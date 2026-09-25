type ExpectedDecision = {
  mode: 'single';
  intent: 'two_choices' | 'timing_trajectory' | 'core_personality' | 'daily_guidance' | 'general';
  needsTarot: boolean;
  spreadId: 'single' | 'three-card' | 'two-options' | null;
  cardCount: 0 | 1 | 3 | 5;
};

type Case = { id: string; message: string; expected: ExpectedDecision };

const cases: Case[] = [
  {
    id: 'career-choice',
    message: 'Tôi nên nhận công việc mới hay ở lại công ty hiện tại?',
    expected: { mode: 'single', intent: 'two_choices', needsTarot: true, spreadId: 'two-options', cardCount: 5 }
  },
  {
    id: 'study-choice',
    message: 'Nên học lập trình hay thiết kế đồ họa trong năm nay?',
    expected: { mode: 'single', intent: 'two_choices', needsTarot: true, spreadId: 'two-options', cardCount: 5 }
  },
  {
    id: 'career-timing',
    message: 'Sáu tháng tới công việc của tôi sẽ diễn biến thế nào?',
    expected: { mode: 'single', intent: 'timing_trajectory', needsTarot: true, spreadId: 'three-card', cardCount: 3 }
  },
  {
    id: 'finance-timing',
    message: 'Năm 2027 tài chính của tôi có khởi sắc không?',
    expected: { mode: 'single', intent: 'timing_trajectory', needsTarot: true, spreadId: 'three-card', cardCount: 3 }
  },
  {
    id: 'personality',
    message: 'Điểm mạnh và điểm yếu cốt lõi trong tính cách của tôi là gì?',
    expected: { mode: 'single', intent: 'core_personality', needsTarot: false, spreadId: null, cardCount: 0 }
  },
  {
    id: 'mission',
    message: 'Sứ mệnh sống của tôi phù hợp với nghề nào?',
    expected: { mode: 'single', intent: 'core_personality', needsTarot: false, spreadId: null, cardCount: 0 }
  },
  {
    id: 'daily-food',
    message: 'Hôm nay tôi nên ăn gì để thấy dễ chịu hơn?',
    expected: { mode: 'single', intent: 'daily_guidance', needsTarot: true, spreadId: 'single', cardCount: 1 }
  },
  {
    id: 'daily-clothes',
    message: 'Ngày mai nên mặc màu gì khi đi gặp khách hàng?',
    expected: { mode: 'single', intent: 'daily_guidance', needsTarot: true, spreadId: 'single', cardCount: 1 }
  },
  {
    id: 'general-love',
    message: 'Tình cảm hiện tại của tôi cần lưu ý điều gì?',
    expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 }
  },
  {
    id: 'general-family',
    message: 'Tôi và gia đình đang hay hiểu lầm nhau, tôi nên làm gì?',
    expected: { mode: 'single', intent: 'general', needsTarot: true, spreadId: 'single', cardCount: 1 }
  }
];

function matches(actual: Record<string, unknown>, expected: ExpectedDecision): boolean {
  return actual.mode === expected.mode &&
    actual.intent === expected.intent &&
    actual.needsTarot === expected.needsTarot &&
    actual.spreadId === expected.spreadId &&
    actual.cardCount === expected.cardCount;
}

async function main() {
  const baseUrl = process.env.CLASSIFICATION_TEST_URL || 'http://localhost:3200';
  const delayMs = Number(process.env.CLASSIFICATION_TEST_DELAY_MS || 0);
  const offset = Number(process.env.CLASSIFICATION_TEST_OFFSET || 0);
  const limit = Number(process.env.CLASSIFICATION_TEST_LIMIT || cases.length);
  const selectedCases = cases.slice(offset, offset + limit);
  const results = [];

  for (const [index, item] of selectedCases.entries()) {
    if (index > 0 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const startedAt = performance.now();
    try {
      const response = await fetch(`${baseUrl}/api/chat/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: item.message, profiles: [{ fullName: 'Người kiểm thử' }] }),
        signal: AbortSignal.timeout(30_000)
      });
      const body = await response.json() as { ok?: boolean; data?: Record<string, unknown>; error?: string };
      const actual = body.data || {};
      results.push({
        id: item.id,
        expected: item.expected.intent,
        actual: actual.intent ?? null,
        fullMatch: response.ok && body.ok === true && matches(actual, item.expected),
        status: response.status,
        routeError: body.error ?? null,
        latencyMs: Math.round(performance.now() - startedAt)
      });
    } catch (error) {
      results.push({
        id: item.id,
        expected: item.expected.intent,
        actual: null,
        fullMatch: false,
        latencyMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const passed = results.filter((item) => item.fullMatch).length;
  console.log(JSON.stringify({ total: selectedCases.length, passed, failed: selectedCases.length - passed, results }, null, 2));
}

void main();
