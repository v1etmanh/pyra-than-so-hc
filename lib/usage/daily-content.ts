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

export type DailyProfileQuotaSnapshot = {
  limit: number;
  used: number;
  remaining: number;
  localDate: string;
};

type ContentRow = { id: string; locale: string; content: Record<string, unknown>; updated_at: string };
type ClaimedContent = {
  state: 'claimed';
  rowId: string;
  claimId: string;
  claimKind?: 'base' | 'localization';
  userId?: string;
  locale?: 'vi' | 'en';
  anchor?: { caDaoSample?: string; caDaoCategory?: string | null } | null;
};
type Claim = ClaimedContent
  | { state: 'cached'; content: Record<string, unknown> }
  | { state: 'pending' }
  | { state: 'limit_reached'; used: number; limit: number };

function isPlaceholder(content: Record<string, unknown> | null | undefined): boolean {
  return content?._state === 'generating';
}

function publicContent(content: Record<string, unknown>): Record<string, unknown> {
  const { _claimId: _privateClaimId, _state: _privateState, ...safe } = content;
  return safe;
}

/** Reads the same allocated profile rows used by claimDailyContent's atomic cap. */
export async function getDailyProfileQuotaSnapshot(
  admin: SupabaseClient,
  input: {
    userId: string;
    localDate: string;
    contentType: DailyContentType;
    limit: number;
  },
): Promise<DailyProfileQuotaSnapshot> {
  if (!Number.isInteger(input.limit) || input.limit < 1) {
    throw new Error('Invalid daily profile limit');
  }
  const { count, error } = await admin
    .from('numina_daily_content')
    .select('profile_key', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .eq('local_date', input.localDate)
    .eq('content_type', input.contentType);
  if (error) throw error;
  const used = Math.max(0, Number(count || 0));
  return {
    limit: input.limit,
    used,
    remaining: Math.max(0, input.limit - used),
    localDate: input.localDate,
  };
}

async function readRow(admin: SupabaseClient, key: DailyContentKey): Promise<ContentRow | null> {
  const { data, error } = await admin.from('numina_daily_content')
    .select('id,locale,content,updated_at')
    .eq('user_id', key.userId)
    .eq('profile_key', key.profileKey)
    .eq('local_date', key.localDate)
    .eq('content_type', key.contentType)
    .maybeSingle();
  if (error) throw error;
  return data as ContentRow | null;
}

export async function readDailyContent(
  admin: SupabaseClient,
  key: DailyContentKey,
  locale?: 'vi' | 'en',
) {
  const row = await readRow(admin, key);
  if (!row || isPlaceholder(row.content)) return null;
  if (locale) {
    const localizations = row.content.localizations;
    if (localizations && typeof localizations === 'object') {
      const localized = (localizations as Record<string, unknown>)[locale];
      if (localized && typeof localized === 'object') {
        return publicContent(localized as Record<string, unknown>);
      }
      return null;
    }
    if (row.locale !== locale) return null;
  }
  return publicContent(row.content);
}

/** Claims a unique user/profile/day/type slot before quota or provider work. */
export async function claimDailyContent(
  admin: SupabaseClient,
  key: DailyContentKey,
  locale: 'vi' | 'en',
  dailyProfileLimit?: number,
): Promise<Claim> {
  const claimId = randomUUID();

  if (key.contentType === 'daily_ca_dao' && dailyProfileLimit) {
    const { data, error } = await admin.rpc('claim_numina_daily_content', {
      p_user_id: key.userId,
      p_profile_key: key.profileKey,
      p_local_date: key.localDate,
      p_content_type: key.contentType,
      p_locale: locale,
      p_claim_id: claimId,
      p_daily_profile_limit: dailyProfileLimit,
    });
    if (error || !data) throw error || new Error('Daily content claim failed');
    const result = data as Record<string, unknown>;
    if (result.state === 'cached' && result.content && typeof result.content === 'object') {
      return { state: 'cached', content: publicContent(result.content as Record<string, unknown>) };
    }
    if (result.state === 'limit_reached') {
      return { state: 'limit_reached', used: Number(result.used || dailyProfileLimit), limit: Number(result.limit || dailyProfileLimit) };
    }
    if (result.state === 'claimed') {
      const anchor = result.anchor && typeof result.anchor === 'object'
        ? result.anchor as ClaimedContent['anchor']
        : null;
      return {
        state: 'claimed',
        rowId: String(result.row_id),
        claimId: String(result.claim_id || claimId),
        claimKind: result.claim_kind === 'localization' ? 'localization' : 'base',
        userId: key.userId,
        locale,
        anchor,
      };
    }
    return { state: 'pending' };
  }

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

export async function waitForLocalizedDailyContent(
  admin: SupabaseClient,
  key: DailyContentKey,
  locale: 'vi' | 'en',
) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const content = await readDailyContent(admin, key, locale);
    if (content) return content;
  }
  return null;
}

export async function completeDailyContent(
  admin: SupabaseClient,
  claim: ClaimedContent,
  content: Record<string, unknown>,
): Promise<void> {
  if (claim.claimKind && claim.userId && claim.locale) {
    const { data, error } = await admin.rpc('complete_numina_daily_content', {
      p_user_id: claim.userId,
      p_content_row_id: claim.rowId,
      p_claim_id: claim.claimId,
      p_claim_kind: claim.claimKind,
      p_locale: claim.locale,
      p_content: content,
    });
    if (error) throw error;
    if (!data) throw new Error('Daily content claim was lost before completion');
    return;
  }
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
  claim: ClaimedContent,
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
  claim: ClaimedContent,
): Promise<void> {
  if (claim.claimKind && claim.userId && claim.locale) {
    await admin.rpc('release_numina_daily_content_claim', {
      p_user_id: claim.userId,
      p_content_row_id: claim.rowId,
      p_claim_id: claim.claimId,
      p_claim_kind: claim.claimKind,
      p_locale: claim.locale,
    });
    return;
  }
  await admin.from('numina_daily_content')
    .delete()
    .eq('id', claim.rowId)
    .contains('content', { _claimId: claim.claimId });
}
