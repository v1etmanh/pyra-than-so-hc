import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  getProviderCascade,
  requestChatCompletion,
  type CascadeProvider,
} from '../lib/ai/provider-cascade.ts';
import { supportsSystemRole } from '../lib/ai/model-config.ts';
import {
  buildClassificationSystemPrompt,
  buildClassificationUserPrompt,
} from '../lib/prompts/chat-classification.ts';
import {
  CLASSIFICATION_BENCHMARK_VERSION,
  classificationBenchmarkCases,
  type ClassificationBenchmarkCase,
} from '../benchmarks/classification/cases.ts';
import {
  evaluateClassificationOutput,
  type ClassificationEvaluation,
} from '../benchmarks/classification/evaluator.ts';

type Tier = 'smoke' | 'full';

interface CliOptions {
  tier: Tier;
  runs: number;
  concurrency: number;
  delayMs: number;
  maxTokens: number;
  allModels: boolean;
  providers: Set<string> | null;
  models: Set<string> | null;
  outputDir: string;
}

interface Candidate {
  provider: CascadeProvider;
  model: string;
}

interface BenchmarkSample {
  version: 1;
  datasetVersion: string;
  timestamp: string;
  provider: string;
  model: string;
  actualModel?: string;
  caseId: string;
  expectedIntent: string;
  run: number;
  status?: number;
  latencyMs: number;
  totalTokens?: number;
  output: string;
  error?: string;
  evaluation: ClassificationEvaluation;
}

interface ModelSummary {
  provider: string;
  model: string;
  sampleCount: number;
  requestSuccessRate: number;
  validJsonRate: number;
  pureJsonRate: number;
  rawIntentAccuracy: number;
  normalizedIntentAccuracy: number;
  spreadAccuracy: number;
  tarotContractAccuracy: number;
  indicatorAccuracy: number;
  criticalIntentAccuracy: number;
  stableCaseRate: number;
  averageScore: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalTokens: number;
  eligible: boolean;
  issueCounts: Record<string, number>;
  confusion: Record<string, Record<string, number>>;
}

const PRODUCTION_PROVIDER = 'Groq';
const PRODUCTION_MODEL = 'openai/gpt-oss-20b';
const CRITICAL_INTENTS = new Set(['two_choices', 'relationship', 'core_personality', 'color_guidance']);

function argValue(argv: string[], name: string): string | undefined {
  const exactIndex = argv.indexOf(name);
  if (exactIndex >= 0) return argv[exactIndex + 1];
  const prefix = `${name}=`;
  return argv.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

function parseList(value: string | undefined): Set<string> | null {
  if (!value) return null;
  return new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean));
}

function parseArgs(argv: string[]): CliOptions {
  const tierValue = argValue(argv, '--tier') || 'full';
  if (tierValue !== 'smoke' && tierValue !== 'full') throw new Error('--tier must be smoke or full');
  const defaultRuns = tierValue === 'smoke' ? 1 : 3;
  const runs = Number(argValue(argv, '--runs') || defaultRuns);
  const concurrency = Number(argValue(argv, '--concurrency') || 2);
  const delayMs = Number(argValue(argv, '--delay-ms') || 0);
  const maxTokens = Number(argValue(argv, '--max-tokens') || 250);
  if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error('--runs must be between 1 and 10');
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 10) throw new Error('--concurrency must be between 1 and 10');
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 60_000) throw new Error('--delay-ms must be between 0 and 60000');
  if (!Number.isInteger(maxTokens) || maxTokens < 50 || maxTokens > 4_000) throw new Error('--max-tokens must be between 50 and 4000');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    tier: tierValue,
    runs,
    concurrency,
    delayMs,
    maxTokens,
    allModels: argv.includes('--all-models'),
    providers: parseList(argValue(argv, '--providers')),
    models: parseList(argValue(argv, '--models')),
    outputDir: resolve(argValue(argv, '--output') || `.benchmarks/classification/${stamp}`),
  };
}

function selectCandidates(options: CliOptions): Candidate[] {
  const providers = getProviderCascade();
  const all = providers.flatMap((provider) => provider.models.map((model) => ({ provider, model })));
  const filtered = all.filter(({ provider, model }) => {
    if (options.providers && !options.providers.has(provider.name.toLowerCase())) return false;
    if (options.models && !options.models.has(model.toLowerCase())) return false;
    return true;
  });
  if (options.allModels || options.providers || options.models) return filtered;
  return filtered.filter(({ provider, model }) => provider.name === PRODUCTION_PROVIDER && model === PRODUCTION_MODEL);
}

function buildMessages(systemPrompt: string, userPrompt: string, model: string) {
  if (supportsSystemRole(model)) {
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }
  return [{
    role: 'user',
    content: `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\n${userPrompt}`,
  }];
}

function extractCompletion(payload: unknown): { output: string; actualModel?: string; totalTokens?: number } {
  if (!payload || typeof payload !== 'object') return { output: '' };
  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0];
  const message = first && typeof first === 'object'
    ? (first as Record<string, unknown>).message
    : undefined;
  const content = message && typeof message === 'object'
    ? (message as Record<string, unknown>).content
    : undefined;
  const usage = record.usage && typeof record.usage === 'object'
    ? record.usage as Record<string, unknown>
    : undefined;
  return {
    output: typeof content === 'string' ? content.trim() : '',
    actualModel: typeof record.model === 'string' ? record.model : undefined,
    totalTokens: typeof usage?.total_tokens === 'number' ? usage.total_tokens : undefined,
  };
}

function safeError(error: unknown, apiKeys: string[]): string {
  let value = error instanceof Error ? error.message : String(error);
  for (const key of apiKeys) {
    if (key) value = value.replaceAll(key, '[REDACTED]');
  }
  return value.slice(0, 1_000);
}

async function runSample(
  candidate: Candidate,
  testCase: ClassificationBenchmarkCase,
  run: number,
  systemPrompt: string,
  maxTokens: number
): Promise<BenchmarkSample> {
  const startedAt = performance.now();
  let status: number | undefined;
  let output = '';
  let actualModel: string | undefined;
  let totalTokens: number | undefined;
  let error: string | undefined;

  try {
    const response = await requestChatCompletion(
      candidate.provider,
      candidate.model,
      buildMessages(
        systemPrompt,
        buildClassificationUserPrompt(testCase.message, testCase.profileName || 'Người hỏi'),
        candidate.model
      ),
      candidate.provider.apiKeys[0]!,
      {
        stream: false,
        maxTokens,
        temperature: 0.1,
        reasoningEffort: 'low',
        responseFormat: 'json_object',
        includeReasoning: false,
        timeoutMs: 30_000,
      }
    );
    status = response.status;
    const body = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`);
    let parsed: unknown;
    try { parsed = JSON.parse(body); }
    catch { throw new Error(`Provider returned invalid JSON envelope: ${body.slice(0, 500)}`); }
    const completion = extractCompletion(parsed);
    output = completion.output;
    actualModel = completion.actualModel;
    totalTokens = completion.totalTokens;
    if (!output) throw new Error('Provider returned empty completion content');
  } catch (sampleError) {
    error = safeError(sampleError, candidate.provider.apiKeys);
  }

  return {
    version: 1,
    datasetVersion: CLASSIFICATION_BENCHMARK_VERSION,
    timestamp: new Date().toISOString(),
    provider: candidate.provider.name,
    model: candidate.model,
    actualModel,
    caseId: testCase.id,
    expectedIntent: testCase.expectedIntent,
    run,
    status,
    latencyMs: Math.round(performance.now() - startedAt),
    totalTokens,
    output,
    error,
    evaluation: evaluateClassificationOutput(testCase, output),
  };
}

function rate(count: number, total: number): number {
  return total ? Math.round((count / total) * 10_000) / 10_000 : 0;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentile(values: number[], value: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((value / 100) * sorted.length) - 1)]!;
}

function summarize(samples: BenchmarkSample[]): ModelSummary[] {
  const groups = new Map<string, BenchmarkSample[]>();
  for (const sample of samples) {
    const key = `${sample.provider}\u0000${sample.model}`;
    groups.set(key, [...(groups.get(key) || []), sample]);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0]!;
    const critical = group.filter((sample) => CRITICAL_INTENTS.has(sample.expectedIntent));
    const byCase = new Map<string, BenchmarkSample[]>();
    const issueCounts: Record<string, number> = {};
    const confusion: Record<string, Record<string, number>> = {};
    for (const sample of group) {
      byCase.set(sample.caseId, [...(byCase.get(sample.caseId) || []), sample]);
      for (const issue of sample.evaluation.issues) issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      const predicted = sample.evaluation.normalizedDecision?.intent || 'invalid_json';
      confusion[sample.expectedIntent] ||= {};
      confusion[sample.expectedIntent]![predicted] = (confusion[sample.expectedIntent]![predicted] || 0) + 1;
    }
    const stableCases = Array.from(byCase.values()).filter((caseSamples) => {
      if (caseSamples.some((sample) => Boolean(sample.error) || !sample.evaluation.parsed)) return false;
      const predictions = new Set(caseSamples.map((sample) => sample.evaluation.normalizedDecision?.intent || 'invalid_json'));
      return predictions.size === 1;
    }).length;
    const requestSuccessRate = rate(group.filter((sample) => !sample.error).length, group.length);
    const validJsonRate = rate(group.filter((sample) => sample.evaluation.parsed).length, group.length);
    const normalizedIntentAccuracy = rate(group.filter((sample) => sample.evaluation.normalizedIntentCorrect).length, group.length);
    const criticalIntentAccuracy = rate(critical.filter((sample) => sample.evaluation.normalizedIntentCorrect).length, critical.length);
    const stableCaseRate = rate(stableCases, byCase.size);
    const summary: ModelSummary = {
      provider: first.provider,
      model: first.model,
      sampleCount: group.length,
      requestSuccessRate,
      validJsonRate,
      pureJsonRate: rate(group.filter((sample) => sample.evaluation.pureJson).length, group.length),
      rawIntentAccuracy: rate(group.filter((sample) => sample.evaluation.rawIntentCorrect).length, group.length),
      normalizedIntentAccuracy,
      spreadAccuracy: rate(group.filter((sample) => sample.evaluation.spreadCorrect).length, group.length),
      tarotContractAccuracy: rate(group.filter((sample) => sample.evaluation.tarotContractCorrect).length, group.length),
      indicatorAccuracy: rate(group.filter((sample) => sample.evaluation.indicatorsCorrect).length, group.length),
      criticalIntentAccuracy,
      stableCaseRate,
      averageScore: Math.round(average(group.map((sample) => sample.evaluation.score)) * 100) / 100,
      p50LatencyMs: percentile(group.map((sample) => sample.latencyMs), 50),
      p95LatencyMs: percentile(group.map((sample) => sample.latencyMs), 95),
      totalTokens: group.reduce((sum, sample) => sum + (sample.totalTokens || 0), 0),
      eligible: false,
      issueCounts,
      confusion,
    };
    summary.eligible = summary.requestSuccessRate === 1
      && summary.validJsonRate === 1
      && summary.normalizedIntentAccuracy >= 0.95
      && summary.criticalIntentAccuracy === 1
      && summary.stableCaseRate >= 0.95;
    return summary;
  }).sort((a, b) =>
    Number(b.eligible) - Number(a.eligible)
    || b.requestSuccessRate - a.requestSuccessRate
    || b.normalizedIntentAccuracy - a.normalizedIntentAccuracy
    || b.rawIntentAccuracy - a.rawIntentAccuracy
    || b.averageScore - a.averageScore
    || a.p95LatencyMs - b.p95LatencyMs
  );
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function recommendation(summaries: ModelSummary[], tier: Tier): string {
  const current = summaries.find((item) => item.provider === PRODUCTION_PROVIDER && item.model === PRODUCTION_MODEL);
  const best = summaries[0];
  if (!best) return 'Không có model nào hoàn thành benchmark.';
  if (best.requestSuccessRate < 0.9 || best.validJsonRate < 0.9) {
    return 'Không thể xếp hạng model vì phần lớn request lỗi hạ tầng hoặc không trả được JSON hợp lệ. Cần sửa kết nối/provider trước khi đánh giá chất lượng.';
  }
  if (tier === 'smoke') {
    if (summaries.length === 1) {
      return `Đây là vòng smoke của ${best.provider}/${best.model}. Hãy chạy full nhiều lần/case để đo độ chính xác và ổn định trước khi thay đổi prompt hoặc cấu hình production.`;
    }
    return `Đây là vòng smoke để loại model yếu. Hãy chạy full 3 lần/case cho 2 model dẫn đầu trước khi đổi production. Dẫn đầu tạm thời: ${best.provider}/${best.model}.`;
  }
  if (!current) return `Model production không có trong batch. Model dẫn đầu đủ điều kiện: ${best.eligible ? `${best.provider}/${best.model}` : 'chưa có'}.`;
  if (best.provider === current.provider && best.model === current.model) {
    return 'Giữ model production hiện tại; chưa có ứng viên nào vượt qua nó theo gate đã định.';
  }
  const accuracyGain = best.normalizedIntentAccuracy - current.normalizedIntentAccuracy;
  const latencyAcceptable = current.p95LatencyMs === 0 || best.p95LatencyMs <= current.p95LatencyMs * 1.25;
  if (best.eligible && accuracyGain >= 0.03 && latencyAcceptable && best.criticalIntentAccuracy >= current.criticalIntentAccuracy) {
    return `Đề xuất thử canary ${best.provider}/${best.model}: accuracy tăng ${(accuracyGain * 100).toFixed(1)} điểm %, không giảm nhóm intent quan trọng và p95 vẫn trong ngưỡng +25%.`;
  }
  return 'Chưa nên đổi model: ứng viên dẫn đầu chưa tạo mức tăng tối thiểu 3 điểm %, chưa qua hard gate, hoặc latency p95 tăng quá 25%.';
}

function buildMarkdown(
  options: CliOptions,
  cases: ClassificationBenchmarkCase[],
  summaries: ModelSummary[],
  samples: BenchmarkSample[]
): string {
  const rows = summaries.map((item) =>
    `| ${item.provider} | ${item.model} | ${item.sampleCount} | ${percent(item.requestSuccessRate)} | ${percent(item.validJsonRate)} | ${percent(item.rawIntentAccuracy)} | ${percent(item.normalizedIntentAccuracy)} | ${percent(item.spreadAccuracy)} | ${percent(item.indicatorAccuracy)} | ${percent(item.stableCaseRate)} | ${item.p95LatencyMs} | ${item.averageScore.toFixed(1)} | ${item.eligible ? 'PASS' : 'FAIL'} |`
  ).join('\n');
  const details = summaries.map((summary) => {
    const topIssues = Object.entries(summary.issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([issue, count]) => `- ${issue}: ${count}`)
      .join('\n') || '- Không có lỗi được ghi nhận.';
    const failed = samples.filter((sample) =>
      sample.provider === summary.provider
      && sample.model === summary.model
      && !sample.evaluation.normalizedIntentCorrect
    ).slice(0, 8).map((sample) =>
      `- \`${sample.caseId}\`: expected \`${sample.expectedIntent}\`, got \`${sample.evaluation.normalizedDecision?.intent || 'invalid_json'}\`${sample.error ? ` — ${sample.error}` : ''}`
    ).join('\n') || '- Không có case sai intent sau normalize.';
    return `### ${summary.provider}/${summary.model}\n\n**Lỗi nổi bật**\n\n${topIssues}\n\n**Case sai**\n\n${failed}`;
  }).join('\n\n');

  return `# Classification Model Benchmark\n\n` +
    `- Dataset: ${CLASSIFICATION_BENCHMARK_VERSION}\n` +
    `- Tier: ${options.tier}\n` +
    `- Cases: ${cases.length}\n` +
    `- Runs per case: ${options.runs}\n` +
    `- Delay between requests: ${options.delayMs} ms\n` +
    `- Max completion tokens: ${options.maxTokens}\n` +
    `- Generated: ${new Date().toISOString()}\n\n` +
    `## Kết luận tự động\n\n${recommendation(summaries, options.tier)}\n\n` +
    `## Bảng xếp hạng\n\n` +
    `| Provider | Model | N | Requests | JSON | Raw intent | Production intent | Spread | Indicators | Stability | p95 ms | Score | Gate |\n` +
    `|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n${rows}\n\n` +
    `Gate full: request và JSON 100%, production intent ≥95%, critical intents 100%, stability ≥95%. Raw intent cho biết năng lực model; production intent bao gồm deterministic overrides/normalization hiện có.\n\n` +
    `## Phân tích theo model\n\n${details}\n`;
}

async function runQueue<T>(tasks: Array<() => Promise<T>>, concurrency: number, delayMs: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]!();
      process.stdout.write(`\rCompleted ${index + 1}/${tasks.length}`);
      if (delayMs > 0 && nextIndex < tasks.length) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  process.stdout.write('\n');
  return results;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const candidates = selectCandidates(options);
  if (!candidates.length) throw new Error('No configured provider/model matched the requested filters.');
  const cases = options.tier === 'smoke'
    ? classificationBenchmarkCases.filter((item) => item.smoke)
    : classificationBenchmarkCases;
  const systemPrompt = buildClassificationSystemPrompt();
  const tasks = candidates.flatMap((candidate) =>
    cases.flatMap((testCase) =>
      Array.from({ length: options.runs }, (_, index) => () => runSample(
        candidate,
        testCase,
        index + 1,
        systemPrompt,
        options.maxTokens
      ))
    )
  );

  console.log(`Classification benchmark ${CLASSIFICATION_BENCHMARK_VERSION}`);
  console.log(`Tier=${options.tier}; cases=${cases.length}; runs=${options.runs}; candidates=${candidates.length}; requests=${tasks.length}; delayMs=${options.delayMs}; maxTokens=${options.maxTokens}`);
  candidates.forEach((item) => console.log(`- ${item.provider.name}/${item.model}`));

  const samples = await runQueue(tasks, options.concurrency, options.delayMs);
  const summaries = summarize(samples);
  await mkdir(options.outputDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(options.outputDir, 'raw.jsonl'), samples.map((sample) => JSON.stringify(sample)).join('\n') + '\n', 'utf8'),
    writeFile(resolve(options.outputDir, 'summary.json'), JSON.stringify({ options, summaries }, null, 2), 'utf8'),
    writeFile(resolve(options.outputDir, 'report.md'), buildMarkdown(options, cases, summaries, samples), 'utf8'),
  ]);

  console.table(summaries.map((item) => ({
    provider: item.provider,
    model: item.model,
    requests: percent(item.requestSuccessRate),
    json: percent(item.validJsonRate),
    rawIntent: percent(item.rawIntentAccuracy),
    productionIntent: percent(item.normalizedIntentAccuracy),
    stability: percent(item.stableCaseRate),
    p95Ms: item.p95LatencyMs,
    gate: item.eligible ? 'PASS' : 'FAIL',
  })));
  console.log(recommendation(summaries, options.tier));
  console.log(`Report: ${resolve(options.outputDir, 'report.md')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
