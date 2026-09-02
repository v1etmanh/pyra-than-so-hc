import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
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
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // Changed matcher to not explicitly ignore /api, so we can intercept /api/admin
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
