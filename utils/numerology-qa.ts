import {
  MOCK_NUMEROLOGY_INDICATORS,
  type MockNumerologyIndicator
} from '../mocks/numerology-indicators.ts';

export type IndicatorSearchResult = MockNumerologyIndicator & { score: number };

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase()
    .trim();
}

const SEARCH_STOPWORDS = new Set([
  'cau', 'hoi', 'khong', 'thuoc', 'nay', 'toi', 'la', 'gi', 'cua', 'va',
  'what', 'does', 'my', 'mean', 'the', 'is', 'about', 'number', 'so'
]);

function tokens(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 2 && !SEARCH_STOPWORDS.has(token));
}

function scoreIndicator(query: string, indicator: MockNumerologyIndicator): number {
  const normalizedQuery = normalizeText(query);
  const queryTokens = new Set(tokens(query));
  if (!normalizedQuery || queryTokens.size === 0) return 0;
  const searchable = [
    indicator.key,
    indicator.nameVi,
    indicator.nameEn,
    indicator.category,
    ...indicator.aliases
  ].map(normalizeText);

  let score = 0;
  for (const value of searchable) {
    if (value === normalizedQuery) score += 100;
    else if (value.includes(normalizedQuery) || normalizedQuery.includes(value)) score += 35;
  }

  for (const token of Array.from(queryTokens)) {
    if (searchable.some((value) => tokens(value).includes(token))) score += 12;
  }

  return score;
}

export function searchMockIndicators(query: string, limit = 8): IndicatorSearchResult[] {
  const safeLimit = Math.max(1, Math.min(24, Math.floor(limit)));
  if (!query.trim()) return [];

  return MOCK_NUMEROLOGY_INDICATORS
    .map((indicator) => ({ indicator, score: scoreIndicator(query, indicator) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.indicator.nameVi.localeCompare(b.indicator.nameVi))
    .slice(0, safeLimit)
    .map(({ indicator, score }) => ({ ...indicator, score }));
}

export function getMockIndicator(key: string): MockNumerologyIndicator | undefined {
  return MOCK_NUMEROLOGY_INDICATORS.find((indicator) => indicator.key === key);
}

export type MockAnswer = {
  mock: true;
  source: 'mock-24-indicators';
  indicator: MockNumerologyIndicator;
  answer: string;
  confidence: number;
};

export function buildMockAnswer(input: {
  question: string;
  indicator?: MockNumerologyIndicator;
  indicatorValue?: string | number;
  locale?: string;
}): MockAnswer {
  const indicator = input.indicator ?? searchMockIndicators(input.question, 1)[0];
  if (!indicator) throw new Error('Không tìm thấy chỉ số phù hợp với câu hỏi.');

  const value = input.indicatorValue ?? indicator.mockValue;
  const isEnglish = input.locale?.toLowerCase().startsWith('en');
  const answer = isEnglish
    ? `Mock reading for ${indicator.nameEn} (${value}): this indicator reflects ${indicator.summaryEn} Your question was “${input.question}”. Use this as a reflective starting point rather than a certain prediction.`
    : `Luận giải mock cho ${indicator.nameVi} (${value}): chỉ số này gợi ý về ${indicator.summaryVi} Câu hỏi của bạn là “${input.question}”. Hãy dùng nội dung này như điểm bắt đầu để tự phản chiếu, không xem là dự đoán chắc chắn.`;

  return {
    mock: true,
    source: 'mock-24-indicators',
    indicator,
    answer,
    confidence: 0.98
  };
}
