/**
 * prompt-validator.ts - Bộ lọc và nhận diện câu hỏi vô nghĩa / rác (Trash & Gibberish Detection)
 * 
 * Giúp hệ thống:
 * 1. Nhận diện ngay tức thì (<0.1ms, 0 token) các nội dung rác: "a,.", "ta", "121", "asdfgh", "???",...
 * 2. Ngăn ngừa lãng phí token LLM và tránh sinh luận giải hoang tưởng cho các ký tự ngẫu nhiên.
 * 3. Hướng dẫn người dùng đặt câu hỏi có chủ đề và mục đích rõ ràng.
 */

export const TRASH_PROMPT_GUIDANCE = `✦ TIỂU LINH MIÊU NHẮN BẠN:
Câu hỏi của bạn dường như chưa có chủ đề hoặc mục đích rõ ràng (ví dụ: gõ thử phím hoặc ký tự ngẫu nhiên).

Để ngọn lửa dẫn lối và các lá bài Tarot phản chiếu chuẩn xác năng lượng của bạn, hãy đặt một câu hỏi có mục đích cụ thể nhé!

💡 Bạn có thể thử đặt câu hỏi như:
• "Sự nghiệp trong 6 tháng tới của tôi sẽ ra sao?"
• "Tôi đang phân vân giữa hai lựa chọn A và B, nên đi hướng nào?"
• "Bản đồ Thần số học nói gì về tính cách cốt lõi và sứ mệnh của tôi?"
• "Hôm nay tôi nên làm gì để thu hút may mắn và tài lộc?"`;

// Bảng nguyên âm tiếng Việt và tiếng Anh để nhận diện từ có nghĩa
const VOWEL_REGEX = /[aeiouyàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;

// Các câu hỏi ngắn hợp lệ mang tính đời sống / tâm linh (không bị coi là rác)
const VALID_SHORT_QUERIES = [
  'ăn gì', 'uống gì', 'mặc gì', 'đi đâu', 'ai đó', 'tôi là ai',
  'có nên', 'nên không', 'sao vậy', 'thế nào', 'ra sao', 'làm sao',
  'năm nay', 'hôm nay', 'ngày mai', 'tương lai', 'tình duyên',
  'công việc', 'tiền bạc', 'sự nghiệp', 'may mắn', 'bình an'
];

/**
 * Kiểm tra xem câu hỏi có phải là rác, ký tự vô nghĩa hoặc không có chủ đề/mục đích không
 */
export function isTrashOrMeaninglessPrompt(rawPrompt: unknown): {
  isTrash: boolean;
  reason?: string;
} {
  if (typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
    return { isTrash: true, reason: 'Nội dung trống' };
  }

  const prompt = rawPrompt.trim();

  // 1. Quá ngắn: <= 2 ký tự (ví dụ: "a", "ta", "ok", "1", "12", "..", "?")
  if (prompt.length <= 2) {
    return { isTrash: true, reason: 'Câu hỏi quá ngắn (dưới 3 ký tự)' };
  }

  const lower = prompt.toLowerCase();

  // Kiểm tra nếu là câu hỏi ngắn nhưng hợp lệ
  const isKnownShort = VALID_SHORT_QUERIES.some(q => lower.includes(q));
  if (isKnownShort) {
    return { isTrash: false };
  }

  // 2. Toàn bộ là dấu câu, ký hiệu đặc biệt, emoji vô nghĩa (ví dụ: "...", "???", "@#$%", "^^")
  // Keep this ES5-compatible: the root TypeScript config targets ES5, so
  // Unicode-property escapes (\p{…}) and the `u` flag cannot be used here.
  const strippedSymbols = prompt.replace(/[\s!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~…–—•]/g, '');
  if (strippedSymbols.length === 0) {
    return { isTrash: true, reason: 'Chỉ chứa ký tự đặc biệt hoặc dấu câu' };
  }

  // 3. Toàn bộ là số ngẫu nhiên không có ngữ cảnh (ví dụ: "121", "12345", "0000", "999")
  if (/^\d{1,8}$/.test(strippedSymbols)) {
    return { isTrash: true, reason: 'Chỉ chứa chữ số rời rạc không có ngữ cảnh' };
  }

  // 4. Lặp lại 1 ký tự duy nhất 3 lần trở lên (ví dụ: "aaaa", "zzzz", "hhhhh", "11111")
  if (/^(.)\1{2,}$/i.test(strippedSymbols)) {
    return { isTrash: true, reason: 'Lặp lại ký tự liên tục' };
  }

  // 5. Chuỗi gõ phím ngẫu nhiên (Keyboard mashing)
  if (/(asdf|ghjk|qwerty|zxcv|poiuy|lkjh|mnbv)/i.test(lower)) {
    return { isTrash: true, reason: 'Gõ phím ngẫu nhiên hàng phím' };
  }

  // 6. Các từ thử nghiệm / chào hỏi trống không / câu thử máy
  const testKeywords = [
    'test', 'testing', 'alo', 'alô', 'check', 'checking', 'thu', 'thử',
    'thử nghiệm', 'abc', 'xyz', 'haha', 'hihi', 'hehe', 'huhu', 'kaka',
    'chào', 'hello', 'hi', 'hey', 'alo 123', 'a b c', '1 2 3'
  ];
  if (testKeywords.includes(lower)) {
    return { isTrash: true, reason: 'Từ thử nghiệm / chào hỏi chưa có nội dung câu hỏi' };
  }

  // Những câu nói rõ là chưa có câu hỏi cũng không nên tốn một lượt LLM.
  if (/^(không biết hỏi gì|chưa biết hỏi gì|không có câu hỏi|hỏi gì bây giờ|có gì đâu)$/i.test(lower)) {
    return { isTrash: true, reason: 'Chưa có câu hỏi hoặc chủ đề cụ thể' };
  }

  // Chỉ chặn lời chào bị lặp lại hoàn toàn; "alo, tôi muốn hỏi..." vẫn hợp lệ.
  if (/^(alo|alô|hello|hi|hey)(?:\s+\1)+[!?.,\s]*$/i.test(lower)) {
    return { isTrash: true, reason: 'Lời chào lặp lại chưa có nội dung câu hỏi' };
  }

  // 7. Từ không chứa bất kỳ nguyên âm nào (ví dụ: "sdfgh", "bcdf", "jklm", "a,.", "m..")
  const lettersOnly = strippedSymbols.replace(/\d/g, '');
  if (lettersOnly.length >= 2 && !VOWEL_REGEX.test(lettersOnly)) {
    return { isTrash: true, reason: 'Từ không có nguyên âm (ký tự gõ ngẫu nhiên)' };
  }

  // 8. Ký tự chữ cái quá ít so với độ dài (ví dụ: "a,.", "x..//", "121,.")
  if (lettersOnly.length < 2 && prompt.length <= 5) {
    return { isTrash: true, reason: 'Chỉ có 1 chữ cái kèm ký tự đặc biệt ngẫu nhiên' };
  }

  return { isTrash: false };
}
