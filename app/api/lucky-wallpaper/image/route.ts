import { NextRequest, NextResponse } from 'next/server';
import { verifyWallpaperAssetToken } from '@/lib/lucky-wallpaper/image-service';

export const dynamic = 'force-dynamic';

function isAllowedProviderUrl(url: URL, provider: 'pixabay' | 'pexels'): boolean {
  if (url.protocol !== 'https:') return false;
  return provider === 'pexels'
    ? url.hostname === 'images.pexels.com'
    : url.hostname === 'cdn.pixabay.com' || url.hostname === 'pixabay.com';
}

async function fetchImageFollowingSafeRedirects(url: string, provider: 'pixabay' | 'pexels'): Promise<Response> {
  let currentUrl = new URL(url);
  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    if (!isAllowedProviderUrl(currentUrl, provider)) throw new Error('Unexpected image host.');
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,image/*' },
    });
    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get('location');
    if (!location) throw new Error('Invalid image redirect.');
    currentUrl = new URL(location, currentUrl);
  }
  throw new Error('Too many image redirects.');
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const signature = req.nextUrl.searchParams.get('signature') || '';
  const asset = verifyWallpaperAssetToken(token, signature);
  if (!asset) {
    return NextResponse.json({ error: 'Invalid wallpaper asset.' }, { status: 400 });
  }

  try {
    const response = await fetchImageFollowingSafeRedirects(asset.url, asset.provider);
    const contentType = response.headers.get('content-type') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (!response.ok || !contentType.startsWith('image/') || contentLength > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Wallpaper image is unavailable.' }, { status: 502 });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Wallpaper image is unavailable.' }, { status: 502 });
  }
}
