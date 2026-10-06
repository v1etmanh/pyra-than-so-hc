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

test('request schema preserves derived house data without raw birth coordinates', () => {
  const parsed = astroFortuneRequestSchema.safeParse({
    ...baseInput,
    metadata: {
      ...baseInput.metadata,
      birthDataPrecision: 'complete',
      houseSystem: 'porphyry',
      ascendantSign: 'Libra',
      midheavenSign: 'Cancer',
      planetHouses: { Sun: 10, Moon: 4 },
      activatedHouses: [{ house: 10, score: 1, topicVi: 'Sự nghiệp và vị thế' }],
      angleHighlights: ['Mars vuông ASC, orb 1.2°'],
    },
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.metadata?.ascendantSign, 'Libra');
  assert.deepEqual(parsed.data.metadata?.planetHouses, { Sun: 10, Moon: 4 });
  assert.equal('latitude' in (parsed.data.metadata ?? {}), false);
  assert.equal('longitude' in (parsed.data.metadata ?? {}), false);
});

test('prompt includes ASC, MC and activated houses only for complete birth data', () => {
  const { userPrompt } = buildAstroFortunePrompt({
    ...baseInput,
    metadata: {
      ...baseInput.metadata,
      birthDataPrecision: 'complete',
      houseSystem: 'porphyry',
      ascendantSign: 'Libra',
      midheavenSign: 'Cancer',
      planetHouses: { Sun: 10, Moon: 4 },
      activatedHouses: [{ house: 10, score: 1, topicVi: 'Sự nghiệp và vị thế' }],
      angleHighlights: ['Mars vuông ASC, orb 1.2°'],
    },
  });

  assert.match(userPrompt, /Cung Mọc \(ASC\): Libra/);
  assert.match(userPrompt, /Thiên Đỉnh \(MC\): Cancer/);
  assert.match(userPrompt, /Sun: Nhà 10/);
  assert.match(userPrompt, /Nhà 10 – Sự nghiệp và vị thế \(100%\)/);
  assert.match(userPrompt, /Mars vuông ASC, orb 1\.2°/);
});
