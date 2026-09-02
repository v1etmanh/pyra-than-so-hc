export type UsageFeature = 'text' | 'wallpaper';
export type BillingPlan = 'free' | 'pro';

import { createAdminClient } from '../supabase/admin.ts';
import { consumeRateLimit, type RateLimitResult } from '../security/rate-limit.ts';
import { getClientIp } from '../security/request.ts';
import type { NextRequest } from 'next/server';

type UsageEntry = {
  day: string;
  requests: number;
  estimatedCostUsd: number;
  lastSeenAt: string;
  plan: BillingPlan;
  feature: UsageFeature;
};

const globalStore = globalThis as typeof globalThis & {
  __numinaUsageMeter?: Map<string, UsageEntry>;
};
const store = (globalStore.__numinaUsageMeter ??= new Map());

export const DAILY_LIMITS: Record<BillingPlan, Record<UsageFeature, number>> = {
  // Free users start with the full daily allowance of 15 requests.
  free: { text: 15, wallpaper: 2 },
  pro: { text: 100, wallpaper: 20 }
};

export type DurableAccessDecision = {
  allowed: boolean;
  rateLimited: boolean;
  unavailable: boolean;
  used: number;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function currentDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function consumeDailyUsage(
  identity: string,
  plan: BillingPlan,
  feature: UsageFeature
): { allowed: boolean; used: number; limit: number; remaining: number } {
  const now = new Date();
  const day = currentDay(now);
  const key = `${day}:${identity}:${feature}`;
  const current = store.get(key);
  const entry: UsageEntry = current && current.day === day
    ? current
    : {
        day,
        requests: 0,
        estimatedCostUsd: 0,
        lastSeenAt: now.toISOString(),
        plan,
        feature
      };
  entry.plan = plan;
  entry.requests += 1;
  entry.lastSeenAt = now.toISOString();
  store.set(key, entry);

  const limit = DAILY_LIMITS[plan][feature];
  return {
    allowed: entry.requests <= limit,
    used: entry.requests,
    limit,
    remaining: Math.max(0, limit - entry.requests)
  };
}

function localAccessDecision(
  request: NextRequest,
  identity: string,
  plan: BillingPlan,
  feature: UsageFeature
): DurableAccessDecision {
  const burst: RateLimitResult = consumeRateLimit(
    `ai:${identity}:${feature}`,
    feature === 'wallpaper' ? 3 : 10,
    60_000
  );
  const usage = consumeDailyUsage(identity, plan, feature);
  return {
    allowed: burst.allowed && usage.allowed,
    rateLimited: !burst.allowed,
    unavailable: false,
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    retryAfterSeconds: Math.max(1, Math.ceil((burst.resetAt - Date.now()) / 1000))
  };
}

/**
 * Uses the atomic Supabase RPC in production. The memory implementation is
 * intentionally retained for local development before the migration runs.
 */
export async function consumeDurableAccess(
  request: NextRequest,
  identity: string,
  plan: BillingPlan,
  feature: UsageFeature
): Promise<DurableAccessDecision> {
  const limit = DAILY_LIMITS[plan][feature];
  const burstLimit = feature === 'wallpaper' ? 3 : 10;
  const requireDurable = process.env.NODE_ENV === 'production' || process.env.NUMINA_REQUIRE_DURABLE_LIMITS === 'true';

  // Local development intentionally uses the in-process limiter until the
  // Supabase migration is applied. Calling a missing RPC on every click adds
  // seconds of avoidable latency before falling back to the local limiter.
  if (!requireDurable) return localAccessDecision(request, identity, plan, feature);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('consume_numina_access', {
      p_identity: identity,
      p_plan: plan,
      p_feature: feature,
      p_daily_limit: limit,
      p_burst_limit: burstLimit,
      p_burst_window_seconds: 60
    });
    if (error || !data) throw error || new Error('Empty usage decision');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Empty usage decision');
    return {
      allowed: Boolean(row.allowed),
      rateLimited: Boolean(row.rate_limited),
      unavailable: false,
      used: Number(row.used || 0),
      limit: Number(row.daily_limit || limit),
      remaining: Number(row.remaining || 0),
      retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds || 60))
    };
  } catch (error) {
    console.warn('[UsageMeter] Durable limiter unavailable:', error instanceof Error ? error.message : error);
    if (requireDurable) {
      return {
        allowed: false,
        rateLimited: false,
        unavailable: true,
        used: 0,
        limit,
        remaining: 0,
        retryAfterSeconds: 60
      };
    }
    return localAccessDecision(request, identity, plan, feature);
  }
}

export function recordAiUsage(input: {
  identity: string;
  plan: BillingPlan;
  feature: UsageFeature;
  route: string;
  provider?: string;
  estimatedCostUsd?: number;
}): void {
  const key = `${currentDay()}:${input.identity}:${input.feature}`;
  const entry = store.get(key);
  if (entry) {
    entry.estimatedCostUsd += Math.max(0, input.estimatedCostUsd || 0);
    entry.lastSeenAt = new Date().toISOString();
  }
  console.info('[NuminaUsage]', JSON.stringify({
    ...input,
    day: currentDay(),
    estimatedCostUsd: Math.max(0, input.estimatedCostUsd || 0)
  }));

  const requireDurable = process.env.NODE_ENV === 'production' || process.env.NUMINA_REQUIRE_DURABLE_LIMITS === 'true';
  if (!requireDurable) return;

  void (async () => {
    try {
      const admin = createAdminClient();
      const { error } = await admin.rpc('record_numina_ai_usage', {
        p_identity: input.identity,
        p_feature: input.feature,
        p_usage_day: currentDay(),
        p_estimated_cost_usd: Math.max(0, input.estimatedCostUsd || 0)
      });
      if (error) console.warn('[UsageMeter] Durable cost recording failed:', error.message);
    } catch {
      // Local development may intentionally run without the service role key.
    }
  })();
}

export function getUsageSnapshot() {
  return Array.from(store.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export async function getDurableUsageSnapshot() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('numina_usage_counters')
      .select('identity,feature,usage_day,requests,estimated_cost_usd,last_seen_at,plan')
      .order('last_seen_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('[UsageMeter] Durable snapshot unavailable:', error instanceof Error ? error.message : error);
    return getUsageSnapshot();
  }
}
