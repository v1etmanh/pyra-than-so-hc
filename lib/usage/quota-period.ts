import type { BillingPlan } from './plan-catalog.ts';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
export type QuotaPeriod = { start: Date; end: Date };

type PeriodSubscription = {
  current_period_start?: string | null;
  current_period_end?: string | null;
};

/** Free periods reset at 00:00 on day one in Vietnam (UTC+7). */
export function getFreeQuotaPeriod(now = new Date()): QuotaPeriod {
  const vietnam = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const start = new Date(Date.UTC(vietnam.getUTCFullYear(), vietnam.getUTCMonth(), 1) - VIETNAM_OFFSET_MS);
  const end = new Date(Date.UTC(vietnam.getUTCFullYear(), vietnam.getUTCMonth() + 1, 1) - VIETNAM_OFFSET_MS);
  return { start, end };
}

/** Pro periods follow the provider renewal window. Legacy rows fall back to 30 days. */
export function getQuotaPeriod(
  plan: BillingPlan,
  subscription: PeriodSubscription | null | undefined,
  now = new Date(),
): QuotaPeriod {
  if (plan !== 'pro' || !subscription?.current_period_end) return getFreeQuotaPeriod(now);
  const end = new Date(subscription.current_period_end);
  const explicitStart = subscription.current_period_start ? new Date(subscription.current_period_start) : null;
  const start = explicitStart && Number.isFinite(explicitStart.getTime())
    ? explicitStart
    : new Date(end.getTime() - 30 * 86_400_000);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    return getFreeQuotaPeriod(now);
  }
  return { start, end };
}
