import type { NextRequest } from 'next/server';
import { getClientIp } from './request.ts';

type RateLimitEntry = { count: number; resetAt: number };
export type RateLimitResult = RateLimitEntry & { allowed: boolean; remaining: number };

const globalStore = globalThis as typeof globalThis & {
  __numinaRateLimits?: Map<string, RateLimitEntry>;
};

const store = (globalStore.__numinaRateLimits ??= new Map());

function cleanup(now: number): void {
  if (store.size < 10_000) return;
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) store.delete(key);
  });
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(now);
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { ...next, allowed: true, remaining: Math.max(0, limit - 1) };
  }

  current.count += 1;
  const allowed = current.count <= limit;
  return {
    ...current,
    allowed,
    remaining: Math.max(0, limit - current.count)
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
  message = 'Too many requests. Please try again later.'
): Response | null {
  if (result.allowed) return null;
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
      'X-RateLimit-Remaining': '0'
    }
  });
}

export function clientRateLimitKey(request: NextRequest, feature: string): string {
  return `${feature}:ip:${getClientIp(request)}`;
}
