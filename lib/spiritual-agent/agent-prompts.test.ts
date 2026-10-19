import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentSystemPrompt, buildAgentUserPrompt } from './agent-prompts.ts';
import { ALL_SLANGS, getRandomSlangSample } from './slang-selector.ts';

test('chat agent prompt requires high-sass Gen Z banter with safety boundaries', () => {
  const prompt = buildAgentSystemPrompt({
    intent: 'daily_guidance',
    isCouple: false,
    complexity: 'standard',
    needsTarot: true,
  });

  assert.match(prompt, /CHẾ ĐỘ GEN Z CÀ KHỊA CƯỜNG ĐỘ CAO/);
  assert.match(prompt, /BẮT BUỘC cài ít nhất 2 nhịp cà khịa/i);
  assert.match(prompt, /linh miêu mỏ hỗn có học/i);
  assert.match(prompt, /Red flag không phải cờ lưu niệm/i);
  assert.match(prompt, /Không biến toàn bài thành meme/i);
  assert.match(prompt, /PHANH KHẨN CẤP.*sức khỏe, an toàn, bạo lực/i);
  assert.match(prompt, /Không dùng ẩn ý tình dục/i);
});

test('slang corpus contains all 203 quotes and samples 5 unique random items', () => {
  assert.equal(ALL_SLANGS.length, 203);
  const sample = getRandomSlangSample(5);
  assert.equal(sample.length, 5);
  const uniqueItems = new Set(sample);
  assert.equal(uniqueItems.size, 5);
});

test('chat agent prompt dynamically injects slangs and never contains the hardcoded 37 tab', () => {
  const prompt1 = buildAgentSystemPrompt({
    intent: 'general',
    isCouple: false,
    complexity: 'standard',
  });
  const prompt2 = buildAgentSystemPrompt({
    intent: 'general',
    isCouple: false,
    complexity: 'standard',
  });

  assert.doesNotMatch(prompt1, /não mở 37 tab/i);
  assert.doesNotMatch(prompt2, /não mở 37 tab/i);
  assert.match(prompt1, /Gợi ý ngẫu nhiên một số chất liệu \/ câu viral/);
  assert.match(prompt1, /TUYỆT ĐỐI CẤM học vẹt hay lặp lại một câu cửa miệng đóng đinh/);
});

test('two-choice prompts use all five cards and do not include the interaction map', () => {
  const systemPrompt = buildAgentSystemPrompt({
    intent: 'two_choices',
    isCouple: false,
    complexity: 'complex',
    needsTarot: true,
  });
  const userPrompt = buildAgentUserPrompt({
    message: 'Tôi nên chọn hướng A hay hướng B?',
    p1: { fullName: 'Người hỏi', birthDate: '2000-01-01' },
    isCouple: false,
    spreadContext: [
      'Trải bài được chọn: Hai lựa chọn (two-options), 5 lá.',
      '1. Tình huống hiện tại: Điều thực sự nằm sau lựa chọn này.',
      '2. Tiến trình A: Trải nghiệm và thử thách trên con đường A.',
      '3. Kết quả A: Xu hướng kết quả của con đường A.',
      '4. Tiến trình B: Trải nghiệm và thử thách trên con đường B.',
      '5. Kết quả B: Xu hướng kết quả của con đường B.',
    ].join('\n'),
    cards: [
      {
        position: { nameVi: 'Tình huống hiện tại' },
        card: { nameVi: 'Giáo Hoàng', meaningReversed: 'Xem lại khuôn mẫu và niềm tin cũ.' },
        isReversed: true,
      },
      {
        position: { nameVi: 'Tiến trình A' },
        card: { nameVi: '9 Kiếm', meaningUpright: 'Lo âu và suy diễn.' },
        isReversed: false,
      },
      {
        position: { nameVi: 'Kết quả A' },
        card: { nameVi: 'Tiết Chế', meaningUpright: 'Cân bằng và điều hòa.' },
        isReversed: false,
      },
      {
        position: { nameVi: 'Tiến trình B' },
        card: { nameVi: 'Thế Giới', meaningUpright: 'Hoàn thành và hội nhập.' },
        isReversed: false,
      },
      {
        position: { nameVi: 'Kết quả B' },
        card: { nameVi: '6 Cốc', meaningUpright: 'Hoài niệm và ký ức.' },
        isReversed: false,
      },
    ],
  });

  assert.doesNotMatch(systemPrompt, /BẢN ĐỒ TƯƠNG TÁC/i);
  assert.doesNotMatch(userPrompt, /BẢN ĐỒ TƯƠNG TÁC/i);
  assert.match(systemPrompt, /BẮT BUỘC sử dụng đủ 5 vai trò/i);
  assert.match(systemPrompt, /Tình huống hiện tại, Tiến trình A, Kết quả A, Tiến trình B và Kết quả B/i);
  assert.match(systemPrompt, /chưa xét đủ kết quả của cả hai hướng/i);

  const expectedCards = [
    'Vị trí 1 [Tình huống hiện tại]: Giáo Hoàng (Lá Ngược)',
    'Vị trí 2 [Tiến trình A]: 9 Kiếm (Lá Xuôi)',
    'Vị trí 3 [Kết quả A]: Tiết Chế (Lá Xuôi)',
    'Vị trí 4 [Tiến trình B]: Thế Giới (Lá Xuôi)',
    'Vị trí 5 [Kết quả B]: 6 Cốc (Lá Xuôi)',
  ];
  let previousIndex = -1;
  for (const expectedCard of expectedCards) {
    const index = userPrompt.indexOf(expectedCard);
    assert.ok(index > previousIndex, `Expected card in spread order: ${expectedCard}`);
    previousIndex = index;
  }
});
