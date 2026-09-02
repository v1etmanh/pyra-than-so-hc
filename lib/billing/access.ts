import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/security/request';
import { consumeDurableAccess, type BillingPlan, type UsageFeature } from '@/lib/usage/usage-meter';

export type RequestAccess = {
  userId?: string;
  identity: string;
  plan: BillingPlan;
  feature: UsageFeature;
  remaining: number;
};

export async function getRequestAccess(
  request: NextRequest,
  feature: UsageFeature
): Promise<RequestAccess | Response> {
  let userId: string | undefined;
  let plan: BillingPlan = 'free';

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id;

    if (userId) {
      const { data: subscription } = await supabase
        .from('numina_subscriptions')
        .select('plan,status,current_period_end')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      const periodIsValid = !subscription?.current_period_end ||
        new Date(subscription.current_period_end).getTime() > Date.now();
      if (periodIsValid && subscription?.plan === 'pro') plan = 'pro';
    }
  } catch (error) {
    // Missing billing tables/config must fail closed to Free, never block the app.
    console.warn('[BillingAccess] Could not resolve subscription:', error);
  }

  const identity = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
  const usage = await consumeDurableAccess(request, identity, plan, feature);
  if (usage.unavailable) {
    return new Response(JSON.stringify({
      error: 'Usage controls are temporarily unavailable. Please try again shortly.',
      code: 'USAGE_CONTROL_UNAVAILABLE'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(usage.retryAfterSeconds) }
    });
  }
  if (usage.rateLimited) {
    return new Response(JSON.stringify({
      error: 'Too many AI requests. Please try again in a moment.',
      code: 'RATE_LIMITED'
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(usage.retryAfterSeconds),
        'X-RateLimit-Remaining': '0'
      }
    });
  }
  if (!usage.allowed) {
    return new Response(JSON.stringify({
      error: plan === 'pro'
        ? 'Daily usage limit reached. Please try again tomorrow.'
        : 'Bạn đã dùng hết lượt miễn phí hôm nay. Hãy nâng cấp Pro để tiếp tục.',
      code: 'DAILY_LIMIT_REACHED',
      plan,
      limit: usage.limit,
      remaining: 0
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(60 * 60 * 6),
        'X-RateLimit-Remaining': '0'
      }
    });
  }

  return { userId, identity, plan, feature, remaining: usage.remaining };
}
