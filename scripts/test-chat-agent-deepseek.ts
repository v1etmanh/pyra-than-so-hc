import { createStreamingResponse, type UserProviderConfig } from '../lib/ai/response-generator.ts';
import { buildAgentSystemPrompt, buildAgentUserPrompt } from '../lib/spiritual-agent/agent-prompts.ts';
import { normalizeChatReplyWithDiagnostics, CHAT_RESPONSE_BUDGETS, type ChatResponseComplexity } from '../lib/spiritual-agent/response-length.ts';
import { validateChatReplyQuality } from '../lib/spiritual-agent/response-quality.ts';

type CardFixture = {
  position: { nameVi: string };
  card: { nameVi: string; meaningUpright: string; meaningReversed: string };
  isReversed: boolean;
};

type PromptCase = {
  id: string;
  label: string;
  intent: string;
  complexity: ChatResponseComplexity;
  needsTarot: boolean;
  message: string;
  spreadContext?: string;
  cards?: CardFixture[];
  numerologyKnowledgeContext?: string;
  selectedIndicators?: Array<{ name: string; key: string; value: string | number }>;
};

const upright = (position: string, name: string, meaning: string): CardFixture => ({
  position: { nameVi: position },
  card: { nameVi: name, meaningUpright: meaning, meaningReversed: meaning },
  isReversed: false,
});

const reversed = (position: string, name: string, meaning: string): CardFixture => ({
  position: { nameVi: position },
  card: { nameVi: name, meaningUpright: meaning, meaningReversed: meaning },
  isReversed: true,
});

const PROMPT_CASES: PromptCase[] = [
  {
    id: 'two-choices',
    label: 'Học tiếp hay ngủ sớm',
    intent: 'two_choices',
    complexity: 'complex',
    needsTarot: true,
    message: 'Tối nay tôi nên học tiếp hay đi ngủ sớm? Tôi đang khá áp lực và thường cố hoàn thành mọi thứ trong một lần.',
    spreadContext: 'Trải bài Hai lựa chọn, 5 lá: Tình huống hiện tại; Tiến trình A; Kết quả A; Tiến trình B; Kết quả B.',
    cards: [
      upright('Tình huống hiện tại', '9 Kiếm', 'Lo âu và đầu óc quá tải.'),
      reversed('Tiến trình A — học tiếp', '7 Cốc', 'Khả năng tập trung đang yếu dù cố thu hẹp lựa chọn.'),
      reversed('Kết quả A — học tiếp', '4 Kiếm', 'Nghỉ không đủ và phục hồi kém.'),
      upright('Tiến trình B — ngủ sớm', 'Tiết Chế', 'Điều chỉnh nhịp và phục hồi.'),
      upright('Kết quả B — ngủ sớm', 'Mặt Trời', 'Sáng rõ, sinh lực và hiệu quả tốt hơn.'),
    ],
  },
  {
    id: 'relationship',
    label: 'Có nên nhắn người cũ',
    intent: 'relationship',
    complexity: 'complex',
    needsTarot: true,
    message: 'Người cũ vừa thả tim story sau ba tháng im lặng. Tôi có nên nhắn lại không?',
    spreadContext: 'Trải bài Mối quan hệ, 3 lá: Năng lượng của bạn; Động lực quan hệ; Điều nên làm.',
    cards: [
      upright('Năng lượng của bạn', '6 Cốc', 'Hoài niệm và mong quay về cảm giác quen thuộc.'),
      upright('Động lực quan hệ', 'Mặt Trăng', 'Tín hiệu chưa rõ và dễ phóng chiếu kỳ vọng.'),
      upright('Điều nên làm', 'Nữ Hoàng Kiếm', 'Rõ ràng, quan sát sự nhất quán và giữ ranh giới.'),
    ],
  },
  {
    id: 'timing',
    label: 'Công việc ba tháng tới',
    intent: 'timing_trajectory',
    complexity: 'complex',
    needsTarot: true,
    message: 'Ba tháng tới công việc của tôi có khá hơn không? Hiện tại công việc ổn định nhưng tôi có ít cơ hội chủ động.',
    spreadContext: 'Trải bài Diễn tiến, 5 lá: Gốc rễ; Hiện tại; Tháng gần nhất; Trở ngại; Kết quả xu hướng.',
    cards: [
      reversed('Gốc rễ', '8 Tiền', 'Nỗ lực lặp lại nhưng thiếu phản hồi và chuẩn nâng cấp.'),
      upright('Hiện tại', '2 Gậy', 'Đã nhìn thấy hướng mới nhưng chưa cam kết.'),
      upright('Tháng gần nhất', 'Xe Ngựa', 'Tiến triển khi tự chọn hướng và hành động có kỷ luật.'),
      upright('Trở ngại', '4 Tiền', 'Bám vào sự an toàn hiện tại.'),
      upright('Kết quả xu hướng', '3 Tiền', 'Hợp tác và được ghi nhận qua năng lực cụ thể.'),
    ],
  },
  {
    id: 'holistic',
    label: 'Điểm nghẽn công việc và tình cảm',
    intent: 'holistic_analysis',
    complexity: 'complex',
    needsTarot: true,
    message: 'Tôi thấy cả công việc lẫn tình cảm đều bế tắc. Vấn đề chính của tôi nằm ở đâu? Tôi thường ngại làm người khác thất vọng.',
    spreadContext: 'Các vị trí trọng tâm của trải bài Toàn cảnh: Hiện tại; Thách thức; Gốc rễ; Nỗi sợ; Kết quả.',
    cards: [
      upright('Hiện tại', '10 Gậy', 'Ôm quá nhiều trách nhiệm.'),
      upright('Thách thức', '2 Kiếm', 'Trì hoãn quyết định để tránh va chạm.'),
      reversed('Gốc rễ', '6 Tiền', 'Trao và nhận thiếu cân bằng.'),
      upright('Nỗi sợ', '5 Cốc', 'Sợ mất mối quan hệ hoặc tiếc lựa chọn cũ.'),
      upright('Kết quả', 'Công Lý', 'Tình hình rõ hơn khi đặt tiêu chuẩn và chịu trách nhiệm cho lựa chọn.'),
    ],
  },
  {
    id: 'personality',
    label: 'Điểm mạnh và cách tự làm khó mình',
    intent: 'core_personality',
    complexity: 'standard',
    needsTarot: false,
    message: 'Điểm mạnh cốt lõi và điểm tôi dễ tự làm khó mình là gì?',
    numerologyKnowledgeContext: [
      'Đường đời: học qua trải nghiệm, thích tự tìm cách hiểu sâu trước khi tin.',
      'Linh hồn: cần được tự chủ và muốn lựa chọn có ý nghĩa cá nhân.',
      'Tư duy lý trí: phân tích được nhiều lớp nhưng dễ kéo dài quyết định khi muốn chắc chắn tuyệt đối.',
    ].join('\n'),
    selectedIndicators: [
      { name: 'Đường đời', key: 'walksOfLife', value: 7 },
      { name: 'Linh hồn', key: 'soul', value: 1 },
      { name: 'Tư duy lý trí', key: 'rationalThinking', value: 7 },
    ],
  },
  {
    id: 'daily',
    label: 'Một ưu tiên cho hôm nay',
    intent: 'daily_guidance',
    complexity: 'standard',
    needsTarot: true,
    message: 'Hôm nay tôi nên tập trung vào điều gì nhất? Tôi có nhiều đầu việc và dễ đổi việc giữa chừng khi có yêu cầu mới.',
    spreadContext: 'Trải bài Một lá: Ưu tiên hôm nay.',
    cards: [upright('Ưu tiên hôm nay', '8 Tiền', 'Tập trung, rèn kỹ năng và hoàn thiện một việc bằng sự đều đặn.')],
  },
];

async function readStreamingText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
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
        const event = JSON.parse(data) as { content?: string; error?: string };
        if (event.error) throw new Error(event.error);
        if (event.content) fullText += event.content;
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }

  return fullText.trim();
}

async function testDeepSeekChatAgent() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is missing in .env');

  const model = process.env.DEEPSEEK_CHAT_AGENT_MODEL?.trim() || process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
  const baseUrl = (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, '');
  const config: UserProviderConfig = { type: 'DeepSeek', baseUrl, model, apiKeys: [apiKey] };
  const requestedIds = new Set(
    (process.env.CHAT_AGENT_TEST_CASE || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const cases = requestedIds.size
    ? PROMPT_CASES.filter((testCase) => requestedIds.has(testCase.id))
    : PROMPT_CASES;
  if (!cases.length) {
    throw new Error(`CHAT_AGENT_TEST_CASE did not match: ${PROMPT_CASES.map(({ id }) => id).join(', ')}`);
  }

  console.log(`[Test Chat Agent DeepSeek] ${cases.length} case(s), model ${model}, endpoint ${baseUrl}`);
  let failures = 0;

  for (const testCase of cases) {
    const systemPrompt = buildAgentSystemPrompt({
      intent: testCase.intent,
      isCouple: false,
      complexity: testCase.complexity,
      needsTarot: testCase.needsTarot,
    });
    const selectedKeys = new Set(testCase.selectedIndicators?.map(({ key }) => key) || []);
    const userPrompt = buildAgentUserPrompt({
      message: testCase.message,
      p1: { fullName: 'Người hỏi thử nghiệm', birthDate: '2000-01-01' },
      isCouple: false,
      spreadContext: testCase.spreadContext,
      cards: testCase.cards,
      numerologyKnowledgeContext: testCase.numerologyKnowledgeContext,
      selectedIndicators: testCase.selectedIndicators,
      retrievedKnowledgeKeys: selectedKeys,
    });
    const stream = createStreamingResponse(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      config,
      {
        maxTokens: Math.max(1200, CHAT_RESPONSE_BUDGETS[testCase.complexity].maxTokens),
        temperature: 0.3,
        reasoningEffort: 'low',
        includeReasoning: false,
      }
    );
    const rawText = await readStreamingText(stream);
    const normalized = normalizeChatReplyWithDiagnostics(rawText, '', testCase.complexity);
    const quality = normalized.usedAI
      ? validateChatReplyQuality(normalized.replyText, { intent: testCase.intent, userMessage: testCase.message })
      : { valid: false, reason: normalized.rejectionReason };

    console.log(`\n[${testCase.id}] ${testCase.label}`);
    console.log(rawText || '(empty response)');
    if (!normalized.usedAI || !quality.valid) {
      failures += 1;
      console.error(`❌ FAIL: ${quality.reason || 'unknown_quality_failure'}`);
    } else {
      console.log('✅ PASS');
    }
  }

  if (failures) throw new Error(`${failures}/${cases.length} DeepSeek prompt case(s) failed.`);
  console.log(`\n✅ All ${cases.length} DeepSeek chat-agent cases passed.`);
}

testDeepSeekChatAgent().catch((error) => {
  console.error('❌ DeepSeek Chat Agent test FAILED:', error);
  process.exitCode = 1;
});
