export type ChatReplyQualityInput = {
  intent?: string | null;
  userMessage: string;
};

export type ChatReplyQualityResult = {
  valid: boolean;
  reason?: string;
};

const FENCE_SITTING_PATTERNS = [
  /tùy (?:bạn|thuộc)/i,
  /quyết định cuối cùng/i,
  /hãy lắng nghe (?:con tim|trực giác)/i,
  /cả hai (?:đều )?có (?:ưu|điểm)/i,
  /mọi khả năng đều/i,
  /không có lựa chọn nào/i,
];

const INSTRUCTION_LEAK_PATTERNS = [
  /theo (?:dữ liệu|chỉ dẫn|quy tắc) được cung cấp/i,
  /không phải (?:chu kỳ|mốc).{0,30}(?:dự báo|tarot|thần số học)/i,
  /tôi đang tuân thủ/i,
  /intent contract/i,
];

const WRITING_ACTION_PATTERN = /(?:ghi ra|ghi lại|ghi nhận|viết ra|viết nhật ký|lập danh sách|mở danh sách|đọc danh sách|note\b|tracker\b|bảng theo dõi|theo dõi tiến độ)/i;
const EXPLICIT_WRITING_REQUEST_PATTERN = /(?:ghi chép|ghi nhớ|note\b|nhật ký|danh sách|lập kế hoạch|bảng theo dõi|tracker\b)/i;

const RELATIONSHIP_MIND_READING_PATTERNS = [
  /(?:họ|người ấy|đối phương).{0,24}(?:còn yêu|thật sự muốn|muốn quay lại|đang thử lòng|đang nghĩ|sẽ quay lại|chắc chắn)/i,
  /(?:còn tình cảm|có tình cảm).{0,20}(?:với bạn|dành cho bạn)/i,
];

function extractSection(reply: string, start: string, end?: string): string {
  const startIndex = reply.toLocaleUpperCase('vi').indexOf(start.toLocaleUpperCase('vi'));
  if (startIndex < 0) return '';
  const contentStart = startIndex + start.length;
  if (!end) return reply.slice(contentStart).trim();
  const endIndex = reply.toLocaleUpperCase('vi').indexOf(end.toLocaleUpperCase('vi'), contentStart);
  return reply.slice(contentStart, endIndex < 0 ? undefined : endIndex).trim();
}

function wordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function validateChatReplyQuality(
  reply: string,
  input: ChatReplyQualityInput
): ChatReplyQualityResult {
  const conclusion = extractSection(reply, '✦ KẾT LUẬN NHANH:', '✦ VÌ SAO:');
  const actions = extractSection(reply, '✦ NÊN LÀM GÌ:');

  if (FENCE_SITTING_PATTERNS.some((pattern) => pattern.test(conclusion))) {
    return { valid: false, reason: 'fence_sitting_conclusion' };
  }

  if (INSTRUCTION_LEAK_PATTERNS.some((pattern) => pattern.test(reply))) {
    return { valid: false, reason: 'instruction_leak' };
  }

  if (
    !EXPLICIT_WRITING_REQUEST_PATTERN.test(input.userMessage)
    && WRITING_ACTION_PATTERN.test(actions)
  ) {
    return { valid: false, reason: 'generic_writing_action' };
  }

  if (input.intent === 'two_choices' && !/^chọn\s+\S+/i.test(conclusion)) {
    return { valid: false, reason: 'two_choices_missing_choice' };
  }

  if (input.intent === 'relationship') {
    if (RELATIONSHIP_MIND_READING_PATTERNS.some((pattern) => pattern.test(reply))) {
      return { valid: false, reason: 'relationship_mind_reading' };
    }
  }

  if (input.intent === 'timing_trajectory') {
    if (!/^hiện tại\s*:/i.test(conclusion) || !/xu hướng (?:thời gian tới|[^:\n]{1,40})\s*:/i.test(conclusion)) {
      return { valid: false, reason: 'timing_missing_current_and_trend' };
    }
  }

  if (wordCount(conclusion) < 25) {
    return { valid: false, reason: 'conclusion_too_thin' };
  }

  return { valid: true };
}

export function buildChatReplyRepairInstruction(reason: string | undefined): string {
  const detail: Record<string, string> = {
    fence_sitting_conclusion: 'Câu kết luận đang nước đôi. Hãy chốt đúng một nhận định hoặc hành vi trong câu đầu.',
    instruction_leak: 'Câu trả lời đang nhắc lại quy tắc nội bộ. Hãy tuân thủ chúng âm thầm và chỉ nói nội dung hữu ích cho người dùng.',
    generic_writing_action: 'Hành động đang rơi vào mẫu ghi chép/danh sách. Hãy thay bằng một hành vi ngoài đời có thể quan sát được.',
    two_choices_missing_choice: 'Câu hỏi có hai lựa chọn nhưng câu đầu chưa bắt đầu bằng “Chọn …”. Hãy gọi đúng tên một phương án.',
    relationship_mind_reading: 'Câu trả lời đang suy đoán tâm trí người thứ ba. Chỉ được đánh giá hành vi quan sát được.',
    timing_missing_current_and_trend: 'Kết luận timing chưa tách “Hiện tại:” và “Xu hướng thời gian tới:”. Hãy viết đúng hai lớp này.',
    response_budget_exceeded: 'Câu trả lời quá dài. Hãy rút gọn nhưng giữ đủ ba phần.',
    incomplete_sentence_or_invalid_bullets: 'Bullet hoặc câu chưa hoàn chỉnh. Mỗi ý phải bắt đầu bằng • và kết thúc bằng dấu câu.',
    missing_or_unordered_sections: 'Thiếu hoặc sai thứ tự ba tiêu đề bắt buộc. Hãy dùng đúng KẾT LUẬN NHANH, VÌ SAO, NÊN LÀM GÌ.',
    empty_or_too_short: 'Phản hồi trước bị trống hoặc quá ngắn. Hãy trả lời đầy đủ theo hợp đồng.',
    conclusion_too_thin: 'Phần KẾT LUẬN NHANH quá cụt. Hãy viết 2–3 câu: chốt trực tiếp, làm rõ ý nghĩa trong hoàn cảnh này, rồi nêu giới hạn hoặc điều kiện quan trọng mà không lặp ý.',
  };

  return `YÊU CẦU TỰ SỬA TRƯỚC KHI TRẢ LỜI: ${detail[reason || ''] || 'Phản hồi trước chưa đạt hợp đồng. Hãy kiểm tra lại lập trường, cấu trúc và dữ liệu.'} Không nhắc đến lần sửa này trong câu trả lời.`;
}
