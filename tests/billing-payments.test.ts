import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  effectiveBillingPlan,
  nextPayosPeriodEnd,
  PAYOS_PRO_PRICE_VND,
  PAYPAL_PRO_PRICE_USD_CENTS
} from '../lib/billing/types.ts';
import { buildPayOSChecksumData, createPayOSOrderCode, verifyPayOSWebhook } from '../lib/billing/payos.ts';
import { paypalEventSubscriptionId, paypalNextBillingTime } from '../lib/billing/paypal.ts';
import { payosWebhookSchema } from '../lib/security/schemas.ts';

test('billing prices are fixed server-side', () => {
  assert.equal(PAYOS_PRO_PRICE_VND, 79_000);
  assert.equal(PAYPAL_PRO_PRICE_USD_CENTS, 399);
});

test('Pro access fails closed without a valid future period end', () => {
  const now = new Date('2026-09-11T00:00:00.000Z');
  assert.equal(effectiveBillingPlan({ plan: 'pro', current_period_end: null }, now), 'free');
  assert.equal(effectiveBillingPlan({ plan: 'pro', current_period_end: 'invalid' }, now), 'free');
  assert.equal(effectiveBillingPlan({ plan: 'pro', current_period_end: '2026-09-10T23:59:59.000Z' }, now), 'free');
  assert.equal(effectiveBillingPlan({ plan: 'pro', status: 'CANCELLED', current_period_end: '2026-09-12T00:00:00.000Z' }, now), 'pro');
});

test('payOS renewals add 30 days without discarding remaining access', () => {
  const now = new Date('2026-09-11T00:00:00.000Z');
  assert.equal(nextPayosPeriodEnd(null, now).toISOString(), '2026-10-11T00:00:00.000Z');
  assert.equal(nextPayosPeriodEnd('2026-09-21T00:00:00.000Z', now).toISOString(), '2026-10-21T00:00:00.000Z');
});

test('payOS signature input is canonical and order codes stay safe integers', () => {
  assert.equal(
    buildPayOSChecksumData({ returnUrl: 'https://numina.app/return', amount: 79000, orderCode: 123, cancelUrl: 'https://numina.app/cancel', description: 'NUMINA 123' }),
    'amount=79000&cancelUrl=https://numina.app/cancel&description=NUMINA 123&orderCode=123&returnUrl=https://numina.app/return'
  );
  assert.equal(Number.isSafeInteger(createPayOSOrderCode(1_700_000_000_000)), true);
});

test('PayPal event helpers resolve subscriptions and renewal dates defensively', () => {
  assert.equal(paypalEventSubscriptionId({ id: 'SALE-1', billing_agreement_id: 'I-SUBSCRIPTION' }), 'I-SUBSCRIPTION');
  assert.equal(paypalEventSubscriptionId({ id: 'I-DIRECT' }), 'I-DIRECT');
  assert.equal(paypalEventSubscriptionId({ id: 'SALE-1' }), null);
  assert.equal(paypalNextBillingTime({ billing_info: { next_billing_time: '2026-10-11T00:00:00Z' } }), '2026-10-11T00:00:00Z');
});

test('payOS webhook schema parses payOS payloads without success field', () => {
  const parsed = payosWebhookSchema.parse({
    code: '00',
    desc: 'success',
    data: {
      orderCode: 123,
      amount: 79000,
      description: 'NUMINA 123'
    },
    signature: 'a'.repeat(64)
  });
  assert.equal(parsed.code, '00');
  assert.equal(parsed.success, undefined);
  assert.equal(parsed.data.orderCode, 123);
});

test('payOS webhook verification exposes only a boolean result', async () => {
  const originalConfig = {
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
  };
  const testChecksumKey = 'test-checksum-key';
  process.env.PAYOS_CLIENT_ID = 'test-client-id';
  process.env.PAYOS_API_KEY = 'test-api-key';
  process.env.PAYOS_CHECKSUM_KEY = testChecksumKey;
  try {
    const data = { amount: 79000, orderCode: 123 };
    const signature = createHmac('sha256', testChecksumKey)
      .update(buildPayOSChecksumData(data))
      .digest('hex');
    assert.equal(await verifyPayOSWebhook(data, signature), true);
    assert.equal(await verifyPayOSWebhook(data, '0'.repeat(64)), false);
  } finally {
    for (const [name, value] of Object.entries({
      PAYOS_CLIENT_ID: originalConfig.clientId,
      PAYOS_API_KEY: originalConfig.apiKey,
      PAYOS_CHECKSUM_KEY: originalConfig.checksumKey
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
