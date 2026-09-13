import type { ProfileContext } from '@/lib/ai/types';
import type { DrawnTarotCard, TarotLocale, TarotSpread } from './types.ts';

function profileBlock(profile: ProfileContext | undefined, locale: TarotLocale): string {
  if (!profile || (!profile.name && !profile.birthDate && !profile.lifePath)) return '';

  const indicatorLines = (profile.indicators ?? [])
    .slice(0, 24)
    .map((indicator) => `- ${indicator.name}: ${indicator.value}`)
    .join('\n');

  if (locale === 'vi') {
    return `\n\n## Hồ sơ số học tham khảo\n- Tên: ${profile.name || 'Không cung cấp'}\n- Ngày sinh: ${profile.birthDate || 'Không cung cấp'}\n- Số Đường Đời: ${profile.lifePath || 'Không cung cấp'}${indicatorLines ? `\n${indicatorLines}` : ''}\n\nChỉ dùng hồ sơ này để cá nhân hóa góc nhìn. Không được để số học phủ nhận hoặc thay đổi ý nghĩa lá bài.`;
  }
  return `\n\n## Optional numerology profile\n- Name: ${profile.name || 'Not provided'}\n- Birth date: ${profile.birthDate || 'Not provided'}\n- Life Path: ${profile.lifePath || 'Not provided'}${indicatorLines ? `\n${indicatorLines}` : ''}\n\nUse this only to personalize the perspective. Do not let numerology override the meaning of the cards.`;
}

function cardsBlock(cards: DrawnTarotCard[], locale: TarotLocale): string {
  return cards.map((drawn, index) => {
    const orientation = drawn.isReversed
      ? (locale === 'vi' ? 'Ngược' : 'Reversed')
      : (locale === 'vi' ? 'Xuôi' : 'Upright');
    const direction = drawn.isReversed ? 'reversed' : 'upright';
    const keywords = drawn.card.keywords[direction].map((keyword) => keyword[locale]).join(', ');
    return `${index + 1}. [${drawn.position.name[locale]}] ${drawn.card.name[locale]} — ${orientation}\n   - ${locale === 'vi' ? 'Từ khóa' : 'Keywords'}: ${keywords}\n   - ${locale === 'vi' ? 'Ý nghĩa nền' : 'Base meaning'}: ${drawn.card.meaning[direction][locale]}\n   - ${locale === 'vi' ? 'Vai trò vị trí' : 'Position role'}: ${drawn.position.description[locale]}`;
  }).join('\n\n');
}

export function isTwoChoiceContext(spread: TarotSpread, question: string): boolean {
  if (spread.id === 'two-options') return true;
  const q = question.toLowerCase();
  const hasComparativeWord = /\b(hay|hoặc|vs|versus|hay là|hay nên)\b/i.test(q);
  const hasChoiceIntent = /\b(nên|chọn|lựa chọn|phân vân|lăn tăn|giữa|định|should i|choose|between|or)\b/i.test(q);
  return hasComparativeWord && hasChoiceIntent;
}

export function buildTarotSystemPrompt(locale: TarotLocale): string {
  if (locale === 'vi') {
    return `Bạn là NUMELYRA Tarot, một người đọc Tarot Rider–Waite–Smith ấm áp, sáng rõ và có trách nhiệm.\n\nQuy tắc bắt buộc:\n- Chỉ luận các lá, chiều xuôi/ngược và vị trí được cung cấp; không tự thêm hay đổi lá.\n- Trình bày Tarot như công cụ tự soi chiếu và gợi ý lựa chọn, không phải sự thật tuyệt đối hay lời tiên tri chắc chắn.\n- Không khẳng định bạn biết suy nghĩ, ý định hoặc hành động bí mật của người khác.\n- Với sức khỏe, pháp lý, tài chính, an toàn hoặc khủng hoảng tinh thần: nêu giới hạn và khuyến khích tìm chuyên gia phù hợp.\n- Không dùng ngôn ngữ gây sợ hãi, định mệnh hóa, nguyền rủa hoặc khuyến khích phụ thuộc vào việc bói bài.\n- Với câu hỏi so sánh 2 lựa chọn (hoặc trải bài Hai lựa chọn): bạn không được trả lời nước đôi 50/50 mà phải thể hiện quan điểm phân định rõ ràng dựa trên năng lượng các lá bài, đưa ra tỷ lệ phần trăm (%) nghiêng cụ thể về bên triển vọng hơn để giúp người hỏi giải tỏa sự do dự.\n- Trả lời hoàn toàn bằng tiếng Việt, có cấu trúc rõ, ấm áp nhưng thành thật.\n- Tuyệt đối không dùng bảng Markdown, bảng HTML hoặc các hàng phân cách bằng dấu |. Chỉ dùng tiêu đề ngắn, đoạn văn và danh sách gạch đầu dòng để dễ đọc trên điện thoại.\n- Kết thúc bằng 2–3 hành động thực tế mà người hỏi có thể tự lựa chọn.`;
  }
  return `You are NUMELYRA Tarot, a warm, clear and responsible Rider–Waite–Smith reader.\n\nMandatory rules:\n- Interpret only the supplied cards, orientations and positions; never invent or replace a card.\n- Present tarot as reflection and decision support, not certainty or guaranteed prediction.\n- Never claim factual access to another person's private thoughts, intentions or actions.\n- For health, legal, financial, safety or mental-health crises, state the limitation and recommend appropriate professional help.\n- Avoid fear, fatalism, curses or language that encourages dependency on readings.\n- For comparative or two-choice questions (or the Two Options spread): do not give a fence-sitting 50/50 response. Take a decisive comparative stance leaning toward the more constructive path based on card energies and provide an explicit percentage (%) breakdown to help resolve hesitation.\n- Respond entirely in English with a clear, compassionate and honest structure.\n- Never use Markdown tables, HTML tables, or pipe-delimited rows. Use only short headings, paragraphs, and bullet lists so the reading stays readable on mobile.\n- End with two or three practical actions the user can choose.`;
}

export function buildInitialReadingPrompt(
  question: string,
  spread: TarotSpread,
  cards: DrawnTarotCard[],
  profile: ProfileContext | undefined,
  locale: TarotLocale,
  regenerate = false
): string {
  const regenerateInstruction = regenerate
    ? (locale === 'vi' ? '\nĐây là lần luận giải lại. Giữ nguyên bộ bài nhưng đưa ra cách diễn đạt mới, cụ thể hơn.' : '\nThis is a regeneration. Keep the exact cards but provide a fresh, more concrete interpretation.')
    : '';

  const isTwoChoice = isTwoChoiceContext(spread, question);

  const twoChoiceInstruction = isTwoChoice
    ? (locale === 'vi'
      ? `\n\n### CHỈ DẪN BẮT BUỘC CHO CÂU HỎI 2 LỰA CHỌN:
Người hỏi đang đứng trước ngã rẽ và cần một điểm tựa định hướng rõ ràng để tháo gỡ bế tắc.
1. BẮT BUỘC thể hiện lập trường nghiêng về một bên dựa trên mức độ thuận lợi / thách thức của các lá bài. Tuyệt đối không trả lời nước đôi 50/50 hay "cả hai đều như nhau".
2. BẮT BUỘC đưa ra phần đánh giá tỷ lệ phần trăm (%) cụ thể, tổng 2 bên = 100%. Viết thành hai gạch đầu dòng riêng, ví dụ:
   - Lựa chọn A: 65%
   - Lựa chọn B: 35%
3. Bố cục câu trả lời cần tuân theo:
   - **Bối cảnh & Nút thắt cốt lõi**: Phân tích tình thế hiện tại dẫn đến sự phân vân.
   - **Đánh giá Hướng đi A**: Cơ hội, thử thách và kết quả dự báo.
   - **Đánh giá Hướng đi B**: Cơ hội, thử thách và kết quả dự báo.
   - **⚖️ Cán cân quyết định & Tỷ lệ nghiêng**:
     - Ghi rõ tỷ lệ % của từng hướng (kèm lý do cô đọng dựa trên lá bài).
     - Khẳng định rõ trải bài đang nghiêng về lựa chọn nào và vì sao.
     - 2–3 hành động thực tế để tối ưu hóa lựa chọn được khuyến nghị.`
      : `\n\n### MANDATORY INSTRUCTION FOR TWO-CHOICE DILEMMAS:
The querent is at a crossroads and needs decisive guidance to break through hesitation.
1. MUST take a clear stance leaning toward one path based on card energies. Never provide a fence-sitting, neutral 50/50 response.
2. MUST provide an explicit percentage (%) balance breakdown totaling 100%. Write it as two separate bullets, for example:
   - Option A: 65%
   - Option B: 35%
3. Structure the response as follows:
   - **Core Context**: Underlying dynamics of the dilemma.
   - **Path A Evaluation**: Opportunities, frictions, and likely outcome.
   - **Path B Evaluation**: Opportunities, frictions, and likely outcome.
   - **⚖️ Decision Balance & Leaning Percentage**:
     - State the exact percentage for each option with concise rationales.
     - State clearly which option the cards favor and why.
     - 2–3 concrete actions to execute the recommended path effectively.`)
    : '';

  if (locale === 'vi') {
    const closingInstruction = isTwoChoice
      ? 'Hãy phân tích sâu sắc, so sánh đa chiều và đưa ra cán cân tỷ lệ % cùng khuyến nghị dứt khoát.'
      : 'Hãy mở đầu bằng thông điệp tổng quan, sau đó luận từng vị trí trong quan hệ với câu hỏi, kết nối các lá với nhau và đưa ra chỉ dẫn thực tế.';
    return `## Câu hỏi\n${question}\n\n## Trải bài\n${spread.name.vi}: ${spread.description.vi}\n\n## Các lá đã rút\n${cardsBlock(cards, locale)}${profileBlock(profile, locale)}${twoChoiceInstruction}${regenerateInstruction}\n\n${closingInstruction}`;
  }

  const closingInstruction = isTwoChoice
    ? 'Analyze deeply, compare both paths rigorously, and provide the percentage balance with decisive guidance.'
    : 'Begin with the overall message, interpret each position in relation to the question, connect the cards, and finish with practical guidance.';
  return `## Question\n${question}\n\n## Spread\n${spread.name.en}: ${spread.description.en}\n\n## Drawn cards\n${cardsBlock(cards, locale)}${profileBlock(profile, locale)}${twoChoiceInstruction}${regenerateInstruction}\n\n${closingInstruction}`;
}

export function buildFollowUpDecisionPrompt(
  originalQuestion: string,
  previousInterpretation: string,
  followUpQuestion: string,
  locale: TarotLocale
): string {
  const instruction = locale === 'vi'
    ? 'Chỉ trả về JSON hợp lệ: {"decision":"direct"|"draw","drawCount":0|1|2|3,"reason":"lý do ngắn"}. Chọn direct nếu bài hiện tại đủ để trả lời. Chọn draw chỉ khi câu hỏi mở ra một khía cạnh mới cần làm rõ.'
    : 'Return valid JSON only: {"decision":"direct"|"draw","drawCount":0|1|2|3,"reason":"short reason"}. Choose direct when the existing reading is sufficient. Choose draw only when the follow-up introduces a genuinely new angle needing clarification.';
  return `${instruction}\n\nOriginal question:\n${originalQuestion}\n\nPrevious interpretation:\n${previousInterpretation.slice(0, 12_000)}\n\nFollow-up question:\n${followUpQuestion}`;
}

export function parseFollowUpDecision(value: string): { decision: 'direct' | 'draw'; drawCount: number; reason: string } {
  const match = value.match(/\{[^{}]*"decision"[^{}]*\}/);
  if (!match) return { decision: 'direct', drawCount: 0, reason: '' };
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const decision = String(parsed.decision).toLowerCase() === 'draw' ? 'draw' : 'direct';
    const rawCount = typeof parsed.drawCount === 'number' ? parsed.drawCount : 0;
    const drawCount = decision === 'draw' ? Math.max(1, Math.min(3, Math.floor(rawCount || 1))) : 0;
    const reason = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 160) : '';
    return { decision, drawCount, reason };
  } catch {
    return { decision: 'direct', drawCount: 0, reason: '' };
  }
}

export function buildFollowUpReadingPrompt(input: {
  originalQuestion: string;
  previousInterpretation: string;
  followUpQuestion: string;
  spread: TarotSpread;
  originalCards: DrawnTarotCard[];
  additionalCards: DrawnTarotCard[];
  profile?: ProfileContext;
  locale: TarotLocale;
}): string {
  const { originalQuestion, previousInterpretation, followUpQuestion, spread, originalCards, additionalCards, profile, locale } = input;
  const extra = additionalCards.length
    ? `\n\n${locale === 'vi' ? '## Lá bổ sung' : '## Supplementary cards'}\n${cardsBlock(additionalCards, locale)}`
    : '';

  const isTwoChoice = isTwoChoiceContext(spread, originalQuestion) || isTwoChoiceContext(spread, followUpQuestion);
  const twoChoiceFollowUp = isTwoChoice
    ? (locale === 'vi'
      ? '\nNếu câu hỏi này đào sâu về 2 phương án, hãy duy trì lập trường nhất quán, củng cố hoặc hiệu chỉnh tỷ lệ % nghiêng kèm lý do thực tế.'
      : '\nIf this follow-up continues comparing the two options, maintain a decisive stance and reinforce or refine the percentage leaning with concrete reasons.')
    : '';

  if (locale === 'vi') {
    return `## Câu hỏi ban đầu\n${originalQuestion}\n\n## Trải bài ban đầu\n${spread.name.vi}\n${cardsBlock(originalCards, locale)}\n\n## Lời giải trước\n${previousInterpretation.slice(0, 12_000)}\n\n## Câu hỏi tiếp theo\n${followUpQuestion}${extra}${profileBlock(profile, locale)}${twoChoiceFollowUp}\n\nTrả lời trực tiếp câu hỏi tiếp theo, giữ nhất quán với bài đã rút và nói rõ khi điều gì chỉ là khả năng.`;
  }
  return `## Original question\n${originalQuestion}\n\n## Original spread\n${spread.name.en}\n${cardsBlock(originalCards, locale)}\n\n## Previous interpretation\n${previousInterpretation.slice(0, 12_000)}\n\n## Follow-up question\n${followUpQuestion}${extra}${profileBlock(profile, locale)}${twoChoiceFollowUp}\n\nAnswer the follow-up directly, remain consistent with the drawn cards, and clearly label possibilities as possibilities.`;
}
