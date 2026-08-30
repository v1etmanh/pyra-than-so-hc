/**
 * Chat API route — RAG pipeline.
 * Flow: validate → embed → retrieve → generate (stream)
 *
 * POST /api/chat
 * Body: { messages: Array<{ role: string, content: string }> }
 * Response: SSE stream
 */
import { NextRequest } from 'next/server';

/**
 * Vercel Serverless config:
 * - maxDuration: Keep enough room for RAG plus a long streamed answer.
 * - dynamic: Forces this route to always run as a serverless function, never statically cached.
 */
export const maxDuration = 180;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { retrieveContext } from './lib/retrieval-service';
import { createStreamingResponse } from './lib/response-generator';
import { buildSystemPrompt } from './prompt';
import type { RetrievalSource } from './lib/retrieval-service';
import { checkRateLimit } from './lib/rate-limit';
import { getProviderCascade } from './lib/provider-cascade';

import type { ChatProfileContext } from '@/hooks/chat-types';

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Config sent by the client when user has a custom AI provider (BYOK) */
interface UserProviderConfig {
  type: string;
  baseUrl: string;
  apiKeys: string[];
  model: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  providerConfig?: UserProviderConfig;
  /** Skip query expansion step in RAG pipeline */
  skipExpansion?: boolean;
  /** Explicit language for RAG (e.g. "Vietnamese", "English") */
  language?: string;
  /** Override system prompt — for direct LLM calls */
  systemPrompt?: string;
  /** Profile context of user */
  profile?: ChatProfileContext;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`RAG retrieval timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

export async function POST(req: NextRequest) {
  try {
    // --- Rate Limit Check ---
    // Get IP address for rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1';
    
    // Check local in-memory limit: 5 requests / 60 giây
    const { success, limit, reset, remaining } = checkRateLimit(ip, 5, 60000);
    
    if (!success) {
      console.warn(`[RateLimit] IP ${ip} exceeded limit.`);
      return new Response(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau một lát.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
    // ------------------------

    const body: ChatRequestBody = await req.json();
    const { messages, providerConfig, skipExpansion, language, systemPrompt: customSystemPrompt, profile } = body;

    if (!messages?.length) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Extract latest user message for retrieval
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user');

    if (!latestUserMessage?.content?.trim()) {
      return new Response('No user message found', { status: 400 });
    }

    const userQuery = latestUserMessage.content.trim();

    // Build base persona prompt (without RAG context — that comes after retrieval)
    const baseSystemPrompt = customSystemPrompt || buildSystemPrompt(undefined, undefined, profile);

    let sources: RetrievalSource[] = [];

    // Return an SSE stream immediately. Retrieval used to happen before the
    // response was returned, leaving the UI with an empty "THINKING" bubble
    // for the entire duration of query expansion and vector search.
    const encoder = new TextEncoder();
    const outputStream = new ReadableStream({
      async start(controller) {
        let streamClosed = false;

        const enqueueChunk = (chunk: Uint8Array): boolean => {
          if (streamClosed) return false;
          try {
            controller.enqueue(chunk);
            return true;
          } catch {
            // The browser may cancel the request while retrieval/generation is running.
            streamClosed = true;
            return false;
          }
        };

        const closeStream = () => {
          if (streamClosed) return;
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // The stream was already closed by the client.
          }
        };

        try {
          const sendEvent = (event: Record<string, unknown>) =>
            enqueueChunk(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

          if (!sendEvent({
            type: 'status',
            phase: 'searching',
            message: 'Đang tìm kiếm tư liệu phù hợp...'
          })) return;

          // --- RAG Pipeline ---
          const recentHistoryForExpansion = messages.slice(-4).map((message) => ({
            role: message.role,
            content: message.content
          }));
          console.time('[Perf] Total RAG Retrieval');
          let ragContext = '';
          let detectedLanguage = language || 'Vietnamese';

          try {
            const retrievalResult = await withTimeout(
              retrieveContext(
                userQuery,
                baseSystemPrompt,
                recentHistoryForExpansion,
                providerConfig,
                { skipExpansion, language }
              ),
              Number(process.env.RAG_RETRIEVAL_TIMEOUT_MS || 30_000)
            );
            console.timeEnd('[Perf] Total RAG Retrieval');
            console.log('retrievalResult.content length', retrievalResult.context.length);
            console.log('retrievalResult.sources length', retrievalResult.sources.length);
            ragContext = retrievalResult.context;
            sources = retrievalResult.sources;
            detectedLanguage = retrievalResult.detectedLanguage;
            console.log(
              `[RAG] Retrieved ${sources.length} sources for query: "${userQuery}" | Language: ${detectedLanguage}`
            );
          } catch (error) {
            console.error('[RAG] Retrieval failed, proceeding without context:', error);
          }

          if (!sendEvent({
            type: 'status',
            phase: 'generating',
            message: 'Đang tạo lời giải từ Numina AI...'
          })) return;

          if (sources.length > 0) {
            if (!sendEvent({
              type: 'sources',
              sources: sources.map((source) => ({
                title: source.title,
                refLink: source.refLink,
                collection: source.collection,
                score: Math.round(source.score * 100) / 100
              }))
            })) return;
          }

          const conversationHistory = messages.slice(-15).map((message) => ({
            role: message.role,
            content: message.content
          }));
          const llmStream = createStreamingResponse(
            buildSystemPrompt(ragContext, detectedLanguage, profile),
            conversationHistory,
            providerConfig
          );
          const reader = llmStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!enqueueChunk(value)) return;
            }
          } finally {
            reader.releaseLock();
          }
          closeStream();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Internal streaming error';
          console.error('[Chat API] Stream error:', error);
          enqueueChunk(
            encoder.encode(
              `data: ${JSON.stringify({
                content: `\n\n⚠️ ${errorMessage}`
              })}\n\n`
            )
          );
          enqueueChunk(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          closeStream();
        }
      }
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  const providers = getProviderCascade().map((provider) => ({
    name: provider.name,
    models: provider.models,
    keyCount: provider.apiKeys.length
  }));

  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Chat RAG API. Use POST to send messages.',
      rag: {
        vectorStore: process.env.VECTOR_STORE || 'supabase',
        embeddingMode: process.env.JINA_MODE || 'local',
        providers
      }
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
