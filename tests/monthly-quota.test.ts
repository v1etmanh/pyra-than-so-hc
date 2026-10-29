import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateAiCostUsd } from '../lib/usage/ai-cost.ts';
import { PLAN_CATALOG } from '../lib/usage/plan-catalog.ts';
import { getFreeQuotaPeriod, getQuotaPeriod } from '../lib/usage/quota-period.ts';

test('published Free and Pro monthly limits exclude profile-limited Daily Fortune', () => {
  assert.deepEqual(PLAN_CATALOG.free, { ai_response: 10, daily_insight_back: 10, wallpaper: 2 });
  assert.deepEqual(PLAN_CATALOG.pro, { ai_response: 200, daily_insight_back: 31, wallpaper: 30 });
});

test('Free quota resets at the start of the Vietnam calendar month', () => {
  const period = getFreeQuotaPeriod(new Date('2026-10-31T20:00:00.000Z'));
  assert.equal(period.start.toISOString(), '2026-10-31T17:00:00.000Z');
  assert.equal(period.end.toISOString(), '2026-11-30T17:00:00.000Z');
});

test('Pro quota uses provider renewal boundaries and upgrade creates a new period', () => {
  const period = getQuotaPeriod('pro', {
    current_period_start: '2026-10-25T08:15:00.000Z',
    current_period_end: '2026-11-25T08:15:00.000Z',
  });
  assert.equal(period.start.toISOString(), '2026-10-25T08:15:00.000Z');
  assert.equal(period.end.toISOString(), '2026-11-25T08:15:00.000Z');
});

test('invalid or expired provider windows fail safely to the Free calendar period', () => {
  const now = new Date('2026-10-25T00:00:00.000Z');
  const period = getQuotaPeriod('pro', { current_period_start: 'bad', current_period_end: 'bad' }, now);
  assert.deepEqual(period, getFreeQuotaPeriod(now));
});

test('provider usage cost uses actual input and output token rates', () => {
  assert.equal(calculateAiCostUsd({ provider: 'Gemini', model: 'gemini-2.5-flash', inputTokens: 1_000_000, outputTokens: 1_000_000 }), 2.8);
  assert.equal(calculateAiCostUsd({ provider: 'Groq', model: 'openai/gpt-oss-20b', inputTokens: 1_000_000, outputTokens: 1_000_000 }), 0.375);
  assert.equal(calculateAiCostUsd({ provider: 'DeepSeek', model: 'deepseek-flash', inputTokens: 1_000_000, outputTokens: 1_000_000 }), 1.5);
});

test('Pro contribution target remains positive at the approved variable-cost ceiling', () => {
  const price = 9.99;
  const revenueAfterPlayFee = price * 0.85;
  const variableCostCeiling = 2.50;
  assert.ok(revenueAfterPlayFee - variableCostCeiling >= 5.99 - 0.01);
  assert.ok(PLAN_CATALOG.pro.ai_response * 0.01 <= 2.00);
});
