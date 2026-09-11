import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayOSOrderCode, createPayOSPaymentLink } from '@/lib/billing/payos';
import { hasActiveEntitlement, PAYOS_PRO_PRICE_VND } from '@/lib/billing/types';
import { billingCheckoutRequestSchema, type BillingCheckoutRequest } from '@/lib/security/schemas';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let orderCode: number | null = null;
  let reservedUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: 'Please sign in first.', code: 'NOT_AUTHENTICATED' }, { status: 401 });
    const body = billingCheckoutRequestSchema.parse(await readJsonBody<BillingCheckoutRequest>(request, 8 * 1024));
    const locale = body.locale || 'vi';
    const { data: current } = await supabase.from('numina_subscriptions')
      .select('plan,provider,status,current_period_end')
      .eq('user_id', auth.user.id).maybeSingle();
    if (hasActiveEntitlement(current) && current?.provider === 'paypal') {
      return NextResponse.json({ error: 'Your PayPal subscription is still active.', code: 'ACTIVE_BILLING_EXISTS' }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data: reserved, error: reserveError } = await admin.rpc('reserve_numina_checkout', {
      p_user_id: auth.user.id,
      p_provider: 'payos'
    });
    if (reserveError) throw reserveError;
    if (!reserved) return NextResponse.json({ error: 'Another checkout or billing agreement is already active.', code: 'ACTIVE_BILLING_EXISTS' }, { status: 409 });
    reservedUserId = auth.user.id;

    orderCode = createPayOSOrderCode();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + 15 * 60;
    const description = `NUMINA ${String(orderCode).slice(-12)}`;
    const { error: insertError } = await admin.from('numina_payment_orders').insert({
      user_id: auth.user.id,
      provider: 'payos',
      order_code: orderCode,
      amount: PAYOS_PRO_PRICE_VND,
      currency: 'vnd',
      status: 'pending',
      expires_at: new Date(expiresAtSeconds * 1000).toISOString()
    });
    if (insertError) throw insertError;

    const payment = await createPayOSPaymentLink({
      orderCode,
      amount: PAYOS_PRO_PRICE_VND,
      description,
      returnUrl: `${origin}/${locale}/account?billing=payos-return`,
      cancelUrl: `${origin}/${locale}/pricing?billing=cancelled`,
      expiresAt: expiresAtSeconds
    });
    const { error: updateError } = await admin.from('numina_payment_orders')
      .update({ provider_order_id: payment.paymentLinkId, updated_at: new Date().toISOString() })
      .eq('order_code', orderCode);
    if (updateError) throw updateError;
    return NextResponse.json({
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode,
      orderCode,
      expiresAt: new Date(expiresAtSeconds * 1000).toISOString()
    });
  } catch (error) {
    if (orderCode) {
      try {
        const admin = createAdminClient();
        await admin.from('numina_payment_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('order_code', orderCode);
        if (reservedUserId) {
          await admin.from('numina_subscriptions').update({ status: 'FAILED', updated_at: new Date().toISOString() })
            .eq('user_id', reservedUserId).eq('provider', 'payos').eq('status', 'CREATING');
        }
      } catch { /* Best-effort order cleanup. */ }
    }
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Unsupported locale.' }, { status: 400 });
    }
    console.error('[PayOSCheckout]', error);
    return NextResponse.json({ error: 'VietQR checkout is temporarily unavailable.', code: 'BILLING_UNAVAILABLE' }, { status: 503 });
  }
}
