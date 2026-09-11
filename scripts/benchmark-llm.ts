import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  getProviderCascade,
  requestChatCompletion,
  type CascadeProvider
} from '../lib/ai/provider-cascade.ts';
import type { BenchmarkSample, BenchmarkWorkload } from '../lib/ai/benchmark.ts';

interface PromptCase {
  id: string;
  workload: BenchmarkWorkload;
  system: string;
  user: string;
  maxTokens: number;
}

interface CliOptions {
  batch: string;
  runsPerModel: number;
  outputDir: string;
  delayMs: number;
  dryRun: boolean;
  providers: Set<string> | null;
  seed: number;
}

const STREAM_FIRST_CONTENT_LIMIT_MS = 45_000;
const BODY_IDLE_LIMIT_MS = 30_000;
const TOTAL_LIMIT_MS = 90_000;
const HEADER_LIMIT_MS = 15_000;

const CASES: PromptCase[] = [
  ...Array.from({ length: 4 }, (_, index): PromptCase => ({
    id: `probe-${index + 1}`,
    workload: 'stream-probe',
    system: 'Follow the user instruction exactly. Do not explain your answer.',
    user: `Return exactly NUMINA_OK on one line. Probe ${index + 1}.`,
    maxTokens: 128
  })),
  {
    id: 'domain-tarot-choice',
    workload: 'stream-domain',
    system: 'Bạn là Numina Tarot. Trả lời bằng tiếng Việt, rõ ràng, không định mệnh hóa.',
    user: 'Câu hỏi: Tôi nên tiếp tục dự án đang chậm hay đổi hướng? Lá The Chariot xuôi ở vị trí lời khuyên. Hãy giải thích trong 4–6 câu và đưa ra 2 hành động thực tế.',
    maxTokens: 600
  },
  {
    id: 'domain-tarot-reflection',
    workload: 'stream-domain',
    system: 'Bạn là Numina Tarot. Chỉ dùng dữ liệu lá bài được cung cấp.',
    user: 'Câu hỏi: Tôi cần nhìn lại điều gì trong mối quan hệ hiện tại? Lá The Hermit xuôi, từ khóa chiêm nghiệm và khoảng lặng. Trả lời 4–6 câu bằng tiếng Việt.',
    maxTokens: 600
  },
  {
    id: 'domain-numerology-life-path',
    workload: 'stream-domain',
    system: 'Bạn là chuyên gia Nhân số học Pythagoras, tập trung vào hành vi thực tế.',
    user: 'Giải thích ngắn gọn Đường đời 7: một điểm mạnh, một cạm bẫy và hai hành động phát triển. Trả lời bằng tiếng Việt.',
    maxTokens: 600
  },
  {
    id: 'domain-numerology-indicator',
    workload: 'stream-domain',
    system: 'Bạn là chuyên gia Nhân số học Pythagoras. Không đưa ra khẳng định mê tín.',
    user: 'Một người có Số Linh hồn 3 nên cân bằng nhu cầu biểu đạt và kỷ luật như thế nào? Trả lời 4–6 câu bằng tiếng Việt.',
    maxTokens: 600
  },
  ...Array.from({ length: 2 }, (_, index): PromptCase => ({
    id: `structured-follow-up-${index + 1}`,
    workload: 'structured-json',
    system: 'Return valid JSON only, without markdown fences.',
    user: index === 0
      ? 'Existing reading already explains The Hermit as a need for reflection. Follow-up: Should I journal tonight? Return {"decision":"direct"|"draw","drawCount":0|1|2|3,"reason":"short reason"}.'
      : 'Existing reading covers career direction but not the new relocation question. Return {"decision":"direct"|"draw","drawCount":0|1|2|3,"reason":"short reason"}.',
    maxTokens: 300
  }))
];

function parseArgs(argv: string[]): CliOptions {
  const value = (flag: string) => {
    const direct = argv.find((arg) => arg.startsWith(`${flag}=`));
    if (direct) return direct.slice(flag.length + 1);
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const batch = value('--batch') || new Date().toISOString().replace(/[:.]/g, '-');
  const runsPerModel = Number(value('--runs-per-model') || 10);
  const providerValue = value('--providers');
  if (!Number.isInteger(runsPerModel) || runsPerModel < 1 || runsPerModel > CASES.length) {
    throw new Error(`--runs-per-model must be between 1 and ${CASES.length}`);
  }
  return {
    batch,
    runsPerModel,
    outputDir: path.resolve(value('--output') || '.benchmarks/llm'),
    delayMs: Math.max(0, Number(value('--delay-ms') || 500)),
    dryRun: argv.includes('--dry-run'),
    providers: providerValue
      ? new Set(providerValue.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))
      : null,
    seed: Number(value('--seed') || hashString(batch))
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomGenerator(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex]!, output[index]!];
  }
  return output;
}

function nowMs(): number {
  return performance.now();
}

function elapsed(startedAt: number): number {
  return Math.round((nowMs() - startedAt) * 100) / 100;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readWithTimeout<T>(
  reader: ReadableStreamDefaultReader<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<ReadableStreamReadResult<T>> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(errorMessage)), Math.max(1, timeoutMs));
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function responseTextWithTimeout(response: Response, timeoutMs: number): Promise<string> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      response.text(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('response body timeout')), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function extractJsonObject(content: string): Record<string, unknown> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function validStructuredOutput(content: string): boolean {
  const parsed = extractJsonObject(content);
  if (!parsed) return false;
  const decision = parsed.decision;
  const drawCount = parsed.drawCount;
  return (decision === 'direct' || decision === 'draw') &&
    typeof drawCount === 'number' && drawCount >= 0 && drawCount <= 3 &&
    typeof parsed.reason === 'string';
}

function safeMessage(error: unknown, keys: string[]): string {
  let message = error instanceof Error ? error.message : String(error);
  for (const key of keys) {
    if (key) message = message.replaceAll(key, '[REDACTED]');
  }
  return message.slice(0, 300);
}

async function runStreamCase(
  provider: CascadeProvider,
  model: string,
  apiKey: string,
  prompt: PromptCase,
  batch: string
): Promise<BenchmarkSample> {
  const startedAt = nowMs();
  let status: number | undefined;
  let ttfbMs: number | undefined;
  let ttftMs: number | undefined;
  let output = '';
  let actualModel: string | undefined;
  let streamCompleted = false;

  try {
    const response = await requestChatCompletion(
      provider,
      model,
      [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      apiKey,
      { stream: true, maxTokens: prompt.maxTokens, temperature: 0.2, timeoutMs: HEADER_LIMIT_MS }
    );
    ttfbMs = elapsed(startedAt);
    status = response.status;
    if (!response.ok || !response.body) {
      const body = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 160)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const totalRemaining = TOTAL_LIMIT_MS - elapsed(startedAt);
        const firstRemaining = STREAM_FIRST_CONTENT_LIMIT_MS - elapsed(startedAt);
        const timeoutMs = ttftMs === undefined
          ? Math.min(totalRemaining, firstRemaining)
          : Math.min(totalRemaining, BODY_IDLE_LIMIT_MS);
        const { done, value } = await readWithTimeout(
          reader,
          timeoutMs,
          ttftMs === undefined ? 'first content timeout' : 'stream idle timeout'
        );
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            streamCompleted = true;
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (typeof parsed.model === 'string') actualModel = parsed.model;
            const content = parsed.choices?.[0]?.delta?.content;
            if (typeof content === 'string' && content.length > 0) {
              if (ttftMs === undefined) ttftMs = elapsed(startedAt);
              output += content;
            }
          } catch {
            // Provider-specific events are ignored but still count toward the absolute first-content limit.
          }
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }

    const validOutput = prompt.workload === 'stream-probe'
      ? output.trim() === 'NUMINA_OK'
      : output.trim().length >= 80;
    return {
      version: 1,
      batch,
      timestamp: new Date().toISOString(),
      provider: provider.name,
      model,
      actualModel,
      workload: prompt.workload,
      promptId: prompt.id,
      status,
      success: streamCompleted && validOutput,
      validOutput,
      streamCompleted,
      ttfbMs,
      ttftMs,
      totalMs: elapsed(startedAt),
      outputChars: output.length,
      ...(!streamCompleted ? { errorType: 'incomplete-stream', errorMessage: 'Provider omitted [DONE]' } : {})
    };
  } catch (error) {
    return {
      version: 1,
      batch,
      timestamp: new Date().toISOString(),
      provider: provider.name,
      model,
      actualModel,
      workload: prompt.workload,
      promptId: prompt.id,
      status,
      success: false,
      validOutput: false,
      streamCompleted,
      ttfbMs,
      ttftMs,
      totalMs: elapsed(startedAt),
      outputChars: output.length,
      errorType: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'request-error',
      errorMessage: safeMessage(error, provider.apiKeys)
    };
  }
}

async function runStructuredCase(
  provider: CascadeProvider,
  model: string,
  apiKey: string,
  prompt: PromptCase,
  batch: string
): Promise<BenchmarkSample> {
  const startedAt = nowMs();
  let status: number | undefined;
  let ttfbMs: number | undefined;
  try {
    const response = await requestChatCompletion(
      provider,
      model,
      [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      apiKey,
      { stream: false, maxTokens: prompt.maxTokens, temperature: 0, timeoutMs: HEADER_LIMIT_MS }
    );
    ttfbMs = elapsed(startedAt);
    status = response.status;
    const raw = await responseTextWithTimeout(response, TOTAL_LIMIT_MS);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${raw.slice(0, 160)}`);
    const payload = JSON.parse(raw);
    const content = String(payload.choices?.[0]?.message?.content ?? '');
    const validOutput = validStructuredOutput(content);
    return {
      version: 1,
      batch,
      timestamp: new Date().toISOString(),
      provider: provider.name,
      model,
      actualModel: typeof payload.model === 'string' ? payload.model : undefined,
      workload: prompt.workload,
      promptId: prompt.id,
      status,
      success: validOutput,
      validOutput,
      ttfbMs,
      totalMs: elapsed(startedAt),
      outputChars: content.length,
      ...(!validOutput ? { errorType: 'invalid-output', errorMessage: 'Structured JSON did not match the required shape' } : {})
    };
  } catch (error) {
    return {
      version: 1,
      batch,
      timestamp: new Date().toISOString(),
      provider: provider.name,
      model,
      workload: prompt.workload,
      promptId: prompt.id,
      status,
      success: false,
      validOutput: false,
      ttfbMs,
      totalMs: elapsed(startedAt),
      outputChars: 0,
      errorType: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'request-error',
      errorMessage: safeMessage(error, provider.apiKeys)
    };
  }
}

function hasHistoricalSamples(outputDir: string, provider: string, model: string): boolean {
  if (!existsSync(outputDir)) return false;
  return readdirSync(outputDir)
    .filter((file) => file.endsWith('.jsonl'))
    .some((file) => readFileSync(path.join(outputDir, file), 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .some((line) => {
        try {
          const sample = JSON.parse(line) as BenchmarkSample;
          return sample.provider === provider && sample.model === model;
        } catch {
          return false;
        }
      }));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const random = randomGenerator(options.seed);
  const providers = getProviderCascade().filter((provider) =>
    !options.providers || options.providers.has(provider.name.toLowerCase())
  );
  const candidates = providers.flatMap((provider) => provider.models.map((model) => ({ provider, model })));
  if (candidates.length === 0) throw new Error('No configured provider/model candidates matched the selection.');

  console.log(`Batch: ${options.batch}`);
  console.log(`Candidates (${candidates.length}):`);
  for (const candidate of candidates) console.log(`- ${candidate.provider.name}/${candidate.model}`);
  console.log(`Measured calls: ${candidates.length * options.runsPerModel}`);
  if (options.dryRun) return;

  mkdirSync(options.outputDir, { recursive: true });
  const outputFile = path.join(options.outputDir, `${options.batch}.jsonl`);
  if (existsSync(outputFile)) throw new Error(`Output already exists: ${outputFile}`);

  for (const candidate of candidates) {
    if (hasHistoricalSamples(options.outputDir, candidate.provider.name, candidate.model)) continue;
    const warmup = CASES[0]!;
    const key = candidate.provider.apiKeys[0]!;
    console.log(`Warm-up: ${candidate.provider.name}/${candidate.model}`);
    await runStreamCase(candidate.provider, candidate.model, key, warmup, `${options.batch}-warmup`);
  }

  const queue = shuffle(
    candidates.flatMap((candidate) => CASES.slice(0, options.runsPerModel).map((prompt, index) => ({ ...candidate, prompt, index }))),
    random
  );
  const keyCounters = new Map<string, number>();

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const item = queue[queueIndex]!;
    const candidateKey = `${item.provider.name}\u0000${item.model}`;
    const keyIndex = keyCounters.get(candidateKey) ?? 0;
    keyCounters.set(candidateKey, keyIndex + 1);
    const apiKey = item.provider.apiKeys[keyIndex % item.provider.apiKeys.length]!;
    console.log(`[${queueIndex + 1}/${queue.length}] ${item.provider.name}/${item.model} ${item.prompt.id}`);
    const sample = item.prompt.workload === 'structured-json'
      ? await runStructuredCase(item.provider, item.model, apiKey, item.prompt, options.batch)
      : await runStreamCase(item.provider, item.model, apiKey, item.prompt, options.batch);
    appendFileSync(outputFile, `${JSON.stringify(sample)}\n`, 'utf8');
    console.log(`  ${sample.success ? 'ok' : 'failed'} ttfb=${sample.ttfbMs ?? '-'} ttft=${sample.ttftMs ?? '-'} total=${sample.totalMs}`);
    if (queueIndex < queue.length - 1 && options.delayMs > 0) {
      await sleep(options.delayMs + Math.floor(random() * Math.max(1, options.delayMs)));
    }
  }

  console.log(`Saved ${queue.length} samples to ${outputFile}`);
}

main().catch((error) => {
  console.error(safeMessage(error, getProviderCascade().flatMap((provider) => provider.apiKeys)));
  process.exitCode = 1;
});
