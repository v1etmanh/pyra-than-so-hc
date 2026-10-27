import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../supabase/migrations/20261025000100_monthly_quota_and_google_play.sql', import.meta.url);

test('quota migration serializes reservations and counts active reservations', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /select \* into v_bucket[\s\S]*for update;/i);
  assert.match(sql, /v_bucket\.used \+ v_reserved >= v_bucket\.quota_limit/i);
  assert.match(sql, /unique \(user_id, period_start, period_end, plan_version, feature, idempotency_key\)/i);
});

test('quota migration expires, releases, and idempotently commits reservations', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /status='reserved' and expires_at <= now\(\)/i);
  assert.match(sql, /if v_res\.status='committed' then/i);
  assert.match(sql, /create or replace function public\.release_numina_quota/i);
});

test('daily content save and quota commit share one service-role transaction', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create or replace function public\.commit_numina_daily_content/i);
  assert.match(sql, /v_result:=public\.commit_numina_quota/i);
  assert.match(sql, /revoke all on function public\.commit_numina_daily_content[\s\S]*authenticated/i);
  assert.match(sql, /grant execute on function public\.commit_numina_daily_content[\s\S]*to service_role/i);
});

test('Google Play RTDN is idempotent, serialized, and ignores stale events', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /select \* into v_existing from public\.numina_subscriptions[\s\S]*for update/i);
  assert.match(sql, /v_existing\.last_provider_event_at>p_event_at/i);
  assert.match(sql, /Google Play RTDN \(stale, ignored\)/i);
  assert.match(sql, /on conflict\(provider,provider_event_id\) do nothing/i);
});

test('checkout reservation blocks every active entitlement, including payOS renewal overlap', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create or replace function public\.reserve_numina_checkout/i);
  assert.match(sql, /v_existing\.plan='pro' and v_existing\.current_period_end>now\(\) then return false/i);
  assert.match(sql, /current_period_start=null[\s\S]*current_period_end=null/i);
});

test('payOS applies a single 30-day entitlement and quota period atomically', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create or replace function public\.apply_numina_payos_payment/i);
  assert.match(sql, /current_period_start=p_paid_at,current_period_end=v_period_end/i);
  assert.match(sql, /v_period_end:=p_paid_at\+interval '30 days'/i);
});

test('PayPal applies entitlement and renewal boundaries in one transaction', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create or replace function public\.apply_numina_paypal_event_v2/i);
  assert.match(sql, /plan=v_plan,status=p_status,current_period_start=v_period_start,current_period_end=p_period_end/i);
  assert.match(sql, /last_provider_event_at>p_event_created_at/i);
});
