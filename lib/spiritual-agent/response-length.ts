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
    maxTokens: 400,
    maxWords: 150,
    maxChars: 900,
    sectionLimits: {
      conclusion: { maxWords: 36, maxChars: 180 },
      reasoning: { maxWords: 80, maxChars: 440 },
      actions: { maxWords: 34, maxChars: 180 },
    },
  },
  complex: {
    complexity: 'complex',
    maxTokens: 600,
    maxWords: 220,
    maxChars: 1400,
    sectionLimits: {
      conclusion: { maxWords: 45, maxChars: 260 },
      reasoning: { maxWords: 130, maxChars: 780 },
      actions: { maxWords: 45, maxChars: 250 },
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
  if (lines.length < minimum || lines.length > maximum) return null;

  const bullets = lines.map((line) => {
    const match = line.match(/^(?:[•*-]|\d+[.)])\s+(.+)$/);
    const content = match?.[1].trim();
    return content && isCompleteSentence(content) ? `• ${content}` : null;
  });

  return bullets.every(Boolean) ? bullets.join('\n') : null;
}

function normalizeStructure(sections: ParsedSections): ParsedSections | null {
  const conclusionLines = sections.conclusion.split('\n').filter(Boolean);
  const conclusion = conclusionLines.join(' ');
  if (
    conclusionLines.length > 2 ||
    /^(?:[•*-]|\d+[.)])\s+/.test(conclusion) ||
    sentenceCount(conclusion) > 2 ||
    !isCompleteSentence(conclusion)
  ) {
    return null;
  }

  const reasoning = normalizeBullets(sections.reasoning, 2, 4);
  const actions = normalizeBullets(sections.actions, 1, 2);
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
 * Canonicalizes a valid three-section reply. Invalid, incomplete, or overlong
 * model output falls back as a whole, which prevents a mid-sentence cut-off.
 */
export function normalizeChatReply(
  raw: string,
  fallback: string,
  complexity: ChatResponseComplexity
): string {
  const budget = CHAT_RESPONSE_BUDGETS[complexity];
  const fallbackReply = safeFallback(fallback, budget);
  const parsed = parseSections(raw);
  const sections = parsed && normalizeStructure(parsed);
  if (!sections) return fallbackReply;

  const formatted = formatSections(sections);
  return fitsBudget(sections, formatted, budget) ? formatted : fallbackReply;
}
