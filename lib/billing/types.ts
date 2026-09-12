import type { BillingPlan } from '../usage/usage-meter.ts';

export type BillingProvider = 'paypal' | 'payos';

export type BillingSubscription = {
  plan?: BillingPlan | string | null;
  provider?: BillingProvider | null;
  provider_subscription_id?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  last_provider_event_at?: string | null;
};

export const PAYOS_PRO_PRICE_VND = 79_000;
export const PAYPAL_PRO_PRICE_USD_CENTS = 399;
export const PAYOS_ACCESS_DAYS = 30;

export function effectiveBillingPlan(
  subscription: BillingSubscription | null | undefined,
  now = new Date()
): BillingPlan {
  if (subscription?.plan !== 'pro' || !subscription.current_period_end) return 'free';
  const periodEnd = new Date(subscription.current_period_end).getTime();
  return Number.isFinite(periodEnd) && periodEnd > now.getTime() ? 'pro' : 'free';
}

export function hasActiveEntitlement(
  subscription: BillingSubscription | null | undefined,
  now = new Date()
): boolean {
  return effectiveBillingPlan(subscription, now) === 'pro';
}

export function nextPayosPeriodEnd(
  currentPeriodEnd: string | null | undefined,
  now = new Date()
): Date {
  const current = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const base = current && Number.isFinite(current.getTime()) && current > now ? current : now;
  return new Date(base.getTime() + PAYOS_ACCESS_DAYS * 24 * 60 * 60 * 1000);
}

export function isTerminalProviderStatus(status: string | null | undefined): boolean {
  return ['CANCELLED', 'CANCELED', 'EXPIRED', 'INACTIVE', 'FAILED'].includes(
    String(status || '').toUpperCase()
  );
}

export function isPendingPayPalStatus(status: string | null | undefined): boolean {
  return ['CREATING', 'APPROVAL_PENDING'].includes(String(status || '').toUpperCase());
}

export function isManageablePayPalStatus(status: string | null | undefined): boolean {
  return ['ACTIVE', 'SUSPENDED', 'PAST_DUE'].includes(String(status || '').toUpperCase());
}
