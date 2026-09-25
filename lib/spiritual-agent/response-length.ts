/**
 * Small, deterministic response budgets for the legacy mobile chat agent.
 * The LLM is prompted to respect these limits; this module validates the
 * completed reply so the UI never receives a response that is too long.
 */

export type ChatResponseComplexity = 'standard' | 'complex';

export type ChatResponseBudget = {
  complexity: ChatResponseComplexity;
  maxTokens: number;
  maxWords: number;
  maxChars: number;
  sectionLimits: {
    conclusion: { maxWords: number; maxChars: number };
    reasoning: { maxWords: number; maxChars: number };
    actions: { maxWords: number; maxChars: number };
  };
};

export const CHAT_RESPONSE_BUDGETS: Record<ChatResponseComplexity, ChatResponseBudget> = {
  standard: {
    complexity: 'standard',
    maxTokens: 800,
    maxWords: 350,
    maxChars: 2200,
    sectionLimits: {
      conclusion: { maxWords: 80, maxChars: 450 },
      reasoning: { maxWords: 250, maxChars: 1500 },
      actions: { maxWords: 80, maxChars: 450 },
    },
  },
  complex: {
    complexity: 'complex',
    maxTokens: 1200,
    maxWords: 500,
    maxChars: 3000,
    sectionLimits: {
      conclusion: { maxWords: 100, maxChars: 600 },
      reasoning: { maxWords: 350, maxChars: 2000 },
      actions: { maxWords: 100, maxChars: 600 },
    },
  },
};

type BudgetInput = {
  intent?: string | null;
  cardCount?: number | null;
  isCouple?: boolean;
};

const COMPLEX_INTENTS = new Set(['two_choices', 'timing_trajectory', 'love_match']);

export function getChatResponseBudget(input: BudgetInput = {}): ChatResponseBudget {
  const isComplex = Boolean(
    input.isCouple ||
    (input.cardCount || 0) >= 3 ||
    (input.intent && COMPLEX_INTENTS.has(input.intent))
  );
  return CHAT_RESPONSE_BUDGETS[isComplex ? 'complex' : 'standard'];
}

const SECTION_HEADINGS = {
  conclusion: '✦ KẾT LUẬN NHANH:',
  reasoning: '✦ VÌ SAO:',
  actions: '✦ NÊN LÀM GÌ:',
} as const;

type SectionName = keyof typeof SECTION_HEADINGS;
type ParsedSections = Record<SectionName, string>;

const DEFAULT_FALLBACKS: Record<ChatResponseComplexity, ParsedSections> = {
  standard: {
    conclusion: 'Hãy ưu tiên một bước rõ ràng và vừa sức trước mắt.',
    reasoning: '• Bạn đã có đủ dữ kiện để bắt đầu, chỉ cần tránh ôm quá nhiều việc.\n• Một nhịp đi chậm mà đều sẽ giúp bạn tự tin hơn.',
    actions: '• Chọn một việc quan trọng nhất cho hôm nay.\n• Hoàn thành việc đó trước khi nhận thêm cam kết.',
  },
  complex: {
    conclusion: 'Hướng đi này có triển vọng khi bạn giữ sự rõ ràng và nhất quán.',
    reasoning: '• Các dấu hiệu hiện tại cho thấy cơ hội và thử thách cùng xuất hiện.\n• Sự chủ động có chuẩn bị sẽ giúp bạn tận dụng lợi thế tốt hơn.\n• Trao đổi thẳng thắn sẽ hạn chế hiểu lầm không cần thiết.',
    actions: '• Chốt một bước nhỏ có thể thực hiện ngay hôm nay.\n• Kiểm tra lại kết quả sau một tuần để điều chỉnh.',
  },
};

const headingPatterns: Record<SectionName, RegExp> = {
  conclusion: /(?:^|\n)\s*(?:✦\s*)?KẾT LUẬN(?:\s+NHANH)?\s*:/i,
  reasoning: /(?:^|\n)\s*(?:✦\s*)?VÌ SAO(?:\s*\([^\n]*\))?\s*:/i,
  actions: /(?:^|\n)\s*(?:✦\s*)?NÊN LÀM GÌ(?:\s*\([^\n]*\))?\s*:/i,
};

function wordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function cleanSection(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/\s{2,}/g, ' '))
    .filter(Boolean)
    .join('\n');
}

function sentenceCount(value: string): number {
  const punctuation = value.match(/[.!?…]+(?:[”’"')\]]*)/g);
  return punctuation?.length || 1;
}

function isCompleteSentence(value: string): boolean {
  return /[.!?…](?:[”’"')\]]*)$/.test(value.trim());
}

function normalizeBullets(value: string, minimum: number, maximum: number): string | null {
  const lines = value.split('\n').filter(Boolean);
  if (lines.length < minimum) return null;

  const limitedLines = lines.slice(0, maximum);
  const bullets = limitedLines.map((line) => {
    const match = line.match(/^(?:[•*-]|\d+[.)])\s+(.+)$/);
    let content = match ? match[1].trim() : line.trim();
    if (!content) return null;
    if (!isCompleteSentence(content)) {
      content = `${content}.`;
    }
    return `• ${content}`;
  });

  const valid = bullets.filter(Boolean) as string[];
  return valid.length >= minimum ? valid.join('\n') : null;
}

function normalizeStructure(sections: ParsedSections): ParsedSections | null {
  const conclusionLines = sections.conclusion.split('\n').filter(Boolean);
  let conclusion = conclusionLines.join(' ').trim();
  if (!conclusion) return null;
  if (!isCompleteSentence(conclusion)) {
    conclusion = `${conclusion}.`;
  }

  const reasoning = normalizeBullets(sections.reasoning, 1, 5);
  const actions = normalizeBullets(sections.actions, 1, 3);
  if (!reasoning || !actions) return null;

  return { conclusion, reasoning, actions };
}

function parseSections(raw: string): ParsedSections | null {
  const source = raw.replace(/\r\n?/g, '\n').trim();
  if (!source) return null;

  const conclusion = headingPatterns.conclusion.exec(source);
  const reasoning = headingPatterns.reasoning.exec(source);
  const actions = headingPatterns.actions.exec(source);
  if (!conclusion || !reasoning || !actions) return null;

  const conclusionStart = conclusion.index + conclusion[0].length;
  const reasoningStart = reasoning.index + reasoning[0].length;
  const actionsStart = actions.index + actions[0].length;

  if (conclusion.index > reasoning.index || reasoning.index > actions.index) return null;

  const parsed: ParsedSections = {
    conclusion: cleanSection(source.slice(conclusionStart, reasoning.index)),
    reasoning: cleanSection(source.slice(reasoningStart, actions.index)),
    actions: cleanSection(source.slice(actionsStart)),
  };

  return parsed.conclusion && parsed.reasoning && parsed.actions ? parsed : null;
}

function formatSections(sections: ParsedSections): string {
  return [
    SECTION_HEADINGS.conclusion,
    sections.conclusion,
    '',
    SECTION_HEADINGS.reasoning,
    sections.reasoning,
    '',
    SECTION_HEADINGS.actions,
    sections.actions,
  ].join('\n').trim();
}

function fitsBudget(sections: ParsedSections, formatted: string, budget: ChatResponseBudget): boolean {
  if (formatted.length > budget.maxChars || wordCount(formatted) > budget.maxWords) return false;

  return (Object.keys(sections) as SectionName[]).every((name) => {
    const value = sections[name];
    const limit = budget.sectionLimits[name];
    return value.length <= limit.maxChars && wordCount(value) <= limit.maxWords;
  });
}

function safeFallback(fallback: string, budget: ChatResponseBudget): string {
  const parsed = parseSections(fallback);
  const normalized = parsed && normalizeStructure(parsed);
  if (normalized) {
    const formatted = formatSections(normalized);
    if (fitsBudget(normalized, formatted, budget)) return formatted;
  }

  return formatSections(DEFAULT_FALLBACKS[budget.complexity]);
}

/**
 * Truncates an overlong section gently without breaking sentences.
 */
function trimToBudget(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);
  const lastDot = Math.max(sliced.lastIndexOf('.'), sliced.lastIndexOf('!'), sliced.lastIndexOf('?'));
  return lastDot > 40 ? sliced.slice(0, lastDot + 1) : `${sliced.trim()}...`;
}

/**
 * Canonicalizes a valid three-section reply. If the model output is slightly
 * overlong or missing punctuation, it cleans and formats it rather than
 * discarding it into a stale fallback template.
 */
export function normalizeChatReply(
  raw: string,
  fallback: string,
  complexity: ChatResponseComplexity
): string {
  const budget = CHAT_RESPONSE_BUDGETS[complexity];
  const fallbackReply = safeFallback(fallback, budget);
  
  if (!raw || raw.trim().length < 20) return fallbackReply;

  // 1. Cố gắng parse 3 phần chuẩn
  const parsed = parseSections(raw);
  if (parsed) {
    const sections = normalizeStructure(parsed);
    if (sections) {
      // Tự động gọt nhẹ nếu vượt giới hạn thay vì vứt bỏ
      const trimmedSections: ParsedSections = {
        conclusion: trimToBudget(sections.conclusion, budget.sectionLimits.conclusion.maxChars),
        reasoning: trimToBudget(sections.reasoning, budget.sectionLimits.reasoning.maxChars),
        actions: trimToBudget(sections.actions, budget.sectionLimits.actions.maxChars),
      };
      return formatSections(trimmedSections);
    }
  }

  // 2. Nếu AI trả về câu trả lời có ý nghĩa nhưng không đúng 3 heading
  // (Ví dụ AI viết thành đoạn văn phân tích), tự động trích xuất cấu trúc để giữ lời AI
  const cleanRaw = raw
    .replace(/^[\s\S]*?(?=✦?\s*KẾT LUẬN|✦?\s*VÌ SAO|Chào bạn|Thông điệp|Lá bài)/i, '')
    .trim();

  if (cleanRaw.length >= 60 && !cleanRaw.includes('The user is asking about')) {
    // Nếu có dạng 3 đoạn hoặc văn bản phân tích, định dạng lại
    return cleanRaw.slice(0, budget.maxChars);
  }

  return fallbackReply;
}
