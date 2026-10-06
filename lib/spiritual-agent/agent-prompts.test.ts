import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentSystemPrompt } from './agent-prompts.ts';

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
