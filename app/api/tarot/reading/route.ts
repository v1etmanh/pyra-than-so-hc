import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { getRequestAccess } from '@/lib/billing/access';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import { tarotReadingRequestSchema, type TarotReadingRequestPayload } from '@/lib/security/schemas';
import { recordAiUsage } from '@/lib/usage/usage-meter';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { getTarotCard } from '@/lib/tarot/cards';
import { drawCardsForSpread, drawSupplementaryCards } from '@/lib/tarot/draw';
import {
  buildFollowUpDecisionPrompt,
  buildFollowUpReadingPrompt,
  buildInitialReadingPrompt,
  buildTarotSystemPrompt,
  parseFollowUpDecision
} from '@/lib/tarot/prompts';
import { getTarotSpread, tarotSpreads } from '@/lib/tarot/spreads';
import type {
  DrawnTarotCard,
  StoredDrawnTarotCard,
  TarotLocale,
  TarotSSEEvent,
  TarotSpread
} from '@/lib/tarot/types';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function jsonError(message: string, status: number, code = 'INVALID_REQUEST'): Response {
  return Response.json({ error: message, code }, { status });
}

function hydrateBaseCards(spread: TarotSpread, stored: StoredDrawnTarotCard[]): DrawnTarotCard[] {
  if (stored.length !== spread.positions.length) {
    throw new Error('Drawn cards do not match the selected spread');
  }
  const cardIds = new Set<string>();
  return stored.map((item, index) => {
    const card = getTarotCard(item.cardId);
    const position = spread.positions[index];
    if (!card || item.positionId !== position.id || cardIds.has(card.id)) {
      throw new Error('Invalid or duplicated card data');
    }
    cardIds.add(card.id);
    return { card, isReversed: item.isReversed, position };
  });
}

function collectUsedCardIds(
  baseCards: DrawnTarotCard[],
  priorFollowUps: Array<{ additionalCards: StoredDrawnTarotCard[] }>
): Set<string> {
  const ids = new Set(baseCards.map((drawn) => drawn.card.id));
  for (const followUp of priorFollowUps) {
    for (const stored of followUp.additionalCards) {
      if (!getTarotCard(stored.cardId) || ids.has(stored.cardId)) {
        throw new Error('Invalid or duplicated supplementary card data');
      }
      ids.add(stored.cardId);
    }
  }
  return ids;
}

async function consumeNormalizedLlmStream(
  stream: ReadableStream<Uint8Array>,
  onContent?: (content: string) => void
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
          const event = JSON.parse(data) as { content?: unknown; done?: unknown };
          if (typeof event.content === 'string') {
            fullText += event.content;
            onContent?.(event.content);
          }
        } catch {
          // Ignore malformed provider chunks. The normalized stream can continue.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return fullText;
}

function priorDialogue(reading: Extract<TarotReadingRequestPayload, { mode: 'follow-up' }>['reading']): string {
  if (!reading.priorFollowUps.length) return reading.interpretation;
  const followUps = reading.priorFollowUps
    .map((item) => `Q: ${item.question}\nA: ${item.interpretation}`)
    .join('\n\n');
  return `${reading.interpretation}\n\nPrevious follow-ups:\n${followUps}`.slice(0, 16_000);
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: TarotReadingRequestPayload;
  try {
    body = tarotReadingRequestSchema.parse(
      await readJsonBody<unknown>(request, 256 * 1024)
    );
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message || 'Invalid tarot request', 400);
    }
    return jsonError('Unable to read tarot request', 400);
  }

  const access = await getRequestAccess(request, 'text');
  if (access instanceof Response) return access;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: TarotSSEEvent): boolean => {
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
        try { controller.close(); } catch { /* client disconnected */ }
      };

      try {
        recordAiUsage({
          identity: access.identity,
          plan: access.plan,
          feature: 'text',
          route: '/api/tarot/reading',
          estimatedCostUsd: Number(process.env.NUMINA_ESTIMATED_TAROT_COST_USD || process.env.NUMINA_ESTIMATED_TEXT_COST_USD || 0)
        });

        const systemPrompt = buildTarotSystemPrompt(body.language as TarotLocale);
        let spread: TarotSpread;
        let baseCards: DrawnTarotCard[];
        let userPrompt: string;

        if (body.mode === 'initial') {
          const selectedSpread = getTarotSpread(body.spreadId);
          if (!selectedSpread) throw new Error('Unknown tarot spread');
          spread = selectedSpread;
          send({
            type: 'status',
            phase: 'drawing',
            message: body.language === 'vi' ? 'Đang xào và rút bài…' : 'Shuffling and drawing…'
          });
          baseCards = drawCardsForSpread(spread);
          if (!send({ type: 'reading', spread, cards: baseCards })) return;
          send({
            type: 'status',
            phase: 'interpreting',
            message: body.language === 'vi' ? 'Numina đang luận giải…' : 'Numina is interpreting…'
          });
          userPrompt = buildInitialReadingPrompt(body.question, spread, baseCards, body.profile, body.language);
        } else {
          const selectedSpread = getTarotSpread(body.reading.spreadId);
          if (!selectedSpread) throw new Error('Unknown tarot spread');
          spread = selectedSpread;
          baseCards = hydrateBaseCards(spread, body.reading.drawnCards);

          if (body.mode === 'regenerate') {
            send({ type: 'reading', spread, cards: baseCards });
            send({
              type: 'status',
              phase: 'interpreting',
              message: body.language === 'vi' ? 'Đang tạo một góc nhìn mới…' : 'Creating a fresh interpretation…'
            });
            userPrompt = buildInitialReadingPrompt(
              body.reading.originalQuestion,
              spread,
              baseCards,
              body.profile,
              body.language,
              true
            );
          } else {
            send({
              type: 'status',
              phase: 'deciding',
              message: body.language === 'vi' ? 'Đang xem có cần rút thêm lá…' : 'Considering whether more cards are needed…'
            });
            const previousInterpretation = priorDialogue(body.reading);
            const decisionText = await consumeNormalizedLlmStream(
              createStreamingResponse(
                systemPrompt,
                [{
                  role: 'user',
                  content: buildFollowUpDecisionPrompt(
                    body.reading.originalQuestion,
                    previousInterpretation,
                    body.question,
                    body.language
                  )
                }],
                body.providerConfig
              )
            );
            const decision = parseFollowUpDecision(decisionText);
            if (!send({ type: 'follow_up_decision', ...decision })) return;

            const usedIds = collectUsedCardIds(baseCards, body.reading.priorFollowUps);
            const previousSupplementaryCount = body.reading.priorFollowUps.reduce(
              (total, item) => total + item.additionalCards.length,
              0
            );
            const additionalCards = decision.decision === 'draw'
              ? drawSupplementaryCards(decision.drawCount, usedIds, previousSupplementaryCount)
              : [];
            if (additionalCards.length && !send({ type: 'supplementary_cards', cards: additionalCards })) return;

            send({
              type: 'status',
              phase: 'interpreting',
              message: body.language === 'vi' ? 'Đang trả lời câu hỏi tiếp theo…' : 'Answering your follow-up…'
            });
            userPrompt = buildFollowUpReadingPrompt({
              originalQuestion: body.reading.originalQuestion,
              previousInterpretation,
              followUpQuestion: body.question,
              spread,
              originalCards: baseCards,
              additionalCards,
              profile: body.profile,
              locale: body.language
            });
          }
        }

        const llmStream = createStreamingResponse(
          systemPrompt,
          [{ role: 'user', content: userPrompt }],
          body.providerConfig
        );
        await consumeNormalizedLlmStream(llmStream, (content) => {
          send({ type: 'content', content });
        });
        send({ type: 'done' });
        close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tarot reading failed';
        console.error('[Tarot API]', error);
        send({ type: 'error', code: 'TAROT_READING_FAILED', message });
        close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
      'X-Accel-Buffering': 'no',
      'X-Numina-Plan': access.plan,
      'X-Numina-Remaining': String(access.remaining)
    }
  });
}

export function GET(): Response {
  return Response.json({
    status: 'ok',
    spreads: tarotSpreads.map((spread) => ({
      id: spread.id,
      name: spread.name,
      description: spread.description,
      cardCount: spread.positions.length
    }))
  });
}
