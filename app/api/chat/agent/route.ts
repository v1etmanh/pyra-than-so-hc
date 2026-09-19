import { NextRequest, NextResponse } from 'next/server';
import { evaluateBaziCompatibility } from '@/lib/bazi-love/engine';
import type { BaziLovePersonInput } from '@/lib/bazi-love/types';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { resolveTargetIndicators, formatIndicatorsForPrompt } from '@/lib/numerology/indicator-resolver';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

async function generateLlmText(systemPrompt: string, userPrompt: string): Promise<string> {
  const stream = createStreamingResponse(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    undefined,
    { maxTokens: 2000, temperature: 0.7, reasoningEffort: 'low' }
  );
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

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
            fullText += event.content;
          }
        } catch {
          // Ignore non-JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return fullText.trim();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, decision, profiles, indicators, tarotCards } = body;

    // 0. BỘ LỌC TỐC HÀNH: Phát hiện câu hỏi rác / vô nghĩa / gõ phím ngẫu nhiên (0 token LLM, phản hồi < 0.1ms)
    const trashCheck = isTrashOrMeaninglessPrompt(message);
    if (decision?.intent === 'trash' || trashCheck.isTrash) {
      return NextResponse.json({
        ok: true,
        data: {
          replyText: TRASH_PROMPT_GUIDANCE,
          cardPayload: {
            type: 'agent_synthesis',
            decision: {
              mode: 'single',
              intent: 'trash',
              needsTarot: false,
              spreadId: null,
              cardCount: 0,
              targetIndicators: [],
              thoughtProcess: `Phát hiện câu hỏi không có chủ đề hoặc mục đích rõ ràng (${trashCheck.reason || 'Ký tự vô nghĩa'}). Gửi phản hồi định hướng để người dùng đặt câu hỏi có ý nghĩa.`
            },
            profiles,
            indicators1: [],
            indicators2: [],
            drawnCards: [],
            isTrashPrompt: true
          }
        }
      }, { headers: corsHeaders });
    }

    const p1 = profiles?.[0] || { fullName: 'Người A', birthDate: '2000-01-01', gender: 'female' };
    const p2 = profiles?.[1];
    const isCouple = profiles?.length >= 2;

    const p1Indicators = indicators?.profile1 || [];
    const p2Indicators = indicators?.profile2 || [];
    const cards = tarotCards || [];

    // Giải mã chuyên sâu tối đa 5 chỉ số Thần số học theo quyết định của AI
    const requestedKeys: string[] = Array.isArray(decision?.targetIndicators) && decision.targetIndicators.length > 0
      ? decision.targetIndicators
      : (p1Indicators.map((i: any) => i.key).filter(Boolean));

    const resolvedP1 = resolveTargetIndicators(p1.fullName, p1.birthDate, requestedKeys);
    const resolvedP2 = (isCouple && p2) ? resolveTargetIndicators(p2.fullName, p2.birthDate, requestedKeys) : [];

    let replyText = '';
    let baziScore = 85;
    let baziSummary = '';
    let cardPayload: any = {
      type: 'agent_synthesis',
      decision: decision || {
        mode: isCouple ? 'compatibility' : 'single',
        intent: isCouple ? 'love_match' : 'general',
        needsTarot: cards.length > 0,
        spreadId: isCouple ? 'relationship' : 'single',
        cardCount: cards.length,
        targetIndicators: requestedKeys,
        thoughtProcess: 'Tiểu Linh Miêu kết hợp Tử Vi Đẩu Số (Bát Tự) và 5 Lá Tarot Mối Quan Hệ.'
      },
      profiles,
      indicators1: resolvedP1.length > 0 ? resolvedP1 : p1Indicators,
      indicators2: resolvedP2.length > 0 ? resolvedP2 : p2Indicators,
      drawnCards: cards
    };

    // 1. Tương hợp 2 người (THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ - KHÔNG CẦN TAROT)
    if (isCouple && p2) {
      const personAInput: BaziLovePersonInput = {
        name: p1.fullName,
        birthDate: p1.birthDate,
        timezone: 'Asia/Ho_Chi_Minh',
        calculationSex: p1.gender === 'male' ? 'male' : 'female'
      };
      const personBInput: BaziLovePersonInput = {
        name: p2.fullName,
        birthDate: p2.birthDate,
        timezone: 'Asia/Ho_Chi_Minh',
        calculationSex: p2.gender === 'male' ? 'male' : 'female'
      };

      try {
        const baziResult = evaluateBaziCompatibility(personAInput, personBInput);
        cardPayload.baziResult = baziResult;
        const rawDelta = baziResult.layers.reduce((acc, l) => acc + l.score, 0);
        baziScore = Math.max(50, Math.min(96, Math.round(65 + rawDelta * 1.5)));
        baziSummary = baziResult.layers.map(l => `• ${l.label.vi}: ${l.notes.slice(0, 3).map(n => n.text.vi).join('; ')}`).join('\n');
      } catch (err) {
        console.warn('Bazi calculation fallback:', err);
      }

      cardPayload.compatibilityScore = baziScore;
      cardPayload.drawnCards = []; // KHÔNG DÙNG BÀI TAROT

      replyText = [
        `✦ KẾT LUẬN TỔNG QUAN TỬ VI & BÁT TỰ:\nTheo luận giải Tử Vi Đẩu Số & Bát Tự Tứ Trụ, mức độ tương hợp duyên nợ giữa ${p1.fullName} và ${p2.fullName} đạt ${baziScore}%. Hai bạn có duyên số bù trừ sâu sắc cả về ngũ hành bản mệnh lẫn nếp sống đời thường.`,
        `\n✦ PHÂN TÍCH TỬ VI ĐẨU SỐ & CUNG PHU THÊ:\n${baziSummary || '• Bản Mệnh & Cung Phu Thê: Năng lượng tương sinh tương dưỡng, cần giữ gìn sự hòa khí và thấu hiểu.'}`,
        `\n✦ VÌ SAO (GÓC NHÌN CAN CHI & NẠP ÂM BẢN MỆNH):\nHai lá số phản chiếu bài học nhân duyên: ${p1.fullName} mang lại sự định hướng và điểm tựa tinh thần, trong khi ${p2.fullName} bồi đắp sự ấm áp, nhẫn nại và sự chia sẻ kịp thời. Sự bù trừ này giúp cả hai chuyển hóa những khía cạnh nóng nảy để cùng nhau trưởng thành.`,
        `\n✦ NÊN LÀM GÌ ĐỂ HÓA GIẢI & HẠNH PHÚC LÂU DÀI:\nHãy thực hành lắng nghe chân thành, tôn trọng không gian riêng của nhau và cùng nhau đặt ra các mục tiêu dài hạn cho gia đạo để sinh khí luôn hưng vượng.`
      ].join('\n');
    }
    // 2. Hai lựa chọn (A vs B)
    else if (decision?.intent === 'two_choices') {
      const optionA = 68;
      const optionB = 32;
      cardPayload.optionSplit = { optionA, optionB };

      replyText = [
        `✦ KẾT LUẬN NHANH:\nVũ trụ và quẻ bài ủng hộ Phương Án A (nghiêng ${optionA}%) hơn so với Phương Án B (${optionB}%). Phương án A mở ra dòng chảy năng lượng hanh thông hơn.`,
        `\n✦ VÌ SAO (PHÂN TÍCH 5 LÁ TAROT & TƯ DUY LÝ TRÍ):\n• Nền tảng hiện tại: Bạn đang đứng trước ngã rẽ quan trọng, trực giác mách bảo cần đổi mới.\n• Phương án A: Thu hút vận may và cơ hội phát triển năng lực nội tại.\n• Phương án B: Tiềm ẩn các chi phí cơ hội và rào cản vô hình chưa lường trước.\n• Tư duy lý trí & Năm cá nhân: Thúc đẩy bạn dũng cảm dứt điểm quyết định.`,
        `\n✦ NÊN LÀM GÌ:\nHãy lập kế hoạch triển khai cho Phương Án A ngay trong tháng này. Tránh để sự do dự làm phân tán nguồn lực.`
      ].join('\n');
    }
    // 3. Thuần 24 chỉ số Thần số học (0 lá Tarot)
    else if (!decision?.needsTarot || decision?.intent === 'core_personality') {
      const indStr = p1Indicators.map((i: any) => `• ${i.name} = ${i.value}: ${i.meaning}`).join('\n');
      replyText = [
        `✦ KẾT LUẬN NHANH:\nBản đồ Thần số học chuyên sâu của ${p1.fullName} mang tần số rung động mạnh mẽ của người có năng lực lãnh đạo, tính tự lập cao và tâm hồn giàu lòng nhân ái.`,
        `\n✦ VÌ SAO (TRÍCH XUẤT TỪ BẢN ĐỒ 24 CHỈ SỐ PYTHAGORAS):\n${indStr}`,
        `\n✦ NÊN LÀM GÌ:\nHãy phát huy bài học từ Số Đường Đời và Số Sứ Mệnh, chủ động nhận lãnh trách nhiệm trong công việc và giữ tâm an trước các biến động bên ngoài.`
      ].join('\n');
    }
    // 4. Mặc định / 1 lá / 3 lá
    else {
      const c1 = cards[0];
      const lowerQ = (message || '').toLowerCase();
      const isFood = /ăn|món|thực đơn|uống|nấu|bữa|sáng|trưa|tối|đói/i.test(lowerQ);

      if (isFood) {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nHôm nay bạn nên thưởng thức một món ăn tươi mới, thanh nhẹ và kích thích vị giác như: Phở/bún nước dùng thanh ngọt, salad tôm bơ ngũ sắc, hoặc thử một món mới lạ mà trước giờ bạn chưa từng ăn!`,
          `\n✦ VÌ SAO (LÁ BÀI ${c1?.card?.nameVi || 'TAROT'} & NĂNG LƯỢNG SỐ HỌC):\nLá bài ${c1?.card?.nameVi || 'The Fool'} (${c1?.isReversed ? 'Lá Ngược' : 'Lá Xuôi'}) mang nguồn năng lượng của sự khám phá và khởi đầu mới. Kết hợp cùng các chỉ số ngày sinh của bạn, cơ thể đang cần nạp nguồn dinh dưỡng tươi mát, lành tính và giàu sinh khí để tinh thần luôn nhẹ nhõm, minh mẫn.`,
          `\n✦ NÊN LÀM GÌ:\nHãy chọn một quán ăn có không gian thoáng mát, ăn chậm nhai kỹ và thưởng thức kèm một ly nước ép hoa quả mát lành nhé!`
        ].join('\n');
      } else {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nThông điệp trực giác dẫn lối cho bạn: "${c1?.card?.meaningUpright || 'Vũ trụ đang gửi tín hiệu nhắc nhở bạn vững tin'}".`,
          `\n✦ VÌ SAO:\nLá bài ${c1?.card?.nameVi || 'Tarot'} phản chiếu đúng tâm trạng và bài học mà bạn đang cần chuyển hóa lúc này. Kết hợp cùng Số Đường Đời của bạn, năng lượng đang hội tụ để tạo bước ngoặt mới.`,
          `\n✦ NÊN LÀM GÌ:\nGiữ vững tâm thế lạc quan, lắng nghe trực giác và đưa ra hành động dứt khoát.`
        ].join('\n');
      }
    }

    // 5. KÍCH HOẠT AI LLM THẬT (Google Gemini / Groq / OpenRouter) ĐỂ SINH LỜI THOẠI CÁ NHÂN HÓA SÂU SẮC
    try {
      const systemPrompt = `Bạn là Tiểu Linh Miêu — linh miêu hộ mệnh thông thái, tinh tế, dí dỏm và ấm áp của ứng dụng tâm linh NUMELYRA.
Bạn đang tư vấn và dẫn dắt người dùng dựa trên năng lượng Thần số học Pythagoras, Tarot Rider-Waite và Tử Vi Đẩu Số.

QUY TẮC BẮT BUỘC:
1. TRƯỜNG HỢP XEM TÌNH DUYÊN GHÉP ĐÔI 2 NGƯỜI:
   - BẮT BUỘC LUẬN GIẢI 100% THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ (Cung Phu Thê, Thiên Can Ngũ Hợp/Xung, Ngũ Hành Nạp Âm, Bát Trạch Quái Mệnh).
   - TUYỆT ĐỐI KHÔNG ĐƯỢC NHẮC ĐẾN BẤT KỲ LÁ BÀI TAROT NÀO! (Ghép đôi 2 người chỉ dùng Tử Vi Đẩu Số & Bát Tự).
2. TRƯỜNG HỢP CÂU HỎI 1 NGƯỜI:
   - Phân tích sâu sắc, kết hợp đầy đủ các lá bài Tarot đã rút và chỉ số Thần số học tương ứng.
3. TRẢ LỜI TRỰC DIỆN, THỰC TẾ ĐÚNG CÂU HỎI:
   - Trả lời rõ ràng, cụ thể, không né tránh. Nếu hỏi so sánh 2 lựa chọn (A vs B), phải nêu rõ chọn phương án nào và tỷ lệ phần trăm nghiêng.
4. BẮT BUỘC PHẢI CÓ ĐẦY ĐỦ CẢ 3 PHẦN, TUYỆT ĐỐI KHÔNG ĐƯỢC THIẾU HOẶC BỎ DỞ PHẦN NÀO:
✦ KẾT LUẬN NHANH:
[1-2 câu trả lời thẳng, dứt khoát vào câu hỏi, nêu rõ kết quả lựa chọn hoặc thông điệp cốt lõi]

✦ VÌ SAO:
[PHẦN QUAN TRỌNG NHẤT: Luận giải chi tiết, rõ ràng từng khía cạnh:
- Nếu là Trải bài 5 lá (Hai Lựa Chọn A vs B): BẮT BUỘC phân tích chi tiết:
  • Lá 1 (Tình trạng nền tảng): Nói lên điều gì về hoàn cảnh, tâm thế của người hỏi?
  • Phương án A: Lá 2 (Tiến trình) và Lá 3 (Kết quả) mở ra thuận lợi, cơ hội hay chuyển biến gì?
  • Phương án B: Lá 4 (Tiến trình) và Lá 5 (Kết quả) tiềm ẩn rào cản, khó khăn hay bài học gì?
  • Đối chiếu với Tư duy lý trí và Số đường đời để giải thích tại sao trực giác và logic vũ trụ ủng hộ phương án A hơn B (hoặc ngược lại).
- Nếu là Trải bài 3 lá (Vận trình): Phân tích lần lượt Quá khứ, Hiện tại, Tương lai và Năm cá nhân.
- Nếu là Trải bài 1 lá: Phân tích hình tượng lá bài, chiều xuôi/ngược và sự đồng điệu với năng lượng số học.
- Nếu là Tình duyên 2 người: Phân tích sâu sắc Tứ Trụ Bát Tự, Cung Phu Thê, Thiên Can và Cung Phi Bát Trạch.]

✦ NÊN LÀM GÌ:
[2-3 lời khuyên hành động cụ thể, thực tế, làm được ngay, vừa mang tính tâm linh dẫn đường vừa giàu tính hành động đời sống]

5. Giọng điệu: Thân thiện, thông thái, ấm áp mang phong cách linh miêu hộ mệnh gần gũi. Độ dài từ 300 - 500 từ để mang lại trải nghiệm luận giải chi tiết, thấu đáo và chạm tới cảm xúc người hỏi.`;

      const userPrompt = `Câu hỏi của người dùng: "${message}"
Hồ sơ người hỏi: ${p1.fullName} (Ngày sinh: ${p1.birthDate}) ${p2 ? `\nHồ sơ người thứ 2: ${p2.fullName} (Ngày sinh: ${p2.birthDate})` : ''}
${isCouple ? 'CHẾ ĐỘ GHÉP ĐÔI 2 NGƯỜI: 100% THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ (KHÔNG CÓ LÁ BÀI TAROT).' : (cards.length > 0 ? `Các lá bài Tarot đã rút:\n${cards.map((c: any, i: number) => `• Vị trí ${i+1} [${c.position?.nameVi || i+1}]: ${c.card?.nameVi} (${c.isReversed ? 'Lá Ngược' : 'Lá Xuôi'}) - Ý nghĩa: ${c.isReversed ? c.card?.meaningReversed : c.card?.meaningUpright}`).join('\n')}` : 'Không sử dụng lá bài Tarot.')}

DỮ LIỆU THẦN SỐ HỌC PYTHAGORAS BẢN MỆNH (${p1.fullName}):
${formatIndicatorsForPrompt(resolvedP1)}
${resolvedP2.length > 0 ? `\nDỮ LIỆU THẦN SỐ HỌC ĐỐI PHƯƠNG (${p2.fullName}):\n${formatIndicatorsForPrompt(resolvedP2)}` : ''}
${baziSummary ? `\nLuận giải Bát Tự & Cung Phu Thê (Điểm hòa hợp: ${baziScore}%):\n${baziSummary}` : ''}
${cardPayload.optionSplit ? `\nPhân bổ lựa chọn: Phương án A (${cardPayload.optionSplit.optionA}%) vs Phương án B (${cardPayload.optionSplit.optionB}%)` : ''}`;

      const aiText = await generateLlmText(systemPrompt, userPrompt);
      const hasExplanation = aiText && (
        aiText.includes('✦ VÌ SAO:') || 
        aiText.includes('✦ VÌ SAO') || 
        aiText.includes('VÌ SAO:') ||
        aiText.includes('## Vì sao') ||
        aiText.includes('PHÂN TÍCH')
      );
      if (aiText && aiText.length > 80 && hasExplanation) {
        replyText = aiText;
      } else if (aiText && aiText.length > 30) {
        console.warn('[Chat Agent Route] LLM response truncated or missing explanation, augmenting with template:');
        // Ghép kết luận ngắn của AI với phần giải thích chi tiết mẫu để đảm bảo không bao giờ thiếu phần giải thích
        replyText = `${aiText.trim()}\n\n${replyText.split('✦ VÌ SAO')[1] ? '✦ VÌ SAO' + replyText.split('✦ VÌ SAO')[1] : ''}`.trim();
      }
    } catch (llmError) {
      console.warn('[Chat Agent Route] LLM fallback to template:', llmError);
    }

    return NextResponse.json({
      ok: true,
      data: {
        replyText,
        cardPayload
      }
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[API /api/chat/agent] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
