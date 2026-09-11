import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cancelPayPalSubscription } from '@/lib/billing/paypal';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: 'Please sign in first.', code: 'NOT_AUTHENTICATED' }, { status: 401 });
    const { data: subscription } = await supabase
      .from('numina_subscriptions')
      .select('provider,provider_subscription_id,current_period_end,cancel_at_period_end')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (subscription?.provider !== 'paypal' || !subscription.provider_subscription_id) {
      return NextResponse.json({ error: 'No PayPal subscription was found.', code: 'SUBSCRIPTION_NOT_FOUND' }, { status: 404 });
    }
    if (!subscription.cancel_at_period_end) {
      await cancelPayPalSubscription(subscription.provider_subscription_id, 'Customer requested cancellation from Numina.');
      const admin = createAdminClient();
      const { error } = await admin.from('numina_subscriptions').update({
        status: 'CANCELLED',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      }).eq('user_id', auth.user.id);
      if (error) throw error;
    }
    return NextResponse.json({ success: true, currentPeriodEnd: subscription.current_period_end });
  } catch (error) {
    console.error('[PayPalCancel]', error);
    return NextResponse.json({ error: 'Unable to cancel PayPal renewal right now.', code: 'BILLING_UNAVAILABLE' }, { status: 503 });
  }
}
