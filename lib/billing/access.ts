import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { commitQuota, releaseQuota, reserveQuota, type QuotaReservation } from '@/lib/usage/quota-service';
import type { QuotaFeature } from '@/lib/usage/plan-catalog';

export type RequestAccess = QuotaReservation & { identity: string };

export async function getRequestAccess(
  request: NextRequest,
  feature: QuotaFeature | 'text',
  requestId?: string,
): Promise<RequestAccess | Response> {
  const quotaFeature: QuotaFeature = feature === 'text' ? 'ai_response' : feature;
  const reservation = await reserveQuota(
    request,
    quotaFeature,
    requestId || request.headers.get('x-request-id') || randomUUID(),
  );
  if (reservation instanceof Response) return reservation;
  return { ...reservation, identity: `user:${reservation.userId}` };
}

export async function commitRequestAccess(access: RequestAccess, metadata: Record<string, unknown> = {}) {
  return commitQuota(access, metadata);
}

export async function releaseRequestAccess(access: RequestAccess, reason?: string) {
  return releaseQuota(access, reason);
}
