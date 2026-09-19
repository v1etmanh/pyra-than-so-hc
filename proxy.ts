import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Check if accessing admin UI or admin API
  const isAdminRoute =
    url.startsWith('/api/admin') || /^\/(vi|en)?\/?admin/.test(url);

  if (isAdminRoute) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const [scheme, authValue] = basicAuth.split(' ', 2);
      let decodedValue = '';
      try {
        if (scheme?.toLowerCase() !== 'basic' || !authValue) throw new Error('Invalid auth scheme');
        decodedValue = atob(authValue);
      } catch {
        decodedValue = '';
      }
      const separator = decodedValue.indexOf(':');
      const user = separator >= 0 ? decodedValue.slice(0, separator) : '';
      const pwd = separator >= 0 ? decodedValue.slice(separator + 1) : '';

      const expectedUser = process.env.ADMIN_USERNAME;
      const expectedPwd = process.env.ADMIN_PASSWORD;

      if (user === expectedUser && pwd === expectedPwd) {
        // Bypass next-intl for API routes to prevent locale prefix redirection
        if (url.startsWith('/api/')) {
          return NextResponse.next();
        }
        return intlMiddleware(req);
      }
    }

    return new NextResponse('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Numerology Admin Area"'
      }
    });
  }

  // Bypass next-intl for normal API routes
  if (url.startsWith('/api/')) {
    // Native clients attach their Supabase access token as a Bearer header.
    // Expo Web therefore sends an OPTIONS preflight before checkout requests.
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
    }
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // Do not ignore /api here because /api/admin must pass through Basic Auth.
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
