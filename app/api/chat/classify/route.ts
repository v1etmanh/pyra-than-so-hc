import { NextRequest, NextResponse } from 'next/server';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';

export interface AgentDecision {
  mode: 'single' | 'compatibility';
  intent: 'two_choices' | 'timing_trajectory' | 'core_personality' | 'daily_guidance' | 'love_match' | 'trash' | 'general';
  needsTarot: boolean;
  spreadId: 'single' | 'three-card' | 'two-options' | 'relationship' | null;
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, profiles } = body;

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
1. "two_choices": Phân vân giữa 2 ngã rẽ A vs B (ví dụ: "nên học IT hay đồ họa", "chọn A hay B", "nên mua hay thuê",...).
   -> needsTarot: true, spreadId: "two-options", cardCount: 5

2. "timing_trajectory": Hỏi về tiến trình thời gian, tương lai, vận hạn (ví dụ: "6 tháng tới thế nào", "tương lai sự nghiệp", "năm nay ra sao",...).
   -> needsTarot: true, spreadId: "three-card", cardCount: 3

3. "core_personality": Hỏi về bản thân, tính cách cốt lõi, sứ mệnh, điểm mạnh yếu (ví dụ: "tính cách tôi thế nào", "sứ mệnh của tôi",...).
   -> needsTarot: false, spreadId: null, cardCount: 0

4. "daily_guidance": Hỏi sinh hoạt đời thường, lời khuyên tức thời trong ngày (ví dụ: "tôi nên ăn gì", "mai mặc màu gì", "hôm nay làm gì", "đi đâu",...).
   -> needsTarot: true, spreadId: "single", cardCount: 1

5. "trash": Câu hỏi vô nghĩa, gõ phím ngẫu nhiên, spam, không có chủ đề hoặc mục đích rõ ràng (ví dụ: "a,.", "ta", "121", "asdfgh", "không biết hỏi gì", "thử máy", "alo alo",...).
   -> needsTarot: false, spreadId: null, cardCount: 0, targetIndicators: []

6. "general": Các câu hỏi khác có chủ đề rõ ràng nhưng không thuộc các nhóm trên.
   -> needsTarot: true, spreadId: "single", cardCount: 1

CATALOG CÁC CHỈ SỐ THẦN SỐ HỌC ĐỂ CHỌN CHO targetIndicators:
- "walksOfLife": Số Đường Đời (con đường tiến hóa cốt lõi, bản chất tính cách gốc, bài học lớn cả đời)
- "mission": Số Sứ Mệnh (năng lực bẩm sinh, nghề nghiệp, thành tựu, vai trò cống hiến cho xã hội)
- "soul": Số Linh Hồn (khao khát nội tâm sâu kín, nhu cầu cảm xúc, tình duyên, sự thỏa mãn tinh thần)
- "personality": Số Nhân Cách (phong thái bên ngoài, cách người khác nhìn nhận, ngoại giao xã hội)
- "dateOfBirth": Số Ngày Sinh (tài năng thiên phú, thói quen thường nhật, ăn uống, chọn màu sắc, phản xạ tự nhiên)
- "rationalThinking": Số Tư Duy Lý Trí (cách xử lý dữ kiện logic, chọn lựa ngã rẽ A vs B, giải quyết bế tắc)
- "yearIndividual": Năm Cá Nhân (năng lượng và vận hạn năm hiện tại trong chu kỳ 9 năm, thời điểm hành động)
- "mature": Số Trưởng Thành (sức mạnh nở rộ sau tuổi 35-40, hậu vận, sự nghiệp lâu dài)
- "attitude": Số Thái Độ (phản ứng đầu tiên trước thử thách, tâm thế khi đối diện cơ hội hay biến cố)

QUY TẮC BẮT BUỘC VỀ targetIndicators:
- Bạn phải TỰ ĐỘNG CHỌN từ 1 đến TỐI ĐA 5 chỉ số (1 <= targetIndicators.length <= 5) phù hợp nhất với bản chất câu hỏi của người dùng (nếu intent là "trash" thì để mảng rỗng []).
- BẮT ĐẦU NGAY LẬP TỨC BẰNG KÝ TỰ { VÀ KẾT THÚC BẰNG }. TUYỆT ĐỐI KHÔNG SUY NGHĨ, KHÔNG DÙNG THẺ SUY NGHĨ HAY GIẢI THÍCH TRƯỚC KHI XUẤT JSON.
Chỉ trả về DUY NHẤT 1 chuỗi JSON hợp lệ (không kèm markdown format, không có bất kỳ văn bản nào ngoài JSON) theo mẫu sau:
{
  "mode": "single",
  "intent": "two_choices" | "timing_trajectory" | "core_personality" | "daily_guidance" | "trash" | "general",
  "needsTarot": true | false,
  "spreadId": "two-options" | "three-card" | "single" | null,
  "cardCount": 0 | 1 | 3 | 5,
  "targetIndicators": ["chỉ_số_1", "chỉ_số_2", "chỉ_số_tối_đa_5"],
  "thoughtProcess": "1 câu tiếng Việt ngắn gọn giải thích lý do Tiểu Linh Miêu chọn trải bài và các chỉ số này để hiển thị cho người dùng xem."
}`;

    const userPrompt = `Câu hỏi của người dùng: "${message}"\nHồ sơ người hỏi: ${p1}`;

    const stream = createStreamingResponse(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      undefined,
      { maxTokens: 250, temperature: 0.1 }
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
    // Giới hạn targetIndicators tối đa 5 phần tử cho các câu hỏi hợp lệ.
    else if (Array.isArray(parsedDecision.targetIndicators)) {
      parsedDecision.targetIndicators = parsedDecision.targetIndicators
        .filter((k: any) => typeof k === 'string' && k.length > 0)
        .slice(0, 5);
      if (parsedDecision.targetIndicators.length === 0) {
        parsedDecision.targetIndicators = ['walksOfLife', 'yearIndividual'];
      }
    } else {
      parsedDecision.targetIndicators = ['walksOfLife', 'yearIndividual'];
    }

    return NextResponse.json({
      ok: true,
      data: parsedDecision
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.warn('[API /api/chat/classify] Fallback activated:', error.message);
    
    // Fallback thông minh nếu AI JSON parse thất bại
    const lower = (request.url || '').toLowerCase();
    const fallbackDecision = {
      mode: 'single',
      intent: 'general',
      needsTarot: true,
      spreadId: 'single',
      cardCount: 1,
      targetIndicators: ['walksOfLife', 'yearIndividual'],
      thoughtProcess: 'Tiểu Linh Miêu kết nối năng lượng trực giác và rút 1 lá Tarot dẫn lối cho câu hỏi của bạn.'
    };

    return NextResponse.json({
      ok: true,
      data: fallbackDecision
    }, { headers: corsHeaders });
  }
}
