import { NextResponse } from 'next/server';
import {
  getGooglePlaySubscription,
  googlePlayEntitlement,
  hashPurchaseToken,
  verifyGooglePubSubBearer,
} from '@/lib/billing/google-play';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await verifyGooglePubSubBearer(request))) {
    return NextResponse.json({ error: 'Invalid Pub/Sub identity.' }, { status: 401 });
  }
  try {
    const envelope = await request.json() as { message?: { messageId?: string; publishTime?: string; data?: string } };
    const messageId = envelope.message?.messageId;
    const data = envelope.message?.data
      ? JSON.parse(Buffer.from(envelope.message.data, 'base64').toString('utf8')) as Record<string, any>
      : null;
    const purchaseToken = data?.subscriptionNotification?.purchaseToken;
    const notificationType = Number(data?.subscriptionNotification?.notificationType || 0);
    if (!messageId || typeof purchaseToken !== 'string') return NextResponse.json({ ignored: true });

    const admin = createAdminClient();
    const tokenHash = hashPurchaseToken(purchaseToken);
    let { data: existing } = await admin.from('numina_subscriptions').select('user_id,last_provider_event_id,current_period_start,current_period_end')
      .eq('purchase_token_hash', tokenHash).maybeSingle();
    let purchase;
    if (!existing) {
      purchase = await getGooglePlaySubscription(purchaseToken);
      const linkedHash = purchase.linkedPurchaseToken ? hashPurchaseToken(purchase.linkedPurchaseToken) : null;
      if (linkedHash) {
        const lookup = await admin.from('numina_subscriptions').select('user_id,last_provider_event_id,current_period_start,current_period_end')
          .eq('purchase_token_hash', linkedHash).maybeSingle();
        existing = lookup.data;
      }
    }
    if (!existing) return NextResponse.json({ ignored: true, reason: 'unknown_purchase' });
    if (existing.last_provider_event_id === messageId) return NextResponse.json({ applied: false, duplicate: true });

    purchase ||= await getGooglePlaySubscription(purchaseToken);
    const entitlement = googlePlayEntitlement(purchase);
    const eventAt = envelope.message?.publishTime || new Date().toISOString();
    const previousEnd = existing.current_period_end ? new Date(existing.current_period_end) : null;
    const nextEnd = entitlement.periodEnd ? new Date(entitlement.periodEnd) : null;
    const periodStart = previousEnd && nextEnd && nextEnd > previousEnd
      ? previousEnd.toISOString()
      : (existing.current_period_start || entitlement.periodStart);
    const { data: result, error } = await admin.rpc('apply_numina_google_play_event', {
      p_user_id: existing.user_id,
      p_event_id: messageId,
      p_event_at: eventAt,
      p_purchase_token_hash: tokenHash,
      p_linked_token_hash: purchase.linkedPurchaseToken ? hashPurchaseToken(purchase.linkedPurchaseToken) : null,
      p_provider_subscription_id: purchase.latestOrderId || tokenHash,
      p_status: entitlement.state,
      p_plan: entitlement.active ? 'pro' : 'free',
      p_period_start: periodStart,
      p_period_end: entitlement.periodEnd,
      p_cancel_at_period_end: !entitlement.autoRenewing,
    });
    if (error) throw error;
    const telemetryUpdate = await admin.from('numina_payment_events')
      .update({ description: `Google Play RTDN:${notificationType}` })
      .eq('provider', 'google_play')
      .eq('provider_event_id', messageId);
    if (telemetryUpdate.error) console.warn('[Google Play RTDN] Could not label event telemetry:', telemetryUpdate.error.message);
    return NextResponse.json(result || { applied: true, plan: entitlement.active ? 'pro' : 'free' });
  } catch (error) {
    console.error('[Google Play RTDN]', error);
    return NextResponse.json({ error: 'RTDN processing failed.' }, { status: 500 });
  }
}
