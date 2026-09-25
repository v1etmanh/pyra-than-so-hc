import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

// Load .env and .env.local if present
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

import { testAIProvidersHealth, formatHealthReport } from '../lib/ai/health-check.ts';

async function main() {
  console.log('Đang kiểm tra kết nối tới các Model AI và Providers cấu hình trong hệ thống...\n');

  // Parse command line arguments if any
  const args = process.argv.slice(2);
  const stream = !args.includes('--no-stream');
  const timeoutMs = 15_000;

  const report = await testAIProvidersHealth({
    stream,
    timeoutMs,
    degradedLatencyThresholdMs: 4_500
  });

  console.log(formatHealthReport(report));

  if (report.overallStatus === 'DOWN') {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Fatal error during AI health check:', err);
  process.exit(1);
});
