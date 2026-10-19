import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASTROLOGY_RULE_ID_ALLOW_LIST,
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

const validRuleContext = {
  catalogId: 'astrology_rule_v1' as const,
  schemaVersion: 1 as const,
  topics: [{
    topicId: 'transit_natal.Mars.Moon',
    title: 'Sao Hỏa · Mặt Trăng',
    score: 0.63,
    matchedRuleIds: [
      'aspect.pair.transit.Mars.natal.Moon',
      'aspect.modifier.square',
    ],
    supportingSignalCount: 1,
    supportingThemes: ['aspect_square', 'natal_moon', 'transit_mars'],
    payload: {
      experience: 'Cảm xúc có thể phản ứng nhanh trước sức ép hành động.',
      challenge: 'Dễ nói hoặc làm trước khi nhận ra nhu cầu thật.',
      supportiveExpression: 'Sự thẳng thắn có thể giúp gọi tên ranh giới.',
      advice: 'Chọn một việc ngắn có điểm dừng rõ ràng.',
    },
  }],
  matchedRuleIds: [
    'aspect.modifier.square',
    'aspect.pair.transit.Mars.natal.Moon',
  ],
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

test('request schema accepts the v1 rule context and uses the exact 489-rule allow-list', () => {
  assert.equal(ASTROLOGY_RULE_ID_ALLOW_LIST.size, 489);
  const parsed = astroFortuneRequestSchema.safeParse({
    ...baseInput,
    ruleContext: validRuleContext,
  });
  assert.equal(parsed.success, true);
});

test('request schema rejects unsupported, inconsistent, oversized, and unknown rule context', () => {
  const invalidCatalog = structuredClone(validRuleContext) as Record<string, unknown>;
  invalidCatalog.catalogId = 'astrology_rule_v2';
  assert.equal(astroFortuneRequestSchema.safeParse({ ...baseInput, ruleContext: invalidCatalog }).success, false);

  const inconsistentIds = structuredClone(validRuleContext);
  inconsistentIds.matchedRuleIds = ['aspect.modifier.square'];
  assert.equal(astroFortuneRequestSchema.safeParse({ ...baseInput, ruleContext: inconsistentIds }).success, false);

  const unknownId = structuredClone(validRuleContext);
  unknownId.topics[0].matchedRuleIds[0] = 'aspect.pair.transit.Unknown.natal.Moon';
  unknownId.matchedRuleIds[1] = 'aspect.pair.transit.Unknown.natal.Moon';
  assert.equal(astroFortuneRequestSchema.safeParse({ ...baseInput, ruleContext: unknownId }).success, false);

  const tooManyTopics = structuredClone(validRuleContext);
  tooManyTopics.topics = Array.from({ length: 4 }, (_, index) => ({
    ...structuredClone(validRuleContext.topics[0]),
    topicId: `transit_natal.Mars.Moon.${index}`,
  }));
  assert.equal(astroFortuneRequestSchema.safeParse({ ...baseInput, ruleContext: tooManyTopics }).success, false);

  const oversizedContent = structuredClone(validRuleContext);
  oversizedContent.topics[0].payload.experience = 'x'.repeat(1201);
  assert.equal(astroFortuneRequestSchema.safeParse({ ...baseInput, ruleContext: oversizedContent }).success, false);
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
  assert.match(systemPrompt, /MỞ RỘNG BIÊN ĐỘ CẢM XÚC/i);
  assert.match(systemPrompt, /con mèo lười sưởi nắng/i);
  assert.match(systemPrompt, /TUYỆT ĐỐI CẤM: Không ngày nào cũng rao giảng về "khát vọng", "vươn lên"/i);
  assert.match(userPrompt, /Tín hiệu chủ đạo đã tính toán: harmony/i);
  assert.match(userPrompt, /Gọi một cuộc điện thoại quan trọng/i);
  assert.match(userPrompt, /đổi cả động từ chính lẫn chủ đề/i);
});

test('prompt grounds mirror and advice in rule topics without exposing technical identifiers', () => {
  const { systemPrompt, userPrompt } = buildAstroFortunePrompt({
    ...baseInput,
    ruleContext: validRuleContext,
  });

  assert.match(systemPrompt, /làm căn cứ chính cho mirror/i);
  assert.match(systemPrompt, /không khẳng định một sự kiện chắc chắn/i);
  assert.match(systemPrompt, /ca dao mẫu chỉ quyết định nhịp, vần và phong cách/i);
  assert.match(userPrompt, /CĂN CỨ LUẬN GIẢI TỪ RULE ENGINE/i);
  assert.match(userPrompt, /Cảm xúc có thể phản ứng nhanh/i);
  assert.match(userPrompt, /Chọn một việc ngắn có điểm dừng rõ ràng/i);
  assert.doesNotMatch(userPrompt, /aspect\.pair|aspect\.modifier|0\.63|transit_mars/i);
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
