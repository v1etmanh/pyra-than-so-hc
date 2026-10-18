import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentSystemPrompt } from './agent-prompts.ts';
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
