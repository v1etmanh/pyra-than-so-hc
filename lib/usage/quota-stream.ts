import { commitRequestAccess, releaseRequestAccess, type RequestAccess } from '@/lib/billing/access';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';
import { recordActualAiUsage } from '@/lib/usage/quota-service';

/** Passes a normalized SSE stream through and finalizes quota exactly once. */
export function finalizeQuotaStream(
  source: ReadableStream<Uint8Array>,
  access: RequestAccess,
  metadata: Record<string, unknown>,
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let sawContent = false;
  let sawDone = false;
  let settled = false;
  let telemetry: { provider?: string; model?: string; usage?: { inputTokens?: number; outputTokens?: number } } = {};

  const settle = async (completed: boolean, reason: string) => {
    if (settled) return;
    settled = true;
    if (completed && sawContent && sawDone) {
      await commitRequestAccess(access, metadata);
      await recordActualAiUsage({
        reservation: access,
        route: String(metadata.route || 'stream'),
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
    } else await releaseRequestAccess(access, reason);
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          await settle(true, 'empty_stream');
          controller.close();
          return;
        }
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue;
          try {
            const event = JSON.parse(line.slice(5).trim()) as typeof telemetry & { content?: string; done?: boolean };
            if (event.content) sawContent = true;
            if (event.done) {
              sawDone = true;
              telemetry = event;
            }
          } catch {
            // The normalized stream uses one JSON event per line; incomplete
            // provider-specific lines are ignored and never mark completion.
          }
        }
        controller.enqueue(value);
      } catch (error) {
        await settle(false, 'stream_error');
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => undefined);
      await settle(false, 'client_disconnected');
    },
  });
}
