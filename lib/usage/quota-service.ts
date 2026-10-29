import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { effectiveBillingPlan, type BillingSubscription } from '@/lib/billing/types';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import {
  PLAN_CATALOG,
  PLAN_CATALOG_VERSION,
  QUOTA_FEATURES,
  type BillingPlan,
  type QuotaFeature,
} from '@/lib/usage/plan-catalog';
import { getFreeQuotaPeriod, getQuotaPeriod, type QuotaPeriod } from '@/lib/usage/quota-period';

export { getFreeQuotaPeriod, getQuotaPeriod } from '@/lib/usage/quota-period';
export type { QuotaPeriod } from '@/lib/usage/quota-period';

const RESERVATION_TTL_SECONDS = 10 * 60;

export type QuotaReservation = {
  userId: string;
  plan: BillingPlan;
  feature: QuotaFeature;
  reservationId: string;
  requestId: string;
  periodStart: string;
  periodEnd: string;
  limit: number;
  used: number;
  remaining: number;
  alreadyCommitted?: boolean;
};

export type QuotaSnapshot = Record<QuotaFeature, { limit: number; used: number; reserved: number; remaining: number }>;

type SubscriptionRow = BillingSubscription & { current_period_start?: string | null };

type LocalReservation = QuotaReservation & { status: 'reserved' | 'committed' | 'released'; expiresAt: number };
const quotaGlobal = globalThis as typeof globalThis & {
  __numinaQuotaReservations?: Map<string, LocalReservation>;
  __numinaQuotaUsage?: Map<string, number>;
};
const localReservations = (quotaGlobal.__numinaQuotaReservations ??= new Map());
const localUsage = (quotaGlobal.__numinaQuotaUsage ??= new Map());

function isDurableRequired(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.NUMINA_REQUIRE_DURABLE_LIMITS === 'true';
}
export async function resolveUserQuotaContext(request: Request) {
  const { supabase, user } = await getRequestAuth(request);
  if (!user) return null;
  const { data, error } = await supabase
    .from('numina_subscriptions')
    .select('plan,provider,status,current_period_start,current_period_end,cancel_at_period_end')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error && isDurableRequired()) throw error;
  const subscription = error ? null : data as SubscriptionRow | null;
  const plan = effectiveBillingPlan(subscription);
  return { userId: user.id, plan, subscription, period: getQuotaPeriod(plan, subscription) };
}

function jsonError(status: number, body: Record<string, unknown>, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function localBucketKey(userId: string, feature: QuotaFeature, period: QuotaPeriod) {
  return `${userId}:${period.start.toISOString()}:${period.end.toISOString()}:${PLAN_CATALOG_VERSION}:${feature}`;
}

function reserveLocally(input: {
  userId: string;
  plan: BillingPlan;
  feature: QuotaFeature;
  requestId: string;
  period: QuotaPeriod;
}): QuotaReservation | null {
  const bucketKey = localBucketKey(input.userId, input.feature, input.period);
  const reservationKey = `${bucketKey}:${input.requestId}`;
  const now = Date.now();
  for (const reservation of Array.from(localReservations.values())) {
    if (reservation.status === 'reserved' && reservation.expiresAt <= now) reservation.status = 'released';
  }
  const used = localUsage.get(bucketKey) || 0;
  const reserved = Array.from(localReservations.values()).filter((item) =>
    item.status === 'reserved'
      && item.userId === input.userId
      && item.feature === input.feature
      && item.periodStart === input.period.start.toISOString()
      && item.periodEnd === input.period.end.toISOString()
      && item.plan === input.plan
  ).length;
  const limit = PLAN_CATALOG[input.plan][input.feature];
  const existing = localReservations.get(reservationKey);
  if (existing) {
    if (existing.status !== 'released') return { ...existing, alreadyCommitted: existing.status === 'committed' };
    if (used + reserved >= limit) return null;
    Object.assign(existing, {
      status: 'reserved' as const,
      expiresAt: now + RESERVATION_TTL_SECONDS * 1000,
      used,
      limit,
      remaining: Math.max(0, limit - used - reserved - 1),
    });
    return { ...existing, alreadyCommitted: false };
  }
  if (used + reserved >= limit) return null;
  const reservation: LocalReservation = {
    userId: input.userId,
    plan: input.plan,
    feature: input.feature,
    reservationId: randomUUID(),
    requestId: input.requestId,
    periodStart: input.period.start.toISOString(),
    periodEnd: input.period.end.toISOString(),
    limit,
    used,
    remaining: Math.max(0, limit - used - reserved - 1),
    status: 'reserved',
    expiresAt: now + RESERVATION_TTL_SECONDS * 1000,
  };
  localReservations.set(reservationKey, reservation);
  return reservation;
}

export async function reserveQuota(
  request: NextRequest,
  feature: QuotaFeature,
  requestId?: string,
): Promise<QuotaReservation | Response> {
  let context;
  try {
    context = await resolveUserQuotaContext(request);
  } catch (error) {
    console.warn('[Quota] Context unavailable:', error);
    return jsonError(503, { error: 'Quota service is temporarily unavailable.', code: 'QUOTA_UNAVAILABLE' }, { 'Retry-After': '60' });
  }
  if (!context) {
    return jsonError(401, { error: 'Bạn cần đăng nhập để sử dụng tính năng này.', code: 'AUTH_REQUIRED' });
  }

  const idempotencyKey = String(requestId || request.headers.get('x-request-id') || '').trim();
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    return jsonError(400, { error: 'requestId is required.', code: 'INVALID_REQUEST_ID' });
  }

  const burstLimit = feature === 'wallpaper' ? 3 : 10;
  const burst = consumeRateLimit(`quota:${context.userId}:${feature}`, burstLimit, 60_000);
  if (!burst.allowed) {
    const retryAfter = Math.max(1, Math.ceil((burst.resetAt - Date.now()) / 1000));
    return jsonError(429, { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', code: 'RATE_LIMITED' }, { 'Retry-After': String(retryAfter) });
  }

  const limit = PLAN_CATALOG[context.plan][feature];
  if (!isDurableRequired()) {
    const reservation = reserveLocally({ ...context, feature, requestId: idempotencyKey });
    if (!reservation) return quotaReached(context.plan, feature, limit, context.period.end);
    return reservation;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('reserve_numina_quota', {
      p_user_id: context.userId,
      p_feature: feature,
      p_plan: context.plan,
      p_plan_version: PLAN_CATALOG_VERSION,
      p_quota_limit: limit,
      p_period_start: context.period.start.toISOString(),
      p_period_end: context.period.end.toISOString(),
      p_idempotency_key: idempotencyKey,
      p_ttl_seconds: RESERVATION_TTL_SECONDS,
    });
    if (error || !data) throw error || new Error('Empty quota response');
    const row = data as Record<string, unknown>;
    if (!row.allowed) return quotaReached(context.plan, feature, limit, context.period.end);
    return {
      userId: context.userId,
      plan: context.plan,
      feature,
      reservationId: String(row.reservation_id),
      requestId: idempotencyKey,
      periodStart: context.period.start.toISOString(),
      periodEnd: context.period.end.toISOString(),
      limit: Number(row.limit ?? limit),
      used: Number(row.used ?? 0),
      remaining: Number(row.remaining ?? 0),
      alreadyCommitted: row.status === 'committed',
    };
  } catch (error) {
    console.warn('[Quota] Reservation failed:', error);
    return jsonError(503, { error: 'Quota service is temporarily unavailable.', code: 'QUOTA_UNAVAILABLE' }, { 'Retry-After': '60' });
  }
}

function quotaReached(plan: BillingPlan, feature: QuotaFeature, limit: number, periodEnd: Date) {
  return jsonError(429, {
    error: plan === 'pro'
      ? 'Bạn đã dùng hết hạn mức kỳ này.'
      : 'Bạn đã dùng hết lượt miễn phí tháng này. Hãy nâng cấp NUMELYRA Pro để tiếp tục.',
    code: 'MONTHLY_LIMIT_REACHED',
    plan,
    feature,
    limit,
    remaining: 0,
    periodEnd: periodEnd.toISOString(),
  });
}

export async function commitQuota(
  reservation: QuotaReservation,
  metadata: Record<string, unknown> = {},
): Promise<{ used: number; remaining: number }> {
  if (reservation.alreadyCommitted) return { used: reservation.used, remaining: reservation.remaining };
  if (!isDurableRequired()) {
    const bucketKey = `${reservation.userId}:${reservation.periodStart}:${reservation.periodEnd}:${PLAN_CATALOG_VERSION}:${reservation.feature}`;
    const entry = Array.from(localReservations.values()).find((item) => item.reservationId === reservation.reservationId);
    if (entry?.status === 'reserved') {
      if (entry.expiresAt <= Date.now()) {
        entry.status = 'released';
        throw new Error('Quota reservation expired before commit');
      }
      entry.status = 'committed';
      const committedUsed = (localUsage.get(bucketKey) || 0) + 1;
      localUsage.set(bucketKey, committedUsed);
      entry.used = committedUsed;
      entry.remaining = Math.max(0, entry.limit - committedUsed);
    }
    const used = localUsage.get(bucketKey) || reservation.used;
    return { used, remaining: Math.max(0, reservation.limit - used) };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('commit_numina_quota', {
    p_user_id: reservation.userId,
    p_reservation_id: reservation.reservationId,
    p_metadata: metadata,
  });
  if (error || !data || !(data as Record<string, unknown>).committed) {
    throw error || new Error('Quota reservation could not be committed');
  }
  const row = data as Record<string, unknown>;
  return { used: Number(row.used || 0), remaining: Number(row.remaining || 0) };
}

export async function releaseQuota(reservation: QuotaReservation, reason = 'request_failed'): Promise<void> {
  if (reservation.alreadyCommitted) return;
  if (!isDurableRequired()) {
    const entry = Array.from(localReservations.values()).find((item) => item.reservationId === reservation.reservationId);
    if (entry?.status === 'reserved') entry.status = 'released';
    return;
  }
  try {
    const admin = createAdminClient();
    await admin.rpc('release_numina_quota', {
      p_user_id: reservation.userId,
      p_reservation_id: reservation.reservationId,
      p_reason: reason,
    });
  } catch (error) {
    console.warn('[Quota] Release failed:', error);
  }
}

export async function getQuotaSnapshot(
  userId: string,
  plan: BillingPlan,
  period: QuotaPeriod,
): Promise<QuotaSnapshot> {
  const result = {} as QuotaSnapshot;
  for (const feature of QUOTA_FEATURES) {
    result[feature] = { limit: PLAN_CATALOG[plan][feature], used: 0, reserved: 0, remaining: PLAN_CATALOG[plan][feature] };
  }
  if (!isDurableRequired()) {
    for (const feature of QUOTA_FEATURES) {
      const bucketKey = localBucketKey(userId, feature, period);
      const used = localUsage.get(bucketKey) || 0;
      const reserved = Array.from(localReservations.values()).filter((item) =>
        item.userId === userId && item.feature === feature && item.periodStart === period.start.toISOString()
          && item.status === 'reserved' && item.expiresAt > Date.now()
      ).length;
      result[feature] = { limit: PLAN_CATALOG[plan][feature], used, reserved, remaining: Math.max(0, PLAN_CATALOG[plan][feature] - used - reserved) };
    }
    return result;
  }
  const admin = createAdminClient();
  const [bucketResult, reservationResult] = await Promise.all([
    admin.from('numina_usage_buckets').select('feature,used,quota_limit')
      .eq('user_id', userId).eq('period_start', period.start.toISOString()).eq('period_end', period.end.toISOString()),
    admin.from('numina_usage_reservations').select('feature')
      .eq('user_id', userId).eq('period_start', period.start.toISOString()).eq('period_end', period.end.toISOString())
      .eq('status', 'reserved').gt('expires_at', new Date().toISOString()),
  ]);
  if (bucketResult.error) throw bucketResult.error;
  if (reservationResult.error) throw reservationResult.error;
  const buckets = bucketResult.data;
  const reservations = reservationResult.data;
  for (const row of buckets || []) {
    const feature = row.feature as QuotaFeature;
    if (!result[feature]) continue;
    result[feature].used = Number(row.used || 0);
    result[feature].limit = Number(row.quota_limit || result[feature].limit);
  }
  for (const row of reservations || []) {
    const feature = row.feature as QuotaFeature;
    if (result[feature]) result[feature].reserved += 1;
  }
  for (const feature of QUOTA_FEATURES) {
    result[feature].remaining = Math.max(0, result[feature].limit - result[feature].used - result[feature].reserved);
  }
  return result;
}

export async function recordActualAiUsage(input: {
  reservation: QuotaReservation;
  route: string;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  retryCount?: number;
}) {
  try {
    if (!isDurableRequired()) {
      console.info('[NUMELYRA Usage]', JSON.stringify(input));
      return;
    }
    const admin = createAdminClient();
    const { error } = await admin.from('numina_ai_usage_events').insert({
      user_id: input.reservation.userId,
      reservation_id: input.reservation.reservationId,
      feature: input.reservation.feature,
      route: input.route,
      provider: input.provider || null,
      model: input.model || null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      cost_usd: input.costUsd ?? null,
      retry_count: input.retryCount || 0,
    });
    if (error) console.warn('[Quota] Usage telemetry failed:', error.message);
  } catch (error) {
    console.warn(
      '[Quota] Usage telemetry failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
  }
}

/** Records provider cost for features governed outside the monthly quota ledger. */
export async function recordUnmeteredAiUsage(input: {
  userId: string;
  feature: string;
  route: string;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  retryCount?: number;
}) {
  try {
    if (!isDurableRequired()) {
      console.info('[NUMELYRA Usage]', JSON.stringify(input));
      return;
    }
    const admin = createAdminClient();
    const { error } = await admin.from('numina_ai_usage_events').insert({
      user_id: input.userId,
      reservation_id: null,
      feature: input.feature,
      route: input.route,
      provider: input.provider || null,
      model: input.model || null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      cost_usd: input.costUsd ?? null,
      retry_count: input.retryCount || 0,
    });
    if (error) console.warn('[Quota] Usage telemetry failed:', error.message);
  } catch (error) {
    console.warn(
      '[Quota] Usage telemetry failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
  }
}
