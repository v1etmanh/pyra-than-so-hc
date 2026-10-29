import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_PLAY_PRODUCT_ID, hasActiveEntitlement } from '@/lib/billing/types';
import {
  acknowledgeGooglePlaySubscription,
  getGooglePlaySubscription,
  googlePlayEntitlement,
  hashPurchaseToken,
  obfuscatedGoogleAccountId,
} from '@/lib/billing/google-play';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestAuth } from '@/lib/supabase/request-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getRequestAuth(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required.', code: 'AUTH_REQUIRED' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const productId = typeof body.productId === 'string' ? body.productId : '';
    const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken.trim() : '';
    if (productId !== GOOGLE_PLAY_PRODUCT_ID || purchaseToken.length < 20) {
      return NextResponse.json({ error: 'Invalid Google Play purchase.', code: 'INVALID_PURCHASE' }, { status: 422 });
    }

    const purchase = await getGooglePlaySubscription(purchaseToken);
    const entitlement = googlePlayEntitlement(purchase);
    if (entitlement.productId !== GOOGLE_PLAY_PRODUCT_ID || !entitlement.active) {
      return NextResponse.json({ error: 'Google Play subscription is not active.', code: 'PURCHASE_NOT_ACTIVE', state: entitlement.state }, { status: 409 });
    }
    const expectedAccountId = obfuscatedGoogleAccountId(user.id);
    if (purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId !== expectedAccountId) {
      return NextResponse.json({ error: 'Purchase is linked to a different NUMELYRA account.', code: 'ACCOUNT_MISMATCH' }, { status: 409 });
    }

    const admin = createAdminClient();
    const tokenHash = hashPurchaseToken(purchaseToken);
    const { data: tokenOwner } = await admin.from('numina_subscriptions').select('user_id')
      .eq('purchase_token_hash', tokenHash).maybeSingle();
    if (tokenOwner && tokenOwner.user_id !== user.id) {
      return NextResponse.json({ error: 'Purchase token is already linked.', code: 'PURCHASE_ALREADY_LINKED' }, { status: 409 });
    }
    const { data: current } = await admin.from('numina_subscriptions').select('*').eq('user_id', user.id).maybeSingle();
    const otherProviderPending = current && current.provider !== 'google_play'
      && ['CREATING', 'APPROVAL_PENDING'].includes(String(current.status || '').toUpperCase());
    if (current && current.provider !== 'google_play' && (hasActiveEntitlement(current) || otherProviderPending)) {
      return NextResponse.json({ error: 'Another subscription source is already active.', code: 'ACTIVE_PROVIDER_EXISTS' }, { status: 409 });
    }
    const currentEnd = current?.provider === 'google_play' && current.current_period_end
      ? new Date(current.current_period_end)
      : null;
    const nextEnd = entitlement.periodEnd ? new Date(entitlement.periodEnd) : null;
    const periodStart = currentEnd && nextEnd && nextEnd > currentEnd
      ? currentEnd.toISOString()
      : (current?.provider === 'google_play' && current.current_period_start
          ? current.current_period_start
          : entitlement.periodStart);

    // Do not grant entitlement until Google confirms the purchase has been
    // acknowledged. A failed acknowledgement is safe to retry with the same
    // purchase token and idempotent database upsert.
    if (purchase.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') {
      await acknowledgeGooglePlaySubscription(purchaseToken, GOOGLE_PLAY_PRODUCT_ID);
    }

    const { error } = await admin.from('numina_subscriptions').upsert({
      user_id: user.id,
      plan: 'pro',
      provider: 'google_play',
      provider_subscription_id: purchase.latestOrderId || tokenHash,
      product_id: GOOGLE_PLAY_PRODUCT_ID,
      purchase_token_hash: tokenHash,
      linked_purchase_token_hash: purchase.linkedPurchaseToken ? hashPurchaseToken(purchase.linkedPurchaseToken) : null,
      status: entitlement.state,
      current_period_start: periodStart,
      current_period_end: entitlement.periodEnd,
      cancel_at_period_end: !entitlement.autoRenewing,
      last_provider_event_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;

    return NextResponse.json({ verified: true, plan: 'pro', state: entitlement.state, periodEnd: entitlement.periodEnd });
  } catch (error) {
    console.error('[Google Play Verify]', error);
    return NextResponse.json({ error: 'Google Play verification failed.', code: 'VERIFICATION_FAILED' }, { status: 502 });
  }
}
