import {
  getProviderCascade,
  isRetryableProviderError,
  requestChatCompletion,
  type CascadeProvider
} from './provider-cascade';
import { supportsSystemRole } from './model-config';

/** Optional user-provided provider config (BYOK). */
export interface UserProviderConfig {
  type?: string;
  baseUrl: string;
  apiKeys: string[];
  model: string;
}

function buildMessages(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  model: string
): Array<{ role: string; content: string }> {
  if (supportsSystemRole(model)) {
    return [{ role: 'system', content: systemPrompt }, ...history];
  }

  const clone = history.map((message) => ({ ...message }));
  const firstUserIndex = clone.findIndex((message) => message.role === 'user');
  const preamble = `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\n`;

  if (firstUserIndex >= 0) {
    clone[firstUserIndex] = {
      ...clone[firstUserIndex],
      content: preamble + clone[firstUserIndex].content
    };
  } else {
    clone.unshift({ role: 'user', content: preamble });
  }

  return clone;
}

function providerLabel(provider: CascadeProvider, model: string): string {
  return `${provider.name}/${model}`;
}

function readWithTimeout<T>(
  reader: ReadableStreamDefaultReader<T>,
  timeoutMs: number,
  timeoutMessage = 'LLM stream timed out while waiting for the next chunk'
): Promise<ReadableStreamReadResult<T>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(timeoutMessage)),
      timeoutMs
    );

    reader.read().then(
      (result) => {
        clearTimeout(timeout);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

/**
 * Streams OpenAI-compatible provider output as the app's normalized SSE shape.
 * Providers and keys are tried in the documented priority order.
 */
export function createStreamingResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userProviderConfig?: UserProviderConfig
): ReadableStream<Uint8Array> {
  const providers = getProviderCascade(userProviderConfig);

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastError = 'No LLM provider is configured.';
      // This deadline covers provider connection/fallback only. Once a provider
      // starts streaming, the answer gets its own idle timeout below so a long
      // but healthy response is not cut off by the fallback budget.
      const cascadeDeadline = Date.now() + Number(process.env.LLM_CASCADE_TIMEOUT_MS || 120_000);
      const streamIdleTimeoutMs = Math.max(
        5_000,
        Number(process.env.LLM_STREAM_IDLE_TIMEOUT_MS || 30_000)
      );
      const maxModelsPerProvider = Math.max(
        1,
        Number(process.env.LLM_MAX_MODELS_PER_PROVIDER || 2)
      );
      const maxKeysPerProvider = Math.max(
        1,
        Number(process.env.LLM_MAX_KEYS_PER_PROVIDER || 1)
      );

      try {
        for (const provider of providers) {
          let providerTimedOut = false;
          for (const model of provider.models.slice(0, maxModelsPerProvider)) {
            if (Date.now() >= cascadeDeadline) break;
            const messages = buildMessages(systemPrompt, history, model);

            for (const apiKey of provider.apiKeys.slice(0, maxKeysPerProvider)) {
              const remainingMs = cascadeDeadline - Date.now();
              if (remainingMs <= 0) break;
              try {
                const response = await requestChatCompletion(
                  provider,
                  model,
                  messages,
                  apiKey,
                  {
                    stream: true,
                    timeoutMs: Math.min(
                      Number(process.env.LLM_STREAM_CONNECT_TIMEOUT_MS || 20_000),
                      remainingMs
                    )
                  }
                );

                if (!response.ok || !response.body) {
                  const body = await response.text().catch(() => '');
                  lastError = `${providerLabel(provider, model)} failed (${response.status}): ${body.slice(0, 500)}`;
                  console.warn(`[LLM Cascade] ${lastError}`);
                  if (!isRetryableProviderError(response.status)) break;
                  continue;
                }

                console.log(`[LLM Cascade] Connected to ${providerLabel(provider, model)}`);
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                  while (true) {
                    const { done, value } = await readWithTimeout(
                      reader,
                      streamIdleTimeoutMs
                    );
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';

                    for (const line of lines) {
                      if (!line.startsWith('data: ')) continue;
                      const data = line.slice(6).trim();
                      if (data === '[DONE]') continue;

                      try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                          );
                        }
                      } catch {
                        // Ignore malformed or provider-specific SSE chunks.
                      }
                    }
                  }
                } finally {
                  await reader.cancel().catch(() => undefined);
                  reader.releaseLock();
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                );
                controller.close();
                return;
              } catch (error) {
                lastError = error instanceof Error ? error.message : String(error);
                console.warn(`[LLM Cascade] ${providerLabel(provider, model)} error: ${lastError}`);
                if (/timed out|aborted|abort/i.test(lastError)) {
                  providerTimedOut = true;
                  break;
                }
              }
            }
            if (providerTimedOut) break;
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              content: `\n\n⚠️ Không thể kết nối các nhà cung cấp AI. ${lastError}`
            })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}
