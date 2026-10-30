import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../supabase/migrations/20261029000100_daily_fortune_profile_limit.sql', import.meta.url);
const routeUrl = new URL('../app/api/astro/fortune/route.ts', import.meta.url);
const dailyContentUrl = new URL('../lib/usage/daily-content.ts', import.meta.url);

test('Daily Fortune profile allocation is serialized and capped atomically', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*p_user_id::text[\s\S]*p_local_date::text[\s\S]*p_content_type/i);
  assert.match(sql, /count\(distinct profile_key\)[\s\S]*v_used >= p_daily_profile_limit/i);
  assert.match(sql, /'state','limit_reached'/i);
});

test('locale claims reuse one base row and its fixed sample anchor', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /unique|profile_key/i);
  assert.match(sql, /'claim_kind','localization'[\s\S]*'anchor',v_existing\.content->'sampleAnchor'/i);
  assert.match(sql, /array\['localizations',p_locale\]/i);
});

test('daily content claim functions are service-role only', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /revoke all on function public\.claim_numina_daily_content[\s\S]*authenticated/i);
  assert.match(sql, /grant execute on function public\.claim_numina_daily_content[\s\S]*to service_role/i);
});

test('Daily Fortune exposes an authenticated quota snapshot and returns it with generated content', async () => {
  const [route, dailyContent] = await Promise.all([
    readFile(routeUrl, 'utf8'),
    readFile(dailyContentUrl, 'utf8'),
  ]);
  assert.match(route, /export async function GET[\s\S]*readFortuneQuota/i);
  assert.match(route, /cached:\s*true,\s*quota/i);
  assert.match(route, /cached:\s*false,\s*quota/i);
  assert.match(dailyContent, /select\('profile_key',\s*\{\s*count:\s*'exact',\s*head:\s*true\s*\}\)/i);
  assert.match(dailyContent, /remaining:\s*Math\.max\(0,\s*input\.limit\s*-\s*used\)/i);
});
