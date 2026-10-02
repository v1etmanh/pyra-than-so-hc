/** Indicators that describe relatively stable tendencies useful for personalizing chat advice. */
export const personalityIndicatorKeys = [
  'walksOfLife',
  'soul',
  'personality',
  'attitude',
  'rationalThinking',
  'mission'
] as const;

export type PersonalityIndicatorKey = (typeof personalityIndicatorKeys)[number];

export const personalityIndicatorDescriptions: Record<PersonalityIndicatorKey, string> = {
  walksOfLife: 'khuynh hướng và bài học cốt lõi; dùng cho câu hỏi về bản thân',
  soul: 'nhu cầu cảm xúc và động lực bên trong; dùng cho tình cảm hoặc điều người hỏi thực sự muốn',
  personality: 'cách thể hiện ra ngoài và tương tác xã hội',
  attitude: 'phản ứng ban đầu trước tình huống mới; hữu ích cho lời khuyên trước mắt',
  rationalThinking: 'cách suy nghĩ và cân nhắc lựa chọn',
  mission: 'định hướng đóng góp; chỉ dùng khi hỏi rõ về sứ mệnh hoặc công việc'
};

const personalityIndicatorSet: ReadonlySet<string> = new Set(personalityIndicatorKeys);

export function isPersonalityIndicatorKey(value: unknown): value is PersonalityIndicatorKey {
  return typeof value === 'string' && personalityIndicatorSet.has(value);
}

export function filterPersonalityIndicatorKeys(value: unknown, limit = 5): PersonalityIndicatorKey[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isPersonalityIndicatorKey))).slice(0, limit);
}

export const personalityIndicatorFallbacks: Record<string, PersonalityIndicatorKey[]> = {
  two_choices: ['rationalThinking', 'attitude'],
  timing_trajectory: ['attitude', 'rationalThinking'],
  relationship: ['soul', 'personality', 'attitude'],
  holistic_analysis: ['walksOfLife', 'soul', 'personality', 'rationalThinking', 'attitude'],
  core_personality: ['walksOfLife', 'soul', 'personality', 'attitude', 'rationalThinking'],
  daily_guidance: ['attitude', 'soul'],
  where_to_go: ['attitude', 'soul'],
  general: ['attitude', 'soul']
};
