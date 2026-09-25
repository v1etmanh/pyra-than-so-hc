import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

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

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

import { requestChatCompletion, type CascadeProvider } from '../lib/ai/provider-cascade.ts';

const USER_TEXT = `Hôm nay của tôi trải qua khá nhiều xáo trộn và áp lực. Buổi sáng công việc dồn dập với 3 cuộc họp liên tiếp, buổi chiều thì phát sinh mâu thuẫn ý kiến nhỏ với đồng nghiệp khi phân chia trách nhiệm dự án khiến tôi cảm thấy hơi kiệt sức và bế tắc. Bây giờ là buổi tối, đầu óc tôi vẫn còn suy nghĩ luẩn quẩn về công việc. Hãy đóng vai một người bạn tâm giao và cố vấn thông thái: phân tích tâm trạng, góc nhìn năng lượng của ngày hôm nay, và gợi ý cho tôi 3 bước thực tế để xả stress, cân bằng lại tâm trí trước khi ngủ.`;

const SYSTEM_PROMPT = `Bạn là một cố vấn tâm lý và năng lượng thấu hiểu, ấm áp. Hãy phân tích chân thành, đồng cảm sâu sắc và đưa ra những giải pháp cụ thể, thực tế bằng tiếng Việt.`;

interface TestTarget {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const groqKey = process.env.GROQ_API_KEY?.trim() || '';
const nvidiaKey = process.env.NVIDIA_API_KEY?.trim() || '';
const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY_1?.trim() || '';

const targets: TestTarget[] = [
  {
    providerName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: groqKey,
    model: 'qwen/qwen3.8-27b'
  },
  {
    providerName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: groqKey,
    model: 'openai/gpt-oss-20b'
  },
  {
    providerName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: groqKey,
    model: 'openai/gpt-oss-120b'
  },
  {
    providerName: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: nvidiaKey,
    model: 'meta/llama-3.2-11b-vision-instruct'
  },
  {
    providerName: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: nvidiaKey,
    model: 'nvidia/nemotron-3-super-120b-a12b'
  },
  {
    providerName: 'Google Gemini',
    baseUrl: process.env.GEMINI_API_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: geminiKey,
    model: 'gemini-3.6-flash'
  }
];

async function runPromptTest(target: TestTarget) {
  const provider: CascadeProvider = {
    name: target.providerName,
    baseUrl: target.baseUrl,
    models: [target.model],
    apiKeys: [target.apiKey]
  };

  const start = performance.now();
  let ttftMs: number | undefined;
  let fullOutput = '';
  let status = 200;

  try {
    const res = await requestChatCompletion(
      provider,
      target.model,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_TEXT }
      ],
      target.apiKey,
      {
        stream: true,
        maxTokens: 800,
        temperature: 0.7,
        timeoutMs: 25000
      }
    );

    status = res.status;
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        target,
        success: false,
        error: `HTTP ${res.status}: ${errText.slice(0, 150)}`,
        latencyMs: Math.round(performance.now() - start)
      };
    }

    const reader = res.body!.getReader();
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
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            if (ttftMs === undefined) {
              ttftMs = Math.round(performance.now() - start);
            }
            fullOutput += delta;
          }
        } catch {}
      }
    }

    return {
      target,
      success: fullOutput.trim().length > 0,
      ttftMs,
      latencyMs: Math.round(performance.now() - start),
      output: fullOutput.trim()
    };
  } catch (err) {
    return {
      target,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Math.round(performance.now() - start)
    };
  }
}

async function main() {
  console.log('======================================================================');
  console.log('THỬ NGHIỆM ĐOẠN TEXT PHÂN TÍCH NGÀY TRÊN BỘ MODEL AI MỚI');
  console.log('======================================================================\n');
  console.log('Nội dung gửi thử nghiệm:\n"' + USER_TEXT + '"\n');

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    console.log(`[${i + 1}/${targets.length}] Đang gửi tới: ${t.providerName} -> ${t.model}...`);
    const res = await runPromptTest(t);

    if (res.success && res.output) {
      console.log(`✅ THÀNH CÔNG!`);
      console.log(`   ⏱️ TTFT: ${res.ttftMs}ms | Tổng: ${res.latencyMs}ms | Độ dài: ${res.output.length} ký tự`);
      console.log(`   💬 Phản hồi:`);
      console.log(`----------------------------------------------------------------------`);
      console.log(res.output);
      console.log(`----------------------------------------------------------------------\n`);
    } else {
      console.log(`❌ THẤT BẠI!`);
      console.log(`   ⏱️ Thời gian: ${res.latencyMs}ms | Lỗi: ${res.error || 'Phản hồi rỗng'}\n`);
    }
  }
}

main().catch(console.error);
