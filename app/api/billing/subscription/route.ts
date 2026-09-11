import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { effectiveBillingPlan } from '@/lib/billing/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ plan: 'free', authenticated: false });
    const { data, error } = await supabase
      .from('numina_subscriptions')
      .select('plan,provider,status,current_period_end,cancel_at_period_end')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    const plan = error ? 'free' : effectiveBillingPlan(data);
    return NextResponse.json({
      authenticated: true,
      plan,
      canManageBilling: Boolean(data?.provider),
      managementUrl: data?.provider === 'paypal'
        ? (process.env.PAYPAL_ENV === 'live' ? 'https://www.paypal.com/myaccount/autopay/' : 'https://www.sandbox.paypal.com/myaccount/autopay/')
        : null,
      subscription: data ? { ...data, plan } : null
    });
  } catch {
    return NextResponse.json({ plan: 'free', authenticated: true, subscription: null });
  }
}
