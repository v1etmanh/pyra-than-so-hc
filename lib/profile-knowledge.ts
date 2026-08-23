import { getKnowledgeByIndicator, type NumerologyKnowledgeRecord } from './supabaseClient';
import { MOCK_NUMEROLOGY_INDICATORS } from '@/mocks/numerology-indicators';
import {
  profileToIndicatorValues,
  type NumerologyProfile24
} from '@/mocks/numerology-profile';

export type ProfileKnowledgeHit = {
  indicatorKey: string;
  value: string | number;
  record: NumerologyKnowledgeRecord;
};

/**
 * Fetches the knowledge row for every indicator represented in the profile.
 * Supabase is the source for value-specific interpretation; local Markdown is
 * used by supabaseClient as an offline fallback.
 */
export async function searchSupabaseForProfile(
  profile: NumerologyProfile24
): Promise<ProfileKnowledgeHit[]> {
  const candidates = profileToIndicatorValues(MOCK_NUMEROLOGY_INDICATORS, profile);
  const results = await Promise.all(
    candidates.map(async ({ indicator, value }) => {
      try {
        const record = await getKnowledgeByIndicator(indicator.key, value);
        return record ? { indicatorKey: indicator.key, value, record } : null;
      } catch (error) {
        console.warn(`[Profile Knowledge] ${indicator.key} lookup failed:`, error);
        return null;
      }
    })
  );
  return results.filter((item): item is ProfileKnowledgeHit => item !== null);
}

export function buildProfileKnowledgeContext(hits: ProfileKnowledgeHit[]): string {
  if (!hits.length) return '';
  return hits
    .map(
      ({ indicatorKey, value, record }) =>
        `### PROFILE INDICATOR: ${record.indicator_name || indicatorKey} = ${value}\n` +
        `Title: ${record.title}\n` +
        record.content
    )
    .join('\n\n---\n\n');
}
