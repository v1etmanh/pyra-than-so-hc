import { NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import { effectiveBillingPlan, isManageablePayPalStatus, isPendingPayPalStatus } from '@/lib/billing/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getRequestAuth(request);
    if (!user) return NextResponse.json({ plan: 'free', authenticated: false });
    const { data, error } = await supabase
      .from('numina_subscriptions')
      .select('plan,provider,provider_subscription_id,status,current_period_end,cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    const plan = error ? 'free' : effectiveBillingPlan(data);
    const paypalManageable = data?.provider === 'paypal'
      && Boolean(data.provider_subscription_id)
      && isManageablePayPalStatus(data.status);
    const checkoutPending = data?.provider === 'paypal' && isPendingPayPalStatus(data.status);
    return NextResponse.json({
      authenticated: true,
      plan,
      canManageBilling: paypalManageable,
      checkoutPending,
      managementUrl: paypalManageable
        ? (process.env.PAYPAL_ENV === 'live' ? 'https://www.paypal.com/myaccount/autopay/' : 'https://www.sandbox.paypal.com/myaccount/autopay/')
        : null,
      subscription: data ? { ...data, plan } : null
    });
  } catch {
    return NextResponse.json({ plan: 'free', authenticated: true, subscription: null });
  }
}
