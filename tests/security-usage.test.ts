import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProviderBaseUrl } from '../lib/security/provider-url.ts';
import { consumeDailyUsage, DAILY_LIMITS } from '../lib/usage/usage-meter.ts';
import { getClientIp } from '../lib/security/request.ts';
import { safeAuthRedirectPath } from '../lib/security/redirect.ts';

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

test('Vercel client IP uses the protected forwarding header', () => {
  const originalVercel = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    const request = {
      headers: new Headers({
        'x-vercel-forwarded-for': '203.0.113.7',
        'x-forwarded-for': '198.51.100.9'
      })
    };
    assert.equal(getClientIp(request as never), '203.0.113.7');
  } finally {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  }
});

test('auth redirects accept only internal absolute paths', () => {
  assert.equal(safeAuthRedirectPath('/account?billing=return'), '/account?billing=return');
  assert.equal(safeAuthRedirectPath('https://evil.example/phish'), '/account');
  assert.equal(safeAuthRedirectPath('//evil.example/phish'), '/account');
  assert.equal(safeAuthRedirectPath('/\\evil.example/phish'), '/account');
});
