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
    return `Bạn là NUMELYRA Tarot, một người đọc Tarot Rider–Waite–Smith ấm áp, sáng rõ và có trách nhiệm.\n\nQuy tắc bắt buộc:\n- Chỉ luận các lá, chiều xuôi/ngược và vị trí được cung cấp; không tự thêm hay đổi lá.\n- Trình bày Tarot như công cụ tự soi chiếu và gợi ý lựa chọn, không phải sự thật tuyệt đối hay lời tiên tri chắc chắn.\n- Không khẳng định bạn biết suy nghĩ, ý định hoặc hành động bí mật của người khác.\n- Với sức khỏe, pháp lý, tài chính, an toàn hoặc khủng hoảng tinh thần: nêu giới hạn và khuyến khích tìm chuyên gia phù hợp.\n- Không dùng ngôn ngữ gây sợ hãi, định mệnh hóa, nguyền rủa hoặc khuyến khích phụ thuộc vào việc bói bài.\n- Luôn đặt kết luận người dùng cần nghe lên trước phần phân tích. Câu đầu tiên phải trả lời trực tiếp câu hỏi và thể hiện một khuynh hướng rõ ràng.\n- Với câu hỏi có/không, dùng một trong các cách chốt: “nghiêng về có”, “nghiêng về không” hoặc “chưa đủ dấu hiệu” nếu dữ liệu thực sự không đủ. Không dùng kết luận nước đôi.\n- Với câu hỏi so sánh 2 lựa chọn (hoặc trải bài Hai lựa chọn): nêu ngay lựa chọn được nghiêng về và tỷ lệ phần trăm cụ thể cho hai bên; không trả lời 50/50.\n- Không kể lại lần lượt mọi lá bài. Chỉ chọn tối đa 3 tín hiệu mạnh nhất liên quan trực tiếp đến câu hỏi, trừ khi người dùng yêu cầu phân tích chi tiết từng lá.\n- Không kết luận bằng câu rỗng như “tùy bạn”, “cả hai đều có ưu và nhược điểm” hoặc “mọi khả năng đều có thể xảy ra”.\n- Trả lời hoàn toàn bằng tiếng Việt, có cấu trúc rõ, ấm áp nhưng thành thật.\n- Tuyệt đối không dùng bảng Markdown, bảng HTML hoặc các hàng phân cách bằng dấu |. Chỉ dùng tiêu đề ngắn, đoạn văn và danh sách gạch đầu dòng để dễ đọc trên điện thoại.`;
  }
  return `You are NUMELYRA Tarot, a warm, clear and responsible Rider–Waite–Smith reader.\n\nMandatory rules:\n- Interpret only the supplied cards, orientations and positions; never invent or replace a card.\n- Present tarot as reflection and decision support, not certainty or guaranteed prediction.\n- Never claim factual access to another person's private thoughts, intentions or actions.\n- For health, legal, financial, safety or mental-health crises, state the limitation and recommend appropriate professional help.\n- Avoid fear, fatalism, curses or language that encourages dependency on readings.\n- Always put the conclusion the user needs before the analysis. The first sentence must answer the question directly and take a clear directional stance.\n- For yes/no questions, conclude with “leans yes”, “leans no”, or “not enough evidence” only when the cards genuinely do not support a direction. Never give a fence-sitting answer.\n- For comparative or two-choice questions (or the Two Options spread), immediately name the favored option and provide an explicit percentage split; never answer 50/50.\n- Do not narrate every card in sequence. Use at most the three strongest signals tied directly to the question unless the user explicitly asks for a card-by-card analysis.\n- Do not use empty conclusions such as “it is up to you”, “both have pros and cons”, or “anything could happen”.\n- Respond entirely in English with a clear, compassionate and honest structure.\n- Never use Markdown tables, HTML tables, or pipe-delimited rows. Use only short headings, paragraphs, and bullet lists so the reading stays readable on mobile.`;
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
1. Ngay câu đầu của phần “Kết luận nhanh”, gọi tên lựa chọn được trải bài nghiêng về.
2. Đưa ra tỷ lệ phần trăm (%) cụ thể, tổng 2 bên = 100%. Viết thành hai gạch đầu dòng riêng, ví dụ:
   - Lựa chọn A: 65%
   - Lựa chọn B: 35%
3. Không viết hai bài phân tích dài riêng cho A và B. Chỉ nêu tối đa 3 lý do cô đọng rồi đưa ra 2 hành động thực tế.`
      : `\n\n### MANDATORY INSTRUCTION FOR TWO-CHOICE DILEMMAS:
1. In the first sentence under “Quick conclusion”, name the option favored by the reading.
2. Provide an explicit percentage split totaling 100%. Write it as two separate bullets, for example:
   - Option A: 65%
   - Option B: 35%
3. Do not write separate long analyses for A and B. Give at most three concise reasons, followed by two practical actions.`)
    : '';

  if (locale === 'vi') {
    const closingInstruction = `Viết 120–180 từ và tuân thủ đúng ba phần sau:
## Kết luận nhanh
Trả lời thẳng trong 1–2 câu đầu, nêu rõ hướng nghiêng; không mở bài hoặc kể lại câu hỏi.
## Vì sao
Tối đa 3 gạch đầu dòng, chỉ dùng các tín hiệu lá bài quan trọng nhất.
## Nên làm gì
Đúng 2 hành động ngắn, cụ thể.`;
    return `## Câu hỏi\n${question}\n\n## Trải bài\n${spread.name.vi}: ${spread.description.vi}\n\n## Các lá đã rút\n${cardsBlock(cards, locale)}${profileBlock(profile, locale)}${twoChoiceInstruction}${regenerateInstruction}\n\n${closingInstruction}`;
  }

  const closingInstruction = `Write 120–180 words using exactly these three sections:
## Quick conclusion
Answer directly in the first one or two sentences and state the direction clearly; do not add an introduction or restate the question.
## Why
Use at most three bullets containing only the strongest card signals.
## What to do
Give exactly two short, concrete actions.`;
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
    return `## Câu hỏi ban đầu\n${originalQuestion}\n\n## Trải bài ban đầu\n${spread.name.vi}\n${cardsBlock(originalCards, locale)}\n\n## Lời giải trước\n${previousInterpretation.slice(0, 12_000)}\n\n## Câu hỏi tiếp theo\n${followUpQuestion}${extra}${profileBlock(profile, locale)}${twoChoiceFollowUp}\n\nViết 60–100 từ. Không lặp lại lời giải trước. Dùng đúng ba phần “## Kết luận nhanh”, “## Vì sao”, “## Nên làm gì”. Trả lời trực tiếp trong câu đầu; phần “Vì sao” có tối đa 3 ý và phần cuối có 1–2 hành động cụ thể. Giữ nhất quán với bài đã rút và nói rõ khi điều gì chỉ là khả năng.`;
  }
  return `## Original question\n${originalQuestion}\n\n## Original spread\n${spread.name.en}\n${cardsBlock(originalCards, locale)}\n\n## Previous interpretation\n${previousInterpretation.slice(0, 12_000)}\n\n## Follow-up question\n${followUpQuestion}${extra}${profileBlock(profile, locale)}${twoChoiceFollowUp}\n\nWrite 60–100 words. Do not repeat the previous reading. Use exactly three sections: “## Quick conclusion”, “## Why”, and “## What to do”. Answer directly in the first sentence; include at most three supporting points and one or two concrete actions. Remain consistent with the drawn cards and clearly label possibilities as possibilities.`;
}
