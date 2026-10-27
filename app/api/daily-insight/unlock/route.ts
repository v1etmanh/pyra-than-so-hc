import { NextRequest, NextResponse } from 'next/server';
import { getRequestAccess, releaseRequestAccess } from '@/lib/billing/access';
import { apiCorsHeaders } from '@/lib/security/cors';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import {
  claimDailyContent,
  commitDailyContent,
  readDailyContent,
  releaseDailyContentClaim,
  waitForDailyContent,
} from '@/lib/usage/daily-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: apiCorsHeaders(request) });
}
export async function POST(request: NextRequest) {
  const headers = apiCorsHeaders(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_REQUEST' }, { status: 400, headers });
  }
  const profileKey = typeof body.profileKey === 'string' ? body.profileKey.trim() : '';
  const localDate = typeof body.localDate === 'string' ? body.localDate.trim() : '';
  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  if (!profileKey || profileKey.length > 160 || !/^\d{4}-\d{2}-\d{2}$/.test(localDate) || requestId.length < 8) {
    return NextResponse.json({ error: 'profileKey, localDate and requestId are required.', code: 'INVALID_REQUEST' }, { status: 422, headers });
  }
  const { user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: 'Authentication is required.', code: 'AUTH_REQUIRED' }, { status: 401, headers });
  const admin = createAdminClient();
  const contentKey = { userId: user.id, profileKey, localDate, contentType: 'daily_insight_back' as const };
  if (await readDailyContent(admin, contentKey)) return NextResponse.json({ unlocked: true, cached: true }, { headers });
  const claim = await claimDailyContent(admin, contentKey, body.locale === 'en' ? 'en' : 'vi');
  if (claim.state === 'cached') return NextResponse.json({ unlocked: true, cached: true }, { headers });
  if (claim.state === 'pending') {
    if (await waitForDailyContent(admin, contentKey)) return NextResponse.json({ unlocked: true, cached: true }, { headers });
    return NextResponse.json({ error: 'Daily Insight is being unlocked.', code: 'CONTENT_PENDING' }, { status: 409, headers });
  }

  const access = await getRequestAccess(request, 'daily_insight_back', requestId);
  if (access instanceof Response) {
    await releaseDailyContentClaim(admin, claim);
    for (const [key, value] of Object.entries(headers)) access.headers.set(key, value);
    return access;
  }
  try {
    const quota = await commitDailyContent(
      admin,
      claim,
      access,
      { unlocked: true },
      { route: '/api/daily-insight/unlock', profileKey, localDate },
    );
    return NextResponse.json({ unlocked: true, cached: false, quota }, { headers });
  } catch (error) {
    await releaseRequestAccess(access, 'daily_insight_unlock_failed');
    await releaseDailyContentClaim(admin, claim);
    console.error('[Daily Insight Unlock]', error);
    return NextResponse.json({ error: 'Could not unlock daily insight.', code: 'UNLOCK_FAILED' }, { status: 500, headers });
  }
}
