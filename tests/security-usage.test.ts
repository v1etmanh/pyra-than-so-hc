import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProviderBaseUrl } from '../lib/security/provider-url.ts';
import { consumeDailyUsage, DAILY_LIMITS } from '../lib/usage/usage-meter.ts';

test('rejects private provider URLs', () => {
  assert.throws(() => validateProviderBaseUrl('http://127.0.0.1:11434/v1'));
  assert.throws(() => validateProviderBaseUrl('http://localhost:3000'));
  assert.throws(() => validateProviderBaseUrl('http://169.254.169.254/latest'));
});

test('accepts public HTTPS provider URLs', () => {
  assert.equal(validateProviderBaseUrl('https://api.openai.com/v1'), 'https://api.openai.com/v1');
});

test('free and pro quotas are bounded', () => {
  const freeIdentity = `test-free-${Date.now()}-${Math.random()}`;
  for (let i = 0; i < DAILY_LIMITS.free.text; i += 1) {
    assert.equal(consumeDailyUsage(freeIdentity, 'free', 'text').allowed, true);
  }
  assert.equal(consumeDailyUsage(freeIdentity, 'free', 'text').allowed, false);
});
