import { getTarotSpread } from '../tarot/spreads.ts';
import {
  filterPersonalityIndicatorKeys,
  personalityIndicatorFallbacks,
} from './personality-indicators.ts';
import { classifyFallbackIntent } from './intent-classifier.ts';

export const CLASSIFICATION_INTENTS = [
  'two_choices',
  'timing_trajectory',
  'relationship',
  'holistic_analysis',
  'core_personality',
  'daily_guidance',
  'color_guidance',
  'where_to_go',
  'love_match',
  'trash',
  'general',
] as const;

export type ClassificationIntent = typeof CLASSIFICATION_INTENTS[number];

export const CLASSIFICATION_SPREADS = [
  'single',
  'three-card',
  'two-options',
  'relationship',
  'timeline',
  'celtic-cross',
] as const;

export type ClassificationSpread = typeof CLASSIFICATION_SPREADS[number];

export interface AgentDecision {
  mode: 'single' | 'compatibility';
  intent: ClassificationIntent;
  needsTarot: boolean;
  spreadId: ClassificationSpread | null;
  cardCount: number;
  targetIndicators: string[];
  thoughtProcess: string;
  /** Present only when the app should ask the user to clarify instead of reading cards. */
  replyText?: string;
}

export const intentSpreadDefaults: Record<ClassificationIntent, ClassificationSpread | null> = {
  two_choices: 'two-options',
  timing_trajectory: 'three-card',
  relationship: 'relationship',
  holistic_analysis: 'celtic-cross',
  core_personality: null,
  daily_guidance: 'single',
  color_guidance: 'single',
  where_to_go: 'single',
  general: 'single',
  trash: null,
  love_match: null,
};

export function spreadCardCount(spreadId: string | null): number {
  return spreadId ? getTarotSpread(spreadId)?.positions.length ?? 0 : 0;
}

export function isClassificationIntent(value: unknown): value is ClassificationIntent {
  return typeof value === 'string'
    && (CLASSIFICATION_INTENTS as readonly string[]).includes(value);
}

export function isClassificationSpread(value: unknown): value is ClassificationSpread {
  return typeof value === 'string'
    && (CLASSIFICATION_SPREADS as readonly string[]).includes(value);
}

/**
 * Applies the same deterministic safety net used by the production route.
 * Benchmarks report both the raw model decision and this normalized decision.
 */
export function normalizeClassificationDecision(value: Record<string, unknown>): AgentDecision {
  const intent = isClassificationIntent(value.intent) ? value.intent : 'general';
  const defaultSpread = intentSpreadDefaults[intent];
  let spreadId = defaultSpread;

  if (intent === 'timing_trajectory') {
    spreadId = value.spreadId === 'timeline' ? 'timeline' : 'three-card';
  } else if (intent === 'trash' || intent === 'love_match' || intent === 'core_personality') {
    spreadId = null;
  }

  const chosenIndicators = filterPersonalityIndicatorKeys(value.targetIndicators);
  const targetIndicators = intent === 'trash'
    ? []
    : chosenIndicators.length
      ? chosenIndicators
      : personalityIndicatorFallbacks[intent] ?? [];

  return {
    mode: value.mode === 'compatibility' ? 'compatibility' : 'single',
    intent,
    needsTarot: Boolean(spreadId),
    spreadId,
    cardCount: spreadCardCount(spreadId),
    targetIndicators,
    thoughtProcess: typeof value.thoughtProcess === 'string'
      ? value.thoughtProcess.slice(0, 500)
      : '',
  };
}

export function extractClassificationJson(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in classifier response.');
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Classifier response must contain a JSON object.');
  }
  return parsed as Record<string, unknown>;
}

/** Deterministic corrections that production applies after the model reply. */
export function applyClassificationRouteOverrides(
  value: Record<string, unknown>,
  rawMessage: string
): Record<string, unknown> {
  const result = { ...value };
  const fallbackIntent = classifyFallbackIntent(rawMessage.toLocaleLowerCase('vi'));

  if (result.intent === 'trash') {
    result.mode = 'single';
    result.needsTarot = false;
    result.spreadId = null;
    result.cardCount = 0;
    result.targetIndicators = [];
  }
  if (fallbackIntent === 'where_to_go') {
    result.intent = 'where_to_go';
    result.targetIndicators = personalityIndicatorFallbacks.where_to_go;
  }
  if (fallbackIntent === 'color_guidance') {
    result.intent = 'color_guidance';
    result.targetIndicators = [];
  }
  if (fallbackIntent === 'two_choices') {
    result.intent = 'two_choices';
    result.targetIndicators = personalityIndicatorFallbacks.two_choices;
  }
  if (fallbackIntent === 'relationship') {
    result.intent = 'relationship';
    result.targetIndicators = personalityIndicatorFallbacks.relationship;
  }
  return result;
}
