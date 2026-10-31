import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../supabase/migrations/20261029000100_daily_fortune_profile_limit.sql', import.meta.url);
const monthlyQuotaMigrationUrl = new URL('../supabase/migrations/20261031000100_monthly_daily_fortune_quota.sql', import.meta.url);
const routeUrl = new URL('../app/api/astro/fortune/route.ts', import.meta.url);
const dailyContentUrl = new URL('../lib/usage/daily-content.ts', import.meta.url);
const planCatalogUrl = new URL('../lib/usage/plan-catalog.ts', import.meta.url);

test('Daily Fortune profile allocation remains serialized', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*p_user_id::text[\s\S]*p_local_date::text[\s\S]*p_content_type/i);
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
  const route = await readFile(routeUrl, 'utf8');
  assert.match(route, /export async function GET[\s\S]*readFortuneQuota/i);
  assert.match(route, /getQuotaSnapshot[\s\S]*snapshot\.daily_ca_dao/i);
  assert.match(route, /cached:\s*true,\s*quota/i);
  assert.match(route, /cached:\s*false,\s*quota/i);
});

test('Daily Fortune grants 10 Free and 90 Pro readings per monthly period', async () => {
  const [route, planCatalog] = await Promise.all([
    readFile(routeUrl, 'utf8'),
    readFile(planCatalogUrl, 'utf8'),
  ]);
  assert.match(planCatalog, /free:[\s\S]*daily_ca_dao:\s*10[\s\S]*pro:[\s\S]*daily_ca_dao:\s*90/i);
  assert.match(route, /getRequestAccess\(req,\s*'daily_ca_dao',\s*requestId\)/i);
  assert.match(route, /commitDailyContent\(admin,\s*contentClaim,\s*access/i);
});

test('Daily Fortune content and monthly quota commit atomically', async () => {
  const [migration, dailyContent] = await Promise.all([
    readFile(monthlyQuotaMigrationUrl, 'utf8'),
    readFile(dailyContentUrl, 'utf8'),
  ]);
  assert.match(migration, /complete_numina_daily_content[\s\S]*commit_numina_quota/i);
  assert.match(migration, /grant execute on function public\.commit_numina_localized_daily_content[\s\S]*service_role/i);
  assert.match(dailyContent, /commit_numina_localized_daily_content/i);
});
