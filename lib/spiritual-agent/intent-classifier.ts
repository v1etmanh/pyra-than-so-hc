export type ChatAgentIntent =
  | 'two_choices'
  | 'timing_trajectory'
  | 'relationship'
  | 'holistic_analysis'
  | 'core_personality'
  | 'daily_guidance'
  | 'color_guidance'
  | 'where_to_go'
  | 'general';

// Avoid \b here because JavaScript word boundaries are ASCII-centric and
// fail after Vietnamese characters such as “ủ” in “ngủ”.
const ACTION_CHOICE_PATTERN = /(?:^|\s)(?:học|ngủ|đi|ở|mua|bán|ăn|uống|làm|nghỉ|nhắn|gọi|chờ|tiếp tục|dừng|quay lại|chia tay|đổi|giữ)(?=\s|$|[?.!,]).{0,60}\s(?:hay|hoặc|vs\.?|versus)\s(?:học|ngủ|đi|ở|mua|bán|ăn|uống|làm|nghỉ|nhắn|gọi|chờ|tiếp tục|dừng|quay lại|chia tay|đổi|giữ)(?=\s|$|[?.!,])/i;

function isTwoChoiceQuestion(message: string): boolean {
  const value = message.trim();
  const choiceSeparator = '(?:hay|hoặc|vs\\.?|versus|or)';
  const hasDecisionCue = new RegExp(
    `(?:nên|chọn|lựa chọn|phân vân|giữa|should i|choose|between).{1,120}\\s${choiceSeparator}\\s.{1,120}`,
    'i'
  ).test(value);
  const hasExplicitLabels = new RegExp(
    `(?:phương án|lựa chọn)\\s*a.{1,120}${choiceSeparator}.{1,120}(?:phương án|lựa chọn)\\s*b`,
    'i'
  ).test(value);
  const habitualStatement = /^(?:tôi|mình|em|anh|chị)\s+hay\s+(?:bị|lo|nghĩ|làm|thấy|cảm|quên|mất|đau|buồn|khóc)\b/i.test(value);
  const directQuestion = !habitualStatement
    && /\S.{1,80}\s(?:hay|hoặc|vs\.?|versus)\s\S.{1,80}\?\s*$/i.test(value);
  const directActionChoice = !habitualStatement && ACTION_CHOICE_PATTERN.test(value);

  return hasDecisionCue || hasExplicitLabels || directQuestion || directActionChoice;
}

/**
 * Deterministic intent fallback used only when model classification fails.
 * It intentionally favors precision except for direct A/B questions.
 */
export function classifyFallbackIntent(rawMessage: string): ChatAgentIntent {
  const message = rawMessage.toLocaleLowerCase('vi');
  const hasAny = (...terms: string[]) => terms.some((term) => message.includes(term));

  if (hasAny('màu', 'phối màu', 'mặc màu', 'sơn màu')) return 'color_guidance';
  if (isTwoChoiceQuestion(message)) return 'two_choices';
  if (hasAny('đi đâu', 'chỗ nào', 'nơi nào', 'quán nào', 'cà phê nào', 'cafe nào', 'địa điểm', 'đi chơi', 'hẹn hò ở đâu', 'dạo ở đâu', 'tham quan')) return 'where_to_go';
  if (hasAny('crush', 'người yêu', 'tình cảm', 'tình duyên', 'mối quan hệ', 'yêu đương', 'thích một người')) return 'relationship';
  if (hasAny('toàn cảnh', 'mọi khía cạnh', 'bế tắc', 'khủng hoảng', 'không lối thoát', 'phân tích tổng thể')) return 'holistic_analysis';
  if (hasAny('gốc rễ', 'nguyên nhân sâu', 'hành động nào', 'diễn biến', 'tiến trình', 'thời gian tới', 'tương lai', 'tháng tới', 'năm nay', 'vận hạn')) return 'timing_trajectory';
  if (hasAny('tính cách', 'sứ mệnh', 'điểm mạnh', 'điểm yếu', 'bản thân tôi')) return 'core_personality';
  if (hasAny('hôm nay', 'ngày mai', 'mặc gì', 'ăn gì')) return 'daily_guidance';
  return 'general';
}
