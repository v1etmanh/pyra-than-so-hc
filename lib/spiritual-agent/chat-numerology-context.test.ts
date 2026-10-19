import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isChatContextIndicator,
  getChatIndicatorConciseRecord,
  getChatNumerologyContext
} from './chat-numerology-context.ts';

test('loads context schema with 9 supported indicators', () => {
  const context = getChatNumerologyContext();
  const keys = Object.keys(context.indicators);
  assert.equal(keys.length, 9);
  assert.ok(keys.includes('walksOfLife'));
  assert.ok(keys.includes('attitude'));
});

test('identifies chat indicators correctly', () => {
  assert.equal(isChatContextIndicator('walksOfLife'), true);
  assert.equal(isChatContextIndicator('soul'), true);
  assert.equal(isChatContextIndicator('unknownKey'), false);
});

test('retrieves concise record for valid indicator and value', () => {
  const record = getChatIndicatorConciseRecord('walksOfLife', 1);
  assert.ok(record);
  assert.equal(record.indicator_key, 'walksOfLife');
  assert.equal(record.number_value, '1');
  assert.equal(record.title, 'Đường Đời 1');
  assert.match(record.content, /Hành trình thiên về tự chủ và tiên phong/);
});

test('returns null for missing or invalid values', () => {
  assert.equal(getChatIndicatorConciseRecord('walksOfLife', 999), null);
  assert.equal(getChatIndicatorConciseRecord('nonExistentKey', 1), null);
});
