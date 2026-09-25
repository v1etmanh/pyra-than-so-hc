import { NumerologyCalculator } from '../mobile_app/src/services/numerology24Service.ts';

type Decision = {
  mode: string;
  intent: string;
  needsTarot: boolean;
  spreadId: string | null;
  cardCount: number;
  targetIndicators: string[];
};

const questions = [
  'Tôi nên nhận công việc mới hay ở lại công ty hiện tại?',
  'Nên học lập trình hay thiết kế đồ họa trong năm nay?',
  'Sáu tháng tới công việc của tôi sẽ diễn biến thế nào?',
  'Năm 2027 tài chính của tôi có khởi sắc không?',
  'Điểm mạnh và điểm yếu cốt lõi trong tính cách của tôi là gì?',
  'Sứ mệnh sống của tôi phù hợp với nghề nào?',
  'Hôm nay tôi nên ăn gì để thấy dễ chịu hơn?',
  'Ngày mai nên mặc màu gì khi đi gặp khách hàng?',
  'Tình cảm hiện tại của tôi cần lưu ý điều gì?',
  'Tôi và gia đình đang hay hiểu lầm nhau, tôi nên làm gì?'
];

const profile = { fullName: 'Người kiểm thử', birthDate: '1995-07-15', gender: 'female' };

const cards = [
  { nameVi: 'Ngôi Sao', meaningUpright: 'Hy vọng, chữa lành và một hướng đi sáng hơn.' },
  { nameVi: 'Công Lý', meaningUpright: 'Cần minh bạch, cân nhắc dữ kiện và chịu trách nhiệm.' },
  { nameVi: 'Tiết Chế', meaningUpright: 'Cân bằng, điều độ và kiên nhẫn điều hòa khác biệt.' },
  { nameVi: 'Nhà Ảo Thuật', meaningUpright: 'Chủ động dùng kỹ năng và nguồn lực đang có.' },
  { nameVi: 'Ẩn Sĩ', meaningUpright: 'Lùi lại quan sát để tìm hướng đi có chủ đích.' }
];

function tarotCards(decision: Decision) {
  if (!decision.needsTarot) return [];
  const count = Math.max(1, Math.min(cards.length, decision.cardCount || 1));
  return cards.slice(0, count).map((card, index) => ({
    card: { ...card, meaningReversed: card.meaningUpright },
    isReversed: false,
    position: { id: `test-${index + 1}`, nameVi: `Vị trí ${index + 1}` }
  }));
}

async function post<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(40_000)
  });
  const payload = await response.json() as T;
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

async function main() {
  const baseUrl = process.env.CHAT_E2E_TEST_URL || 'http://localhost:3200';
  const offset = Number(process.env.CHAT_E2E_TEST_OFFSET || 0);
  const limit = Number(process.env.CHAT_E2E_TEST_LIMIT || questions.length);
  const selectedQuestions = questions.slice(offset, offset + limit);
  const results: Array<Record<string, unknown>> = [];

  for (const question of selectedQuestions) {
    const startedAt = performance.now();
    try {
      const classified = await post<{ ok: boolean; data?: Decision }>(baseUrl, '/api/chat/classify', {
        message: question,
        profiles: [profile]
      });
      if (!classified.ok || !classified.data) throw new Error('Classification response has no decision.');
      const indicators = new NumerologyCalculator(profile.fullName, profile.birthDate)
        .getRequestedIndicators(classified.data.targetIndicators || []);

      const answered = await post<{ ok: boolean; data?: { replyText?: string } }>(baseUrl, '/api/chat/agent', {
        message: question,
        decision: classified.data,
        profiles: [profile],
        indicators: { profile1: indicators, profile2: [] },
        tarotCards: tarotCards(classified.data)
      });
      const answer = answered.data?.replyText?.trim() || '';
      results.push({
        question,
        intent: classified.data.intent,
        answer,
        answerChars: answer.length,
        latencyMs: Math.round(performance.now() - startedAt),
        ok: answered.ok && answer.length > 0
      });
    } catch (error) {
      results.push({
        question,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Math.round(performance.now() - startedAt)
      });
    }
  }

  console.log(JSON.stringify({
    total: selectedQuestions.length,
    answered: results.filter((item) => item.ok).length,
    results
  }, null, 2));
}

void main();
