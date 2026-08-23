/**
 * Query Expansion Service — enriches short user queries with numerology-specific
 * keywords to improve semantic retrieval quality in ChromaDB.
 * Also detects the user's input language in the same LLM call (zero extra latency)
 * so downstream components can instruct the response LLM to reply in the user's language.
 *
 * Uses system prompt + recent conversation history to understand the full context,
 * then generates additional search keywords appended to the original query.
 *
 * Example: "Nguyen Van A 10/3/1995"
 * → expandedQuery: "Nguyen Van A 10/3/1995 con số chủ đạo đường đời biểu đồ ngày sinh
 *    năm cá nhân sứ mệnh linh hồn nhân cách life path number birth chart"
 * → detectedLanguage: "Vietnamese"
 */
import { getProviderCascade, requestChatCompletion } from './provider-cascade';
import { supportsSystemRole } from './model-config';
import type { UserProviderConfig } from './response-generator';

// --- Types ---

interface ChatMessage {
  role: string;
  content: string;
}

interface QueryExpansionContext {
  /** The current user query to expand */
  originalQuery: string;
  /** System prompt so the LLM understands the domain */
  systemPrompt: string;
  /** Recent conversation history (last N messages) for continuity */
  recentHistory: ChatMessage[];
}

export interface QueryExpansionResult {
  /** Original query + appended keywords (or just the original if skipped) */
  expandedQuery: string;
  /** Language name detected from user input (e.g. "Vietnamese", "English") */
  detectedLanguage: string;
}

// --- Configuration ---

/** Short queries below this threshold trigger expansion */
const EXPANSION_THRESHOLD = 80;

/** Expansion is helpful, but must never hold the chat request hostage. */
const EXPANSION_DEADLINE_MS = 12_000;
const EXPANSION_ATTEMPT_TIMEOUT_MS = 4_000;

/** Max recent messages to include for context */
const MAX_HISTORY_ITEMS = 4;

/** Fallback language when detection fails or is skipped */
const DEFAULT_LANGUAGE = 'Vietnamese';

const EXPANSION_INSTRUCTION = `You are a search keyword generator for a knowledge base retrieval system.

Your task: Given the domain context (provided as <domain_context>) and the user's latest query:
1. DETECT the language the user is writing in.
2. Generate additional search keywords to help retrieve the most relevant documents.

Rules for keywords:
- DO NOT repeat the user's original query. Your output will be APPENDED to it.
- Analyze the <domain_context> to understand the domain and its terminology, then generate domain-specific keywords relevant to the user's query.
- Generate keywords in both the user's language and English for cross-language retrieval.
- If conversation history is provided, use it to understand what the user is specifically asking about and narrow the keywords accordingly.
- Keep keywords under 100 words.
- If the user query is already rich with keywords, leave "keywords" as an empty string.

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no code fences, no explanation):
{"language":"<detected language name in English, e.g. Vietnamese, English, Japanese>","keywords":"<space-separated search keywords>"}`;

// --- Main ---

/**
 * Expands a short user query by appending LLM-generated search keywords.
 * Simultaneously detects the user's input language (zero extra API calls).
 * Uses system prompt + conversation history for context-aware expansion.
 * Tries a small, time-bounded subset of available API keys/model fallbacks.
 * Falls back to the original query as soon as the deadline is reached.
 */
export async function expandQueryForRetrieval(
  context: QueryExpansionContext,
  userProviderConfig?: UserProviderConfig
): Promise<QueryExpansionResult> {
  const { originalQuery, systemPrompt, recentHistory } = context;

  // Skip expansion for already-detailed queries but still detect language
  if (originalQuery.length >= EXPANSION_THRESHOLD) {
    console.log(
      '[QueryExpansion] Query is detailed enough, skipping expansion (language detection only)'
    );
    const detectedLanguage = detectLanguageHeuristic(originalQuery);
    return { expandedQuery: originalQuery, detectedLanguage };
  }

  const providers = getProviderCascade(userProviderConfig);
  const deadline = Date.now() + EXPANSION_DEADLINE_MS;
  let attempts = 0;

  try {
    console.time('[Perf] Query Expansion');

    for (const provider of providers) {
      for (const model of provider.models.slice(0, 1)) {
        if (Date.now() >= deadline) break;
        const expansionMessages = buildExpansionMessages(
          systemPrompt,
          recentHistory,
          originalQuery,
          model
        );

        // Expansion is optional. Use one key per provider so a slow primary
        // cannot consume the whole budget before fallback providers run.
        for (const apiKey of provider.apiKeys.slice(0, 1)) {
        if (Date.now() >= deadline || attempts >= 3) break;
        attempts += 1;
        const remainingMs = Math.max(1_000, deadline - Date.now());

        try {
          const response = await requestChatCompletion(
            provider,
            model,
            expansionMessages,
            apiKey,
            // Give the model enough room to return valid JSON even when it
            // spends tokens reasoning about the numerology context.
            {
              maxTokens: 800,
              temperature: 0.2,
              timeoutMs: Math.min(EXPANSION_ATTEMPT_TIMEOUT_MS, remainingMs)
            }
          );

          if (!response.ok) {
            console.warn(
              `[QueryExpansion] API error from ${provider.name}/${model} (status ${response.status})`
            );
            continue;
          }

          const data = await response.json();
          const rawOutput = data.choices?.[0]?.message?.content?.trim() ?? '';

          console.timeEnd('[Perf] Query Expansion');

          // Parse structured JSON response
          const { keywords, language } = parseExpansionResponse(
            rawOutput,
            originalQuery
          );

          const expandedQuery = keywords
            ? `${originalQuery} ${keywords}`
            : originalQuery;

          console.log(
            `[QueryExpansion] model="${model}" | lang="${language}" | "${originalQuery}" + keywords: "${keywords || '(none)'}"`
          );

          return { expandedQuery, detectedLanguage: language };
        } catch (error) {
          console.warn(
            `[QueryExpansion] Error on ${provider.name}/${model}:`,
            error
          );
          continue;
        }
      }

      // All keys exhausted for this model
      if (attempts > 0) {
        console.warn(
          `[QueryExpansion] ${provider.name}/${model} unavailable; trying a bounded fallback`
        );
      }
      }
    }

    // Deadline/attempt limit reached — non-critical, fall back gracefully.
    console.timeEnd('[Perf] Query Expansion');
    console.warn(
      `[QueryExpansion] Expansion deadline reached after ${attempts} attempt(s), using original query`
    );
    return {
      expandedQuery: originalQuery,
      detectedLanguage: detectLanguageHeuristic(originalQuery)
    };
  } catch (error) {
    console.warn(
      '[QueryExpansion] Expansion failed, using original query:',
      error
    );
    return {
      expandedQuery: originalQuery,
      detectedLanguage: detectLanguageHeuristic(originalQuery)
    };
  }
}

// --- Helpers ---

/**
 * Parses the structured JSON response from the LLM.
 * Handles edge cases: markdown fences, malformed JSON, plain text fallback.
 */
function parseExpansionResponse(
  rawOutput: string,
  originalQuery: string
): { keywords: string; language: string } {
  if (!rawOutput) {
    return { keywords: '', language: detectLanguageHeuristic(originalQuery) };
  }

  try {
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const cleanedOutput = rawOutput
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedOutput);

    return {
      keywords: (parsed.keywords ?? '').trim(),
      language: (parsed.language ?? DEFAULT_LANGUAGE).trim()
    };
  } catch {
    // JSON parse failed — treat entire output as keywords (backward compatible)
    console.warn(
      '[QueryExpansion] Failed to parse structured response, treating as plain keywords'
    );
    return {
      keywords: rawOutput,
      language: detectLanguageHeuristic(originalQuery)
    };
  }
}

/**
 * Lightweight heuristic language detection for fallback scenarios.
 * Checks for Vietnamese diacritics, CJK ranges, Cyrillic, etc.
 * Returns a human-readable language name.
 */
function detectLanguageHeuristic(text: string): string {
  // Vietnamese: check for common diacritical marks
  if (
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      text
    )
  ) {
    return 'Vietnamese';
  }

  // Japanese (Hiragana/Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'Japanese';
  }

  // Korean (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return 'Korean';
  }

  // Chinese (CJK Unified Ideographs — after Japanese check)
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'Chinese';
  }

  // Thai
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return 'Thai';
  }

  // Cyrillic (Russian, etc.)
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'Russian';
  }

  // Arabic
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'Arabic';
  }

  // Default to English for Latin scripts without diacritics
  return 'English';
}

/**
 * Builds the message array for the expansion LLM call.
 * Includes a condensed system context + recent history so the LLM
 * understands the domain and ongoing conversation.
 * Adapts message structure based on model's system role support.
 */
function buildExpansionMessages(
  systemPrompt: string,
  history: ChatMessage[],
  currentQuery: string,
  model: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Inject domain context as a condensed reference (truncate to save tokens)
  const condensedSystemPrompt = systemPrompt.slice(0, 2000);

  if (supportsSystemRole(model)) {
    messages.push({ role: 'system', content: EXPANSION_INSTRUCTION });
    messages.push({
      role: 'user',
      content: `<domain_context>\n${condensedSystemPrompt}\n</domain_context>`
    });
  } else {
    // Merge instruction + domain context into first user message for Gemma
    messages.push({
      role: 'user',
      content: `${EXPANSION_INSTRUCTION}\n\n<domain_context>\n${condensedSystemPrompt}\n</domain_context>`
    });
  }

  messages.push({
    role: 'assistant',
    content:
      'Understood. I will detect the language and generate search keywords based on this domain context. I will respond with a JSON object only.'
  });

  // Include recent conversation history for continuity
  const recentMessages = history.slice(-MAX_HISTORY_ITEMS);
  if (recentMessages.length > 0) {
    const historyText = recentMessages
      .map((message) => `${message.role}: ${message.content.slice(0, 300)}`)
      .join('\n');

    messages.push({
      role: 'user',
      content: `<recent_conversation>\n${historyText}\n</recent_conversation>`
    });
    messages.push({
      role: 'assistant',
      content:
        'Noted. I will consider this conversation context for keyword generation and language detection.'
    });
  }

  // The actual query to expand
  messages.push({
    role: 'user',
    content: `Detect language and generate search keywords for this user query: "${currentQuery}"`
  });

  return messages;
}
