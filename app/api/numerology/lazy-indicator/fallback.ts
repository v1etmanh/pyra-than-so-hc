import type { NumerologyKnowledgeRecord } from '@/lib/supabaseClient';

type IndicatorLanguage = 'Vietnamese' | 'English';

export interface IndicatorFallbackInput {
  fullName?: string;
  indicatorName: string;
  indicatorValue: string | number;
  language?: IndicatorLanguage;
  knowledgeRecord: Pick<NumerologyKnowledgeRecord, 'content'> | null;
}

/**
 * Keeps the knowledge article intact while adding only a small personalized
 * introduction. The article itself remains the source of truth for fallback
 * interpretations when no usable AI answer is available.
 */
export function buildIndicatorKnowledgeFallback({
  fullName,
  indicatorName,
  indicatorValue,
  language = 'Vietnamese',
  knowledgeRecord
}: IndicatorFallbackInput): string | null {
  const content = knowledgeRecord?.content;
  if (!content?.trim()) return null;

  const name = fullName?.trim() || (language === 'English' ? 'you' : 'bạn');
  const intro = language === 'English'
    ? `**${name}**, here is the reference interpretation for **${indicatorName} ${indicatorValue}**, taken from Numina's knowledge library.`
    : `**${name}**, dưới đây là lời giải tham khảo cho **${indicatorName} ${indicatorValue}**, được lấy từ kho kiến thức của Numina.`;

  return `${intro}\n\n${content}`;
}

function isProviderFailureContent(content: string): boolean {
  const normalized = content.trim();
  return normalized.startsWith('⚠️')
    || normalized.includes('⚠️ Không thể kết nối các nhà cung cấp AI.')
    || normalized.includes('⚠️ Luồng AI bị gián đoạn:');
}

function encodeSseEvent(encoder: TextEncoder, event: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Converts the normalized AI stream into a fallback-aware stream. Normal AI
 * chunks still stream immediately; a later provider failure is replaced in
 * the client by one complete knowledge event.
 */
export function createIndicatorFallbackStream(
  aiStream: ReadableStream<Uint8Array>,
  fallbackContent: string | null
): ReadableStream<Uint8Array> {
  if (!fallbackContent) return aiStream;

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = aiStream.getReader();
      let buffer = '';
      let hasUsableContent = false;
      let fallbackSent = false;

      const sendFallback = () => {
        if (fallbackSent) return;
        fallbackSent = true;
        controller.enqueue(encodeSseEvent(encoder, {
          type: 'fallback',
          source: 'knowledge',
          content: fallbackContent,
          done: true
        }));
      };

      const handleLine = (line: string) => {
        if (fallbackSent) return;
        if (!line.startsWith('data: ')) return;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') return;

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(payload) as Record<string, unknown>;
        } catch {
          return;
        }

        const content = typeof event.content === 'string' ? event.content : '';
        if (content && isProviderFailureContent(content)) {
          sendFallback();
          return;
        }

        if (content.trim()) hasUsableContent = true;
        controller.enqueue(encoder.encode(`${line}\n\n`));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(handleLine);
          if (fallbackSent) break;
        }

        if (!fallbackSent && buffer.trim()) handleLine(buffer);
        if (!fallbackSent && !hasUsableContent) sendFallback();
        controller.close();
      } catch {
        if (fallbackSent) {
          controller.close();
        } else {
          sendFallback();
          controller.close();
        }
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    }
  });
}
