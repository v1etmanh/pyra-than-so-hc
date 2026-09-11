export type AIProviderType =
  | 'openai'
  | 'openrouter'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'grok'
  | 'ollama'
  | 'custom';

/** Request-safe provider override accepted by the active AI endpoints. */
export interface ProviderRequestConfig {
  type: AIProviderType;
  baseUrl: string;
  apiKeys: string[];
  model: string;
}

/** Internal provider override shape used by the shared model cascade. */
export interface UserProviderConfig {
  type?: string;
  baseUrl: string;
  apiKeys: string[];
  model: string;
}

export interface ProfileIndicatorContext {
  key: string;
  name: string;
  value: string | number;
}

/** Minimal numerology profile context shared by Tarot and AI prompt builders. */
export interface ProfileContext {
  name?: string;
  birthDate?: string;
  lifePath?: string | number;
  indicators?: ProfileIndicatorContext[];
}
