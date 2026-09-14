import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { getRequestAccess } from '@/lib/billing/access';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import { recordAiUsage } from '@/lib/usage/usage-meter';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { evaluateBaziCompatibility } from '@/lib/bazi-love/engine';
import {
  buildBaziLoveFollowUpPrompt,
  buildBaziLoveInitialPrompt,
  buildBaziLoveSystemPrompt,
  redactBaziLoveUserText
} from '@/lib/bazi-love/prompts';
import {
  baziLoveReadingRequestSchema,
  type BaziLoveReadingRequestPayload
} from '@/lib/bazi-love/schemas';
import type { BaziLoveSSEEvent } from '@/lib/bazi-love/types';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function jsonError(message: string, status: number, code = 'INVALID_REQUEST'): Response {
  return Response.json({ error: message, code }, { status });
}

async function consumeNormalizedLlmStream(
  stream: ReadableStream<Uint8Array>,
  onContent: (content: string) => boolean
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const event = JSON.parse(data) as { content?: unknown };
          if (typeof event.content === 'string') {
            fullText += event.content;
            const ok = onContent(event.content);
            if (!ok) {
              await reader.cancel('client disconnected');
              return fullText;
            }
          }
        } catch {
          // Ignore malformed provider chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return fullText;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: BaziLoveReadingRequestPayload;
  try {
    body = baziLoveReadingRequestSchema.parse(
      await readJsonBody<unknown>(request, 256 * 1024)
    );
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message || 'Invalid Bazi request', 400);
    }
    return jsonError('Unable to read Bazi request', 400);
  }

  // Quota & access check (reuse existing billing/text feature limit)
  const access = await getRequestAccess(request, 'text');
  if (access instanceof Response) return access;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: BaziLoveSSEEvent): boolean => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          return true;
        } catch {
          closed = true;
          return false;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* client disconnected */
        }
      };

      try {
        // 1. Calculate Bazi synastry server-side (deterministic engine, blind to raw identities)
        send({
          type: 'status',
          phase: 'calculating',
          message: body.language === 'vi' ? 'Đang tính toán lá số và tương hợp Bát Tự…' : 'Calculating Bazi charts and synastry…'
        });

        const personA = body.people[0];
        const personB = body.people[1];
        const compatibility = evaluateBaziCompatibility(personA, personB);

        // Invalid calendar input must fail before a quota use is recorded.
        recordAiUsage({
          identity: access.identity,
          plan: access.plan,
          feature: 'text',
          route: '/api/bazi-love/reading',
          estimatedCostUsd: Number(process.env.NUMINA_ESTIMATED_TEXT_COST_USD || 0)
        });

        // 2. Transmit structured compatibility data to client
        if (!send({ type: 'compatibility', result: compatibility })) {
          close();
          return;
        }

        // 3. Prepare AI prompt
        send({
          type: 'status',
          phase: 'interpreting',
          message: body.language === 'vi' ? 'NUMELYRA đang phân tích và luận giải…' : 'NUMELYRA is interpreting the dynamics…'
        });

        const systemPrompt = buildBaziLoveSystemPrompt(body.language);
        let messages: Array<{ role: 'user' | 'assistant'; content: string }>;
        const people = body.people;

        if (body.mode === 'initial' || body.mode === 'regenerate') {
          const safeQuestion = body.question
            ? redactBaziLoveUserText(body.question, people, body.language)
            : undefined;
          const userPrompt = buildBaziLoveInitialPrompt(compatibility, body.language, safeQuestion);
          messages = [{ role: 'user', content: userPrompt }];
        } else {
          // follow-up mode
          const priorHistory = (body.history || []).map((msg) => ({
            role: msg.role,
            content: redactBaziLoveUserText(msg.content, people, body.language)
          }));
          const safeQuestion = redactBaziLoveUserText(body.question, people, body.language);
          const followUpPrompt = buildBaziLoveFollowUpPrompt(compatibility, safeQuestion, body.language);
          messages = [...priorHistory, { role: 'user', content: followUpPrompt }];
        }

        // 4. Stream LLM interpretation
        const llmStream = createStreamingResponse(systemPrompt, messages, body.providerConfig);
        await consumeNormalizedLlmStream(llmStream, (content) => send({ type: 'content', content }));

        send({ type: 'done' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Calculation error occurred';
        send({
          type: 'error',
          code: 'BAZI_LOVE_PROCESSING_ERROR',
          message
        });
      } finally {
        close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
