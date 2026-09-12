import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPayPalSubscription,
  paypalEventSubscriptionId,
  paypalNextBillingTime,
  paypalPlanId,
  verifyPayPalWebhook
} from '@/lib/billing/paypal';
import { paypalWebhookEventSchema } from '@/lib/security/schemas';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';

export const dynamic = 'force-dynamic';
type JsonRecord = Record<string, unknown>;

function cents(value: unknown): number {
  const parsed = Number.parseFloat(String(value || '0'));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await readJsonBody<JsonRecord>(request, 256 * 1024);
    const event = paypalWebhookEventSchema.parse(raw);
    if (!(await verifyPayPalWebhook(request.headers, raw))) {
      return NextResponse.json({ error: 'Invalid PayPal webhook signature.' }, { status: 400 });
    }

    const resource = (event.resource || {}) as JsonRecord;
    let subscriptionId = paypalEventSubscriptionId(resource);
    const admin = createAdminClient();
    let details = resource;
    if (subscriptionId && (event.event_type.startsWith('PAYMENT.') || !resource.plan_id)) {
      details = await getPayPalSubscription(subscriptionId);
    }
    subscriptionId ||= paypalEventSubscriptionId(details);
    if (!subscriptionId || details.plan_id !== paypalPlanId()) {
      return NextResponse.json({ received: true, ignored: true });
    }

    let userId = typeof details.custom_id === 'string' ? details.custom_id : null;
    if (!userId) {
      const { data } = await admin.from('numina_subscriptions')
        .select('user_id')
        .eq('provider', 'paypal')
        .eq('provider_subscription_id', subscriptionId)
        .maybeSingle();
      userId = data?.user_id || null;
    }
    if (!userId) return NextResponse.json({ received: true, ignored: true });
    const { data: existingUser } = await admin.auth.admin.getUserById(userId);
    if (!existingUser.user) return NextResponse.json({ received: true, ignored: true });

    const { data: current } = await admin.from('numina_subscriptions')
      .select('provider,provider_subscription_id,current_period_end')
      .eq('user_id', userId)
      .maybeSingle();
    // A user may abandon one approval flow and start another. Never allow a
    // late webhook from the superseded PayPal subscription to overwrite the
    // current billing agreement.
    if (current?.provider !== 'paypal' || current.provider_subscription_id !== subscriptionId) {
      return NextResponse.json({ received: true, ignored: true, reason: 'superseded_subscription' });
    }
    const eventType = event.event_type;
    let status = typeof details.status === 'string' ? details.status : 'ACTIVE';
    let periodEnd = paypalNextBillingTime(details) || current?.current_period_end || null;
    let cancelAtPeriodEnd = false;
    if (eventType.endsWith('.CANCELLED')) { status = 'CANCELLED'; cancelAtPeriodEnd = true; }
    if (eventType.endsWith('.SUSPENDED')) status = 'SUSPENDED';
    if (eventType.endsWith('.EXPIRED')) { status = 'EXPIRED'; periodEnd = periodEnd || new Date().toISOString(); }
    if (eventType.endsWith('.PAYMENT.FAILED')) status = 'PAST_DUE';
    if (eventType.endsWith('.REFUNDED') || eventType.endsWith('.REVERSED')) {
      status = 'REVERSED';
      periodEnd = new Date().toISOString();
    }

    const amount = resource.amount as JsonRecord | undefined;
    const eventCreatedAt = event.create_time && Number.isFinite(new Date(event.create_time).getTime())
      ? event.create_time
      : new Date().toISOString();
    const { error } = await admin.rpc('apply_numina_paypal_event', {
      p_user_id: userId,
      p_subscription_id: subscriptionId,
      p_status: status,
      p_period_end: periodEnd,
      p_cancel_at_period_end: cancelAtPeriodEnd,
      p_event_id: event.id,
      p_event_created_at: eventCreatedAt,
      p_amount: cents(amount?.total || amount?.value),
      p_currency: String(amount?.currency || amount?.currency_code || 'usd').toLowerCase(),
      p_payment_status: eventType,
      p_description: 'NUMELYRA Pro via PayPal'
    });
    if (error) throw error;
    if (eventType === 'PAYMENT.SALE.COMPLETED' || eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      await admin.from('numina_payment_orders').update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('provider', 'paypal').eq('provider_order_id', subscriptionId);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    console.error('[PayPalWebhook]', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid PayPal webhook payload.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'PayPal webhook processing failed.' }, { status: 500 });
  }
}
