import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

import {
  createStreamingResponse,
  type UserProviderConfig,
} from '@/lib/ai/response-generator';
import {
  buildFollowUpSystemPrompt,
  normalizeStoredHistory,
  type FollowUpContext,
} from '@/lib/chat/follow-up-prompt';
import {
  MAX_FOLLOW_UP_QUESTIONS,
  SESSION_QUESTION_LIMIT_CODE,
  getRemainingSessionQuestions,
} from '@/lib/chat/session-limits';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';
import { createCurrentTimeContext } from '@/lib/spiritual-agent/time-context';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import { commitRequestAccess, getRequestAccess, releaseRequestAccess } from '@/lib/billing/access';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';
import { recordActualAiUsage } from '@/lib/usage/quota-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Chat continuation is intentionally pinned to DeepSeek: no provider cascade. */
function getDeepSeekContinuationProviderConfig(): UserProviderConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured for Chat Continuation.');

  return {
    type: 'DeepSeek',
    baseUrl: (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, ''),
    model:
      process.env.DEEPSEEK_CHAT_CONTINUE_MODEL?.trim()
      || process.env.DEEPSEEK_MODEL?.trim()
      || process.env.DEEPSEEK_CHAT_AGENT_MODEL?.trim()
      || 'deepseek-flash',
    apiKeys: [apiKey],
  };
}

type DoneMetadata = {
  turnIndex: number;
  remaining: number;
  sessionCompleted: boolean;
  accepted: boolean;
  code?: string;
  userMessageId?: string;
  assistantMessageId?: string;
};

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const configured = (process.env.CHAT_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const isLocalDevelopment = process.env.NODE_ENV !== 'production'
    && Boolean(origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin));
  const allowed = Boolean(origin && (configured.includes(origin.replace(/\/$/, '')) || isLocalDevelopment));
  return {
    ...(allowed && origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

function streamHeaders(request: Request): Record<string, string> {
  return {
    ...corsHeaders(request),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

function sseResponse(request: Request, events: Array<Record<string, unknown>>, status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      events.forEach((event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)));
      controller.close();
    },
  });
  return new Response(body, { status, headers: streamHeaders(request) });
}

/** Replaces the generic provider done event with quota/session metadata. */
function enrichDoneEvent(
  source: ReadableStream<Uint8Array>,
  metadata: DoneMetadata,
  onComplete: (fullText: string, telemetry: { provider?: string; model?: string; usage?: { inputTokens?: number; outputTokens?: number } }) => Promise<boolean>,
  onFailure: () => Promise<void>,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      let fullText = '';
      let telemetry: { provider?: string; model?: string; usage?: { inputTokens?: number; outputTokens?: number } } = {};

      const forwardBlock = (block: string) => {
        const dataLine = block.split(/\r?\n/).find((line) => line.startsWith('data:'));
        if (!dataLine) return;
        try {
          const parsed = JSON.parse(dataLine.slice(5).trim()) as typeof telemetry & { done?: boolean; content?: string };
          if (parsed.done) {
            telemetry = parsed;
            return;
          }
          if (typeof parsed.content === 'string') fullText += parsed.content;
        } catch {
          // createStreamingResponse already emits normalized SSE. Preserve an
          // unfamiliar non-JSON event rather than dropping response content.
        }
        controller.enqueue(encoder.encode(`${block.trim()}\n\n`));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';
          blocks.forEach(forwardBlock);
        }
        buffer += decoder.decode();
        if (buffer.trim()) forwardBlock(buffer);
        const persisted = await onComplete(fullText.trim(), telemetry);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, ...metadata, persisted })}\n\n`));
        controller.close();
      } catch (error) {
        await onFailure();
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return sseResponse(request, [
      { error: 'Request body must be valid JSON.' },
      { done: true, accepted: false, turnIndex: 0, remaining: MAX_FOLLOW_UP_QUESTIONS, sessionCompleted: false },
    ], 400);
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const requestedTurn = typeof body.turnIndex === 'number' ? body.turnIndex : Number.NaN;
  const userMessageId = typeof body.userMessageId === 'string' && UUID_PATTERN.test(body.userMessageId)
    ? body.userMessageId
    : randomUUID();
  const assistantMessageId = typeof body.assistantMessageId === 'string' && UUID_PATTERN.test(body.assistantMessageId)
    ? body.assistantMessageId
    : randomUUID();

  if (!UUID_PATTERN.test(sessionId)) {
    return sseResponse(request, [
      { error: 'sessionId must be a valid UUID.' },
      { done: true, accepted: false, turnIndex: 0, remaining: MAX_FOLLOW_UP_QUESTIONS, sessionCompleted: false },
    ], 400);
  }
  if (!message || message.length > 2_000) {
    return sseResponse(request, [
      { error: 'message must contain between 1 and 2000 characters.' },
      { done: true, accepted: false, turnIndex: 0, remaining: MAX_FOLLOW_UP_QUESTIONS, sessionCompleted: false },
    ], 400);
  }
  if (!Number.isInteger(requestedTurn) || requestedTurn < 1) {
    return sseResponse(request, [
      { error: 'turnIndex must be a positive integer.' },
      { done: true, accepted: false, turnIndex: 0, remaining: MAX_FOLLOW_UP_QUESTIONS, sessionCompleted: false },
    ], 400);
  }

  const { supabase, user } = await getRequestAuth(request);
  if (!user) {
    return sseResponse(request, [
      { error: 'Authentication is required.' },
      { done: true, accepted: false, turnIndex: 0, remaining: MAX_FOLLOW_UP_QUESTIONS, sessionCompleted: false },
    ], 401);
  }

  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, user_id, context_data, question_count, max_questions, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return sseResponse(request, [
      { error: 'Chat session was not found.' },
      { done: true, accepted: false, turnIndex: 0, remaining: MAX_FOLLOW_UP_QUESTIONS, sessionCompleted: false },
    ], 404);
  }

  const currentCount = Math.max(0, Number(session.question_count) || 0);
  const maxQuestions = Math.min(MAX_FOLLOW_UP_QUESTIONS, Math.max(1, Number(session.max_questions) || MAX_FOLLOW_UP_QUESTIONS));
  if (session.status !== 'active' || currentCount >= maxQuestions) {
    return sseResponse(request, [
      { content: 'Phiên chiêm nghiệm 10 câu đã hoàn thành. Bạn hãy bắt đầu một phiên mới để tiếp tục nhé.' },
      {
        done: true,
        accepted: false,
        code: SESSION_QUESTION_LIMIT_CODE,
        turnIndex: currentCount,
        remaining: 0,
        sessionCompleted: true,
      },
    ]);
  }

  const expectedTurn = currentCount + 1;
  if (requestedTurn !== expectedTurn) {
    return sseResponse(request, [
      { error: `turnIndex conflict. Expected ${expectedTurn}.`, code: 'SESSION_TURN_CONFLICT' },
      {
        done: true,
        accepted: false,
        turnIndex: currentCount,
        remaining: Math.max(0, maxQuestions - currentCount),
        sessionCompleted: false,
      },
    ], 409);
  }

  const trashCheck = isTrashOrMeaninglessPrompt(message);
  if (trashCheck.isTrash) {
    return sseResponse(request, [
      { content: TRASH_PROMPT_GUIDANCE },
      {
        done: true,
        accepted: false,
        turnIndex: expectedTurn,
        remaining: Math.max(0, maxQuestions - currentCount),
        sessionCompleted: false,
      },
    ]);
  }

  let deepSeekProvider: UserProviderConfig;
  try {
    deepSeekProvider = getDeepSeekContinuationProviderConfig();
  } catch (error) {
    console.error('[Chat Continue Route] DeepSeek configuration error:', error);
    return sseResponse(request, [
      { error: 'DeepSeek is not configured for chat continuation.' },
      {
        done: true,
        accepted: false,
        turnIndex: currentCount,
        remaining: Math.max(0, maxQuestions - currentCount),
        sessionCompleted: false,
      },
    ], 503);
  }

  const quotaAccess = await getRequestAccess(
    request,
    'ai_response',
    typeof body.requestId === 'string' ? body.requestId : userMessageId,
  );
  if (quotaAccess instanceof Response) {
    const quotaError = await quotaAccess.json().catch(() => ({ error: 'Monthly quota is unavailable.' }));
    return sseResponse(request, [
      quotaError,
      { done: true, accepted: false, turnIndex: currentCount, remaining: Math.max(0, maxQuestions - currentCount), sessionCompleted: false },
    ], quotaAccess.status);
  }

  const nextStatus = expectedTurn >= maxQuestions ? 'completed' : 'active';
  const { data: reservedSession, error: reserveError } = await supabase
    .from('chat_sessions')
    .update({
      question_count: expectedTurn,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('question_count', currentCount)
    .eq('status', 'active')
    .select('id')
    .maybeSingle();

  if (reserveError || !reservedSession) {
    await releaseRequestAccess(quotaAccess, 'session_turn_conflict');
    return sseResponse(request, [
      { error: 'Another request already advanced this session.', code: 'SESSION_TURN_CONFLICT' },
      {
        done: true,
        accepted: false,
        turnIndex: currentCount,
        remaining: Math.max(0, maxQuestions - currentCount),
        sessionCompleted: false,
      },
    ], 409);
  }

  const { data: storedMessages } = await supabase
    .from('chat_messages')
    .select('sender, text')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(6);
  const { error: userMessageError } = await supabase.from('chat_messages').upsert({
    id: userMessageId,
    session_id: sessionId,
    turn_index: expectedTurn,
    sender: 'user',
    text: message,
    card_payload: null,
    created_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (userMessageError) {
    await supabase
      .from('chat_sessions')
      .update({ question_count: currentCount, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('question_count', expectedTurn);
    await releaseRequestAccess(quotaAccess, 'user_message_persist_failed');
    return sseResponse(request, [
      { error: 'Could not persist the follow-up question.' },
      {
        done: true,
        accepted: false,
        turnIndex: currentCount,
        remaining: Math.max(0, maxQuestions - currentCount),
        sessionCompleted: false,
      },
    ], 500);
  }
  const history = normalizeStoredHistory(
    (storedMessages || []).reverse().map((item) => ({
      role: item.sender === 'mascot' ? 'assistant' : 'user',
      content: item.text,
    }))
  );
  const context = (session.context_data && typeof session.context_data === 'object'
    ? session.context_data
    : {}) as FollowUpContext;
  const systemPrompt = buildFollowUpSystemPrompt(
    context,
    expectedTurn,
    createCurrentTimeContext(body.timeZone)
  );
  let source: ReadableStream<Uint8Array>;
  try {
    source = createStreamingResponse(
      systemPrompt,
      [...history, { role: 'user', content: message }],
      deepSeekProvider,
      {
        maxTokens: 8192,
        temperature: 0.55,
        reasoningEffort: 'low',
        includeReasoning: false,
      }
    );
  } catch (error) {
    await Promise.all([
      releaseRequestAccess(quotaAccess, 'provider_start_failed'),
      supabase.from('chat_sessions').update({ question_count: currentCount, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', sessionId).eq('user_id', user.id).eq('question_count', expectedTurn),
      supabase.from('chat_messages').delete().eq('id', userMessageId).eq('session_id', sessionId),
    ]);
    console.error('[Chat Continue Route] Provider start failed:', error);
    return sseResponse(request, [
      { error: 'Could not start the AI response.' },
      { done: true, accepted: false, turnIndex: currentCount, remaining: Math.max(0, maxQuestions - currentCount), sessionCompleted: false },
    ], 503);
  }
  const metadata: DoneMetadata = {
    turnIndex: expectedTurn,
    remaining: getRemainingSessionQuestions(expectedTurn),
    sessionCompleted: expectedTurn >= maxQuestions,
    accepted: true,
    userMessageId,
    assistantMessageId,
  };

  let finalized = false;
  const rollback = async () => {
    if (finalized) return;
    finalized = true;
    await Promise.all([
      releaseRequestAccess(quotaAccess, 'continuation_incomplete'),
      supabase.from('chat_sessions').update({ question_count: currentCount, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', sessionId).eq('user_id', user.id).eq('question_count', expectedTurn),
      supabase.from('chat_messages').delete().eq('id', userMessageId).eq('session_id', sessionId),
      supabase.from('chat_messages').delete().eq('id', assistantMessageId).eq('session_id', sessionId),
    ]);
  };

  return new Response(enrichDoneEvent(source, metadata, async (fullText, telemetry) => {
    if (!fullText) {
      await rollback();
      return false;
    }
    const { error } = await supabase.from('chat_messages').upsert({
      id: assistantMessageId,
      session_id: sessionId,
      turn_index: expectedTurn,
      sender: 'mascot',
      text: fullText,
      card_payload: {
        type: 'follow_up',
        turnIndex: expectedTurn,
        remaining: metadata.remaining,
        sessionCompleted: metadata.sessionCompleted,
      },
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) {
      console.warn('[Chat Continue Route] Could not persist assistant message:', error);
      await rollback();
      return false;
    }
    await commitRequestAccess(quotaAccess, { route: '/api/chat/continue', sessionId, turnIndex: expectedTurn });
    await recordActualAiUsage({
      reservation: quotaAccess,
      route: '/api/chat/continue',
      provider: telemetry.provider,
      model: telemetry.model,
      inputTokens: telemetry.usage?.inputTokens,
      outputTokens: telemetry.usage?.outputTokens,
      costUsd: calculateAiCostUsd({
        provider: telemetry.provider,
        model: telemetry.model,
        inputTokens: telemetry.usage?.inputTokens,
        outputTokens: telemetry.usage?.outputTokens,
      }),
    });
    finalized = true;
    return true;
  }, rollback), { headers: streamHeaders(request) });
}

