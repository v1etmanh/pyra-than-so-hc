import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStreamingResponse } from '../lib/ai/response-generator.ts';
import {
  classifyProviderError,
  getOrderedModelCandidates,
  getProviderCascade,
  markCredentialFailure,
  isRetryableProviderError,
  requestChatCompletion
} from '../lib/ai/provider-cascade.ts';

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
    'LLM_RESPONSE_HEADER_TIMEOUT_MS',
    'LLM_FIRST_CONTENT_TIMEOUT_MS',
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
    process.env.LLM_RESPONSE_HEADER_TIMEOUT_MS = '1000';

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
    markCredentialFailure(initialCandidates[0]!);
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

    assert.equal(isRetryableProviderError(400), false);
    assert.equal(isRetryableProviderError(404), true);
    assert.equal(isRetryableProviderError(429), true);
    assert.equal(isRetryableProviderError(500), true);
    assert.equal(isRetryableProviderError(401), true);
    assert.equal(classifyProviderError(401), 'credential');
    assert.equal(classifyProviderError(403), 'credential');
    assert.equal(classifyProviderError(404), 'model');
    assert.equal(classifyProviderError(400, 'This model is unsupported'), 'model');
    assert.equal(classifyProviderError(400, 'Invalid messages payload'), 'request');
    assert.equal(classifyProviderError(429), 'provider');
    assert.equal(classifyProviderError(500), 'provider');
    assert.equal(classifyProviderError(undefined), 'provider');
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
    'LLM_RESPONSE_HEADER_TIMEOUT_MS',
    'LLM_FIRST_CONTENT_TIMEOUT_MS',
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
    process.env.LLM_RESPONSE_HEADER_TIMEOUT_MS = '1000';

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

test('a missing model falls through to the next model on the same provider', async () => {
  const envNames = [
    'GEMINI_API_BASE_URL',
    'GEMINI_API_KEY',
    'GEMINI_CHAT_MODELS',
    'NVIDIA_API_KEY',
    'GROQ_API_KEY',
    'XAI_API_KEY',
    'OPENROUTER_API_KEY'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;

  try {
    for (const name of envNames) delete process.env[name];
    process.env.GEMINI_API_BASE_URL = 'https://gemini-model-scope.test/v1';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_CHAT_MODELS = 'test/missing-model,test/working-model';
    const calls: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const model = (JSON.parse(String(init?.body)) as { model: string }).model;
      calls.push(model);
      if (model === 'test/missing-model') {
        return new Response(JSON.stringify({ error: 'model not found' }), { status: 404 });
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"same provider ok"}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    };

    const output = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(calls, ['test/missing-model', 'test/working-model']);
    assert.match(output, /same provider ok/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('reasoning-only chunks do not extend the first-content deadline', async () => {
  const envNames = [
    'GEMINI_API_BASE_URL',
    'GEMINI_API_KEY',
    'GEMINI_CHAT_MODELS',
    'NVIDIA_API_KEY',
    'NVIDIA_CHAT_MODELS',
    'GROQ_API_KEY',
    'XAI_API_KEY',
    'OPENROUTER_API_KEY',
    'LLM_FIRST_CONTENT_TIMEOUT_MS',
    'LLM_RESPONSE_HEADER_TIMEOUT_MS'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;

  try {
    for (const name of envNames) delete process.env[name];
    process.env.GEMINI_API_BASE_URL = 'https://gemini-reasoning-timeout.test/v1';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CHAT_MODELS = 'test/reasoning-only';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';
    process.env.NVIDIA_CHAT_MODELS = 'test/fast-fallback';
    process.env.LLM_FIRST_CONTENT_TIMEOUT_MS = '1000';
    process.env.LLM_RESPONSE_HEADER_TIMEOUT_MS = '1000';
    const calls: string[] = [];

    globalThis.fetch = async (_input, init) => {
      const model = (JSON.parse(String(init?.body)) as { model: string }).model;
      calls.push(model);
      if (model === 'test/fast-fallback') {
        return new Response(
          'data: {"choices":[{"delta":{"content":"fallback after content deadline"}}]}\n\ndata: [DONE]\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } }
        );
      }

      let interval: ReturnType<typeof setInterval> | undefined;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          interval = setInterval(() => {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"reasoning_content":"still thinking"}}]}\n\n'
              )
            );
          }, 100);
        },
        cancel() {
          if (interval) clearInterval(interval);
        }
      });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    };

    const output = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(calls, ['test/reasoning-only', 'test/fast-fallback']);
    assert.match(output, /fallback after content deadline/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('a pre-token stream break and network error both fall through safely', async () => {
  const envNames = [
    'GEMINI_API_BASE_URL',
    'GEMINI_API_KEY',
    'GEMINI_CHAT_MODELS',
    'NVIDIA_API_KEY',
    'NVIDIA_CHAT_MODELS',
    'GROQ_API_KEY',
    'GROQ_CHAT_MODELS',
    'XAI_API_KEY',
    'OPENROUTER_API_KEY'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;

  try {
    for (const name of envNames) delete process.env[name];
    process.env.GEMINI_API_BASE_URL = 'https://gemini-pre-token-break.test/v1';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CHAT_MODELS = 'test/pre-token-break';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';
    process.env.NVIDIA_CHAT_MODELS = 'test/network-error';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.GROQ_CHAT_MODELS = 'test/final-success';
    const calls: string[] = [];

    globalThis.fetch = async (_input, init) => {
      const model = (JSON.parse(String(init?.body)) as { model: string }).model;
      calls.push(model);
      if (model === 'test/pre-token-break') {
        return new Response(
          'data: {"choices":[{"delta":{"reasoning_content":"partial thought"}}]}\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } }
        );
      }
      if (model === 'test/network-error') throw new TypeError('simulated network timeout');
      return new Response(
        'data: {"choices":[{"delta":{"content":"recovered safely"}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    };

    const output = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(calls, [
      'test/pre-token-break',
      'test/network-error',
      'test/final-success'
    ]);
    assert.match(output, /recovered safely/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('request-scoped 400 errors stop instead of fanning out to every provider', async () => {
  const envNames = [
    'GEMINI_API_BASE_URL',
    'GEMINI_API_KEY',
    'GEMINI_CHAT_MODELS',
    'NVIDIA_API_KEY',
    'NVIDIA_CHAT_MODELS',
    'GROQ_API_KEY',
    'XAI_API_KEY',
    'OPENROUTER_API_KEY'
  ];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;

  try {
    for (const name of envNames) delete process.env[name];
    process.env.GEMINI_API_BASE_URL = 'https://gemini-bad-request.test/v1';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CHAT_MODELS = 'test/bad-request';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';
    process.env.NVIDIA_CHAT_MODELS = 'test/should-not-run';
    const calls: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const model = (JSON.parse(String(init?.body)) as { model: string }).model;
      calls.push(model);
      return new Response(JSON.stringify({ error: 'Invalid messages payload' }), { status: 400 });
    };

    const output = await readStream(
      createStreamingResponse('system', [{ role: 'user', content: 'hello' }])
    );
    assert.deepEqual(calls, ['test/bad-request']);
    assert.match(output, /Không thể kết nối/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('Gemini reasoning effort is forwarded only to the Gemini provider', async () => {
  const originalEffort = process.env.GEMINI_REASONING_EFFORT;
  const originalFetch = globalThis.fetch;
  const payloads: Array<Record<string, unknown>> = [];

  try {
    process.env.GEMINI_REASONING_EFFORT = 'low';
    globalThis.fetch = async (_input, init) => {
      payloads.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response('{}', { status: 200 });
    };

    const messages = [{ role: 'user', content: 'hello' }];
    await requestChatCompletion(
      { name: 'Google Gemini', baseUrl: 'https://gemini.test/v1', models: ['gemini-test'], apiKeys: ['key'] },
      'gemini-test',
      messages,
      'key'
    );
    await requestChatCompletion(
      { name: 'NVIDIA NIM', baseUrl: 'https://nvidia.test/v1', models: ['nvidia-test'], apiKeys: ['key'] },
      'nvidia-test',
      messages,
      'key'
    );

    assert.equal(payloads[0]?.reasoning_effort, 'low');
    assert.equal('reasoning_effort' in (payloads[1] || {}), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEffort === undefined) delete process.env.GEMINI_REASONING_EFFORT;
    else process.env.GEMINI_REASONING_EFFORT = originalEffort;
  }
});

test('NVIDIA thinking is disabled with each model family schema', async () => {
  const originalThinking = process.env.NVIDIA_ENABLE_THINKING;
  const originalFetch = globalThis.fetch;
  const payloads: Array<Record<string, unknown>> = [];

  try {
    process.env.NVIDIA_ENABLE_THINKING = 'false';
    globalThis.fetch = async (_input, init) => {
      payloads.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response('{}', { status: 200 });
    };

    const provider = {
      name: 'NVIDIA NIM',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      models: [],
      apiKeys: ['key']
    };
    const messages = [{ role: 'user', content: 'hello' }];

    await requestChatCompletion(provider, 'nvidia/nemotron-3.5-lightning-30b-a3b', messages, 'key');
    await requestChatCompletion(provider, 'deepseek-ai/deepseek-v4-flash-0731', messages, 'key');
    await requestChatCompletion(provider, 'meta/muse-glimmer-30b', messages, 'key');

    assert.deepEqual(payloads[0]?.chat_template_kwargs, { enable_thinking: false });
    assert.deepEqual(payloads[1]?.chat_template_kwargs, { thinking: false });
    assert.equal('chat_template_kwargs' in (payloads[2] || {}), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalThinking === undefined) delete process.env.NVIDIA_ENABLE_THINKING;
    else process.env.NVIDIA_ENABLE_THINKING = originalThinking;
  }
});

test('streaming generation options forward output limits to the provider request', async () => {
  const originalFetch = globalThis.fetch;
  let payload: Record<string, unknown> = {};

  try {
    globalThis.fetch = async (_input, init) => {
      payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    };

    const output = await readStream(
      createStreamingResponse(
        'system',
        [{ role: 'user', content: 'hello' }],
        {
          type: 'custom',
          baseUrl: 'https://provider.example/v1',
          apiKeys: ['test-key'],
          model: 'test-model'
        },
        { maxTokens: 500, temperature: 0.2, reasoningEffort: 'low' }
      )
    );

    assert.equal(payload.max_tokens, 500);
    assert.equal(payload.temperature, 0.2);
    assert.equal(payload.reasoning_effort, 'low');
    assert.match(output, /ok/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('structured-output generation options forward JSON and reasoning controls', async () => {
  const originalFetch = globalThis.fetch;
  let payload: Record<string, unknown> = {};

  try {
    globalThis.fetch = async (_input, init) => {
      payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        'data: {"choices":[{"delta":{"content":"{}"}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    };

    await readStream(
      createStreamingResponse(
        'system',
        [{ role: 'user', content: 'classify this' }],
        {
          type: 'Groq',
          baseUrl: 'https://provider.example/v1',
          apiKeys: ['test-key'],
          model: 'openai/gpt-oss-20b'
        },
        { responseFormat: 'json_object', includeReasoning: false, reasoningEffort: 'low' }
      )
    );

    assert.deepEqual(payload.response_format, { type: 'json_object' });
    assert.equal(payload.include_reasoning, false);
    assert.equal(payload.reasoning_effort, 'low');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('an empty completed provider stream becomes a visible failure instead of a blank answer', async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => new Response(
      'data: [DONE]\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );

    const output = await readStream(
      createStreamingResponse(
        'system',
        [{ role: 'user', content: 'hello' }],
        {
          type: 'custom',
          baseUrl: 'https://provider.example/v1',
          apiKeys: ['test-key'],
          model: 'test-model'
        },
        { maxTokens: 500 }
      )
    );

    assert.match(output, /Không thể kết nối các nhà cung cấp AI/);
    assert.match(output, /completed without response content/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
