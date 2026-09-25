import { performance } from 'node:perf_hooks';
import {
  getProviderCascade,
  requestChatCompletion,
  type CascadeProvider,
  type ModelCandidate
} from './provider-cascade';
import { supportsSystemRole } from './model-config';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface ModelHealthResult {
  provider: string;
  model: string;
  apiKeyMasked: string;
  status: HealthStatus;
  httpStatus?: number;
  latencyMs: number;
  ttftMs?: number;
  outputPreview?: string;
  tokenCountEstimate?: number;
  issues: string[];
}

export interface HealthCheckReport {
  timestamp: string;
  totalModelsTested: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  overallStatus: HealthStatus;
  results: ModelHealthResult[];
}

export interface HealthCheckOptions {
  /** Filter by provider names (e.g. ['Google Gemini', 'Groq']) */
  providers?: string[];
  /** Maximum timeout per probe request in milliseconds (default: 10_000ms) */
  timeoutMs?: number;
  /** Latency threshold in ms above which a model is considered 'DEGRADED' (default: 4_000ms) */
  degradedLatencyThresholdMs?: number;
  /** Test streaming capability (TTFT measurement) or simple batch request */
  stream?: boolean;
  /** Max models to test per provider (default: test all configured) */
  maxModelsPerProvider?: number;
  /** Custom test prompt */
  testPrompt?: {
    system?: string;
    user?: string;
  };
}

function maskApiKey(key: string): string {
  if (!key) return '(none)';
  if (key.length <= 8) return '****' + key.slice(-2);
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function buildTestMessages(systemPrompt: string, userPrompt: string, model: string) {
  if (supportsSystemRole(model)) {
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }
  // Gemma and models without system role support
  return [
    {
      role: 'user',
      content: `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\n${userPrompt}`
    }
  ];
}

/**
 * Tests an individual AI candidate (provider + model + apiKey).
 * Probes the model with a minimal prompt to measure latency, availability, and response validity.
 */
export async function probeModelCandidate(
  candidate: ModelCandidate,
  options: {
    timeoutMs?: number;
    degradedLatencyThresholdMs?: number;
    stream?: boolean;
    systemPrompt?: string;
    userPrompt?: string;
  } = {}
): Promise<ModelHealthResult> {
  const { provider, model, apiKey } = candidate;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const degradedThresholdMs = options.degradedLatencyThresholdMs ?? 4_000;
  const useStream = options.stream ?? true;
  const systemPrompt = options.systemPrompt ?? 'You are an AI health probe. Be concise and follow instructions exactly.';
  const userPrompt = options.userPrompt ?? 'Reply with "PONG" and current status in 1 short sentence.';

  const apiKeyMasked = maskApiKey(apiKey);
  const issues: string[] = [];
  const messages = buildTestMessages(systemPrompt, userPrompt, model);

  const startTime = performance.now();
  let httpStatus: number | undefined;
  let ttftMs: number | undefined;
  let output = '';

  try {
    const response = await requestChatCompletion(
      provider,
      model,
      messages,
      apiKey,
      {
        stream: useStream,
        maxTokens: 350,
        temperature: 0.1,
        timeoutMs
      }
    );

    httpStatus = response.status;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let errorSummary = errorBody.slice(0, 200).trim();
      
      if (httpStatus === 401 || httpStatus === 403) {
        issues.push(`Lỗi xác thực (Auth/Key invalid): ${errorSummary || 'Invalid API key or unauthorized'}`);
      } else if (httpStatus === 404) {
        issues.push(`Model không tồn tại hoặc đã bị đổi tên (404 Not Found): ${errorSummary}`);
      } else if (httpStatus === 429) {
        issues.push(`Bị giới hạn tốc độ / Hết hạn mức (429 Rate Limit/Quota Exceeded)`);
      } else if (httpStatus >= 500) {
        issues.push(`Nhà cung cấp lỗi máy chủ (${httpStatus} Server Error): ${errorSummary}`);
      } else {
        issues.push(`HTTP ${httpStatus}: ${errorSummary}`);
      }

      return {
        provider: provider.name,
        model,
        apiKeyMasked,
        status: 'DOWN',
        httpStatus,
        latencyMs: Math.round(performance.now() - startTime),
        issues
      };
    }

    if (!response.body) {
      issues.push('Response body rỗng (No stream/body received)');
      return {
        provider: provider.name,
        model,
        apiKeyMasked,
        status: 'DOWN',
        httpStatus,
        latencyMs: Math.round(performance.now() - startTime),
        issues
      };
    }

    let hasReasoning = false;

    // Process response (stream vs batch)
    if (useStream) {
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
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.reasoning) {
              hasReasoning = true;
            }
            const content = delta?.content;
            if (content) {
              if (ttftMs === undefined) {
                ttftMs = Math.round(performance.now() - startTime);
              }
              output += content;
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } else {
      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string; reasoning?: string } }>;
      };
      output = data.choices?.[0]?.message?.content || '';
      if (data.choices?.[0]?.message?.reasoning) {
        hasReasoning = true;
      }
    }

    const totalLatencyMs = Math.round(performance.now() - startTime);
    output = output.trim();

    // Analyze output quality
    if (!output) {
      if (hasReasoning) {
        issues.push('Model chỉ sinh reasoning tokens mà không sinh nội dung trả lời (Cần tăng max_tokens)');
      } else {
        issues.push('Model phản hồi rỗng (0 characters output)');
      }
    }

    // Analyze latency
    if (totalLatencyMs > degradedThresholdMs) {
      issues.push(`Độ trễ cao (${totalLatencyMs}ms > ${degradedThresholdMs}ms)`);
    }

    if (ttftMs !== undefined && ttftMs > degradedThresholdMs) {
      issues.push(`Thời gian ra token đầu tiên chậm (TTFT = ${ttftMs}ms)`);
    }

    let status: HealthStatus = 'HEALTHY';
    if (!output || issues.some((i) => i.includes('Lỗi'))) {
      status = 'DOWN';
    } else if (issues.length > 0) {
      status = 'DEGRADED';
    }

    return {
      provider: provider.name,
      model,
      apiKeyMasked,
      status,
      httpStatus,
      latencyMs: totalLatencyMs,
      ttftMs,
      outputPreview: output.slice(0, 100).replace(/\n/g, ' '),
      tokenCountEstimate: Math.ceil(output.length / 4),
      issues
    };
  } catch (error) {
    const totalLatencyMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('abort') || message.includes('timed out')) {
      issues.push(`Request bị quá thời gian chờ (Timeout sau ${timeoutMs}ms)`);
    } else {
      issues.push(`Lỗi kết nối mạng / Ngoại lệ: ${message}`);
    }

    return {
      provider: provider.name,
      model,
      apiKeyMasked,
      status: 'DOWN',
      httpStatus,
      latencyMs: totalLatencyMs,
      issues
    };
  }
}

/**
 * Main testing function: Evaluates all configured AI providers and models in the system.
 * Returns a comprehensive health report.
 */
export async function testAIProvidersHealth(
  options: HealthCheckOptions = {}
): Promise<HealthCheckReport> {
  const cascade = getProviderCascade();
  const filteredCascade = options.providers?.length
    ? cascade.filter((p) =>
        options.providers!.some((name) => p.name.toLowerCase().includes(name.toLowerCase()))
      )
    : cascade;

  if (filteredCascade.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      totalModelsTested: 0,
      healthyCount: 0,
      degradedCount: 0,
      downCount: 0,
      overallStatus: 'DOWN',
      results: []
    };
  }

  // Gather all unique candidates to test
  const candidates: ModelCandidate[] = [];
  for (const provider of filteredCascade) {
    const models = options.maxModelsPerProvider
      ? provider.models.slice(0, options.maxModelsPerProvider)
      : provider.models;

    for (const model of models) {
      // Test the primary configured key for this provider
      // If multiple keys exist, we test the first one (or could optionally test all)
      for (const apiKey of provider.apiKeys) {
        candidates.push({ provider, model, apiKey });
      }
    }
  }

  // Execute probes sequentially or with small concurrency to avoid rate-limiting ourselves
  const results: ModelHealthResult[] = [];
  for (const candidate of candidates) {
    const result = await probeModelCandidate(candidate, {
      timeoutMs: options.timeoutMs,
      degradedLatencyThresholdMs: options.degradedLatencyThresholdMs,
      stream: options.stream,
      systemPrompt: options.testPrompt?.system,
      userPrompt: options.testPrompt?.user
    });
    results.push(result);
  }

  const healthyCount = results.filter((r) => r.status === 'HEALTHY').length;
  const degradedCount = results.filter((r) => r.status === 'DEGRADED').length;
  const downCount = results.filter((r) => r.status === 'DOWN').length;

  let overallStatus: HealthStatus = 'HEALTHY';
  if (healthyCount === 0 && degradedCount === 0) {
    overallStatus = 'DOWN';
  } else if (downCount > 0 || degradedCount > 0) {
    overallStatus = 'DEGRADED';
  }

  return {
    timestamp: new Date().toISOString(),
    totalModelsTested: results.length,
    healthyCount,
    degradedCount,
    downCount,
    overallStatus,
    results
  };
}

/**
 * Formats the health check report into a readable console string with colors and icons.
 */
export function formatHealthReport(report: HealthCheckReport): string {
  const lines: string[] = [];
  lines.push('======================================================================');
  lines.push(`           BÁO CÁO KIỂM TRA SỨC KHỎE CÁC MODEL AI PROVDIER           `);
  lines.push('======================================================================');
  lines.push(`Thời gian kiểm tra : ${report.timestamp}`);
  lines.push(`Tổng số probe      : ${report.totalModelsTested}`);
  lines.push(`🟢 Hoạt động tốt   : ${report.healthyCount}`);
  lines.push(`🟡 Cảnh báo chậm   : ${report.degradedCount}`);
  lines.push(`🔴 Lỗi / Không chạy: ${report.downCount}`);
  lines.push(`Trạng thái chung   : [ ${report.overallStatus} ]`);
  lines.push('----------------------------------------------------------------------');

  if (report.results.length === 0) {
    lines.push('❌ Không tìm thấy Provider nào được cấu hình API Key trong môi trường (.env)!');
    lines.push('----------------------------------------------------------------------');
    return lines.join('\n');
  }

  for (const item of report.results) {
    const icon = item.status === 'HEALTHY' ? '🟢' : item.status === 'DEGRADED' ? '🟡' : '🔴';
    lines.push(`${icon} [${item.status}] ${item.provider} -> ${item.model}`);
    lines.push(`   Key: ${item.apiKeyMasked} | HTTP: ${item.httpStatus ?? 'ERR'} | Tổng thời gian: ${item.latencyMs}ms${item.ttftMs ? ` | TTFT: ${item.ttftMs}ms` : ''}`);
    if (item.outputPreview) {
      lines.push(`   Phản hồi: "${item.outputPreview}"`);
    }
    if (item.issues.length > 0) {
      lines.push(`   ⚠️ Vấn đề: ${item.issues.join('; ')}`);
    }
    lines.push('');
  }

  lines.push('======================================================================');
  return lines.join('\n');
}
