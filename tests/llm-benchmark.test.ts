import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  percentile,
  rankBenchmarkSummaries,
  recommendedTimeoutMs,
  summarizeBenchmarkSamples,
  type BenchmarkSample
} from '../lib/ai/benchmark.ts';

function samplesFor(
  provider: string,
  model: string,
  options: { failures?: number; ttftMs: number; actualModels?: string[] }
): BenchmarkSample[] {
  return Array.from({ length: 30 }, (_, index) => {
    const structured = index % 10 >= 8;
    const success = index >= (options.failures ?? 0);
    return {
      version: 1,
      batch: `batch-${Math.floor(index / 10) + 1}`,
      timestamp: new Date(2026, 0, index + 1).toISOString(),
      provider,
      model,
      actualModel: options.actualModels?.[index % options.actualModels.length],
      workload: structured ? 'structured-json' : index % 10 < 4 ? 'stream-probe' : 'stream-domain',
      promptId: `prompt-${index}`,
      status: success ? 200 : 503,
      success,
      validOutput: success,
      streamCompleted: structured ? undefined : success,
      ttfbMs: 200,
      ttftMs: structured ? undefined : options.ttftMs + index,
      totalMs: options.ttftMs + 500,
      outputChars: success ? 120 : 0
    };
  });
}

test('percentiles use nearest rank and timeout suggestions are bounded', () => {
  assert.equal(percentile([5, 1, 4, 2, 3], 50), 3);
  assert.equal(percentile([5, 1, 4, 2, 3], 95), 5);
  assert.equal(recommendedTimeoutMs(4_100, 1.25, 5_000, 15_000), 6_000);
  assert.equal(recommendedTimeoutMs(50_000, 2, 5_000, 15_000), 15_000);
});

test('ranking prioritizes reliability before latency', () => {
  const reliable = samplesFor('Reliable', 'stable', { ttftMs: 1_500 });
  const fasterWithFailure = samplesFor('Fast', 'flaky', { failures: 2, ttftMs: 200 });
  const ranked = rankBenchmarkSummaries(
    summarizeBenchmarkSamples([...fasterWithFailure, ...reliable])
  );

  assert.equal(ranked[0]?.provider, 'Reliable');
  assert.equal(ranked[0]?.eligible, true);
  assert.equal(ranked[1]?.eligible, false);
  assert.match(ranked[1]?.disqualifiers.join(' ') || '', /success rate/);
});

test('router aliases record actual models and are marked unstable', () => {
  const samples = samplesFor('OpenRouter Free', 'openrouter/free', {
    ttftMs: 500,
    actualModels: ['model/a', 'model/b']
  });
  const [summary] = summarizeBenchmarkSamples(samples);
  assert.deepEqual(summary?.actualModels, ['model/a', 'model/b']);
  assert.equal(summary?.unstableRouting, true);
});
