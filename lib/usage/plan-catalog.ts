export type BillingPlan = 'free' | 'pro';

export type QuotaFeature =
  | 'ai_response'
  | 'daily_ca_dao'
  | 'daily_insight_back'
  | 'wallpaper';

export type PlanQuota = Record<QuotaFeature, number>;

export const PLAN_CATALOG_VERSION = '2026-10-25-v1';

export const PLAN_CATALOG: Record<BillingPlan, PlanQuota> = {
  free: {
    ai_response: 10,
    daily_ca_dao: 7,
    daily_insight_back: 10,
    wallpaper: 2,
  },
  pro: {
    ai_response: 200,
    daily_ca_dao: 31,
    daily_insight_back: 31,
    wallpaper: 30,
  },
};

export const QUOTA_FEATURES = Object.freeze(Object.keys(PLAN_CATALOG.free) as QuotaFeature[]);

export function isQuotaFeature(value: unknown): value is QuotaFeature {
  return typeof value === 'string' && QUOTA_FEATURES.includes(value as QuotaFeature);
}
