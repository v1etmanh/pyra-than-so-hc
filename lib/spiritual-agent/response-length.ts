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
    maxWords: 240,
    maxChars: 1950,
    sectionLimits: {
      conclusion: { maxWords: 70, maxChars: 500 },
      reasoning: { maxWords: 140, maxChars: 1050 },
      actions: { maxWords: 60, maxChars: 480 },
    },
  },
  complex: {
    complexity: 'complex',
    maxTokens: 1200,
    maxWords: 300,
    maxChars: 2350,
    sectionLimits: {
      conclusion: { maxWords: 80, maxChars: 600 },
      reasoning: { maxWords: 180, maxChars: 1320 },
      actions: { maxWords: 70, maxChars: 520 },
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
  actions: '✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:',
} as const;

type SectionName = keyof typeof SECTION_HEADINGS;
type ParsedSections = Record<SectionName, string>;

const DEFAULT_FALLBACKS: Record<ChatResponseComplexity, ParsedSections> = {
  standard: {
    conclusion: 'Mình chưa thể hoàn tất lượt đọc này đủ rõ để đưa ra lời khuyên đáng tin.',
    reasoning: '• Phản hồi vừa nhận bị thiếu cấu trúc hoặc không bám đủ dữ liệu được cung cấp.\n• Mình sẽ không lấp chỗ trống bằng một lời khuyên chung chung.',
    actions: '• Bạn có thể gửi lại câu hỏi khi muốn bắt đầu một lượt đọc mới; đôi khi một lần dừng ngắn cũng giúp câu hỏi tìm được đúng trọng tâm.',
  },
  complex: {
    conclusion: 'Mình chưa thể hoàn tất lượt đọc này đủ rõ để chốt một hướng đáng tin.',
    reasoning: '• Phản hồi vừa nhận chưa đáp ứng đủ cấu trúc hoặc lập trường mà câu hỏi cần.\n• Mình sẽ không ghép các tín hiệu trái chiều thành một câu trả lời ba phải.',
    actions: '• Bạn có thể gửi lại câu hỏi khi muốn bắt đầu một lượt đọc mới; sự rõ ràng đáng tin luôn quan trọng hơn một câu trả lời được ghép vội.',
  },
};

const headingPatterns: Record<SectionName, RegExp> = {
  conclusion: /(?:^|\n)\s*(?:✦\s*)?KẾT LUẬN(?:\s+NHANH)?\s*:/i,
  reasoning: /(?:^|\n)\s*(?:✦\s*)?VÌ SAO(?:\s*\([^\n]*\))?\s*:/i,
  actions: /(?:^|\n)\s*(?:✦\s*)?(?:ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM|NÊN LÀM GÌ)(?:\s*\([^\n]*\))?\s*:/i,
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
  const lines: string[] = [];
  for (const line of value.split('\n').filter(Boolean)) {
    if (/^(?:[•*-]|\d+[.)])\s+/.test(line)) {
      lines.push(line);
    } else if (lines.length > 0) {
      lines[lines.length - 1] += ` ${line}`;
    } else {
      // The model sometimes writes a section as one prose paragraph without a
      // bullet marker. Treat it as a single implicit bullet; completeness and
      // bullet-count limits below still apply.
      lines.push(`• ${line}`);
    }
  }
  if (lines.length < minimum || lines.length > maximum) return null;

  const bullets = lines.map((line) => {
    const match = line.match(/^(?:[•*-]|\d+[.)])\s+(.+)$/);
    const content = match?.[1].trim();
    if (!content || !isCompleteSentence(content)) return null;
    return `• ${content}`;
  });

  if (bullets.some((bullet) => bullet === null)) return null;
  return (bullets as string[]).join('\n');
}

function normalizeStructure(sections: ParsedSections, complexity: ChatResponseComplexity): ParsedSections | null {
  const conclusionLines = sections.conclusion.split('\n').filter(Boolean);
  const conclusion = conclusionLines.join(' ').trim();
  if (!conclusion || !isCompleteSentence(conclusion) || sentenceCount(conclusion) > 3) return null;

  const reasoning = normalizeBullets(sections.reasoning, 1, complexity === 'complex' ? 5 : 4);
  const actions = normalizeBullets(sections.actions, 1, 2);
  if (!reasoning || !actions) return null;

  return { conclusion, reasoning, actions };
}

function parseSections(raw: string): ParsedSections | null {
  // Accept common presentation differences without discarding the answer.
  // Completion, section order, bullet counts and budgets are still checked.
  const source = raw.replace(/\r\n?/g, '\n')
    .replace(/\*\*([^\n]+?)\*\*/g, '$1')
    .replace(/__([^\n]+?)__/g, '$1')
    .replace(/^(?:#{1,6})\s+(?=(?:✦\s*)?(?:KẾT LUẬN|VÌ SAO|ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM|NÊN LÀM GÌ))/gim, '')
    .trim();
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
  const normalized = parsed && normalizeStructure(parsed, budget.complexity);
  if (normalized) {
    const formatted = formatSections(normalized);
    if (fitsBudget(normalized, formatted, budget)) return formatted;
  }

  return formatSections(DEFAULT_FALLBACKS[budget.complexity]);
}

/**
 * Accept only complete three-section replies. A partial model response must
 * never be shown as a successful answer.
 */
export function normalizeChatReply(
  raw: string,
  fallback: string,
  complexity: ChatResponseComplexity
): string {
  return normalizeChatReplyWithDiagnostics(raw, fallback, complexity).replyText;
}

export function normalizeChatReplyWithDiagnostics(
  raw: string,
  fallback: string,
  complexity: ChatResponseComplexity
): { replyText: string; usedAI: boolean; rejectionReason?: string } {
  const budget = CHAT_RESPONSE_BUDGETS[complexity];
  const fallbackReply = safeFallback(fallback, budget);
  
  if (!raw || raw.trim().length < 20) {
    return { replyText: fallbackReply, usedAI: false, rejectionReason: 'empty_or_too_short' };
  }

  const parsed = parseSections(raw);
  if (parsed) {
    const sections = normalizeStructure(parsed, complexity);
    if (sections) {
      const formatted = formatSections(sections);
      if (fitsBudget(sections, formatted, budget)) return { replyText: formatted, usedAI: true };
      return { replyText: fallbackReply, usedAI: false, rejectionReason: 'response_budget_exceeded' };
    }
  }

  return {
    replyText: fallbackReply,
    usedAI: false,
    rejectionReason: parsed ? 'incomplete_sentence_or_invalid_bullets' : 'missing_or_unordered_sections',
  };
}
