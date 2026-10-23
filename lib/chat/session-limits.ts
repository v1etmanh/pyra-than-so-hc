/** The root reading is turn 0 and does not consume this follow-up quota. */
export const MAX_FOLLOW_UP_QUESTIONS = 10;
/** Backward-compatible alias used by existing callers. */
export const MAX_SESSION_QUESTIONS = MAX_FOLLOW_UP_QUESTIONS;
export const SESSION_QUESTION_LIMIT_CODE = 'SESSION_QUESTION_LIMIT_REACHED';

type ChatRole = { role: string };

export function countUserMessages(messages: readonly ChatRole[]): number {
  return messages.reduce((total, message) => total + (message.role === 'user' ? 1 : 0), 0);
}

export function getSessionQuestionCount(followUpCount: number): number {
  const safeFollowUpCount = Number.isFinite(followUpCount)
    ? Math.max(0, Math.floor(followUpCount))
    : 0;
  return Math.min(MAX_FOLLOW_UP_QUESTIONS, safeFollowUpCount);
}

export function getRemainingSessionQuestions(followUpCount: number): number {
  return Math.max(0, MAX_FOLLOW_UP_QUESTIONS - getSessionQuestionCount(followUpCount));
}

export function canAskSessionFollowUp(followUpCount: number): boolean {
  return getSessionQuestionCount(followUpCount) < MAX_FOLLOW_UP_QUESTIONS;
}

export function hasReachedSessionQuestionLimit(followUpCount: number): boolean {
  return !canAskSessionFollowUp(followUpCount);
}

export function sessionQuestionLimitMessage(locale: 'vi' | 'en'): string {
  return locale === 'vi'
    ? 'Phiên trò chuyện đã hoàn thành tối đa 10 câu hỏi. Hãy bắt đầu một phiên mới để tiếp tục.'
    : 'This conversation has reached its 10-question limit. Start a new session to continue.';
}
