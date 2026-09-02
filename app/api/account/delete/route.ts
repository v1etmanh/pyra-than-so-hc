import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: 'You must be signed in to delete your account.' }, { status: 401 });
    }

    const admin = createAdminClient();
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

