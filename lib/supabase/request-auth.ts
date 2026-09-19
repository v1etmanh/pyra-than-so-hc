import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createCookieClient } from './server';

/**
 * Resolves the authenticated user for both web (Supabase SSR cookies) and
 * native clients (Authorization: Bearer <Supabase access token>).
 */
export async function getRequestAuth(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];

  if (token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data } = await supabase.auth.getUser(token);
    return { supabase, user: data.user };
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
