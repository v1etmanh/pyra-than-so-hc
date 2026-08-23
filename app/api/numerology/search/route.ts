import { NextRequest, NextResponse } from 'next/server';
import { searchMockIndicators } from '@/utils/numerology-qa';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '8');

  if (query.length < 2) {
    return NextResponse.json(
      { error: 'Query phải có ít nhất 2 ký tự.', results: [] },
      { status: 400 }
    );
  }

  return NextResponse.json({
    mock: true,
    catalog: '24-indicators',
    query,
    results: searchMockIndicators(query, Number.isFinite(limit) ? limit : 8)
  });
}
