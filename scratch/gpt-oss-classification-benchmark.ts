import { readFile } from 'node:fs/promises';

type Expected = {
  mode: 'single' | 'compatibility';
  intent: 'two_choices' | 'timing_trajectory' | 'core_personality' | 'daily_guidance' | 'trash' | 'general';
  needsTarot: boolean;
  spreadId: 'single' | 'three-card' | 'two-options' | 'relationship' | null;
  cardCount: number;
};

type Case = { id: string; message: string; expected: Expected };

const cases: Case[] = [
  { id: 'two-choice-career', message: 'Tôi nên nhận công việc mới hay ở lại công ty hiện tại?', expected: { mode: 'single', intent: 'two_choices', needsTarot: true, spreadId: 'two-options', cardCount: 5 } },
  { id: 'two-choice-study', message: 'Nên học lập trình hay thiết kế đồ họa trong năm nay?', expected: { mode: 'single', intent: 'two_choices', needsTarot: true, spreadId: 'two-options', cardCount: 5 } },
  { id: 'timing-six-months', message: 'Sáu tháng tới công việc của tôi sẽ diễn biến thế nào?', expected: { mode: 'single', intent: 'timing_trajectory', needsTarot: true, spreadId: 'three-card', cardCount: 3 } },
  { id: 'timing-year', message: 'Năm 2027 tài chính của tôi có khởi sắc không?', expected: { mode: 'single', intent: 'timing_trajectory', needsTarot: true, spreadId: 'three-card', cardCount: 3 } },
  { id: 'personality', message: 'Điểm mạnh và điểm yếu cốt lõi trong tính cách của tôi là gì?', expected: { mode: 'single', intent: 'core_personality', needsTarot: false, spreadId: null, cardCount: 0 } },
  { id: 'mission', message: 'Sứ mệnh sống của tôi phù hợp với nghề nào?', expected: { mode: 'single', intent: 'core_personality', needsTarot: false, spreadId: null, cardCount: 0 } },
  { id: 'daily-food', message: 'Hôm nay tôi nên ăn gì để thấy dễ chịu hơn?', expected: { mode: 'single', intent: 'daily_guidance', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'daily-clothes', message: 'Ngày mai nên mặc màu gì khi đi gặp khách hàng?', expected: { mode: 'single', intent: 'daily_guidance', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'general-love', message: 'Tình cảm hiện tại của tôi cần lưu ý điều gì?', expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'general-work', message: 'Tôi đang mất động lực làm việc, nên bắt đầu từ đâu?', expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'trash-letters', message: 'asdfgh', expected: { mode: 'single', intent: 'trash', needsTarot: false, spreadId: null, cardCount: 0 } },
  { id: 'trash-numbers', message: '121', expected: { mode: 'single', intent: 'trash', needsTarot: false, spreadId: null, cardCount: 0 } },
  { id: 'general-money', message: 'Tôi nên lưu ý gì về tiền bạc trong tháng này?', expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'timing-love', message: 'Ba tháng tới chuyện tình cảm của tôi có thay đổi gì?', expected: { mode: 'single', intent: 'timing_trajectory', needsTarot: true, spreadId: 'three-card', cardCount: 3 } },
  { id: 'two-choice-home', message: 'Tôi nên mua nhà ngay hay tiếp tục thuê để tích lũy?', expected: { mode: 'single', intent: 'two_choices', needsTarot: true, spreadId: 'two-options', cardCount: 5 } },
  { id: 'personality-strength', message: 'Tôi cần phát huy năng lực bẩm sinh nào?', expected: { mode: 'single', intent: 'core_personality', needsTarot: false, spreadId: null, cardCount: 0 } },
  { id: 'daily-travel', message: 'Cuối tuần này tôi nên đi đâu để nạp lại năng lượng?', expected: { mode: 'single', intent: 'daily_guidance', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'general-family', message: 'Tôi và gia đình đang hay hiểu lầm nhau, tôi nên làm gì?', expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 } },
  { id: 'trash-greeting', message: 'alo alo', expected: { mode: 'single', intent: 'trash', needsTarot: false, spreadId: null, cardCount: 0 } },
  { id: 'general-health', message: 'Dạo này tôi thấy căng thẳng, cần cân bằng cuộc sống ra sao?', expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 } },
];

const systemPrompt = `You classify Vietnamese user questions. Return exactly one JSON object with fields mode, intent, needsTarot, spreadId, cardCount, targetIndicators, thoughtProcess.\nIntent mapping: two choices -> two_choices/true/two-options/5; future or a period -> timing_trajectory/true/three-card/3; personality, mission, innate strengths -> core_personality/false/null/0; daily practical advice -> daily_guidance/true/single/1; gibberish, greetings without a question, or standalone digits -> trash/false/null/0; otherwise -> general/true/single/1.\nUse mode single. targetIndicators must be [] for trash and 1-5 strings otherwise. Return JSON only.`;

function extractContent(payload: unknown): { content: string; reasoningChunks: number; finishReason: string | null } {
  const body = String(payload);
  let content = '';
  let reasoningChunks = 0;
  let finishReason: string | null = null;
  for (const line of body.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const chunk = JSON.parse(data);
      const choice = chunk.choices?.[0];
      if (typeof choice?.delta?.content === 'string') content += choice.delta.content;
      if (choice?.delta?.reasoning || choice?.delta?.reasoning_content) reasoningChunks += 1;
      if (typeof choice?.finish_reason === 'string') finishReason = choice.finish_reason;
    } catch {
      // Preserve the benchmark result as a failed stream rather than guessing.
    }
  }
  return { content, reasoningChunks, finishReason };
}

function sameDecision(actual: Record<string, unknown>, expected: Expected): boolean {
  return actual.mode === expected.mode &&
    actual.intent === expected.intent &&
    actual.needsTarot === expected.needsTarot &&
    actual.spreadId === expected.spreadId &&
    actual.cardCount === expected.cardCount;
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is required. Run with --env-file=.env or set it in the shell.');

  const results: Array<Record<string, unknown>> = [];
  for (const item of cases) {
    const startedAt = performance.now();
    let status: number | null = null;
    let output = '';
    let reasoningChunks = 0;
    let finishReason: string | null = null;
    let parsed: Record<string, unknown> | null = null;
    let error: string | null = null;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Question: ${item.message}` }],
          stream: true,
          max_tokens: 250,
          temperature: 0.1,
          reasoning_effort: 'low',
          include_reasoning: false,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(20_000)
      });
      status = response.status;
      const streamText = await response.text();
      const extracted = extractContent(streamText);
      output = extracted.content;
      reasoningChunks = extracted.reasoningChunks;
      finishReason = extracted.finishReason;
      parsed = output ? JSON.parse(output) as Record<string, unknown> : null;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }

    results.push({
      id: item.id,
      expected: item.expected.intent,
      actual: parsed?.intent ?? null,
      decisionMatch: parsed ? sameDecision(parsed, item.expected) : false,
      jsonParsed: parsed !== null,
      status,
      latencyMs: Math.round(performance.now() - startedAt),
      contentChars: output.length,
      reasoningChunks,
      finishReason,
      error
    });
  }

  const successfulJson = results.filter((item) => item.jsonParsed).length;
  const matching = results.filter((item) => item.decisionMatch).length;
  console.log(JSON.stringify({
    model: 'openai/gpt-oss-20b',
    requestMode: 'streaming + JSON mode + include_reasoning=false + reasoning_effort=low',
    summary: { cases: cases.length, successfulJson, matching },
    results
  }, null, 2));
}

void main();
