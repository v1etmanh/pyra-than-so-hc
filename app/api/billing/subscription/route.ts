import { NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import { effectiveBillingPlan, isManageablePayPalStatus, isPendingPayPalStatus } from '@/lib/billing/types';
import { getQuotaPeriod, getQuotaSnapshot } from '@/lib/usage/quota-service';
import { obfuscatedGoogleAccountId } from '@/lib/billing/google-play';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getRequestAuth(request);
    if (!user) return NextResponse.json({ plan: 'free', authenticated: false, quota: null });
    const { data, error } = await supabase
      .from('numina_subscriptions')
      .select('plan,provider,provider_subscription_id,status,current_period_start,current_period_end,cancel_at_period_end,product_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    const plan = effectiveBillingPlan(data);
    const paypalManageable = data?.provider === 'paypal'
      && Boolean(data.provider_subscription_id)
      && isManageablePayPalStatus(data.status);
    const checkoutPending = data?.provider === 'paypal' && isPendingPayPalStatus(data.status);
    const period = getQuotaPeriod(plan, data);
    const quota = await getQuotaSnapshot(user.id, plan, period);
    return NextResponse.json({
      authenticated: true,
      plan,
      canManageBilling: paypalManageable,
      checkoutPending,
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      quota,
      googlePlayObfuscatedAccountId: obfuscatedGoogleAccountId(user.id),
      managementUrl: paypalManageable
        ? (process.env.PAYPAL_ENV === 'live' ? 'https://www.paypal.com/myaccount/autopay/' : 'https://www.sandbox.paypal.com/myaccount/autopay/')
        : null,
      subscription: data ? { ...data, plan } : null
    });
  } catch {
    return NextResponse.json({ plan: 'free', authenticated: true, subscription: null, quota: null }, { status: 503 });
  }
}
