function configuredOrigins(): string[] {
  return (process.env.API_ALLOWED_ORIGINS || process.env.CHAT_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
export function apiCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')?.replace(/\/$/, '') || '';
  const local = process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const allowed = Boolean(origin && (configuredOrigins().includes(origin) || local));
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-Id',
  };
}
