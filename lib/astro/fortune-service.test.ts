import assert from 'node:assert/strict';
import test from 'node:test';

import {
  astroFortuneRequestSchema,
  buildAstroFortunePrompt,
} from './fortune-service.ts';

const baseInput = {
  caDaoSample: 'Có công mài sắt, có ngày nên kim',
  astroSummary: 'Các góc hỗ trợ đang trội hơn.',
  metadata: {
    tensionScore: 0.3,
    harmonyScore: 0.7,
    conjunctionScore: 0.1,
    dominantSignal: 'harmony' as const,
    dominantElements: ['Khí', 'Linh hoạt'],
    highlights: ['Mặt Trăng tam hợp Sao Kim'],
  },
};

test('astro fortune request remains backward compatible', () => {
  assert.equal(
    astroFortuneRequestSchema.safeParse({ caDaoSample: baseInput.caDaoSample }).success,
    true
  );
  assert.equal(
    astroFortuneRequestSchema.safeParse({
      ...baseInput,
      recentAdvice: ['Gọi một cuộc điện thoại quan trọng.'],
    }).success,
    true
  );
});

test('prompt uses dominant signal and recent advice without the old impatience primer', () => {
  const { systemPrompt, userPrompt } = buildAstroFortunePrompt({
    ...baseInput,
    recentAdvice: [
      'Gọi một cuộc điện thoại quan trọng.',
      'Viết ba việc cần hoàn thành trước bữa trưa.',
    ],
  });

  assert.doesNotMatch(systemPrompt, /nóng vội|hãy bình tĩnh/i);
  assert.match(systemPrompt, /Hòa hợp: ưu tiên nắm cơ hội/i);
  assert.match(userPrompt, /Tín hiệu chủ đạo đã tính toán: harmony/i);
  assert.match(userPrompt, /Gọi một cuộc điện thoại quan trọng/i);
  assert.match(userPrompt, /đổi cả động từ chính lẫn chủ đề/i);
});

test('request schema caps anti-repetition history at seven items', () => {
  const parsed = astroFortuneRequestSchema.safeParse({
    ...baseInput,
    recentAdvice: Array.from({ length: 8 }, (_, index) => `Kế sách ${index}`),
  });
  assert.equal(parsed.success, false);
});
