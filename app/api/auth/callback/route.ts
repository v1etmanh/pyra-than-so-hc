import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeAuthRedirectPath } from '@/lib/security/redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = safeAuthRedirectPath(searchParams.get('next'));
  const type = searchParams.get('type');

  if (type === 'recovery' && !next.includes('reset_password')) {
    next = next.includes('?') ? `${next}&reset_password=true` : `${next}?reset_password=true`;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/account?error=auth-code-error`);
}
