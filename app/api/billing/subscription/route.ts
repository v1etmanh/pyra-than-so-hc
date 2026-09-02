import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ plan: 'free', authenticated: false });
    const { data, error } = await supabase
      .from('numina_subscriptions')
      .select('plan,status,current_period_end,cancel_at_period_end')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    return NextResponse.json({
      authenticated: true,
      plan: data?.plan === 'pro' && !error ? 'pro' : 'free',
      subscription: data || null
    });
  } catch {
    return NextResponse.json({ plan: 'free', authenticated: true, subscription: null });
  }
}

