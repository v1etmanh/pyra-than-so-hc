export type ChatReplyQualityInput = {
  intent?: string | null;
  userMessage: string;
  coupleProfileNames?: [string, string];
};

export type ChatReplyQualityResult = {
  valid: boolean;
  reason?: string;
};

const INSTRUCTION_LEAK_PATTERNS = [
  /theo (?:dữ liệu|chỉ dẫn|quy tắc) được cung cấp/i,
  /không phải (?:chu kỳ|mốc).{0,30}(?:dự báo|tarot|thần số học)/i,
  /tôi đang tuân thủ/i,
  /intent contract/i,
];

const RELATIONSHIP_MIND_READING_PATTERNS = [
  /(?:họ|người ấy|đối phương).{0,24}(?:còn yêu|thật sự muốn|muốn quay lại|đang thử lòng|đang nghĩ|sẽ quay lại|chắc chắn)/i,
  /(?:còn tình cảm|có tình cảm).{0,20}(?:với bạn|dành cho bạn)/i,
];

export function validateChatReplyQuality(
  reply: string,
  input: ChatReplyQualityInput
): ChatReplyQualityResult {
  // Keep this gate deliberately small. Structure, completeness and response
  // budgets are already enforced by normalizeChatReplyWithDiagnostics. The
  // quality validator should only reject leaks and a narrow safety violation,
  // not retry otherwise useful answers because they missed fixed phrasing.
  if (INSTRUCTION_LEAK_PATTERNS.some((pattern) => pattern.test(reply))) {
    return { valid: false, reason: 'instruction_leak' };
  }

  if (input.intent === 'relationship') {
    if (RELATIONSHIP_MIND_READING_PATTERNS.some((pattern) => pattern.test(reply))) {
      return { valid: false, reason: 'relationship_mind_reading' };
    }
  }

  return { valid: true };
}

export function buildChatReplyRepairInstruction(reason: string | undefined): string {
  const detail: Record<string, string> = {
    instruction_leak: 'Câu trả lời đang nhắc lại quy tắc nội bộ. Hãy tuân thủ chúng âm thầm và chỉ nói nội dung hữu ích cho người dùng.',
    relationship_mind_reading: 'Câu trả lời đang suy đoán tâm trí người thứ ba. Chỉ được đánh giá hành vi quan sát được.',
    response_budget_exceeded: 'Câu trả lời quá dài. Hãy rút gọn nhưng giữ đủ ba phần.',
    incomplete_sentence_or_invalid_bullets: 'Bullet hoặc câu chưa hoàn chỉnh. Mỗi ý phải bắt đầu bằng • và kết thúc bằng dấu câu.',
    missing_or_unordered_sections: 'Thiếu hoặc sai thứ tự ba tiêu đề bắt buộc. Hãy dùng đúng KẾT LUẬN NHANH, VÌ SAO, ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM.',
    empty_or_too_short: 'Phản hồi trước bị trống hoặc quá ngắn. Hãy trả lời đầy đủ theo hợp đồng.',
  };

  return `YÊU CẦU TỰ SỬA TRƯỚC KHI TRẢ LỜI: ${detail[reason || ''] || 'Phản hồi trước chưa đạt hợp đồng. Hãy kiểm tra lại lập trường, cấu trúc và dữ liệu.'} Không nhắc đến lần sửa này trong câu trả lời.`;
}
