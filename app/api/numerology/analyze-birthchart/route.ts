import { NextRequest } from 'next/server';
import { getKnowledgeByIndicator } from '@/lib/supabaseClient';
import { createStreamingResponse } from '@/app/api/chat/lib/response-generator';
import type { PersonalityProfile } from '@/utils/personalityTypes';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface AnalyzeBirthChartBody {
  fullName?: string;
  birthDay: string;
  birthChartData: {
    grid: Array<{ number: number; frequency: number; isIsolated: boolean }>;
    arrows: Array<{ name: string; numbers: number[]; type: 'strength' | 'empty'; desc: string }>;
  };
  personalityProfile?: PersonalityProfile;
  providerConfig?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeBirthChartBody = await req.json();
    const { fullName, birthDay, birthChartData, personalityProfile, providerConfig } = body;

    if (!birthDay || !birthChartData) {
      return new Response(JSON.stringify({ error: 'Missing birthDay or birthChartData' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Fetch relevant arrow knowledge from Supabase
    const activeArrows = birthChartData.arrows || [];
    const arrowKnowledgePromises = activeArrows.map((a) => {
      const numKey = a.numbers.join('-');
      return getKnowledgeByIndicator('arrows', numKey);
    });

    const arrowDocs = (await Promise.all(arrowKnowledgePromises)).filter(Boolean);
    const arrowContextText = arrowDocs.length > 0
      ? arrowDocs.map((doc) => `[TƯ LIỆU SÁCH MŨI TÊN: ${doc!.title}]
${doc!.content}`).join('\n\n')
      : '';

    // 2. Format grid & arrows overview
    const numbersList = birthChartData.grid
      .filter((c) => c.frequency > 0)
      .map((c) => `- Số ${c.number}: Xuất hiện ${c.frequency} lần${c.isIsolated ? ' ⚠️ [BỊ CÔ LẬP]' : ''}`)
      .join('\n');

    const strengthArrowsList = activeArrows
      .filter((a) => a.type === 'strength')
      .map((a) => `- ${a.name} (${a.numbers.join('-')}): ${a.desc}`)
      .join('\n') || '- Không có mũi tên sức mạnh';

    const emptyArrowsList = activeArrows
      .filter((a) => a.type === 'empty')
      .map((a) => `- ${a.name} (Trống ${a.numbers.join('-')}): ${a.desc}`)
      .join('\n') || '- Không có mũi tên trống';

    // 3. Personality Persona Directive
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

    // 4. Build System Prompt
    const systemPrompt = `Bạn là Chuyên gia Cao cấp Thần số học Pythagoras (theo trường phái TS. David A. Phillips).
Nhiệm vụ của bạn là luận giải CHI TIẾT & TOÀN DIỆN Biểu đồ Ngày Sinh 3x3 cho đương số:
- Họ và tên: ${fullName || 'Đương số'}
- Ngày sinh: ${birthDay}

DỮ LIỆU BIỂU ĐỒ 3x3:
Các con số có mặt:
${numbersList}

Mũi tên sức mạnh (Đầy đủ):
${strengthArrowsList}

Mũi tên điểm yếu (Trống):
${emptyArrowsList}

${arrowContextText ? `TƯ LIỆU SÁCH GỐC TRA CỨU TỪ SUPABASE:\n${arrowContextText}\n` : ''}
${personalitySection}

HƯỚNG DẪN CẤU TRÚC BÀI LUẬN GIẢI BIỂU ĐỒ NGÀY SINH (MARKDOWN):
### 🌌 GIẢI MÃ TOÀN DIỆN BIỂU ĐỒ NGÀY SINH 3x3 (${birthDay})

#### I. CẤU TRÚC 3 TRỤC NĂNG LƯỢNG
- **Trục Thể chất (1-4-7):** Năng lực hành động, thực tế, công việc và sức bền.
- **Trục Cảm xúc & Tâm hồn (2-5-8):** Trực giác, tình cảm, sự cân bằng nội tâm.
- **Trục Trí tuệ & Tinh thần (3-6-9):** Tư duy, trí nhớ, sáng tạo và lý tưởng sống.

#### II. CÁC MŨI TÊN NĂNG LƯỢNG CHỦ ĐẠO
- Phân tích chi tiết các mũi tên sức mạnh (nếu có) và tác động của chúng.
- Phân tích sâu các mũi tên trống (nếu có) và những nút thắt tâm lý mà đương số hay gặp.

#### III. CẢNH BÁO CÁC CON SỐ BỊ CÔ LẬP & TẦN SUẤT LẶP LẠI
- Nhận diện các con số bị cô lập (số 1, 3, 7, 9 nếu đứng trơ trọi).
- Nhận diện các số xuất hiện quá nhiều lần (bội số) gây mất cân bằng năng lượng.

#### IV. GIẢI PHÁP "ĐIỀN CON SỐ ẢO" BẰNG HÀNH VI THỰC TẾ
- Hướng dẫn cụ thể từng bước rèn luyện thói quen hàng ngày để bù đắp các ô trống và hóa giải số cô lập.

#### V. LỜI KHUYÊN ĐỒNG HÀNH & ĐỊNH HƯỚNG TỔNG THỂ
- Đúc kết ngắn gọn, truyền động lực và bình an.

LƯU Ý QUAN TRỌNG:
1. TUYỆT ĐỐI TUÂN THỦ CHỈ THỊ VĂN PHONG VÀ TÂM LÝ ĐÃ NÊU Ở TRÊN.
2. KHÔNG nói mê tín dị đoan, tập trung vào TÂM LÝ HỌC HÀNH VI và RÈN LUYỆN NỘI LỰC.`;

    const messages = [
      {
        role: 'user' as const,
        content: `Hãy phân tích chi tiết Biểu đồ Ngày Sinh (${birthDay}) của tôi.`
      }
    ];

    const stream = createStreamingResponse(systemPrompt, messages, providerConfig);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Analyze birth chart API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
