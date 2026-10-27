import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getUsageDashboard } from '@/lib/usage/usage-dashboard';

export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_USAGE_SECRET?.trim() || '';
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_USAGE_SECRET?.trim()) {
    return NextResponse.json({ error: 'ADMIN_USAGE_SECRET is not configured.' }, { status: 503 });
  }
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const requestedDays = Number(request.nextUrl.searchParams.get('days') || 31);
  const days = Number.isFinite(requestedDays) ? Math.max(1, Math.min(93, requestedDays)) : 31;
  return NextResponse.json(await getUsageDashboard(days));
}
