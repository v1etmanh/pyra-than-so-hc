import { NextRequest, NextResponse } from 'next/server';
import { evaluateBaziCompatibility } from '@/lib/bazi-love/engine';
import type { BaziLovePersonInput } from '@/lib/bazi-love/types';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { resolveTargetIndicators, formatIndicatorsForPrompt } from '@/lib/numerology/indicator-resolver';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';
import { getChatResponseBudget, normalizeChatReply } from '@/lib/spiritual-agent/response-length';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

async function generateLlmText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const stream = createStreamingResponse(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    undefined,
    { maxTokens, temperature: 0.7, reasoningEffort: 'low' }
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
        `✦ KẾT LUẬN NHANH:\n${p1.fullName} và ${p2.fullName} đạt khoảng ${baziScore}% tương hợp. Điểm quan trọng là giữ giao tiếp rõ ràng khi hai người khác nhịp sống.`,
        `\n✦ VÌ SAO:\n• Cung Phu Thê và ngũ hành cho thấy hai bạn có cả điểm bổ trợ lẫn bài học cân bằng.\n• Kết quả này là gợi ý để hiểu nhau, không thay cho lựa chọn thực tế của hai người.`,
        `\n✦ NÊN LÀM GÌ:\n• Nói rõ mong đợi và ranh giới ngay từ đầu.\n• Chọn một mục tiêu chung nhỏ để cùng thực hiện trong tháng này.`
      ].join('\n');
    }
    // 2. Hai lựa chọn (A vs B)
    else if (decision?.intent === 'two_choices') {
      const optionA = 68;
      const optionB = 32;
      cardPayload.optionSplit = { optionA, optionB };

      replyText = [
        `✦ KẾT LUẬN NHANH:\nPhương án A đang thuận hơn (${optionA}% so với ${optionB}%). Hãy chọn A nếu nó vẫn phù hợp nguồn lực và ưu tiên thực tế của bạn.`,
        `\n✦ VÌ SAO:\n• Trải bài cho thấy A có đà phát triển rõ hơn.\n• B có thể an toàn trước mắt nhưng dễ làm bạn chậm quyết định.\n• Tư duy lý trí và năm cá nhân nghiêng về hành động có chuẩn bị.`,
        `\n✦ NÊN LÀM GÌ:\n• Viết ba bước đầu tiên cho A.\n• Đặt mốc kiểm tra lại sau một tuần.`
      ].join('\n');
    }
    // 3. Thuần 24 chỉ số Thần số học (0 lá Tarot)
    else if (!decision?.needsTarot || decision?.intent === 'core_personality') {
      const indicatorReasons = (resolvedP1.length > 0 ? resolvedP1 : p1Indicators)
        .slice(0, 3)
        .map((i: any) => `• ${i.name} = ${i.value}.`)
        .filter((item: string) => item.length <= 140);
      const indicatorSummary = [
        ...indicatorReasons,
        '• Các chỉ số cốt lõi đều nhắc bạn giữ sự tự chủ và cân bằng.',
        '• Tiến bộ bền vững đến từ việc lặp lại những lựa chọn phù hợp.',
      ].slice(0, Math.max(2, indicatorReasons.length)).join('\n');
      replyText = [
        `✦ KẾT LUẬN NHANH:\nBản đồ của ${p1.fullName} cho thấy tiềm năng phát triển tốt khi bạn kết hợp chủ động với sự kiên định.`,
        `\n✦ VÌ SAO:\n${indicatorSummary}`,
        `\n✦ NÊN LÀM GÌ:\n• Chọn một mục tiêu phù hợp thế mạnh của bạn.\n• Duy trì một thói quen nhỏ trong 14 ngày tới.`
      ].join('\n');
    }
    // 4. Mặc định / 1 lá / 3 lá
    else {
      const c1 = cards[0];
      const lowerQ = (message || '').toLowerCase();
      const isFood = /ăn|món|thực đơn|uống|nấu|bữa|sáng|trưa|tối|đói/i.test(lowerQ);

      if (isFood) {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nHôm nay hợp với một bữa nhẹ, tươi và dễ tiêu như phở, bún hoặc salad.`,
          `\n✦ VÌ SAO:\n• Lá ${c1?.card?.nameVi || 'Tarot'} gợi tinh thần khám phá và làm mới nhịp sinh hoạt.\n• Một bữa nhẹ giúp bạn giữ năng lượng ổn định hơn.`,
          `\n✦ NÊN LÀM GÌ:\n• Chọn món có rau và đạm vừa phải.\n• Ăn chậm, uống đủ nước.`
        ].join('\n');
      } else {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nThông điệp hiện tại là giữ vững hướng đi và đừng vội phản ứng theo cảm xúc.`,
          `\n✦ VÌ SAO:\n• Lá ${c1?.card?.nameVi || 'Tarot'} nhấn mạnh bài học ${c1?.isReversed ? 'nhìn lại và điều chỉnh' : 'chủ động hành động'}.\n• Một lựa chọn bình tĩnh sẽ giúp bạn thấy rõ bước tiếp theo.`,
          `\n✦ NÊN LÀM GÌ:\n• Chọn một việc quan trọng nhất hôm nay.\n• Hoàn thành nó trước khi nhận thêm cam kết.`
        ].join('\n');
      }
    }

    const responseBudget = getChatResponseBudget({
      intent: decision?.intent,
      cardCount: Math.max(cards.length, Number(decision?.cardCount) || 0),
      isCouple,
    });
    const fallbackReply = normalizeChatReply('', replyText, responseBudget.complexity);

    // 5. KÍCH HOẠT AI LLM THẬT (Google Gemini / Groq / OpenRouter) ĐỂ SINH LỜI THOẠI CÁ NHÂN HÓA NGẮN GỌN
    try {
      const systemPrompt = `Bạn là Tiểu Linh Miêu — linh miêu hộ mệnh thông thái, tinh tế và ấm áp của NUMELYRA.
Bạn tư vấn dựa trên dữ liệu Thần số học Pythagoras, Tarot Rider-Waite và Tử Vi Đẩu Số đã được cung cấp.

QUY TẮC BẮT BUỘC:
1. Với ghép đôi hai người: chỉ dùng Tử Vi Đẩu Số và Bát Tự Tứ Trụ; tuyệt đối không nhắc Tarot.
2. Với một người: chỉ dùng các lá Tarot và chỉ số đã cung cấp; không tự bịa thêm dữ kiện.
3. Với hai lựa chọn: nêu rõ phương án nghiêng về và tỷ lệ phần trăm.
4. Dùng đúng ba tiêu đề sau, theo đúng thứ tự, không thêm mở bài hoặc kết luận lặp lại:
✦ KẾT LUẬN NHANH:
[Tối đa 2 câu ngắn, trả lời thẳng vào câu hỏi]

✦ VÌ SAO:
[Tối đa ${responseBudget.complexity === 'complex' ? '4' : '3'} bullet; mỗi bullet chỉ một câu ngắn và kết thúc bằng dấu chấm. Với trải bài nhiều lá, gộp các lá cùng ý thay vì diễn giải từng lá thành đoạn dài.]

✦ NÊN LÀM GÌ:
[1-2 bullet là hành động cụ thể, làm được ngay; mỗi bullet kết thúc bằng dấu chấm]

5. Giọng điệu thân thiện, thông thái, ấm áp. Tổng câu trả lời không vượt quá ${responseBudget.maxWords} từ tiếng Việt hoặc ${responseBudget.maxChars} ký tự. Kết thúc ngay sau phần “NÊN LÀM GÌ”.`;

      const userPrompt = `Câu hỏi của người dùng: "${message}"
Hồ sơ người hỏi: ${p1.fullName} (Ngày sinh: ${p1.birthDate}) ${p2 ? `\nHồ sơ người thứ 2: ${p2.fullName} (Ngày sinh: ${p2.birthDate})` : ''}
${isCouple ? 'CHẾ ĐỘ GHÉP ĐÔI 2 NGƯỜI: 100% THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ (KHÔNG CÓ LÁ BÀI TAROT).' : (cards.length > 0 ? `Các lá bài Tarot đã rút:\n${cards.map((c: any, i: number) => `• Vị trí ${i+1} [${c.position?.nameVi || i+1}]: ${c.card?.nameVi} (${c.isReversed ? 'Lá Ngược' : 'Lá Xuôi'}) - Ý nghĩa: ${c.isReversed ? c.card?.meaningReversed : c.card?.meaningUpright}`).join('\n')}` : 'Không sử dụng lá bài Tarot.')}

DỮ LIỆU THẦN SỐ HỌC PYTHAGORAS BẢN MỆNH (${p1.fullName}):
${formatIndicatorsForPrompt(resolvedP1)}
${resolvedP2.length > 0 ? `\nDỮ LIỆU THẦN SỐ HỌC ĐỐI PHƯƠNG (${p2.fullName}):\n${formatIndicatorsForPrompt(resolvedP2)}` : ''}
${baziSummary ? `\nLuận giải Bát Tự & Cung Phu Thê (Điểm hòa hợp: ${baziScore}%):\n${baziSummary}` : ''}
${cardPayload.optionSplit ? `\nPhân bổ lựa chọn: Phương án A (${cardPayload.optionSplit.optionA}%) vs Phương án B (${cardPayload.optionSplit.optionB}%)` : ''}`;

      const aiText = await generateLlmText(systemPrompt, userPrompt, responseBudget.maxTokens);
      // Either return a complete, bounded response or the short fallback. Never
      // append a template to partial model output, as that can repeat sections
      // and exceed the mobile-friendly response budget.
      replyText = normalizeChatReply(aiText, fallbackReply, responseBudget.complexity);
    } catch (llmError) {
      console.warn('[Chat Agent Route] LLM fallback to template:', llmError);
      replyText = fallbackReply;
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
