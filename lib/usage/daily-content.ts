import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { commitQuota, type QuotaReservation } from '@/lib/usage/quota-service';

export type DailyContentType = 'daily_ca_dao' | 'daily_insight_back';
export type DailyContentKey = {
  userId: string;
  profileKey: string;
  localDate: string;
  contentType: DailyContentType;
};

type ContentRow = { id: string; content: Record<string, unknown>; updated_at: string };
type Claim = { state: 'claimed'; rowId: string; claimId: string } | { state: 'cached'; content: Record<string, unknown> } | { state: 'pending' };

function isPlaceholder(content: Record<string, unknown> | null | undefined): boolean {
  return content?._state === 'generating';
}

function publicContent(content: Record<string, unknown>): Record<string, unknown> {
  const { _claimId: _privateClaimId, _state: _privateState, ...safe } = content;
  return safe;
}

async function readRow(admin: SupabaseClient, key: DailyContentKey): Promise<ContentRow | null> {
  const { data, error } = await admin.from('numina_daily_content')
    .select('id,content,updated_at')
    .eq('user_id', key.userId)
    .eq('profile_key', key.profileKey)
    .eq('local_date', key.localDate)
    .eq('content_type', key.contentType)
    .maybeSingle();
  if (error) throw error;
  return data as ContentRow | null;
}

export async function readDailyContent(admin: SupabaseClient, key: DailyContentKey) {
  const row = await readRow(admin, key);
  return row && !isPlaceholder(row.content) ? publicContent(row.content) : null;
}

/** Claims a unique user/profile/day/type slot before quota or provider work. */
export async function claimDailyContent(
  admin: SupabaseClient,
  key: DailyContentKey,
  locale: 'vi' | 'en',
): Promise<Claim> {
  const claimId = randomUUID();
  const now = new Date();
  const placeholder = { _state: 'generating', _claimId: claimId };
  const { data, error } = await admin.from('numina_daily_content').insert({
    user_id: key.userId,
    profile_key: key.profileKey,
    local_date: key.localDate,
    content_type: key.contentType,
    locale,
    content: placeholder,
    updated_at: now.toISOString(),
  }).select('id').maybeSingle();
  if (!error && data?.id) return { state: 'claimed', rowId: data.id, claimId };
  if (error && error.code !== '23505') throw error;

  const existing = await readRow(admin, key);
  if (!existing) return { state: 'pending' };
  if (!isPlaceholder(existing.content)) return { state: 'cached', content: publicContent(existing.content) };

  // A crashed request cannot block this profile-day forever. The equality on
  // updated_at makes stale-claim takeover atomic between competing requests.
  if (new Date(existing.updated_at).getTime() <= now.getTime() - 10 * 60_000) {
    const { data: reclaimed, error: reclaimError } = await admin.from('numina_daily_content')
      .update({ locale, content: placeholder, updated_at: now.toISOString() })
      .eq('id', existing.id)
      .eq('updated_at', existing.updated_at)
      .select('id')
      .maybeSingle();
    if (reclaimError) throw reclaimError;
    if (reclaimed?.id) return { state: 'claimed', rowId: reclaimed.id, claimId };
  }
  return { state: 'pending' };
}

export async function waitForDailyContent(admin: SupabaseClient, key: DailyContentKey) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const content = await readDailyContent(admin, key);
    if (content) return content;
  }
  return null;
}

export async function completeDailyContent(
  admin: SupabaseClient,
  claim: Extract<Claim, { state: 'claimed' }>,
  content: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await admin.from('numina_daily_content')
    .update({ content: { ...content, _claimId: claim.claimId }, updated_at: new Date().toISOString() })
    .eq('id', claim.rowId)
    .contains('content', { _claimId: claim.claimId })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Daily content claim was lost before completion');
}

/** Saves the claimed content and commits its quota reservation in one DB transaction. */
export async function commitDailyContent(
  admin: SupabaseClient,
  claim: Extract<Claim, { state: 'claimed' }>,
  reservation: QuotaReservation,
  content: Record<string, unknown>,
  metadata: Record<string, unknown>,
): Promise<{ used: number; remaining: number }> {
  const durable = process.env.NODE_ENV === 'production' || process.env.NUMINA_REQUIRE_DURABLE_LIMITS === 'true';
  if (!durable) {
    await completeDailyContent(admin, claim, content);
    return commitQuota(reservation, metadata);
  }
  const { data, error } = await admin.rpc('commit_numina_daily_content', {
    p_user_id: reservation.userId,
    p_reservation_id: reservation.reservationId,
    p_content_row_id: claim.rowId,
    p_claim_id: claim.claimId,
    p_content: content,
    p_metadata: metadata,
  });
  if (error || !data || !(data as Record<string, unknown>).committed) {
    throw error || new Error('Daily content quota transaction failed');
  }
  const result = data as Record<string, unknown>;
  return { used: Number(result.used || 0), remaining: Number(result.remaining || 0) };
}

export async function releaseDailyContentClaim(
  admin: SupabaseClient,
  claim: Extract<Claim, { state: 'claimed' }>,
): Promise<void> {
  await admin.from('numina_daily_content')
    .delete()
    .eq('id', claim.rowId)
    .contains('content', { _claimId: claim.claimId });
}
