import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getProviderCascade } from '../lib/ai/provider-cascade.ts';
import { createStreamingResponse } from '../lib/ai/response-generator.ts';

async function withChatEnv(run: () => Promise<void>) {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    for (const name of Object.keys(process.env)) {
      if (/^(DEEPSEEK_|GEMINI_|GOOGLE_|NVIDIA_|GROQ_|XAI_|OPENROUTER_|LLM_|CHAT_MODEL)/.test(name)
        || ['API_KEYS', 'API_BASE_URL', 'OPENAI_API_KEY'].includes(name)) {
        delete process.env[name];
      }
    }
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of Object.keys(process.env)) {
      if (!(name in originalEnv)) delete process.env[name];
    }
    Object.assign(process.env, originalEnv);
  }
}

async function readChat(): Promise<string> {
  return new Response(createStreamingResponse(
    'Trả lời bằng tiếng Việt.',
    [{ role: 'user', content: 'tôi nên làm gì bây giờ' }]
  )).text();
}

function answer(content: string) {
  return new Response(
    `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`,
    { headers: { 'Content-Type': 'text/event-stream' } }
  );
}

test('general chat uses the existing DeepSeek credentials and model', async () => {
  await withChatEnv(async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.DEEPSEEK_API_BASE_URL = 'https://deepseek.test/v1/';
    process.env.DEEPSEEK_MODEL = 'existing-place-model';
    const providers = getProviderCascade();
    assert.equal(providers.length, 1);
    assert.equal(providers[0]?.name, 'DeepSeek');
    assert.deepEqual(providers[0]?.models, ['existing-place-model']);

    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      assert.equal(String(input), 'https://deepseek.test/v1/chat/completions');
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-deepseek-key');
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.model, 'existing-place-model');
      assert.equal(payload.stream, true);
      assert.deepEqual(payload.messages, [
        { role: 'system', content: 'Trả lời bằng tiếng Việt.' },
        { role: 'user', content: 'tôi nên làm gì bây giờ' }
      ]);
      return answer('Hãy bắt đầu bằng một việc nhỏ.');
    };
    const output = await readChat();
    assert.match(output, /Hãy bắt đầu bằng một việc nhỏ/);
    assert.match(output, /"done":true/);
    assert.equal(calls, 1);
  });
});

test('DeepSeek respects configured order and falls back when unavailable', async () => {
  await withChatEnv(async () => {
    process.env.DEEPSEEK_API_KEYS = 'key-a,key-b,key-a';
    process.env.DEEPSEEK_CHAT_MODELS = 'chat-a,chat-b';
    process.env.DEEPSEEK_MODEL = 'place-only-model';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.GROQ_CHAT_MODEL = 'groq-fallback';
    process.env.LLM_PROVIDER_ORDER = 'DeepSeek,Groq';
    const providers = getProviderCascade();
    assert.deepEqual(providers.map((provider) => provider.name), ['DeepSeek', 'Groq']);
    assert.deepEqual(providers[0]?.models, ['chat-a', 'chat-b']);
    assert.deepEqual(providers[0]?.apiKeys, ['key-a', 'key-b']);

    const calls: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const payload = JSON.parse(String(init?.body));
      calls.push(payload.model);
      return payload.model.startsWith('chat-')
        ? new Response('temporarily unavailable', { status: 503 })
        : answer('Câu trả lời từ model dự phòng.');
    };
    assert.match(await readChat(), /Câu trả lời từ model dự phòng/);
    assert.deepEqual(calls, ['chat-a', 'groq-fallback']);
  });
});

test('DeepSeek requires credentials and does not override a user provider', async () => {
  await withChatEnv(async () => {
    process.env.DEEPSEEK_MODEL = 'place-model';
    assert.equal(getProviderCascade().length, 0);
    process.env.DEEPSEEK_API_KEY = 'test-key';
    assert.deepEqual(getProviderCascade()[0]?.models, ['place-model']);
    const providers = getProviderCascade({
      type: 'custom', baseUrl: 'https://custom.test/v1',
      model: 'custom-model', apiKeys: ['custom-key']
    });
    assert.equal(providers.length, 1);
    assert.equal(providers[0]?.name, 'custom');
  });
});
