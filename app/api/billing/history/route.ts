import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ history: [] }, { status: 401 });
    const { data, error } = await supabase
      .from('numina_payment_events')
      .select('id,amount,currency,status,description,created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ history: [] });
    return NextResponse.json({ history: data || [] });
  } catch {
    return NextResponse.json({ history: [] });
  }
}

