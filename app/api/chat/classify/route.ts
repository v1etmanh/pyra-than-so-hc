import { NextRequest, NextResponse } from 'next/server';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { getProviderCascade } from '@/lib/ai/provider-cascade';
import type { UserProviderConfig } from '@/lib/ai/types';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';
import { getTarotSpread, tarotSpreads } from '@/lib/tarot/spreads';

const chatIndicatorKeys = [
  'walksOfLife', 'mission', 'soul', 'personality', 'dateOfBirth', 'mature', 'balance',
  'rationalThinking', 'subconsciousPower', 'passion', 'attitude', 'karmicDebts', 'missingNumbers',
  'bridgeLifeMission', 'bridgeSoulPersonality', 'bridgeMaturityPassion', 'yearIndividual',
  'monthIndividual', 'dayIndividual', 'way', 'challenges', 'arrows', 'nameChart', 'birthChart'
] as const;

const indicatorDescriptions: Record<typeof chatIndicatorKeys[number], string> = {
  walksOfLife: 'bản chất và bài học cốt lõi', mission: 'năng lực, nghề nghiệp và đóng góp', soul: 'nhu cầu nội tâm và cảm xúc',
  personality: 'hình ảnh xã hội và cách thể hiện', dateOfBirth: 'tài năng thiên phú', mature: 'sự trưởng thành và định hướng dài hạn',
  balance: 'cách giữ cân bằng khi gặp áp lực', rationalThinking: 'cách phân tích và ra quyết định', subconsciousPower: 'nguồn lực nội tại',
  passion: 'tài năng/động lực nổi trội', attitude: 'phản ứng ban đầu trước hoàn cảnh', karmicDebts: 'bài học nợ nghiệp',
  missingNumbers: 'bài học từ những năng lượng còn thiếu', bridgeLifeMission: 'kết nối bản chất với sứ mệnh',
  bridgeSoulPersonality: 'kết nối nhu cầu nội tâm với biểu hiện', bridgeMaturityPassion: 'kết nối trưởng thành với đam mê',
  yearIndividual: 'chủ đề năm hiện tại', monthIndividual: 'nhịp năng lượng tháng', dayIndividual: 'nhịp năng lượng ngày',
  way: 'các đỉnh cao trong chu kỳ đời người', challenges: 'các thử thách trong chu kỳ đời người',
  arrows: 'mẫu năng lượng trong biểu đồ ngày sinh', nameChart: 'tần suất chữ trong biểu đồ tên', birthChart: 'mẫu số trong biểu đồ ngày sinh'
};

const intentSpreadDefaults: Record<string, string | null> = {
  two_choices: 'two-options',
  timing_trajectory: 'three-card',
  relationship: 'relationship',
  holistic_analysis: 'celtic-cross',
  core_personality: null,
  daily_guidance: 'single',
  where_to_go: 'single',
  general: 'single',
  trash: null,
  love_match: null
};

const fallbackIndicators: Record<string, string[]> = {
  two_choices: ['rationalThinking', 'attitude', 'yearIndividual'],
  timing_trajectory: ['yearIndividual', 'way', 'challenges'],
  relationship: ['soul', 'personality', 'attitude'],
  holistic_analysis: ['walksOfLife', 'mission', 'mature', 'balance', 'challenges'],
  core_personality: ['walksOfLife', 'mission', 'soul', 'personality', 'dateOfBirth'],
  daily_guidance: ['dateOfBirth', 'dayIndividual', 'attitude'],
  where_to_go: ['dateOfBirth', 'attitude'],
  general: ['walksOfLife', 'yearIndividual']
};

function spreadCardCount(spreadId: string | null): number {
  return spreadId ? getTarotSpread(spreadId)?.positions.length ?? 0 : 0;
}

function normalizeDecision(value: Record<string, any>): AgentDecision {
  const intent = Object.hasOwn(intentSpreadDefaults, value.intent) ? value.intent : 'general';
  const defaultSpread = intentSpreadDefaults[intent];
  let spreadId = defaultSpread as AgentDecision['spreadId'];
  if (intent === 'timing_trajectory') {
    spreadId = value.spreadId === 'timeline' ? 'timeline' : 'three-card';
  } else if (intent === 'trash' || intent === 'love_match' || intent === 'core_personality') {
    spreadId = null;
  }
  const needsTarot = Boolean(spreadId);
  const targetIndicators = Array.isArray(value.targetIndicators)
    ? Array.from(new Set(value.targetIndicators.filter((key: unknown): key is string =>
      typeof key === 'string' && chatIndicatorKeys.includes(key as typeof chatIndicatorKeys[number])
    ))).slice(0, 5)
    : [];
  return {
    mode: value.mode === 'compatibility' ? 'compatibility' : 'single',
    intent,
    needsTarot,
    spreadId,
    cardCount: spreadCardCount(spreadId),
    targetIndicators: intent === 'trash' ? [] : targetIndicators,
    thoughtProcess: typeof value.thoughtProcess === 'string' ? value.thoughtProcess.slice(0, 500) : ''
  };
}

function classifyFallback(message: string) {
  const hasAny = (...terms: string[]) => terms.some((term) => message.includes(term));
  const hasChoice = hasAny(' hay ', 'hay ', ' hay?', ' hoặc ', 'hoặc ', ' vs ', 'versus', 'giữa ', 'phân vân', 'lựa chọn a', 'lựa chọn b');
  if (hasChoice) return 'two_choices';
  if (hasAny('đi đâu', 'chỗ nào', 'nơi nào', 'quán nào', 'cà phê nào', 'cafe nào', 'địa điểm', 'đi chơi', 'hẹn hò ở đâu', 'dạo ở đâu', 'tham quan')) return 'where_to_go';
  if (hasAny('crush', 'người yêu', 'tình cảm', 'tình duyên', 'mối quan hệ', 'yêu đương', 'thích một người')) return 'relationship';
  if (hasAny('toàn cảnh', 'mọi khía cạnh', 'bế tắc', 'khủng hoảng', 'không lối thoát', 'phân tích tổng thể')) return 'holistic_analysis';
  if (hasAny('gốc rễ', 'nguyên nhân sâu', 'hành động nào', 'diễn biến', 'tiến trình', 'thời gian tới', 'tương lai', 'tháng tới', 'năm nay', 'vận hạn')) return 'timing_trajectory';
  if (hasAny('tính cách', 'sứ mệnh', 'điểm mạnh', 'điểm yếu', 'bản thân tôi')) return 'core_personality';
  if (hasAny('hôm nay', 'ngày mai', 'mặc gì', 'ăn gì')) return 'daily_guidance';
  return 'general';
}

export interface AgentDecision {
  mode: 'single' | 'compatibility';
  intent: 'two_choices' | 'timing_trajectory' | 'relationship' | 'holistic_analysis' | 'core_personality' | 'daily_guidance' | 'where_to_go' | 'love_match' | 'trash' | 'general';
  needsTarot: boolean;
  spreadId: 'single' | 'three-card' | 'two-options' | 'relationship' | 'timeline' | 'celtic-cross' | null;
  cardCount: number;
  targetIndicators: string[];
  thoughtProcess: string;
  /** Present only when the app should ask the user to clarify instead of reading cards. */
  replyText?: string;
}

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

/**
 * Classification is deliberately pinned to the model evaluated for this task.
 * The main cascade remains available only if Groq credentials are absent.
 */
function classificationProvider(): UserProviderConfig | undefined {
  const groq = getProviderCascade().find((provider) => provider.name === 'Groq');
  if (!groq) return undefined;

  return {
    type: 'Groq',
    baseUrl: groq.baseUrl,
    apiKeys: groq.apiKeys,
    model: 'openai/gpt-oss-20b'
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  let messageForFallback = '';
  try {
    const body = await request.json();
    const { message, profiles } = body;
    messageForFallback = typeof message === 'string' ? message.toLowerCase() : '';

    const isCouple = profiles?.length >= 2;
    const p1 = profiles?.[0]?.fullName || 'Người hỏi';
    const p2 = profiles?.[1]?.fullName;

    // 0. BỘ LỌC TỐC HÀNH: Phát hiện ngay câu hỏi rác / vô nghĩa / gõ phím ngẫu nhiên (<0.1ms, 0 token)
    const trashCheck = isTrashOrMeaninglessPrompt(message);
    if (trashCheck.isTrash) {
      const trashDecision: AgentDecision = {
        mode: 'single',
        intent: 'trash',
        needsTarot: false,
        spreadId: null,
        cardCount: 0,
        targetIndicators: [],
        thoughtProcess: `Phát hiện câu hỏi không có chủ đề hoặc mục đích rõ ràng (${trashCheck.reason}). Cần hướng dẫn người dùng đặt câu hỏi cụ thể.`,
        replyText: TRASH_PROMPT_GUIDANCE
      };
      return NextResponse.json({ ok: true, data: trashDecision }, { headers: corsHeaders });
    }

    // 1. Trường hợp 2 hồ sơ: TỰ ĐỘNG KÍCH HOẠT THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ (KHÔNG CẦN TAROT)
    if (isCouple && p2) {
      const coupleDecision = {
        mode: 'compatibility',
        intent: 'love_match',
        needsTarot: false,
        spreadId: null,
        cardCount: 0,
        targetIndicators: ['walksOfLife', 'soul', 'tuvi_bazi'],
        thoughtProcess: `Tiểu Linh Miêu kết nối lá số Tử Vi Đẩu Số & Bát Tự Tứ Trụ của ${p1} & ${p2}: Luận giải chuyên sâu Thiên Can, Địa Chi, Cung Phu Thê, Ngũ Hành Nạp Âm và Quái Mệnh Bát Trạch (Thuần Tử Vi Bát Tự toàn diện, không cần rút bài Tarot).`
      };

      return NextResponse.json({ ok: true, data: coupleDecision }, { headers: corsHeaders });
    }

    // 2. Trường hợp 1 hồ sơ: DÙNG AI LLM TỰ ĐỘNG PHÂN TÍCH VÀ PHÂN LOẠI
    const systemPrompt = `Bạn là bộ não phân tích ý định (Autonomous AI Agent Decision Engine) của hệ thống tâm linh NUMELYRA.
Nhiệm vụ: Đọc kỹ câu hỏi của người dùng, TỰ ĐỘNG QUYẾT ĐỊNH chiến lược lấy bài Tarot VÀ LỰA CHỌN TỐI ĐA 5 CHỈ SỐ THẦN SỐ HỌC phù hợp nhất để backend trích xuất dữ liệu bản mệnh.

DANH MỤC Ý ĐỊNH (intent):
1. "two_choices": Phân vân giữa đúng hai lựa chọn cụ thể -> spreadId "two-options".
2. "relationship": Hỏi tình cảm, người yêu, crush hoặc một mối quan hệ khi chỉ có một hồ sơ -> spreadId "relationship". Không khẳng định biết suy nghĩ riêng tư của đối phương.
3. "timing_trajectory": Hỏi diễn biến hoặc thời gian tới. Dùng "timeline" nếu cần đào sâu gốc rễ, ảnh hưởng quá khứ, hiện tại, xu hướng gần và hành động; dùng "three-card" cho câu hỏi ngắn về quá khứ-hiện tại-tương lai.
4. "holistic_analysis": Yêu cầu rõ ràng về phân tích toàn cảnh, nhiều khía cạnh, tình huống phức tạp/bế tắc kéo dài -> spreadId "celtic-cross". Không dùng chỉ vì câu hỏi có vẻ nghiêm trọng; khủng hoảng an toàn/tâm thần cần hướng dẫn hỗ trợ phù hợp.
5. "core_personality": Hỏi tính cách cốt lõi, sứ mệnh, điểm mạnh yếu -> không Tarot.
6. "where_to_go": Tìm địa điểm thực tế -> spreadId "single"; Tarot chỉ chọn vibe sau các điều kiện thực tế.
7. "daily_guidance": Lời khuyên tức thời trong ngày -> spreadId "single".
8. "trash": Câu hỏi vô nghĩa/spam -> không Tarot.
9. "general": Chủ đề đơn, rõ ràng không khớp nhóm khác -> spreadId "single".

DANH MỤC SPREAD VÀ SỐ VỊ TRÍ CHUẨN (giữ nguyên mô tả/vị trí trong Tarot):
${tarotSpreads.map((spread) => `- ${spread.id}: ${spread.positions.length} lá`).join('\n')}
Với câu hỏi so sánh, bắt buộc chọn "two-options"; với quan hệ một hồ sơ, chọn "relationship"; với câu hỏi toàn cảnh, chọn "celtic-cross".

CATALOG CÁC CHỈ SỐ THẦN SỐ HỌC ĐỂ CHỌN CHO targetIndicators:
${chatIndicatorKeys.map((key) => `- "${key}": ${indicatorDescriptions[key]}`).join('\n')}

QUY TẮC BẮT BUỘC VỀ targetIndicators:
- Bạn phải TỰ ĐỘNG CHỌN từ 1 đến TỐI ĐA 5 chỉ số (1 <= targetIndicators.length <= 5) phù hợp nhất với bản chất câu hỏi của người dùng (nếu intent là "trash" thì để mảng rỗng []).
- BẮT ĐẦU NGAY LẬP TỨC BẰNG KÝ TỰ { VÀ KẾT THÚC BẰNG }. TUYỆT ĐỐI KHÔNG SUY NGHĨ, KHÔNG DÙNG THẺ SUY NGHĨ HAY GIẢI THÍCH TRƯỚC KHI XUẤT JSON.
Chỉ trả về DUY NHẤT 1 chuỗi JSON hợp lệ (không kèm markdown format, không có bất kỳ văn bản nào ngoài JSON) theo mẫu sau:
{
  "mode": "single",
  "intent": "two_choices" | "timing_trajectory" | "relationship" | "holistic_analysis" | "core_personality" | "daily_guidance" | "where_to_go" | "trash" | "general",
  "needsTarot": true | false,
  "spreadId": "single" | "three-card" | "two-options" | "relationship" | "timeline" | "celtic-cross" | null,
  "cardCount": ${tarotSpreads.map((spread) => spread.positions.length).filter((value, index, all) => all.indexOf(value) === index).sort((a, b) => a - b).join(' | ')},
  "targetIndicators": ["chỉ_số_1", "chỉ_số_2", "chỉ_số_tối_đa_5"],
  "thoughtProcess": "1 câu tiếng Việt ngắn gọn giải thích lý do Tiểu Linh Miêu chọn trải bài và các chỉ số này để hiển thị cho người dùng xem."
}`;

    const userPrompt = `Câu hỏi của người dùng: "${message}"\nHồ sơ người hỏi: ${p1}`;

    const groqProvider = classificationProvider();
    if (groqProvider) {
      console.info('[API /api/chat/classify] Primary model: Groq/openai/gpt-oss-20b');
    }

    const stream = createStreamingResponse(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      groqProvider,
      {
        maxTokens: 250,
        temperature: 0.1,
        reasoningEffort: 'low',
        responseFormat: 'json_object',
        includeReasoning: false
      }
    );

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let rawJson = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const event = JSON.parse(data) as { content?: unknown };
            if (typeof event.content === 'string') {
              rawJson += event.content;
            }
          } catch {
            // Ignore non-JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Trích xuất JSON hợp lệ từ phản hồi của AI
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No JSON object found in AI response. RAW: "${rawJson}"`);
    }
    const parsedDecision = JSON.parse(jsonMatch[0]);

    // LLM vẫn có thể nhận ra một câu không có chủ đề. Chuẩn hoá quyết định đó
    // để mobile có thể trả lời ngay, không tính chỉ số hay rút bài.
    if (parsedDecision.intent === 'trash') {
      parsedDecision.mode = 'single';
      parsedDecision.needsTarot = false;
      parsedDecision.spreadId = null;
      parsedDecision.cardCount = 0;
      parsedDecision.targetIndicators = [];
      parsedDecision.replyText = TRASH_PROMPT_GUIDANCE;
    }
    const normalized = normalizeDecision(parsedDecision);
    if (normalized.intent === 'trash') normalized.replyText = TRASH_PROMPT_GUIDANCE;

    return NextResponse.json({
      ok: true,
      data: normalized
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.warn('[API /api/chat/classify] Fallback activated:', error.message);
    
    // Fallback follows the same intent-to-spread mapping as normal classification.
    const intent = classifyFallback(messageForFallback);
    const needsDeepTimeline = ['gốc rễ', 'nguyên nhân sâu', 'hành động nào', 'đào sâu'].some((term) => messageForFallback.includes(term));
    const spreadId = intent === 'timing_trajectory' && needsDeepTimeline ? 'timeline' : intentSpreadDefaults[intent];
    const fallbackDecision: AgentDecision = {
      mode: 'single',
      intent: intent as AgentDecision['intent'],
      needsTarot: Boolean(spreadId),
      spreadId: spreadId as AgentDecision['spreadId'],
      cardCount: spreadCardCount(spreadId),
      targetIndicators: fallbackIndicators[intent] || [],
      thoughtProcess: intent === 'where_to_go'
        ? 'Tiểu Linh Miêu sẽ lọc địa điểm theo nhu cầu thực tế trước, rồi rút một lá Tarot để chọn vibe phù hợp.'
        : 'Tiểu Linh Miêu chọn trải bài phù hợp với chủ đề câu hỏi.'
    };

    return NextResponse.json({
      ok: true,
      data: fallbackDecision
    }, { headers: corsHeaders });
  }
}
