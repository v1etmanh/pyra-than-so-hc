import type { UserProviderConfig } from './response-generator';
import { getChatModels } from './model-config';

export interface CascadeProvider {
  name: string;
  baseUrl: string;
  models: string[];
  apiKeys: string[];
}

export interface ModelCandidate {
  provider: CascadeProvider;
  model: string;
  apiKey: string;
}

const MODEL_FAILURE_COOLDOWN_MS = 60_000;

// This state intentionally lives only in the server process. It is reset on a
// cold start/deploy, which keeps failover fast and avoids a write on every
// failed request to a durable store.
let preferredNextCandidateKey: string | null = null;
const failedCandidates = new Map<string, number>();
const failedProviders = new Map<string, number>();

function parseKeys(...names: string[]): string[] {
  const keys: string[] = [];
  for (const name of names) {
    const value = process.env[name];
    if (!value) continue;
    keys.push(
      ...value
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean)
    );
  }
  return Array.from(new Set(keys));
}

/**
 * Reads numbered environment variables such as GEMINI_API_KEY_1..7.
 * The numeric suffix is sorted so rotation is deterministic.
 */
function parseIndexedKeys(prefix: string): string[] {
  return Object.entries(process.env)
    .map(([name, value]) => {
      const suffix = name.startsWith(`${prefix}_`) ? name.slice(prefix.length + 1) : '';
      return /^\d+$/.test(suffix) && value?.trim()
        ? { index: Number(suffix), value: value.trim() }
        : null;
    })
    .filter((item): item is { index: number; value: string } => item !== null)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.value);
}

function parseModels(names: string | string[], fallback: string[]): string[] {
  const envNames = Array.isArray(names) ? names : [names];
  const value = envNames.map((name) => process.env[name]).find(Boolean);
  if (!value) return fallback;
  const models = value
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  return models.length > 0 ? models : fallback;
}

function customProvider(config: UserProviderConfig): CascadeProvider {
  return {
    name: config.type || 'custom',
    baseUrl: config.baseUrl.replace(/\/$/, ''),
    models: [config.model],
    apiKeys: config.apiKeys.filter(Boolean)
  };
}

function getCandidateKey(candidate: ModelCandidate): string {
  // The key is used only as an in-memory map key and is never logged or sent
  // back to the client. Including it keeps each Gemini key independent.
  return `${candidate.provider.name}::${candidate.model}::${candidate.apiKey}`;
}

function getProviderKey(provider: CascadeProvider): string {
  return `${provider.name}::${provider.baseUrl}`;
}

function isCoolingDown(candidate: ModelCandidate, now = Date.now()): boolean {
  const failedAt = failedCandidates.get(getCandidateKey(candidate));
  return failedAt !== undefined && now - failedAt < MODEL_FAILURE_COOLDOWN_MS;
}

function isProviderCoolingDown(candidate: ModelCandidate, now = Date.now()): boolean {
  const failedAt = failedProviders.get(getProviderKey(candidate.provider));
  return failedAt !== undefined && now - failedAt < MODEL_FAILURE_COOLDOWN_MS;
}

function flattenCandidates(
  providers: CascadeProvider[],
  maxModelsPerProvider?: number,
  maxKeysPerProvider?: number
): ModelCandidate[] {
  return providers.flatMap((provider) => {
    const models = maxModelsPerProvider
      ? provider.models.slice(0, maxModelsPerProvider)
      : provider.models;
    const apiKeys = maxKeysPerProvider
      ? provider.apiKeys.slice(0, maxKeysPerProvider)
      : provider.apiKeys;
    return models.flatMap((model) =>
      apiKeys.map((apiKey) => ({ provider, model, apiKey }))
    );
  });
}

/**
 * Returns candidates in the current process-wide priority order.
 * User-provided BYOK providers pass rotate=false so their existing behavior
 * remains unchanged.
 */
export function getOrderedModelCandidates(
  providers: CascadeProvider[],
  options?: {
    maxModelsPerProvider?: number;
    maxKeysPerProvider?: number;
    rotate?: boolean;
  }
): ModelCandidate[] {
  const candidates = flattenCandidates(
    providers,
    options?.maxModelsPerProvider,
    options?.maxKeysPerProvider
  );
  if (options?.rotate === false || candidates.length < 2) return candidates;

  const preferredIndex = preferredNextCandidateKey
    ? candidates.findIndex(
        (candidate) => getCandidateKey(candidate) === preferredNextCandidateKey
      )
    : -1;
  const startIndex = preferredIndex >= 0 ? (preferredIndex + 1) % candidates.length : 0;
  const rotated = [...candidates.slice(startIndex), ...candidates.slice(0, startIndex)];
  const available = rotated.filter(
    (candidate) => !isCoolingDown(candidate) && !isProviderCoolingDown(candidate)
  );

  // If every candidate is cooling down, try them in cursor order rather than
  // returning no providers at all. This guarantees a recovery attempt.
  return available.length > 0 ? available : rotated;
}

/**
 * Marks a system candidate as failed and moves the next request past it.
 * The mutation is synchronous, so subsequent requests in this process see it
 * before beginning their next network operation.
 */
export function markModelFailure(candidate: ModelCandidate): void {
  const candidateKey = getCandidateKey(candidate);
  failedCandidates.set(candidateKey, Date.now());
  preferredNextCandidateKey = candidateKey;
}

/**
 * A timeout, network failure, or non-auth HTTP error normally applies to the
 * provider rather than one API key. Skip all of that provider's candidates
 * until its cooldown expires.
 */
export function markProviderFailure(candidate: ModelCandidate): void {
  failedProviders.set(getProviderKey(candidate.provider), Date.now());
  preferredNextCandidateKey = getCandidateKey(candidate);
}

export function isCredentialProviderError(status?: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Ordered provider cascade for system chat generation.
 * A provider is only enabled when at least one key is configured.
 */
export function getProviderCascade(
  userProviderConfig?: UserProviderConfig
): CascadeProvider[] {
  if (userProviderConfig?.apiKeys?.length) {
    return [customProvider(userProviderConfig)];
  }

  // Preserve the original provider priority: Gemini first, followed by the
  // configured fallback providers.
  const tiers: CascadeProvider[] = [
    {
      name: 'Google Gemini',
      baseUrl:
        process.env.GEMINI_API_BASE_URL?.trim() ||
        process.env.API_BASE_URL?.trim() ||
        'https://generativelanguage.googleapis.com/v1beta/openai',
      models: parseModels('GEMINI_CHAT_MODELS', getChatModels()),
      apiKeys: parseKeys(
        'GEMINI_API_KEYS',
        'GEMINI_API_KEY',
        'GOOGLE_API_KEYS',
        'GOOGLE_API_KEY',
        'API_KEYS',
        'OPENAI_API_KEY'
      ).concat(parseIndexedKeys('GEMINI_API_KEY'), parseIndexedKeys('GOOGLE_API_KEY'))
    },
    {
      name: 'NVIDIA NIM',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      models: parseModels(['NVIDIA_CHAT_MODELS', 'NVIDIA_CHAT_MODEL'], [
        'meta/llama-3.3-70b-instruct',
        'nvidia/llama-3.1-nemotron-70b-instruct'
      ]),
      apiKeys: parseKeys('NVIDIA_API_KEYS', 'NVIDIA_API_KEY')
    },
    {
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      models: parseModels(['GROQ_CHAT_MODELS', 'GROQ_CHAT_MODEL'], [
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b'
      ]),
      apiKeys: parseKeys('GROQ_API_KEYS', 'GROQ_API_KEY')
    },
    {
      name: 'Grok / xAI',
      baseUrl: 'https://api.x.ai/v1',
      models: parseModels(['XAI_CHAT_MODELS', 'XAI_CHAT_MODEL'], ['grok-2-latest', 'grok-beta']),
      apiKeys: parseKeys('XAI_API_KEYS', 'XAI_API_KEY')
    },
    {
      name: 'OpenRouter Free',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: parseModels(
        [
          'OPENROUTER_FREE_MODELS',
          'OPENROUTER_FREE_MODEL',
          'OPENROUTER_CHAT_MODELS',
          'OPENROUTER_CHAT_MODEL'
        ],
        [
          'meta-llama/llama-3.3-70b-instruct:free',
          'google/gemini-2.0-flash-exp:free',
          'deepseek/deepseek-r1:free'
        ]
      ),
      apiKeys: parseKeys('OPENROUTER_API_KEYS', 'OPENROUTER_API_KEY')
    }
  ];

  return tiers
    .map((provider) => ({ ...provider, apiKeys: Array.from(new Set(provider.apiKeys)) }))
    .filter(
      (provider) => provider.baseUrl && provider.models.length > 0 && provider.apiKeys.length > 0
    );
}

export function isRetryableProviderError(status?: number): boolean {
  return (
    !status ||
    status === 400 ||
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status === 402 ||
    status === 404 ||
    status >= 500
  );
}

export async function requestChatCompletion(
  provider: CascadeProvider,
  model: string,
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  options?: {
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? Number(process.env.LLM_REQUEST_TIMEOUT_MS || 15000);
  const timeout = setTimeout(
    () => controller.abort(new Error(`LLM request timed out after ${timeoutMs}ms`)),
    timeoutMs
  );

  try {
    return await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: options?.stream ?? false,
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        ...(typeof options?.temperature === 'number'
          ? { temperature: options.temperature }
          : {})
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}
