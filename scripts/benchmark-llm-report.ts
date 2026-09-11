import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  rankBenchmarkSummaries,
  recommendedTimeoutMs,
  summarizeBenchmarkSamples,
  type BenchmarkSample,
  type CandidateBenchmarkSummary
} from '../lib/ai/benchmark.ts';

const PROVIDER_ENV: Record<string, string> = {
  'Google Gemini': 'GEMINI_CHAT_MODELS',
  'NVIDIA NIM': 'NVIDIA_CHAT_MODELS',
  Groq: 'GROQ_CHAT_MODELS',
  'Grok / xAI': 'XAI_CHAT_MODELS',
  'OpenRouter Free': 'OPENROUTER_FREE_MODELS'
};

function argValue(flag: string): string | undefined {
  const direct = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (direct) return direct.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function loadSamples(inputDir: string): BenchmarkSample[] {
  if (!existsSync(inputDir)) throw new Error(`Benchmark directory does not exist: ${inputDir}`);
  return readdirSync(inputDir)
    .filter((file) => file.endsWith('.jsonl'))
    .flatMap((file) => readFileSync(path.join(inputDir, file), 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line) as BenchmarkSample;
        } catch {
          throw new Error(`Invalid JSONL in ${file}:${index + 1}`);
        }
      }));
}

function displayMetric(value: number | undefined): string {
  return value === undefined ? '—' : Math.round(value).toString();
}

function buildMarkdown(ranked: CandidateBenchmarkSummary[], generatedAt: string): string {
  const rows = ranked.map((summary, index) =>
    `| ${index + 1} | ${summary.provider} | \`${summary.model}\` | ${summary.sampleCount} | ${(summary.successRate * 100).toFixed(1)}% | ${displayMetric(summary.p50TtftMs)} | ${displayMetric(summary.p95TtftMs)} | ${displayMetric(summary.avgTotalMs)} | ${summary.eligible ? 'PASS' : `FAIL: ${summary.disqualifiers.join('; ')}`} |`
  );
  const providerOrder = Array.from(new Set(ranked.filter((item) => item.eligible).map((item) => item.provider)));
  const routingNotes = ranked
    .filter((item) => item.actualModels.length > 0)
    .map((item) => `- ${item.provider}/\`${item.model}\`: response models = ${item.actualModels.map((model) => `\`${model}\``).join(', ')}${item.unstableRouting ? ' (unstable router alias)' : ''}`);

  return `# LLM fallback benchmark\n\nGenerated: ${generatedAt}\n\n` +
    `## Recommended provider order\n\n${providerOrder.length ? providerOrder.map((provider, index) => `${index + 1}. ${provider}`).join('\n') : 'No provider currently meets the production gate.'}\n\n` +
    `## Candidate ranking\n\n| Rank | Provider | Model | Samples | Success | p50 TTFT ms | p95 TTFT ms | Avg total ms | Gate |\n|---:|---|---|---:|---:|---:|---:|---:|---|\n${rows.join('\n')}\n\n` +
    `## Routed model observations\n\n${routingNotes.length ? routingNotes.join('\n') : 'No provider reported an underlying model ID.'}\n\n` +
    `Eligibility requires at least 30 samples, 29/30 success, all structured cases valid, and p95 TTFT at or below 10,000 ms.\n`;
}

function buildEnvSuggestion(ranked: CandidateBenchmarkSummary[]): string {
  const lines = [
    '# Generated benchmark suggestion. Review manually; this file contains no API keys.',
    `# Generated at ${new Date().toISOString()}`
  ];
  const providerOrder = Array.from(new Set(ranked.filter((item) => item.eligible).map((item) => item.provider)));
  lines.push(`# Provider order: ${providerOrder.length ? providerOrder.join(' -> ') : 'no eligible provider'}`);
  if (providerOrder.length > 0) {
    lines.push(`LLM_PROVIDER_ORDER=${providerOrder.join(',')}`);
  }

  for (const [provider, envName] of Object.entries(PROVIDER_ENV)) {
    const models = ranked.filter((item) => item.provider === provider && item.eligible).map((item) => item.model);
    if (models.length) lines.push(`${envName}=${models.join(',')}`);
  }

  const top = ranked.find((item) => item.eligible);
  const firstContentTimeout = recommendedTimeoutMs(top?.p95TtftMs, 1.25, 5_000, 15_000);
  const headerTimeout = recommendedTimeoutMs(top?.avgTtfbMs, 1.5, 2_000, 10_000);
  if (headerTimeout) lines.push(`LLM_RESPONSE_HEADER_TIMEOUT_MS=${headerTimeout}`);
  if (firstContentTimeout) lines.push(`LLM_FIRST_CONTENT_TIMEOUT_MS=${firstContentTimeout}`);
  return `${lines.join('\n')}\n`;
}

const inputDir = path.resolve(argValue('--input') || '.benchmarks/llm');
const outputDir = path.resolve(argValue('--output') || inputDir);
const samples = loadSamples(inputDir);
if (samples.length === 0) throw new Error('No benchmark samples found.');
const ranked = rankBenchmarkSummaries(summarizeBenchmarkSamples(samples));
const generatedAt = new Date().toISOString();
mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify({ generatedAt, samples: samples.length, candidates: ranked }, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'report.md'), buildMarkdown(ranked, generatedAt), 'utf8');
writeFileSync(path.join(outputDir, '.env.suggested'), buildEnvSuggestion(ranked), 'utf8');
console.log(`Summarized ${samples.length} samples across ${ranked.length} candidates in ${outputDir}`);
