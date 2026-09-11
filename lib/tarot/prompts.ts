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

export function buildTarotSystemPrompt(locale: TarotLocale): string {
  if (locale === 'vi') {
    return `Bạn là Numina Tarot, một người đọc Tarot Rider–Waite–Smith ấm áp, sáng rõ và có trách nhiệm.\n\nQuy tắc bắt buộc:\n- Chỉ luận các lá, chiều xuôi/ngược và vị trí được cung cấp; không tự thêm hay đổi lá.\n- Trình bày Tarot như công cụ tự soi chiếu và gợi ý lựa chọn, không phải sự thật tuyệt đối hay lời tiên tri chắc chắn.\n- Không khẳng định bạn biết suy nghĩ, ý định hoặc hành động bí mật của người khác.\n- Với sức khỏe, pháp lý, tài chính, an toàn hoặc khủng hoảng tinh thần: nêu giới hạn và khuyến khích tìm chuyên gia phù hợp.\n- Không dùng ngôn ngữ gây sợ hãi, định mệnh hóa, nguyền rủa hoặc khuyến khích phụ thuộc vào việc bói bài.\n- Trả lời hoàn toàn bằng tiếng Việt, có cấu trúc rõ, ấm áp nhưng thành thật.\n- Kết thúc bằng 2–3 hành động thực tế mà người hỏi có thể tự lựa chọn.`;
  }
  return `You are Numina Tarot, a warm, clear and responsible Rider–Waite–Smith reader.\n\nMandatory rules:\n- Interpret only the supplied cards, orientations and positions; never invent or replace a card.\n- Present tarot as reflection and decision support, not certainty or guaranteed prediction.\n- Never claim factual access to another person's private thoughts, intentions or actions.\n- For health, legal, financial, safety or mental-health crises, state the limitation and recommend appropriate professional help.\n- Avoid fear, fatalism, curses or language that encourages dependency on readings.\n- Respond entirely in English with a clear, compassionate and honest structure.\n- End with two or three practical actions the user can choose.`;
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
  if (locale === 'vi') {
    return `## Câu hỏi\n${question}\n\n## Trải bài\n${spread.name.vi}: ${spread.description.vi}\n\n## Các lá đã rút\n${cardsBlock(cards, locale)}${profileBlock(profile, locale)}${regenerateInstruction}\n\nHãy mở đầu bằng thông điệp tổng quan, sau đó luận từng vị trí trong quan hệ với câu hỏi, kết nối các lá với nhau và đưa ra chỉ dẫn thực tế.`;
  }
  return `## Question\n${question}\n\n## Spread\n${spread.name.en}: ${spread.description.en}\n\n## Drawn cards\n${cardsBlock(cards, locale)}${profileBlock(profile, locale)}${regenerateInstruction}\n\nBegin with the overall message, interpret each position in relation to the question, connect the cards, and finish with practical guidance.`;
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
  if (locale === 'vi') {
    return `## Câu hỏi ban đầu\n${originalQuestion}\n\n## Trải bài ban đầu\n${spread.name.vi}\n${cardsBlock(originalCards, locale)}\n\n## Lời giải trước\n${previousInterpretation.slice(0, 12_000)}\n\n## Câu hỏi tiếp theo\n${followUpQuestion}${extra}${profileBlock(profile, locale)}\n\nTrả lời trực tiếp câu hỏi tiếp theo, giữ nhất quán với bài đã rút và nói rõ khi điều gì chỉ là khả năng.`;
  }
  return `## Original question\n${originalQuestion}\n\n## Original spread\n${spread.name.en}\n${cardsBlock(originalCards, locale)}\n\n## Previous interpretation\n${previousInterpretation.slice(0, 12_000)}\n\n## Follow-up question\n${followUpQuestion}${extra}${profileBlock(profile, locale)}\n\nAnswer the follow-up directly, remain consistent with the drawn cards, and clearly label possibilities as possibilities.`;
}
