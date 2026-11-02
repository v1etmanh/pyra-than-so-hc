import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getKnowledgeByIndicator } from '../lib/supabaseClient.ts';

const originalFetch = global.fetch;
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restoreEnvironment() {
  global.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
}

test.afterEach(restoreEnvironment);

test('queries the exact locale and safely encodes compound values', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co/';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-secret';
  let requestedUrl = '';
  let requestedAuthorization = '';
  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedAuthorization = new Headers(init?.headers).get('Authorization') || '';
    return Response.json([{
      id: '8f259b50-7593-4984-af36-69b57ea004a5',
      indicator_key: 'arrows',
      number_value: '1-2-3:strong',
      locale: 'en',
      indicator_name: 'Arrows',
      title: 'Arrow 1-2-3',
      category: 'chart',
      content: 'English content',
      keywords: ['arrows']
    }]);
  };

  const record = await getKnowledgeByIndicator('arrows', '1-2-3:strong', 'en');
  const url = new URL(requestedUrl);

  assert.equal(url.pathname, '/rest/v1/numerology_knowledge');
  assert.equal(url.searchParams.get('indicator_key'), 'eq.arrows');
  assert.equal(url.searchParams.get('number_value'), 'eq.1-2-3:strong');
  assert.equal(url.searchParams.get('locale'), 'eq.en');
  assert.equal(url.searchParams.get('limit'), '1');
  assert.equal(requestedAuthorization, 'Bearer service-secret');
  assert.equal(record?.locale, 'en');
  assert.equal(record?.content, 'English content');
});

test('defaults knowledge lookups to Vietnamese', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-secret';
  let requestedUrl = '';
  global.fetch = async (input) => {
    requestedUrl = String(input);
    return Response.json([]);
  };

  await getKnowledgeByIndicator('karmicDebts', '13/4');

  assert.equal(new URL(requestedUrl).searchParams.get('locale'), 'eq.vi');
  assert.equal(new URL(requestedUrl).searchParams.get('number_value'), 'eq.13/4');
});

test('never falls back to the public anon key', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-anon-key';
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return Response.json([]);
  };

  const record = await getKnowledgeByIndicator('mission', 7, 'vi');

  assert.equal(fetchCalled, false);
  assert.equal(record, null);
});

test('restore migration keeps knowledge access backend-only', () => {
  const migration = fs.readFileSync(
    path.resolve('supabase/migrations/20261102000100_restore_numerology_knowledge.sql'),
    'utf8'
  );

  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.numerology_knowledge from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.numerology_knowledge to service_role/i);
  assert.match(migration, /unique \(indicator_key, number_value, locale\)/i);
  assert.doesNotMatch(migration, /create policy/i);
});
