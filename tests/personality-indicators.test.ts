import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPersonalityIndicatorKeys,
  personalityIndicatorFallbacks,
  personalityIndicatorKeys
} from '../lib/spiritual-agent/personality-indicators.ts';
import { NumerologyCalculator } from '../mobile_app/src/services/numerology24Service.ts';

test('chat indicator selection excludes cycles, bridge scores and charts', () => {
  assert.deepEqual(
    filterPersonalityIndicatorKeys([
      'yearIndividual', 'walksOfLife', 'bridgeSoulPersonality', 'soul',
      'arrows', 'attitude', 'soul', 'personality', 'rationalThinking', 'balance', 'passion'
    ]),
    ['walksOfLife', 'soul', 'attitude', 'personality', 'rationalThinking']
  );
});

test('the mobile calculator can supply every indicator offered to the classifier', () => {
  const calculator = new NumerologyCalculator('Le Viet Manh', '2005-02-07');
  for (const key of personalityIndicatorKeys) {
    const supplied = calculator.getRequestedIndicators([key]);
    assert.deepEqual(supplied.map((item) => item.key), [key], `mobile cannot calculate ${key}`);
  }
  assert.deepEqual(calculator.getRequestedIndicators(['unknown-indicator']), []);
});

test('every classifier fallback stays within the curated personality catalog', () => {
  const allowed = new Set(personalityIndicatorKeys);
  for (const [intent, keys] of Object.entries(personalityIndicatorFallbacks)) {
    assert.ok(keys.length >= 1 && keys.length <= 5, `${intent}: invalid selection count`);
    assert.equal(new Set(keys).size, keys.length, `${intent}: duplicate indicator`);
    assert.ok(keys.every((key) => allowed.has(key)), `${intent}: indicator outside catalog`);
  }
});
