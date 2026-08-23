export type MockNumerologyIndicator = {
  key: string;
  nameVi: string;
  nameEn: string;
  aliases: string[];
  category: string;
  mockValue: string | number;
  summaryVi: string;
  summaryEn: string;
};

/**
 * Stable mock profile for the Search + Q&A MVP.
 * The catalog intentionally mirrors the 24 indicators returned by
 * useProcessNumerology so the UI/API contract can be tested without an LLM.
 */
export const MOCK_NUMEROLOGY_INDICATORS: MockNumerologyIndicator[] = [
  { key: 'walksOfLife', nameVi: 'Đường đời', nameEn: 'Life Path', aliases: ['số chủ đạo', 'life path', 'đường đời'], category: 'core', mockValue: 7, summaryVi: 'khuynh hướng phát triển, bài học và hướng đi tổng quát của bạn.', summaryEn: 'your broad direction, lessons, and developmental themes.' },
  { key: 'mission', nameVi: 'Sứ mệnh', nameEn: 'Mission / Destiny', aliases: ['sứ mệnh', 'mission', 'destiny', 'biểu đạt'], category: 'core', mockValue: 3, summaryVi: 'cách bạn đóng góp năng lực và giá trị của mình cho cuộc sống.', summaryEn: 'how you express your abilities and contribute value.' },
  { key: 'soul', nameVi: 'Linh hồn', nameEn: 'Soul Urge', aliases: ['linh hồn', 'soul', 'soul urge', 'tâm hồn'], category: 'core', mockValue: 6, summaryVi: 'nhu cầu nội tâm và điều thật sự tạo động lực cho bạn.', summaryEn: 'your inner needs and what genuinely motivates you.' },
  { key: 'personality', nameVi: 'Nhân cách', nameEn: 'Personality', aliases: ['nhân cách', 'personality', 'biểu hiện bên ngoài'], category: 'core', mockValue: 1, summaryVi: 'ấn tượng đầu tiên và cách bạn thể hiện ra bên ngoài.', summaryEn: 'your first impression and outward style.' },
  { key: 'dateOfBirth', nameVi: 'Ngày sinh', nameEn: 'Birthday Number', aliases: ['ngày sinh', 'birthday number', 'birth day'], category: 'core', mockValue: 2, summaryVi: 'một năng lượng nổi bật gắn với ngày bạn chào đời.', summaryEn: 'a notable energy associated with your birth day.' },
  { key: 'mature', nameVi: 'Trưởng thành', nameEn: 'Maturity Number', aliases: ['trưởng thành', 'maturity', 'maturity number'], category: 'potential', mockValue: 1, summaryVi: 'năng lực có xu hướng hội tụ rõ hơn khi bạn tích lũy trải nghiệm.', summaryEn: 'a strength that tends to become clearer as experience accumulates.' },
  { key: 'balance', nameVi: 'Cân bằng', nameEn: 'Balance Number', aliases: ['cân bằng', 'balance number', 'balance'], category: 'potential', mockValue: 5, summaryVi: 'cách tìm lại sự ổn định khi gặp áp lực hoặc biến động.', summaryEn: 'how to regain stability during pressure or change.' },
  { key: 'rationalThinking', nameVi: 'Tư duy lý trí', nameEn: 'Rational Thought', aliases: ['tư duy lý trí', 'rational thought', 'logic'], category: 'mind', mockValue: 7, summaryVi: 'cách bạn phân tích, sắp xếp thông tin và giải quyết vấn đề.', summaryEn: 'how you analyze information and solve problems.' },
  { key: 'subconsciousPower', nameVi: 'Sức mạnh tiềm thức', nameEn: 'Subconscious Power', aliases: ['sức mạnh tiềm thức', 'subconscious power', 'nội lực'], category: 'mind', mockValue: 6, summaryVi: 'mức độ chủ động và nguồn lực bên trong khi hành động.', summaryEn: 'your inner resources and instinctive capacity to act.' },
  { key: 'passion', nameVi: 'Đam mê ẩn giấu', nameEn: 'Hidden Passion', aliases: ['đam mê', 'đam mê ẩn giấu', 'hidden passion', 'passion'], category: 'potential', mockValue: 3, summaryVi: 'chủ đề hoặc hoạt động dễ khơi dậy sự say mê tự nhiên.', summaryEn: 'themes or activities that can naturally spark enthusiasm.' },
  { key: 'attitude', nameVi: 'Thái độ tiếp cận', nameEn: 'Attitude / Approach', aliases: ['thái độ', 'thái độ tiếp cận', 'attitude', 'approach'], category: 'behavior', mockValue: 4, summaryVi: 'phản ứng ban đầu và cách bạn bước vào tình huống mới.', summaryEn: 'your initial reaction and approach to new situations.' },
  { key: 'karmicDebts', nameVi: 'Nợ nghiệp', nameEn: 'Karmic Debts', aliases: ['nợ nghiệp', 'karmic debt', 'karmic debts'], category: 'karmic', mockValue: '13/4', summaryVi: 'một chủ đề cần nhìn nhận như bài học phát triển, không phải phán quyết.', summaryEn: 'a development theme to reflect on, not a fixed judgment.' },
  { key: 'missingNumbers', nameVi: 'Số thiếu / Bài học nghiệp', nameEn: 'Karmic Lessons', aliases: ['số thiếu', 'bài học nghiệp', 'karmic lesson', 'missing number'], category: 'karmic', mockValue: '2, 8', summaryVi: 'những phẩm chất bạn có thể chủ động rèn luyện thêm.', summaryEn: 'qualities you may choose to develop intentionally.' },
  { key: 'bridgeLifeMission', nameVi: 'Cầu nối Đường đời – Sứ mệnh', nameEn: 'Life Path – Mission Bridge', aliases: ['cầu nối đường đời sứ mệnh', 'life mission bridge', 'bridge life mission'], category: 'bridge', mockValue: 2, summaryVi: 'khoảng cách cần điều hòa giữa hướng đi và cách bạn thể hiện năng lực.', summaryEn: 'the gap to harmonize between direction and expression.' },
  { key: 'bridgeSoulPersonality', nameVi: 'Cầu nối Linh hồn – Nhân cách', nameEn: 'Soul – Personality Bridge', aliases: ['cầu nối linh hồn nhân cách', 'soul personality bridge'], category: 'bridge', mockValue: 5, summaryVi: 'mức độ đồng điệu giữa nhu cầu bên trong và hình ảnh bên ngoài.', summaryEn: 'the alignment between inner needs and outward image.' },
  { key: 'bridgeMaturityPassion', nameVi: 'Cầu nối Trưởng thành – Đam mê', nameEn: 'Maturity – Passion Bridge', aliases: ['cầu nối trưởng thành đam mê', 'maturity passion bridge'], category: 'bridge', mockValue: 2, summaryVi: 'cách biến sở thích tự nhiên thành năng lực trưởng thành.', summaryEn: 'how natural interests can become mature capabilities.' },
  { key: 'yearIndividual', nameVi: 'Năm cá nhân', nameEn: 'Personal Year', aliases: ['năm cá nhân', 'personal year', 'year individual'], category: 'cycle', mockValue: 8, summaryVi: 'chủ đề lớn để ưu tiên trong chu kỳ năm hiện tại.', summaryEn: 'the broader theme to prioritize in the current yearly cycle.' },
  { key: 'monthIndividual', nameVi: 'Tháng cá nhân', nameEn: 'Personal Month', aliases: ['tháng cá nhân', 'personal month', 'month individual'], category: 'cycle', mockValue: 4, summaryVi: 'trọng tâm thực hành và sắp xếp trong tháng hiện tại.', summaryEn: 'the practical focus for the current month.' },
  { key: 'dayIndividual', nameVi: 'Ngày cá nhân', nameEn: 'Personal Day', aliases: ['ngày cá nhân', 'personal day', 'day individual'], category: 'cycle', mockValue: 6, summaryVi: 'nhịp năng lượng tham khảo để bạn lựa chọn việc nhỏ trong ngày.', summaryEn: 'a reflective daily rhythm for choosing small actions today.' },
  { key: 'way', nameVi: '4 Đỉnh cao cuộc đời', nameEn: '4 Pinnacles', aliases: ['đỉnh cao', '4 đỉnh cao', 'pinnacle', 'pinnacles', 'kim tự tháp'], category: 'cycle', mockValue: '8 – 7 – 6 – 11', summaryVi: 'bốn giai đoạn phát triển cần được nhìn trong bối cảnh toàn bộ cuộc đời.', summaryEn: 'four developmental phases to read in the context of your whole life.' },
  { key: 'challenges', nameVi: '4 Thách thức cuộc đời', nameEn: '4 Challenges', aliases: ['thách thức', '4 thách thức', 'challenge', 'challenges'], category: 'cycle', mockValue: '5 – 6 – 1 – 1', summaryVi: 'những kỹ năng cần rèn qua từng giai đoạn, không phải giới hạn cố định.', summaryEn: 'skills to practice across phases, not fixed limitations.' },
  { key: 'arrows', nameVi: '8 Mũi tên cá tính', nameEn: 'Arrows of Individuality', aliases: ['mũi tên', '8 mũi tên', 'arrows', 'birth chart arrows'], category: 'chart', mockValue: 'Quyết tâm; Trí tuệ', summaryVi: 'các trục nổi bật hoặc khoảng trống trong biểu đồ ngày sinh 3x3.', summaryEn: 'prominent or missing axes in the 3x3 birth chart.' },
  { key: 'nameChart', nameVi: 'Biểu đồ tên & Tần suất', nameEn: 'Name Chart & Frequency', aliases: ['biểu đồ tên', 'name chart', 'tần suất tên', 'name frequency'], category: 'chart', mockValue: '13 ký tự', summaryVi: 'tần suất các con số được quy đổi từ họ tên.', summaryEn: 'the frequency of numbers mapped from your full name.' },
  { key: 'birthChart', nameVi: 'Biểu đồ ngày sinh 3x3', nameEn: '3x3 Birth Chart', aliases: ['biểu đồ ngày sinh', 'birth chart', 'birth matrix'], category: 'chart', mockValue: '3 × 3', summaryVi: 'cách các chữ số ngày sinh phân bố trên ba mặt phẳng trải nghiệm.', summaryEn: 'how birth-date digits distribute across three experiential planes.' }
];

if (MOCK_NUMEROLOGY_INDICATORS.length !== 24) {
  throw new Error('The mock numerology catalog must contain exactly 24 indicators.');
}
