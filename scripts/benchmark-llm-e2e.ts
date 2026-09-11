import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

interface E2ECase {
  id: string;
  endpoint: string;
  body: Record<string, unknown>;
}

interface E2EResult {
  id: string;
  endpoint: string;
  status?: number;
  success: boolean;
  ttfbMs?: number;
  ttftMs?: number;
  totalMs: number;
  outputChars: number;
  error?: string;
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const tarotQuestions = [
  'Tôi nên ưu tiên điều gì trong tuần này?',
  'Điều gì đang cản trở quyết định công việc của tôi?',
  'Tôi cần hiểu gì về nhịp nghỉ ngơi hiện tại?',
  'Tôi nên tiếp cận cuộc trò chuyện khó khăn sắp tới thế nào?',
  'Nguồn lực nào tôi đang bỏ quên?',
  'Bước nhỏ thực tế nào phù hợp nhất lúc này?'
];

const cases: E2ECase[] = [
  ...tarotQuestions.map((question, index) => ({
    id: `tarot-${index + 1}`,
    endpoint: '/api/tarot/reading',
    body: { mode: 'initial', question, spreadId: 'single', language: 'vi' }
  })),
  ...[
    ['walksOfLife', 'Đường đời', 7],
    ['soul', 'Linh hồn', 3],
    ['personality', 'Nhân cách', 5],
    ['yearIndividual', 'Năm cá nhân', 9]
  ].map(([indicatorKey, indicatorName, indicatorValue], index) => ({
    id: `indicator-${index + 1}`,
    endpoint: '/api/numerology/lazy-indicator',
    body: {
      fullName: 'Benchmark Profile',
      birthDay: '1995-10-24',
      indicatorKey,
      indicatorName,
      indicatorValue,
      language: 'Vietnamese'
    }
  }))
];

function elapsed(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}

async function runCase(baseUrl: string, testCase: E2ECase, cookie?: string): Promise<E2EResult> {
  const startedAt = performance.now();
  let status: number | undefined;
  let ttfbMs: number | undefined;
  let ttftMs: number | undefined;
  let output = '';
  try {
    const response = await fetch(`${baseUrl}${testCase.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {})
      },
      body: JSON.stringify(testCase.body),
      signal: AbortSignal.timeout(180_000)
    });
    status = response.status;
    ttfbMs = elapsed(startedAt);
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const event = JSON.parse(raw);
          const content = typeof event.content === 'string' ? event.content : '';
          if (content) {
            if (ttftMs === undefined) ttftMs = elapsed(startedAt);
            output += content;
          }
          if (event.type === 'error') throw new Error(String(event.message || 'SSE error'));
        } catch (error) {
          if (error instanceof SyntaxError) continue;
          throw error;
        }
      }
    }
    return {
      id: testCase.id,
      endpoint: testCase.endpoint,
      status,
      success: output.trim().length >= 80,
      ttfbMs,
      ttftMs,
      totalMs: elapsed(startedAt),
      outputChars: output.length
    };
  } catch (error) {
    return {
      id: testCase.id,
      endpoint: testCase.endpoint,
      status,
      success: false,
      ttfbMs,
      ttftMs,
      totalMs: elapsed(startedAt),
      outputChars: output.length,
      error: (error instanceof Error ? error.message : String(error)).slice(0, 200)
    };
  }
}

async function main(): Promise<void> {
  const baseUrl = (argValue('--app-url') || 'http://localhost:3200').replace(/\/$/, '');
  const outputDir = path.resolve(argValue('--output') || '.benchmarks/llm');
  const cookie = argValue('--cookie');
  const results: E2EResult[] = [];
  for (let index = 0; index < cases.length; index += 1) {
    const testCase = cases[index]!;
    console.log(`[${index + 1}/${cases.length}] ${testCase.id}`);
    const result = await runCase(baseUrl, testCase, cookie);
    results.push(result);
    console.log(`  ${result.success ? 'ok' : 'failed'} ttft=${result.ttftMs ?? '-'} total=${result.totalMs}`);
  }
  mkdirSync(outputDir, { recursive: true });
  const file = path.join(outputDir, `e2e-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results }, null, 2)}\n`, 'utf8');
  console.log(`Saved ${results.length} end-to-end samples to ${file}`);
  if (results.some((result) => !result.success)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
