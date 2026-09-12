import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cancelPayPalSubscription, createPayPalSubscription } from '@/lib/billing/paypal';
import { hasActiveEntitlement, isManageablePayPalStatus, PAYPAL_PRO_PRICE_USD_CENTS } from '@/lib/billing/types';
import { billingCheckoutRequestSchema, type BillingCheckoutRequest } from '@/lib/security/schemas';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let reservedUserId: string | null = null;
  let createdSubscriptionId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: 'Please sign in first.', code: 'NOT_AUTHENTICATED' }, { status: 401 });

    const body = billingCheckoutRequestSchema.parse(await readJsonBody<BillingCheckoutRequest>(request, 8 * 1024));
    const locale = body.locale || 'vi';
    const { data: current } = await supabase
      .from('numina_subscriptions')
      .select('plan,provider,provider_subscription_id,status,current_period_end')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (hasActiveEntitlement(current) ||
      (current?.provider === 'paypal' && current.provider_subscription_id && isManageablePayPalStatus(current.status))) {
      return NextResponse.json({ error: 'An active billing agreement already exists.', code: 'ACTIVE_BILLING_EXISTS' }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data: reserved, error: reserveError } = await admin.rpc('reserve_numina_checkout', {
      p_user_id: auth.user.id,
      p_provider: 'paypal'
    });
    if (reserveError) throw reserveError;
    if (!reserved) return NextResponse.json({ error: 'Another checkout or billing agreement is already active.', code: 'ACTIVE_BILLING_EXISTS' }, { status: 409 });
    reservedUserId = auth.user.id;

    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const subscription = await createPayPalSubscription({
      userId: auth.user.id,
      locale,
      returnUrl: `${origin}/${locale}/account?billing=paypal-return`,
      cancelUrl: `${origin}/${locale}/pricing?billing=cancelled`
    });
    createdSubscriptionId = subscription.id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const { error: subscriptionError } = await admin.from('numina_subscriptions').upsert({
      user_id: auth.user.id,
      plan: 'free',
      provider: 'paypal',
      provider_subscription_id: subscription.id,
      status: 'APPROVAL_PENDING',
      current_period_end: null,
      cancel_at_period_end: false,
      last_provider_event_at: null,
      updated_at: now.toISOString()
    }, { onConflict: 'user_id' });
    if (subscriptionError) throw subscriptionError;
    const { error: orderError } = await admin.from('numina_payment_orders').insert({
      user_id: auth.user.id,
      provider: 'paypal',
      provider_order_id: subscription.id,
      amount: PAYPAL_PRO_PRICE_USD_CENTS,
      currency: 'usd',
      status: 'pending',
      expires_at: expiresAt
    });
    if (orderError) throw orderError;
    return NextResponse.json({ approvalUrl: subscription.approvalUrl });
  } catch (error) {
    if (reservedUserId) {
      if (createdSubscriptionId) {
        try { await cancelPayPalSubscription(createdSubscriptionId, 'Checkout setup failed before approval.'); }
        catch { /* The unapproved PayPal agreement cannot grant access. */ }
      }
      try {
        await createAdminClient().from('numina_subscriptions').update({ status: 'FAILED', updated_at: new Date().toISOString() })
          .eq('user_id', reservedUserId).eq('provider', 'paypal').in('status', ['CREATING', 'APPROVAL_PENDING']);
      } catch { /* Best-effort checkout reservation release. */ }
    }
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Unsupported locale.' }, { status: 400 });
    }
    console.error('[PayPalCheckout]', error);
    return NextResponse.json({ error: 'PayPal checkout is temporarily unavailable.', code: 'BILLING_UNAVAILABLE' }, { status: 503 });
  }
}
