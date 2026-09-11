import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cancelPayPalSubscription } from '@/lib/billing/paypal';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: 'You must be signed in to delete your account.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: subscription, error: subscriptionError } = await admin
      .from('numina_subscriptions')
      .select('provider,provider_subscription_id,status')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (subscriptionError) {
      console.error('[AccountDelete] Billing lookup failed:', subscriptionError.message);
      return NextResponse.json({ error: 'Unable to verify the billing account before deletion.' }, { status: 502 });
    }
    if (subscription?.provider === 'paypal' && subscription.provider_subscription_id &&
      ['ACTIVE', 'SUSPENDED', 'PAST_DUE'].includes(String(subscription.status || '').toUpperCase())) {
      try {
        await cancelPayPalSubscription(subscription.provider_subscription_id, 'Numina account deletion');
      } catch (error) {
        console.error('[AccountDelete] PayPal cancellation failed:', error);
        return NextResponse.json({ error: 'Your PayPal renewal could not be canceled. Your account was not deleted.' }, { status: 502 });
      }
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.error('[AccountDelete] Supabase deletion failed:', deleteError.message);
      return NextResponse.json({ error: 'Unable to delete the account right now.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AccountDelete] Unexpected error:', error);
    return NextResponse.json({ error: 'Account deletion is not configured yet.' }, { status: 503 });
  }
}
