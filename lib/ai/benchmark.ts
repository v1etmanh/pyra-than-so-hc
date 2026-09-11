export type BenchmarkWorkload = 'stream-probe' | 'stream-domain' | 'structured-json';

export interface BenchmarkSample {
  version: 1;
  batch: string;
  timestamp: string;
  provider: string;
  model: string;
  actualModel?: string;
  workload: BenchmarkWorkload;
  promptId: string;
  status?: number;
  success: boolean;
  validOutput: boolean;
  streamCompleted?: boolean;
  ttfbMs?: number;
  ttftMs?: number;
  totalMs: number;
  outputChars: number;
  errorType?: string;
  errorMessage?: string;
}

export interface CandidateBenchmarkSummary {
  provider: string;
  model: string;
  sampleCount: number;
  successCount: number;
  successRate: number;
  validCount: number;
  validRate: number;
  structuredCount: number;
  structuredValidCount: number;
  avgTtfbMs?: number;
  avgTtftMs?: number;
  p50TtftMs?: number;
  p95TtftMs?: number;
  avgTotalMs: number;
  actualModels: string[];
  unstableRouting: boolean;
  eligible: boolean;
  disqualifiers: string[];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Nearest-rank percentile, suitable for the deliberately small 30-sample batches. */
export function percentile(values: number[], percentileValue: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((percentileValue / 100) * sorted.length));
  return sorted[Math.min(rank - 1, sorted.length - 1)];
}

export function summarizeBenchmarkSamples(
  samples: BenchmarkSample[],
  options: { minimumSamples?: number; ttftSloMs?: number } = {}
): CandidateBenchmarkSummary[] {
  const minimumSamples = options.minimumSamples ?? 30;
  const ttftSloMs = options.ttftSloMs ?? 10_000;
  const grouped = new Map<string, BenchmarkSample[]>();

  for (const sample of samples) {
    const key = `${sample.provider}\u0000${sample.model}`;
    const group = grouped.get(key) ?? [];
    group.push(sample);
    grouped.set(key, group);
  }

  return Array.from(grouped.values()).map((group) => {
    const first = group[0]!;
    const successful = group.filter((sample) => sample.success);
    const valid = group.filter((sample) => sample.validOutput);
    const structured = group.filter((sample) => sample.workload === 'structured-json');
    const structuredValid = structured.filter((sample) => sample.validOutput);
    const ttfbValues = successful.flatMap((sample) => sample.ttfbMs === undefined ? [] : [sample.ttfbMs]);
    const ttftValues = successful
      .filter((sample) => sample.workload !== 'structured-json')
      .flatMap((sample) => sample.ttftMs === undefined ? [] : [sample.ttftMs]);
    const actualModels = Array.from(
      new Set<string>(group.flatMap((sample) => sample.actualModel ? [sample.actualModel] : []))
    ).sort();
    const p95TtftMs = percentile(ttftValues, 95);
    const avgTtfbMs = average(ttfbValues);
    const avgTtftMs = average(ttftValues);
    const disqualifiers: string[] = [];

    if (group.length < minimumSamples) disqualifiers.push(`needs ${minimumSamples} samples`);
    if (successful.length / group.length < 29 / 30) disqualifiers.push('success rate below 29/30');
    if (structured.length === 0 || structuredValid.length !== structured.length) {
      disqualifiers.push('structured output validation failed');
    }
    if (p95TtftMs === undefined || p95TtftMs > ttftSloMs) {
      disqualifiers.push(`p95 TTFT above ${ttftSloMs}ms`);
    }

    return {
      provider: first.provider,
      model: first.model,
      sampleCount: group.length,
      successCount: successful.length,
      successRate: round(successful.length / group.length),
      validCount: valid.length,
      validRate: round(valid.length / group.length),
      structuredCount: structured.length,
      structuredValidCount: structuredValid.length,
      avgTtfbMs: avgTtfbMs === undefined ? undefined : round(avgTtfbMs),
      avgTtftMs: avgTtftMs === undefined ? undefined : round(avgTtftMs),
      p50TtftMs: percentile(ttftValues, 50),
      p95TtftMs,
      avgTotalMs: round(average(group.map((sample) => sample.totalMs)) ?? 0),
      actualModels,
      unstableRouting: first.model === 'openrouter/free' && actualModels.length > 1,
      eligible: disqualifiers.length === 0,
      disqualifiers
    };
  });
}

export function rankBenchmarkSummaries(
  summaries: CandidateBenchmarkSummary[]
): CandidateBenchmarkSummary[] {
  const latency = (value: number | undefined) => value ?? Number.POSITIVE_INFINITY;
  return [...summaries].sort((a, b) =>
    Number(b.eligible) - Number(a.eligible) ||
    b.successRate - a.successRate ||
    Number(a.unstableRouting) - Number(b.unstableRouting) ||
    latency(a.p95TtftMs) - latency(b.p95TtftMs) ||
    latency(a.p50TtftMs) - latency(b.p50TtftMs) ||
    a.avgTotalMs - b.avgTotalMs ||
    a.provider.localeCompare(b.provider) ||
    a.model.localeCompare(b.model)
  );
}

export function recommendedTimeoutMs(
  measuredP95Ms: number | undefined,
  multiplier: number,
  minimumMs: number,
  maximumMs: number
): number | undefined {
  if (measuredP95Ms === undefined || !Number.isFinite(measuredP95Ms)) return undefined;
  const roundedToSecond = Math.ceil((measuredP95Ms * multiplier) / 1_000) * 1_000;
  return Math.min(maximumMs, Math.max(minimumMs, roundedToSecond));
}
