import { personalityIndicatorKeys } from '../../lib/spiritual-agent/personality-indicators.ts';
import {
  applyClassificationRouteOverrides,
  extractClassificationJson,
  isClassificationIntent,
  isClassificationSpread,
  normalizeClassificationDecision,
  spreadCardCount,
  type AgentDecision,
} from '../../lib/spiritual-agent/classification-contract.ts';
import type { ClassificationBenchmarkCase } from './cases.ts';

export interface ClassificationEvaluation {
  parsed: boolean;
  pureJson: boolean;
  rawIntent?: string;
  rawSpread?: string | null;
  normalizedDecision?: AgentDecision;
  rawIntentCorrect: boolean;
  normalizedIntentCorrect: boolean;
  spreadCorrect: boolean;
  tarotContractCorrect: boolean;
  indicatorsCorrect: boolean;
  score: number;
  issues: string[];
}

const allowedIndicatorSet = new Set<string>(personalityIndicatorKeys);

function sameMembers(actual: string[], expected: string[]): boolean {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return expected.every((item) => actualSet.has(item));
}

export function evaluateClassificationOutput(
  testCase: ClassificationBenchmarkCase,
  rawOutput: string
): ClassificationEvaluation {
  const pureJson = rawOutput.trim().startsWith('{') && rawOutput.trim().endsWith('}');
  const issues: string[] = [];
  let parsedDecision: Record<string, unknown>;

  try {
    parsedDecision = extractClassificationJson(rawOutput);
  } catch {
    return {
      parsed: false,
      pureJson,
      rawIntentCorrect: false,
      normalizedIntentCorrect: false,
      spreadCorrect: false,
      tarotContractCorrect: false,
      indicatorsCorrect: false,
      score: 0,
      issues: ['invalid_json'],
    };
  }

  const rawIntent = typeof parsedDecision.intent === 'string' ? parsedDecision.intent : undefined;
  const rawSpread = parsedDecision.spreadId === null || typeof parsedDecision.spreadId === 'string'
    ? parsedDecision.spreadId
    : undefined;
  const rawIntentCorrect = rawIntent === testCase.expectedIntent;
  const corrected = applyClassificationRouteOverrides(parsedDecision, testCase.message);
  const normalizedDecision = normalizeClassificationDecision(corrected);
  const normalizedIntentCorrect = normalizedDecision.intent === testCase.expectedIntent;
  const spreadCorrect = normalizedDecision.spreadId === testCase.expectedSpread;
  const expectedNeedsTarot = testCase.expectedSpread !== null;
  const tarotContractCorrect = normalizedDecision.needsTarot === expectedNeedsTarot
    && normalizedDecision.cardCount === spreadCardCount(testCase.expectedSpread);

  const rawIndicators = Array.isArray(parsedDecision.targetIndicators)
    ? parsedDecision.targetIndicators.filter((item): item is string => typeof item === 'string')
    : [];
  const unknownIndicators = rawIndicators.filter((item) => !allowedIndicatorSet.has(item));
  let indicatorsCorrect = unknownIndicators.length === 0
    && normalizedDecision.targetIndicators.length <= 5;

  if (testCase.requiredIndicators?.length) {
    indicatorsCorrect = indicatorsCorrect
      && testCase.requiredIndicators.every((item) => normalizedDecision.targetIndicators.includes(item));
  }
  if (testCase.forbiddenIndicators?.length) {
    indicatorsCorrect = indicatorsCorrect
      && testCase.forbiddenIndicators.every((item) => !normalizedDecision.targetIndicators.includes(item));
  }
  if (testCase.exactIndicators) {
    indicatorsCorrect = indicatorsCorrect
      && sameMembers(normalizedDecision.targetIndicators, testCase.exactIndicators);
  }

  if (!pureJson) issues.push('non_json_wrapping');
  if (!isClassificationIntent(parsedDecision.intent)) issues.push('raw_intent_out_of_catalog');
  if (rawSpread !== null && !isClassificationSpread(rawSpread)) issues.push('raw_spread_out_of_catalog');
  if (!rawIntentCorrect) issues.push(`intent_confusion:${rawIntent || 'missing'}->${testCase.expectedIntent}`);
  if (!normalizedIntentCorrect) issues.push('normalized_intent_wrong');
  if (!spreadCorrect) issues.push(`spread_wrong:${String(normalizedDecision.spreadId)}->${String(testCase.expectedSpread)}`);
  if (!tarotContractCorrect) issues.push('tarot_contract_wrong');
  if (unknownIndicators.length) issues.push(`unknown_indicators:${unknownIndicators.join(',')}`);
  if (!indicatorsCorrect) issues.push('indicator_selection_wrong');

  const score =
    10
    + (pureJson ? 5 : 0)
    + (rawIntentCorrect ? 30 : 0)
    + (normalizedIntentCorrect ? 20 : 0)
    + (spreadCorrect ? 15 : 0)
    + (tarotContractCorrect ? 10 : 0)
    + (indicatorsCorrect ? 10 : 0);

  return {
    parsed: true,
    pureJson,
    rawIntent,
    rawSpread,
    normalizedDecision,
    rawIntentCorrect,
    normalizedIntentCorrect,
    spreadCorrect,
    tarotContractCorrect,
    indicatorsCorrect,
    score,
    issues,
  };
}
