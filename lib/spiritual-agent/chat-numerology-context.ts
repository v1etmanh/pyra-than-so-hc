import fs from 'node:fs';
import path from 'node:path';

export interface IndicatorDefinition {
  name: string;
  values: Record<string, string>;
}

export interface ChatNumerologyContextData {
  version: string;
  source: string;
  usage: string;
  indicators: Record<string, IndicatorDefinition>;
}

export interface ConciseKnowledgeRecord {
  id: string;
  indicator_key: string;
  number_value: string;
  indicator_name: string;
  title: string;
  category: string;
  content: string;
  keywords?: string[];
}

let cachedData: ChatNumerologyContextData | null = null;

/**
 * Load ChatNumerologyContext.v1.json with lazy in-memory caching.
 */
export function getChatNumerologyContext(): ChatNumerologyContextData {
  if (cachedData) return cachedData;

  const candidatePaths = [
    path.resolve(process.cwd(), 'data/spiritual-agent/ChatNumerologyContext.v1.json'),
    path.resolve(process.cwd(), 'mobile_app/assets/rule/ChatNumerologyContext.v1.json'),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedData = JSON.parse(raw) as ChatNumerologyContextData;
        return cachedData;
      }
    } catch {
      // Continue to next candidate path
    }
  }

  throw new Error('[ChatNumerologyContext] Unable to locate ChatNumerologyContext.v1.json');
}

/**
 * Check if the given indicator key is one of the 9 concise chat indicators.
 */
export function isChatContextIndicator(key: string): boolean {
  if (!key) return false;
  try {
    const context = getChatNumerologyContext();
    return Object.prototype.hasOwnProperty.call(context.indicators, key);
  } catch {
    return false;
  }
}

/**
 * Retrieve a concise knowledge record directly from ChatNumerologyContext.v1.json.
 * Bypasses database queries (Supabase / SQLite) for the 9 core chat indicators.
 */
export function getChatIndicatorConciseRecord(
  key: string,
  value: string | number,
  nameFallback?: string
): ConciseKnowledgeRecord | null {
  if (!key || value === undefined || value === null) return null;

  try {
    const context = getChatNumerologyContext();
    const indicator = context.indicators[key];
    if (!indicator?.values) return null;

    const valStr = String(value).trim();
    const meaning = indicator.values[valStr];
    if (!meaning) return null;

    const indicatorName = indicator.name || nameFallback || key;
    return {
      id: `concise_${key}_${valStr}`,
      indicator_key: key,
      number_value: valStr,
      indicator_name: indicatorName,
      title: `${indicatorName} ${valStr}`,
      category: 'core',
      content: meaning,
      keywords: [key, valStr]
    };
  } catch (err) {
    console.warn('[ChatNumerologyContext] Failed to get concise record:', err);
    return null;
  }
}
