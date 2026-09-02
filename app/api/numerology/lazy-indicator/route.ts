import { NextRequest } from 'next/server';
import { getRequestAccess } from '@/lib/billing/access';
import { recordAiUsage } from '@/lib/usage/usage-meter';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import { getKnowledgeByIndicator } from '@/lib/supabaseClient';
import { createStreamingResponse } from '@/app/api/chat/lib/response-generator';
import {
  buildIndicatorKnowledgeFallback,
  createIndicatorFallbackStream
} from './fallback';
import { lazyIndicatorRequestSchema, type LazyIndicatorRequest } from '@/lib/security/schemas';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = lazyIndicatorRequestSchema.parse(await readJsonBody<LazyIndicatorRequest>(req, 128 * 1024));
    const {
      fullName,
      birthDay,
      indicatorKey,
      indicatorName,
      indicatorValue,
      personalityProfile,
      providerConfig,
      language = 'Vietnamese'
    } = body;

    if (!indicatorKey || indicatorValue === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing indicatorKey or indicatorValue' }),
        { status: 400 }
      );
    }

    // 1. Direct Knowledge Retrieval from Supabase PostgreSQL (O(1) search < 50ms)
    console.log(`[Direct Lookup] Fetching Supabase knowledge for ${indicatorKey}=${indicatorValue}...`);
    const knowledgeRecord = await getKnowledgeByIndicator(indicatorKey, indicatorValue);

    const fallbackContent = buildIndicatorKnowledgeFallback({
      fullName,
      indicatorName,
      indicatorValue,
      language,
      knowledgeRecord
    });

    const access = await getRequestAccess(req, 'text');
    if (access instanceof Response) {
      // A knowledge reading does not consume AI tokens. Keep the experience
      // useful when quota/rate controls reject the AI request, but still keep
      // malformed requests and other errors on their original error path.
      if (fallbackContent && (access.status === 429 || access.status === 503)) {
        const emptyAiStream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.close();
          }
        });
        const fallbackStream = createIndicatorFallbackStream(emptyAiStream, fallbackContent);
        return new Response(fallbackStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Numina-Source': 'knowledge',
            'X-Numina-Fallback-Reason': access.status === 429 ? 'quota' : 'usage-control'
          }
        });
      }
      return access;
    }

    const contextText = knowledgeRecord
      ? `### TƯ LIỆU SÁCH GỐC TRA CỨU TỪ SUPABASE (${knowledgeRecord.title})\n${knowledgeRecord.content}`
      : `Chỉ số: ${indicatorName} (${indicatorKey}) mang giá trị ${indicatorValue}.`;

    // 2. Build Personality Persona Directive
    let personalitySection = '';
    if (personalityProfile && personalityProfile.scores) {
      personalitySection = `
HỒ SƠ TÂM LÝ & TÍNH CÁCH ĐƯƠNG SỐ (TỪ BÀI KHẢO SÁT BIG FIVE 20 CÂU):
- Các nét tính cách chủ đạo: ${personalityProfile.dominantTraits?.join(', ') || 'Cân bằng'}
- Phong cách tiếp nhận: ${personalityProfile.communicationStyle || 'Rõ ràng, thấu đáo'}
- Chỉ thị văn phong bắt buộc cho AI:
${personalityProfile.toneDirective}
`;
    }

    // 3. Build Expert System Prompt
    const languageDirective = language === 'English'
      ? 'IMPORTANT: Respond entirely in English. Translate the section headings and explanation naturally into English while preserving all numbers and markdown formatting.'
      : 'QUAN TRỌNG: Bắt buộc trả lời hoàn toàn bằng tiếng Việt.';

    const systemPrompt = `Bạn là Chuyên gia Cao cấp Thần số học Pythagoras (theo trường phái TS. David A. Phillips và Hans Decoz).
Nhiệm vụ của bạn là luận giải CHI TIẾT & CHUYÊN SÂU khi đương số xem xét chỉ số sau:
- Họ tên đương số: ${fullName || 'Đương số'}
- Ngày sinh: ${birthDay}
- Chỉ số: ${indicatorName} (${indicatorKey})
- Con số / Giá trị: ${indicatorValue}

${contextText}

${personalitySection}

HƯỚNG DẪN CẤU TRÚC BÀI LUẬN GIẢI CHUYÊN SÂU (MARKDOWN):
### 🌟 LUẬN GIẢI: ${indicatorName.toUpperCase()} ${indicatorValue}

#### I. BẢN CHẤT CỐT LÕI & NĂNG LƯỢNG CON SỐ ${indicatorValue}
- Phân tích ý nghĩa nguyên bản dựa trên tài liệu sách gốc được tra cứu ở trên.

#### II. TÁC ĐỘNG ĐẾN ĐỜI SỐNG, CÔNG VIỆC & MỐI QUAN HỆ
- Phân tích cách con số này định hình năng lực và hành vi thực tế của đương số.

#### III. VÙNG BÓNG TỐI & CẠM BẪY TÂM LÝ CẦN LƯU Ý (SHADOW SIDE)
- Nhận diện những thách thức, cạm bẫy hoặc thiên kiến tâm lý mà con số này dễ mắc phải.

#### IV. 3 BƯỚC HÀNH ĐỘNG THỰC TẾ ĐỂ CHUYỂN HÓA (ACTIONABLE STEPS)
1. Bước 1...
2. Bước 2...
3. Bước 3...

#### V. LỜI KHUYÊN & THÔNG ĐIỆP ĐỒNG HÀNH
- Đúc kết ngắn gọn, sâu sắc và truyền cảm hứng.

LƯU Ý QUAN TRỌNG:
0. ${languageDirective}
1. TUYỆT ĐỐI TUÂN THỦ CHỈ THỊ VĂN PHONG VÀ TÂM LÝ ĐÃ NÊU Ở TRÊN (nếu người dùng thiên về logic hãy dùng từ ngữ gãy gọn sắc bén; nếu nhạy cảm cảm xúc hãy dùng ngôn từ ấm áp chữa lành).
2. KHÔNG nói mê tín, không bói toán bề nổi. Chỉ tập trung vào TÂM LÝ HỌC HÀNH VI và PHÁT TRIỂN NỘI TỰC.
3. BẮT BUỘC IN ĐẬM (**...**) TẤT CẢ các con số (VD: **Số ${indicatorValue}**, **Đường Đời ${indicatorValue}**, **Năm 2026**), các từ khóa năng lượng cốt lõi, màu sắc may mắn, và các gạch đầu dòng then chốt để làm nổi bật và cực kỳ dễ đọc.`;

    const messages = [
      {
        role: 'user' as const,
        content: `Hãy phân tích chi tiết và sâu sắc cho tôi về chỉ số: ${indicatorName} mang giá trị "${indicatorValue}".`
      }
    ];

    let aiStream: ReadableStream<Uint8Array>;
    try {
      aiStream = createStreamingResponse(systemPrompt, messages, providerConfig);
    } catch (error) {
      if (!fallbackContent) throw error;
      aiStream = new ReadableStream({
        start(controller) {
          controller.error(error);
        }
      });
    }
    const stream = createIndicatorFallbackStream(aiStream, fallbackContent);
    recordAiUsage({
      identity: access.identity,
      plan: access.plan,
      feature: 'text',
      route: '/api/numerology/lazy-indicator',
      estimatedCostUsd: Number(process.env.NUMINA_ESTIMATED_TEXT_COST_USD || 0)
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Numina-Plan': access.plan,
        'X-Numina-Remaining': String(access.remaining)
      }
    });
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Invalid indicator request.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.error('Lazy indicator API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
