import { createAdminClient } from '@/lib/supabase/admin';

type UsageEvent = {
  user_id: string;
  reservation_id: string | null;
  feature: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | string | null;
  retry_count: number | null;
};

function percentile(values: number[], fraction: number): number {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * fraction) - 1)] || 0;
}

export async function getUsageDashboard(days = 31) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const since = new Date(Date.now() - Math.max(1, Math.min(days, 93)) * 86_400_000).toISOString();
  const [usageResult, bucketResult, orderResult, paymentResult, subscriptionResult] = await Promise.all([
    admin.from('numina_ai_usage_events')
      .select('user_id,reservation_id,feature,input_tokens,output_tokens,cost_usd,retry_count')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10_000),
    admin.from('numina_usage_buckets')
      .select('feature,used,quota_limit')
      .gte('period_end', nowIso)
      .limit(10_000),
    admin.from('numina_payment_orders')
      .select('provider,status')
      .gte('created_at', since)
      .limit(10_000),
    admin.from('numina_payment_events')
      .select('provider,status,description')
      .gte('created_at', since)
      .limit(10_000),
    admin.from('numina_subscriptions')
      .select('plan,status,current_period_end,cancel_at_period_end,updated_at')
      .limit(10_000),
  ]);
  if (usageResult.error) throw usageResult.error;
  if (bucketResult.error) throw bucketResult.error;
  if (orderResult.error) throw orderResult.error;
  if (paymentResult.error) throw paymentResult.error;
  if (subscriptionResult.error) throw subscriptionResult.error;

  const events = (usageResult.data || []) as UsageEvent[];
  const buckets = bucketResult.data || [];
  const byFeature: Record<string, { requests: number; inputTokens: number; outputTokens: number; costUsd: number; retries: number }> = {};
  const featureReservations = new Map<string, Set<string>>();
  const requestCosts = new Map<string, number>();
  const perUser = new Map<string, number>();
  let totalCostUsd = 0;
  let totalRetries = 0;
  events.forEach((event, eventIndex) => {
    const cost = Number(event.cost_usd || 0);
    const retries = Number(event.retry_count || 0);
    const feature = (byFeature[event.feature] ??= { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, retries: 0 });
    const requestKey = event.reservation_id || `unlinked:${eventIndex}`;
    const reservations = featureReservations.get(event.feature) || new Set<string>();
    reservations.add(requestKey);
    featureReservations.set(event.feature, reservations);
    feature.requests = reservations.size;
    feature.inputTokens += Number(event.input_tokens || 0);
    feature.outputTokens += Number(event.output_tokens || 0);
    feature.costUsd += cost;
    feature.retries += retries;
    totalCostUsd += cost;
    totalRetries += retries;
    perUser.set(event.user_id, (perUser.get(event.user_id) || 0) + cost);
    requestCosts.set(requestKey, (requestCosts.get(requestKey) || 0) + cost);
  });

  const subscriptions = subscriptionResult.data || [];
  const paidSubscribers = subscriptions.filter((row) => row.plan === 'pro'
    && Boolean(row.current_period_end && new Date(row.current_period_end) > new Date())).length;
  const projectedCogsPerSubscriber = paidSubscribers > 0 ? totalCostUsd / paidSubscribers : 0;
  const p95AiCost = percentile(Array.from(requestCosts.values()), 0.95);
  const retryRate = requestCosts.size ? totalRetries / requestCosts.size : 0;
  const quotaHitBuckets = (buckets || []).filter((row) => Number(row.used) >= Number(row.quota_limit)).length;
  const quotaHitRate = (buckets || []).length ? quotaHitBuckets / (buckets || []).length : 0;
  const orders = orderResult.data || [];
  const paidOrders = orders.filter((order) => order.status === 'paid').length;
  const paymentEvents = paymentResult.data || [];
  const renewalEvents = paymentEvents.filter((event) =>
    /PAYMENT\.SALE\.COMPLETED|RENEW|paid/i.test(event.status || '')
      || event.description === 'Google Play RTDN:2'
  ).length;
  const refundEvents = paymentEvents.filter((event) => /REFUND|REVERSE|REVOK/i.test(event.status || '')).length;
  const churnedSubscriptions = subscriptions.filter((row) => {
    if (!row.updated_at || new Date(row.updated_at) < new Date(since)) return false;
    return row.plan !== 'pro' && /CANCEL|EXPIRED|REVERSE|REVOK|INACTIVE/i.test(row.status || '');
  }).length;
  const conversionRate = orders.length ? paidOrders / orders.length : 0;
  const churnRate = paidSubscribers + churnedSubscriptions
    ? churnedSubscriptions / (paidSubscribers + churnedSubscriptions)
    : 0;

  return {
    window: { days, since, generatedAt: nowIso },
    totals: { providerCalls: events.length, completedAiResponses: requestCosts.size, paidSubscribers, costUsd: totalCostUsd, projectedCogsPerSubscriber, p95AiCost, retryRate, quotaHitRate },
    byFeature,
    highestCostUsers: Array.from(perUser, ([userId, costUsd]) => ({ userId, costUsd })).sort((a, b) => b.costUsd - a.costUsd).slice(0, 50),
    commercial: {
      webCheckouts: orders.length,
      paidWebCheckouts: paidOrders,
      conversionRate,
      renewalPaymentEvents: renewalEvents,
      refundOrRevokeEvents: refundEvents,
      churnedSubscriptions,
      churnRate,
      definitions: 'Conversion uses PayPal/payOS checkout orders. Churn uses terminal subscription states updated inside the selected window.',
    },
    alerts: {
      p95AiCostExceeded: p95AiCost > 0.01,
      retryRateExceeded: retryRate > 0.15,
      projectedCogsExceeded: projectedCogsPerSubscriber > 2.50,
    },
    thresholds: { p95AiCostUsd: 0.01, retryRate: 0.15, cogsPerSubscriberUsd: 2.50 },
  };
}
