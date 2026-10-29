import assert from 'node:assert/strict';
import test from 'node:test';

import { googlePlayEntitlement } from '../lib/billing/google-play.ts';

const future = new Date(Date.now() + 86_400_000).toISOString();

test('Google Play grants Pro for paid, grace, or canceled-before-expiry subscriptions', () => {
  for (const subscriptionState of ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED']) {
    const result = googlePlayEntitlement({
      subscriptionState,
      startTime: '2026-10-25T00:00:00.000Z',
      lineItems: [{ productId: 'numelyra_pro_monthly', expiryTime: future, autoRenewingPlan: { autoRenewEnabled: true } }],
    });
    assert.equal(result.active, true);
    assert.equal(result.autoRenewing, true);
  }
});

test('hold, pause, expiry, revoke, and stale periods do not grant Pro', () => {
  for (const subscriptionState of [
    'SUBSCRIPTION_STATE_ON_HOLD',
    'SUBSCRIPTION_STATE_PAUSED',
    'SUBSCRIPTION_STATE_EXPIRED',
    'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED',
  ]) {
    assert.equal(googlePlayEntitlement({
      subscriptionState,
      lineItems: [{ productId: 'numelyra_pro_monthly', expiryTime: future }],
    }).active, false);
  }
  assert.equal(googlePlayEntitlement({
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    lineItems: [{ productId: 'numelyra_pro_monthly', expiryTime: '2020-01-01T00:00:00.000Z' }],
  }).active, false);
});
