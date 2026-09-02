import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStreamingResponse } from '../app/api/chat/lib/response-generator.ts';
import {
  getOrderedModelCandidates,
  getProviderCascade,
  markModelFailure,
  isRetryableProviderError
} from '../app/api/chat/lib/provider-cascade.ts';

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return output;
      output += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

test('failed cascade candidates are deprioritized and later retried', async () => {
  const envNames = [
    'GEMINI_API_KEY',
    'GEMINI_API_KEY_1',
    'GEMINI_API_KEY_2',
    'GEMINI_API_KEY_3',
    'GEMINI_API_KEY_4',
    'GEMINI_API_KEY_5',
    'GEMINI_API_KEY_6',
    'GEMINI_API_KEY_7',
    'GEMINI_API_KEYS',
    'GEMINI_CHAT_MODELS',
    'GOOGLE_API_KEY',
    'GOOGLE_API_KEYS',
    'API_KEYS',
    'OPENAI_API_KEY',
    'NVIDIA_API_KEY',
    'NVIDIA_CHAT_MODELS',
    'GROQ_API_KEY',
    'GROQ_CHAT_MODELS',
    'XAI_API_KEY',
    'XAI_CHAT_MODELS',
    'OPENROUTER_API_KEY',
    'OPENROUTER_FREE_MODELS',
    'LLM_CASCADE_TIMEOUT_MS',
    'LLM_STREAM_CONNECT_TIMEOUT_MS',
    'LLM_MAX_KEYS_PER_PROVIDER'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let now = 1_000;

  try {
    for (const name of envNames) delete process.env[name];
    Date.now = () => now;
    process.env.GEMINI_API_KEY_1 = 'test-gemini-key-1';
    process.env.GEMINI_API_KEY_2 = 'test-gemini-key-2';
    process.env.GEMINI_CHAT_MODELS = 'test/gemini-model';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';
    process.env.NVIDIA_CHAT_MODELS = 'test/nvidia-a';
    process.env.LLM_CASCADE_TIMEOUT_MS = '5000';
    process.env.LLM_STREAM_CONNECT_TIMEOUT_MS = '1000';

    const providers = getProviderCascade();
    assert.equal(providers[0]?.name, 'Google Gemini');
    assert.deepEqual(
      getOrderedModelCandidates(providers).map(({ provider, model }) => `${provider.name}/${model}`),
      [
        'Google Gemini/test/gemini-model',
        'Google Gemini/test/gemini-model',
        'NVIDIA NIM/test/nvidia-a'
      ]
    );

    const initialCandidates = getOrderedModelCandidates(providers);
    markModelFailure(initialCandidates[0]!);
    assert.deepEqual(
      getOrderedModelCandidates(providers).map(({ provider, model }) => `${provider.name}/${model}`),
      ['Google Gemini/test/gemini-model', 'NVIDIA NIM/test/nvidia-a']
    );

    now += 60_001;
    assert.deepEqual(
      getOrderedModelCandidates(providers).map(({ provider, model }) => `${provider.name}/${model}`),
      ['Google Gemini/test/gemini-model', 'NVIDIA NIM/test/nvidia-a', 'Google Gemini/test/gemini-model']
    );

    const calls: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const payload = JSON.parse(String(init?.body)) as { model: string };
      const authorization = new Headers(init?.headers).get('authorization');
      calls.push(`${payload.model}:${authorization?.endsWith('2') ? 'key2' : authorization?.endsWith('1') ? 'key1' : 'nvidia'}`);
      if (payload.model === 'test/nvidia-a') {
        return new Response(
          'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } }
        );
      }
      return new Response(JSON.stringify({ error: 'temporary outage' }), { status: 503 });
    };

    const output = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(calls, ['test/gemini-model:key2', 'test/nvidia-a:nvidia']);
    assert.match(output, /ok/);
    assert.deepEqual(
      getOrderedModelCandidates(providers).map(({ provider, model }) => `${provider.name}/${model}`),
      ['NVIDIA NIM/test/nvidia-a']
    );

    now += 60_001;
    assert.deepEqual(
      getOrderedModelCandidates(providers).map(({ provider, model }) => `${provider.name}/${model}`),
      ['NVIDIA NIM/test/nvidia-a', 'Google Gemini/test/gemini-model', 'Google Gemini/test/gemini-model']
    );

    assert.equal(isRetryableProviderError(400), true);
    assert.equal(isRetryableProviderError(404), true);
    assert.equal(isRetryableProviderError(429), true);
    assert.equal(isRetryableProviderError(500), true);
    assert.equal(isRetryableProviderError(401), false);
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('stream errors after the first token do not switch models', async () => {
  const envNames = [
    'GEMINI_API_KEY',
    'GEMINI_API_KEY_1',
    'GEMINI_API_KEY_2',
    'GEMINI_API_KEY_3',
    'GEMINI_API_KEY_4',
    'GEMINI_API_KEY_5',
    'GEMINI_API_KEY_6',
    'GEMINI_API_KEY_7',
    'GEMINI_CHAT_MODELS',
    'NVIDIA_API_KEY',
    'GROQ_API_KEY',
    'XAI_API_KEY',
    'OPENROUTER_API_KEY',
    'LLM_MAX_KEYS_PER_PROVIDER'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;

  try {
    for (const name of envNames) delete process.env[name];
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CHAT_MODELS = 'test/partial-stream';
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'
            )
          );
          setTimeout(() => controller.error(new Error('upstream disconnected')), 10);
        }
      });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    };

    const output = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.equal(calls, 1);
    assert.match(output, /partial/);
    assert.match(output, /Luồng AI bị gián đoạn/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('server failures skip the remaining Gemini keys, while 401 retries the next key', async () => {
  const envNames = [
    'GEMINI_API_BASE_URL',
    'GEMINI_API_KEY',
    'GEMINI_API_KEY_1',
    'GEMINI_API_KEY_2',
    'GEMINI_CHAT_MODELS',
    'NVIDIA_API_KEY',
    'NVIDIA_CHAT_MODELS',
    'GROQ_API_KEY',
    'XAI_API_KEY',
    'OPENROUTER_API_KEY',
    'LLM_CASCADE_TIMEOUT_MS',
    'LLM_STREAM_CONNECT_TIMEOUT_MS',
    'LLM_MAX_KEYS_PER_PROVIDER'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;

  try {
    for (const name of envNames) delete process.env[name];
    process.env.GEMINI_API_BASE_URL = 'https://gemini-server-failure.test/v1';
    process.env.GEMINI_API_KEY_1 = 'test-key-1';
    process.env.GEMINI_API_KEY_2 = 'test-key-2';
    process.env.GEMINI_CHAT_MODELS = 'test/provider-wide-failure';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';
    process.env.NVIDIA_CHAT_MODELS = 'test/nvidia-fallback';
    process.env.LLM_CASCADE_TIMEOUT_MS = '5000';
    process.env.LLM_STREAM_CONNECT_TIMEOUT_MS = '1000';

    const serverFailureCalls: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const payload = JSON.parse(String(init?.body)) as { model: string };
      const authorization = new Headers(init?.headers).get('authorization') || '';
      serverFailureCalls.push(
        `${payload.model}:${authorization.endsWith('1') ? 'key1' : authorization.endsWith('2') ? 'key2' : 'nvidia'}`
      );
      if (payload.model === 'test/provider-wide-failure') {
        return new Response(JSON.stringify({ error: 'provider unavailable' }), { status: 503 });
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"nvidia ok"}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    };

    const fallbackOutput = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(serverFailureCalls, [
      'test/provider-wide-failure:key1',
      'test/nvidia-fallback:nvidia'
    ]);
    assert.match(fallbackOutput, /nvidia ok/);

    process.env.GEMINI_API_BASE_URL = 'https://gemini-credential-failure.test/v1';
    process.env.GEMINI_CHAT_MODELS = 'test/credential-failure';
    const credentialFailureCalls: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const payload = JSON.parse(String(init?.body)) as { model: string };
      const authorization = new Headers(init?.headers).get('authorization') || '';
      credentialFailureCalls.push(
        `${payload.model}:${authorization.endsWith('1') ? 'key1' : 'key2'}`
      );
      if (authorization.endsWith('1')) {
        return new Response(JSON.stringify({ error: 'invalid key' }), { status: 401 });
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"key two ok"}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    };

    const credentialOutput = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(credentialFailureCalls, [
      'test/credential-failure:key1',
      'test/credential-failure:key2'
    ]);
    assert.match(credentialOutput, /key two ok/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
