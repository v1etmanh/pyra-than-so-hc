import { NextResponse } from 'next/server';
import { getDurableUsageSnapshot } from '@/lib/usage/usage-meter';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    note: 'Supabase-backed usage counters. Run supabase/billing_schema.sql before enabling production traffic.',
    usage: await getDurableUsageSnapshot()
  });
}
