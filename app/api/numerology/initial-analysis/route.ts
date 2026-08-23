import { NextRequest } from 'next/server';
import { createStreamingResponse } from '@/app/api/chat/lib/response-generator';
import { getKnowledgeByIndicator } from '@/lib/supabaseClient';
import * as fs from 'fs';
import * as path from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface InitialAnalysisBody {
  fullName: string;
  birthDay: string;
  coreIndicators: {
    walksOfLife: number | string;
    mission: number | string;
    soul: number | string;
    personality: number | string;
    dateOfBirth: number | string;
  };
  providerConfig?: any;
}

// Fallback local memory search if needed
function searchLocalKnowledge(numbers: string[]): string {
  try {
    const filePath = path.resolve(process.cwd(), 'data/master_knowledge.json');
    if (!fs.existsSync(filePath)) return '';
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: any[] = JSON.parse(raw);
    const matches = data.filter((item) =>
      numbers.some((num) =>
        item.number === `Số ${num}` || item.number === num || (item.category === 'life_path_number' && item.number?.includes(String(num)))
      )
    );
    return matches
      .map(
        (m) =>
          `[HỒ SƠ ${m.number}]\n- Bản chất: ${m.core_essence}\n- Điểm mạnh: ${m.strengths_and_talents}\n- Điểm yếu/Bài học: ${m.weaknesses_and_lessons}\n- Sự nghiệp: ${m.career_and_life_path}\n- Tình cảm: ${m.relationship_and_behavior}`
      )
      .join('\n\n');
  } catch (err) {
    console.error('Error searching local knowledge:', err);
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: InitialAnalysisBody = await req.json();
    const { fullName, birthDay, coreIndicators, providerConfig } = body;

    if (!coreIndicators) {
      return new Response(JSON.stringify({ error: 'Missing coreIndicators' }), { status: 400 });
    }

    const { walksOfLife, mission, soul, personality, dateOfBirth } = coreIndicators;
    const targetNumbers = [String(walksOfLife), String(mission), String(soul), String(personality), String(dateOfBirth)];

    // 1. Direct Knowledge Retrieval from Supabase PostgreSQL for 5 Core Indicators
    const [docLife, docMission, docSoul, docPersonality, docDay] = await Promise.all([
      getKnowledgeByIndicator('walksOfLife', walksOfLife),
      getKnowledgeByIndicator('mission', mission),
      getKnowledgeByIndicator('soul', soul),
      getKnowledgeByIndicator('personality', personality),
      getKnowledgeByIndicator('dateOfBirth', dateOfBirth)
    ]);

    const retrievedList = [docLife, docMission, docSoul, docPersonality, docDay].filter(Boolean);
    let retrievedContext = retrievedList
      .map((d) => `[TƯ LIỆU SÁCH: ${d!.indicator_name} (${d!.number_value})]\n${d!.content}`)
      .join('\n\n');

    // 2. Fallback to master_knowledge.json directly
    if (!retrievedContext) {
      retrievedContext = searchLocalKnowledge(targetNumbers);
    }

    // 3. Build System Prompt for 5 Core Overview
    const systemPrompt = `Bạn là Chuyên gia Cao cấp về Thần số học chuẩn trường phái Pythagoras (theo TS. David A. Phillips và Hans Decoz).
Nhiệm vụ của bạn là luận giải HỒ SƠ TỔNG QUAN 5 CHỈ SỐ CỐT LÕI cho đương số:
- Họ và tên: ${fullName || 'Đương số'}
- Ngày sinh: ${birthDay}
- 5 Chỉ số cốt lõi:
  1. Số Đường đời: ${walksOfLife}
  2. Số Sứ mệnh: ${mission}
  3. Số Linh hồn: ${soul}
  4. Số Nhân cách: ${personality}
  5. Số Ngày sinh: ${dateOfBirth}

TƯ LIỆU SÁCH GỐC TRA CỨU:
${retrievedContext}

QUY TẮC LUẬN GIẢI CHUYÊN NGHIỆP:
1. KHÔNG nói về các yếu tố mê tín, màu sơn móng tay, phong thủy bề nổi. Chỉ tập trung vào TÂM LÝ HỌC HÀNH VI, BẢN CHẤT LINH HỒN, ĐIỂM MẠNH BẨM SINH, CẠM BẪY TÂM LÝ & BÀI HỌC CUỘC ĐỜI.
2. Cấu trúc bài luận giải:
   - **I. TỔNG QUAN BẢN THỂ & BẢN ĐỒ LINH HỒN**: Mối quan hệ tương hỗ giữa Đường đời (${walksOfLife}) và Sứ mệnh (${mission}).
   - **II. THẾ GIỚI NỘI TÂM & HÌNH ẢNH NGOẠI TẠI**: Sự hòa hợp hoặc mâu thuẫn giữa Khát khao Linh hồn (${soul}) và Thể hiện Nhân cách (${personality}).
   - **III. NĂNG LỰC BẨM SINH (SỐ NGÀY SINH ${dateOfBirth})**: Đòn bẩy hành động thực tế.
   - **IV. CẠM BẪY TÂM LÝ & BÀI HỌC TIẾN HÓA**: Cảnh báo rủi ro tâm lý và lời khuyên chuyển hóa.
   - **V. ĐỊNH HƯỚNG CHIẾN LƯỢC PHÁT TRIỂN DÀI HẠN**.
3. Văn phong sâu sắc, thấu cảm, triết lý, truyền cảm hứng và đậm chất hàn lâm.`;

    const messages = [
      {
        role: 'user' as const,
        content: `Hãy phân tích chi tiết bản đồ 5 chỉ số cốt lõi của tôi (Đường đời: ${walksOfLife}, Sứ mệnh: ${mission}, Linh hồn: ${soul}, Nhân cách: ${personality}, Ngày sinh: ${dateOfBirth}).`
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
    console.error('Initial analysis API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
