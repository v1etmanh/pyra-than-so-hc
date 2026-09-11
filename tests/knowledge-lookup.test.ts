import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getKnowledgeByIndicator, type NumerologyKnowledgeRecord } from '../lib/supabaseClient.ts';

test('exact knowledge lookup never falls back to the removed vector table', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requestedUrls: string[] = [];

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://knowledge.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

  try {
    await t.test('returns the exact Supabase record', async () => {
      const record: NumerologyKnowledgeRecord = {
        id: 'life-path-7',
        indicator_key: 'walksOfLife',
        number_value: '7',
        indicator_name: 'Đường đời',
        title: 'Đường đời 7',
        category: 'core',
        content: 'Exact knowledge content'
      };
      globalThis.fetch = async (input) => {
        requestedUrls.push(String(input));
        return Response.json([record]);
      };

      assert.deepEqual(await getKnowledgeByIndicator('walksOfLife', 7), record);
    });

    await t.test('uses Markdown when Supabase has no exact record', async () => {
      globalThis.fetch = async (input) => {
        requestedUrls.push(String(input));
        return Response.json([]);
      };

      const record = await getKnowledgeByIndicator('walksOfLife', 7);
      assert.equal(record?.indicator_key, 'walksOfLife');
      assert.equal(record?.number_value, '7');
      assert.ok(record?.content.length);
    });

    await t.test('uses Markdown when Supabase is unavailable', async () => {
      globalThis.fetch = async (input) => {
        requestedUrls.push(String(input));
        throw new Error('network unavailable');
      };

      const record = await getKnowledgeByIndicator('walksOfLife', 7);
      assert.equal(record?.indicator_key, 'walksOfLife');
      assert.ok(record?.content.length);
    });

    await t.test('does not use a partial number match in Markdown', async () => {
      globalThis.fetch = async (input) => {
        requestedUrls.push(String(input));
        return Response.json([]);
      };

      assert.equal(await getKnowledgeByIndicator('walksOfLife', 17), null);
    });

    assert.ok(requestedUrls.length >= 4);
    assert.ok(requestedUrls.every((url) => url.includes('/rest/v1/numerology_knowledge')));
    assert.ok(requestedUrls.every((url) => !url.includes('numerology_chunks')));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  }
});
