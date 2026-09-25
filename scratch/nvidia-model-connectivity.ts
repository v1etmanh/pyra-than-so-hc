const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

const defaultModels = [
  'mistralai/mistral-nemotron',
  'z-ai/glm5-3-flash',
  'z-ai/glm5-3',
  'poolside/laguna-xs-2.1',
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'openai/gpt-oss-20b',
] as const;
const models = process.argv.slice(2);
const modelsToTest = models.length > 0 ? models : defaultModels;

const apiKey = process.env.NVIDIA_API_KEY;
if (!apiKey) throw new Error('NVIDIA_API_KEY is missing');

for (const model of modelsToTest) {
  const startedAt = performance.now();
  const controller = new AbortController();
  console.log(JSON.stringify({ model, event: 'started' }));
  const timeout = setTimeout(() => {
    console.log(JSON.stringify({ model, event: 'timeout' }));
    controller.abort();
  }, 30_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 16,
        temperature: 0,
        stream: false,
      }),
      signal: controller.signal,
    });
    const elapsedMs = Math.round(performance.now() - startedAt);
    const raw = await response.text();
    const payload = (() => {
      try { return JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }; }
      catch { return undefined; }
    })();
    const content = payload?.choices?.[0]?.message?.content?.replace(/\s+/g, ' ').trim();
    const error = payload?.error?.message?.replace(/\s+/g, ' ').trim();
    console.log(JSON.stringify({ model, status: response.status, elapsedMs, ok: response.ok && Boolean(content), content, error }));
  } catch (error) {
    console.log(JSON.stringify({ model, elapsedMs: Math.round(performance.now() - startedAt), ok: false, error: error instanceof Error ? error.message : String(error) }));
  } finally {
    clearTimeout(timeout);
  }
}
