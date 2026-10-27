import {
  classifyProviderError,
  getOrderedModelCandidates,
  getProviderCascade,
  markCredentialFailure,
  markModelFailure,
  markProviderFailure,
  requestChatCompletion,
  type CascadeProvider
} from './provider-cascade.ts';
import { supportsSystemRole } from './model-config.ts';
import type { UserProviderConfig } from './types.ts';

export type { UserProviderConfig } from './types.ts';

export interface StreamingGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
  /** OpenAI-compatible structured-output mode, used by intent classification. */
  responseFormat?: 'json_object';
  /** Prevent reasoning tokens from being emitted as part of a user-visible response. */
  includeReasoning?: boolean;
}

export interface TextGenerationResult {
  text: string;
  provider: string;
  model: string;
  actualModel?: string;
  finishReason?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
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

function readTextWithTimeout(response: Response, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('LLM response body timed out')),
      timeoutMs
    );
    response.text().then(
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

function extractCompletionContent(payload: unknown): { text: string; actualModel?: string; finishReason?: string; usage?: TextGenerationResult['usage'] } {
  if (!payload || typeof payload !== 'object') return { text: '' };
  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0];
  if (!first || typeof first !== 'object') return { text: '' };
  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') return { text: '' };
  const content = (message as Record<string, unknown>).content;
  const usageRecord = record.usage && typeof record.usage === 'object'
    ? record.usage as Record<string, unknown>
    : null;
  const text = typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && typeof (part as Record<string, unknown>).text === 'string') {
            return (part as Record<string, unknown>).text as string;
          }
          return '';
        }).join('')
      : '';
  return {
    text: text.trim(),
    actualModel: typeof record.model === 'string' ? record.model : undefined,
    finishReason: typeof (first as Record<string, unknown>).finish_reason === 'string'
      ? (first as Record<string, unknown>).finish_reason as string
      : undefined,
    usage: usageRecord ? {
      inputTokens: Number(usageRecord.prompt_tokens ?? usageRecord.input_tokens) || undefined,
      outputTokens: Number(usageRecord.completion_tokens ?? usageRecord.output_tokens) || undefined,
      totalTokens: Number(usageRecord.total_tokens) || undefined,
    } : undefined,
  };
}

/**
 * Executes a complete, non-streaming chat completion through the same provider
 * cascade used by streaming routes. Intended for small structured outputs such
 * as intent classification where the caller cannot display partial tokens.
 */
export async function generateTextResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userProviderConfig?: UserProviderConfig,
  generationOptions?: StreamingGenerationOptions
): Promise<TextGenerationResult> {
  const providers = getProviderCascade(userProviderConfig);
  const deadline = Date.now() + Number(process.env.LLM_CASCADE_TIMEOUT_MS || 120_000);
  const maxModelsPerProvider = Math.max(1, Number(process.env.LLM_MAX_MODELS_PER_PROVIDER || 2));
  const configuredMaxKeys = Number(process.env.LLM_MAX_KEYS_PER_PROVIDER);
  const maxKeysPerProvider = Number.isFinite(configuredMaxKeys) && configuredMaxKeys > 0
    ? Math.floor(configuredMaxKeys)
    : undefined;
  const candidates = getOrderedModelCandidates(providers, {
    maxModelsPerProvider,
    maxKeysPerProvider: userProviderConfig ? 1 : maxKeysPerProvider,
    rotate: !userProviderConfig,
  });
  const failedProvidersInRequest = new Set<CascadeProvider>();
  let lastError = 'No LLM provider is configured.';

  for (const candidate of candidates) {
    const { provider, model, apiKey } = candidate;
    if (failedProvidersInRequest.has(provider) || Date.now() >= deadline) continue;
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    try {
      const response = await requestChatCompletion(
        provider,
        model,
        buildMessages(systemPrompt, history, model),
        apiKey,
        {
          stream: false,
          maxTokens: generationOptions?.maxTokens,
          temperature: generationOptions?.temperature,
          reasoningEffort: generationOptions?.reasoningEffort,
          responseFormat: generationOptions?.responseFormat,
          includeReasoning: generationOptions?.includeReasoning,
          timeoutMs: Math.min(
            Number(process.env.LLM_RESPONSE_HEADER_TIMEOUT_MS || 15_000),
            remainingMs
          ),
        }
      );

      const body = await readTextWithTimeout(response, Math.min(30_000, remainingMs));
      if (!response.ok) {
        lastError = `${providerLabel(provider, model)} failed (${response.status}): ${body.slice(0, 500) || 'empty response body'}`;
        if (!userProviderConfig) {
          const failureScope = classifyProviderError(response.status, body);
          if (failureScope === 'credential') markCredentialFailure(candidate);
          else if (failureScope === 'model') markModelFailure(candidate);
          else if (failureScope === 'provider') {
            markProviderFailure(candidate);
            failedProvidersInRequest.add(provider);
          } else {
            break;
          }
        }
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new Error(`${providerLabel(provider, model)} returned invalid completion JSON`);
      }
      const completion = extractCompletionContent(parsed);
      if (!completion.text) throw new Error(`${providerLabel(provider, model)} returned empty completion content`);
      return {
        text: completion.text,
        provider: provider.name,
        model,
        actualModel: completion.actualModel,
        finishReason: completion.finishReason,
        usage: completion.usage,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (!userProviderConfig) {
        markProviderFailure(candidate);
        failedProvidersInRequest.add(provider);
      }
    }
  }

  throw new Error(lastError);
}

/**
 * Streams OpenAI-compatible provider output as the app's normalized SSE shape.
 * Providers and keys are tried in the documented priority order.
 */
export function createStreamingResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userProviderConfig?: UserProviderConfig,
  generationOptions?: StreamingGenerationOptions
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
      const firstContentTimeoutMs = Math.max(
        1_000,
        Number(process.env.LLM_FIRST_CONTENT_TIMEOUT_MS || 15_000)
      );
      const maxModelsPerProvider = Math.max(
        1,
        Number(process.env.LLM_MAX_MODELS_PER_PROVIDER || 2)
      );
      const configuredMaxKeys = Number(process.env.LLM_MAX_KEYS_PER_PROVIDER);
      const maxKeysPerProvider = Number.isFinite(configuredMaxKeys) && configuredMaxKeys > 0
        ? Math.floor(configuredMaxKeys)
        : undefined;
      const candidates = getOrderedModelCandidates(providers, {
        maxModelsPerProvider,
        // BYOK keeps its existing first-key behavior. System providers use
        // every configured key unless an explicit limit is set.
        maxKeysPerProvider: userProviderConfig ? 1 : maxKeysPerProvider,
        rotate: !userProviderConfig
      });
      const failedProvidersInRequest = new Set<CascadeProvider>();

      try {
        for (const candidate of candidates) {
          const { provider, model, apiKey } = candidate;
          if (failedProvidersInRequest.has(provider)) continue;
          if (Date.now() >= cascadeDeadline) break;
          const messages = buildMessages(systemPrompt, history, model);

          const remainingMs = cascadeDeadline - Date.now();
          if (remainingMs <= 0) break;
          let emittedContent = false;
          try {
            const response = await requestChatCompletion(
              provider,
              model,
              messages,
              apiKey,
              {
                stream: true,
                maxTokens: generationOptions?.maxTokens,
                temperature: generationOptions?.temperature,
                reasoningEffort: generationOptions?.reasoningEffort,
                responseFormat: generationOptions?.responseFormat,
                includeReasoning: generationOptions?.includeReasoning,
                timeoutMs: Math.min(
                  Number(
                    process.env.LLM_RESPONSE_HEADER_TIMEOUT_MS ||
                    process.env.LLM_STREAM_CONNECT_TIMEOUT_MS ||
                    10_000
                  ),
                  remainingMs
                )
              }
            );

            if (!response.ok || !response.body) {
              const body = await response.text().catch(() => '');
              lastError = `${providerLabel(provider, model)} failed (${response.status}): ${body.slice(0, 500) || 'empty response body'}`;
              console.warn(`[LLM Cascade] ${lastError}`);
              if (!userProviderConfig) {
                const failureScope = response.ok && !response.body
                  ? 'provider'
                  : classifyProviderError(response.status, body);
                if (failureScope === 'credential') {
                  markCredentialFailure(candidate);
                } else if (failureScope === 'model') {
                  markModelFailure(candidate);
                } else if (failureScope === 'provider') {
                  markProviderFailure(candidate);
                  failedProvidersInRequest.add(provider);
                } else {
                  break;
                }
              }
              continue;
            }

            console.log(`[LLM Cascade] Connected to ${providerLabel(provider, model)}`);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let providerSentDone = false;
            let finishReason: string | undefined;
            let actualModel: string | undefined;
            let usage: TextGenerationResult['usage'];
            const firstContentDeadline = Date.now() + firstContentTimeoutMs;

            try {
              while (true) {
                const contentTimeoutMs = emittedContent
                  ? streamIdleTimeoutMs
                  : Math.max(0, firstContentDeadline - Date.now());
                if (contentTimeoutMs <= 0) {
                  throw new Error('LLM stream timed out before first content token');
                }
                const { done, value } = await readWithTimeout(
                  reader,
                  contentTimeoutMs,
                  emittedContent
                    ? 'LLM stream timed out while waiting for the next chunk'
                    : 'LLM stream timed out before first content token'
                );
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue;
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') {
                    providerSentDone = true;
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (typeof parsed.model === 'string') actualModel = parsed.model;
                    if (parsed.usage && typeof parsed.usage === 'object') {
                      usage = {
                        inputTokens: Number(parsed.usage.prompt_tokens ?? parsed.usage.input_tokens) || undefined,
                        outputTokens: Number(parsed.usage.completion_tokens ?? parsed.usage.output_tokens) || undefined,
                        totalTokens: Number(parsed.usage.total_tokens) || undefined,
                      };
                    }
                    const reportedFinishReason = parsed.choices?.[0]?.finish_reason;
                    if (typeof reportedFinishReason === 'string') finishReason = reportedFinishReason;
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      emittedContent = true;
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

            if (!providerSentDone) {
              throw new Error('LLM stream ended before completion');
            }
            if (finishReason && finishReason !== 'stop') {
              throw new Error(`LLM stream ended with finish_reason=${finishReason}`);
            }
            if (!emittedContent) {
              throw new Error('LLM stream completed without response content');
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                done: true,
                provider: provider.name,
                model: actualModel || model,
                usage,
              })}\n\n`)
            );
            controller.close();
            return;
          } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            console.warn(`[LLM Cascade] ${providerLabel(provider, model)} error: ${lastError}`);

            // Once output has reached the client, switching candidates would
            // produce a malformed answer by concatenating two responses.
            if (emittedContent) throw error;

            if (!userProviderConfig) {
              markProviderFailure(candidate);
              failedProvidersInRequest.add(provider);
            }
          }
        }

        controller.error(new Error(lastError));
      } catch (error) {
        controller.error(error);
      }
    }
  });
}
