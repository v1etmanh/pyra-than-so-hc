import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { allTarotCards, majorArcanaCards, minorArcanaCards } from '../lib/tarot/cards.ts';
import { drawCardsForSpread, drawSupplementaryCards } from '../lib/tarot/draw.ts';
import {
  buildFollowUpReadingPrompt,
  buildInitialReadingPrompt,
  buildTarotSystemPrompt,
  isTwoChoiceContext,
  parseFollowUpDecision
} from '../lib/tarot/prompts.ts';
import { getTarotSpread, tarotSpreads } from '../lib/tarot/spreads.ts';
import { tarotReadingRequestSchema } from '../lib/security/schemas.ts';

test('tarot catalog contains a complete, unique 78-card deck', () => {
  assert.equal(allTarotCards.length, 78);
  assert.equal(majorArcanaCards.length, 22);
  assert.equal(minorArcanaCards.length, 56);
  assert.equal(new Set(allTarotCards.map((card) => card.id)).size, 78);

  for (const card of allTarotCards) {
    assert.ok(card.name.vi);
    assert.ok(card.name.en);
    assert.ok(card.meaning.upright.vi);
    assert.ok(card.meaning.reversed.en);
    assert.match(card.image, /^\/tarot\/cards\/.+\.jpg$/);
    assert.equal(existsSync(join(process.cwd(), 'public', card.image)), true, `missing image for ${card.id}`);
  }
});

test('six supported spreads keep their expected card counts', () => {
  assert.equal(tarotSpreads.length, 6);
  assert.deepEqual(
    Object.fromEntries(tarotSpreads.map((spread) => [spread.id, spread.positions.length])),
    {
      single: 1,
      'three-card': 3,
      'two-options': 5,
      relationship: 5,
      timeline: 5,
      'celtic-cross': 10
    }
  );
});

test('draws contain no duplicate cards and supplementary draws honor exclusions', () => {
  const spread = getTarotSpread('celtic-cross');
  assert.ok(spread);
  const original = drawCardsForSpread(spread);
  assert.equal(original.length, 10);
  assert.equal(new Set(original.map((item) => item.card.id)).size, 10);

  const excluded = new Set(original.map((item) => item.card.id));
  const supplementary = drawSupplementaryCards(9, excluded);
  assert.equal(supplementary.length, 3);
  assert.equal(new Set(supplementary.map((item) => item.card.id)).size, 3);
  assert.ok(supplementary.every((item) => !excluded.has(item.card.id)));
});

test('follow-up draw decisions are parsed defensively', () => {
  assert.deepEqual(
    parseFollowUpDecision('{"decision":"draw","drawCount":9,"reason":"A new angle"}'),
    { decision: 'draw', drawCount: 3, reason: 'A new angle' }
  );
  assert.deepEqual(
    parseFollowUpDecision('{"decision":"direct","drawCount":2,"reason":"Enough context"}'),
    { decision: 'direct', drawCount: 0, reason: 'Enough context' }
  );
  assert.deepEqual(
    parseFollowUpDecision('not-json'),
    { decision: 'direct', drawCount: 0, reason: '' }
  );
});

test('tarot request schema accepts valid modes and rejects malformed payloads', () => {
  const initial = tarotReadingRequestSchema.safeParse({
    mode: 'initial',
    question: 'Tôi cần nhìn rõ điều gì?',
    spreadId: 'three-card',
    language: 'vi'
  });
  assert.equal(initial.success, true);

  const followUp = tarotReadingRequestSchema.safeParse({
    mode: 'follow-up',
    question: 'Tôi nên hành động thế nào?',
    language: 'vi',
    reading: {
      originalQuestion: 'Tôi cần nhìn rõ điều gì?',
      spreadId: 'single',
      drawnCards: [{ cardId: 'major-00', isReversed: false, positionId: 'single-1' }],
      interpretation: 'Một lời giải hợp lệ.',
      priorFollowUps: []
    }
  });
  assert.equal(followUp.success, true);

  const invalid = tarotReadingRequestSchema.safeParse({
    mode: 'initial',
    question: 'x',
    spreadId: '',
    language: 'vi',
    unexpected: true
  });
  assert.equal(invalid.success, false);

  const profileWithLongIndicator = tarotReadingRequestSchema.safeParse({
    mode: 'initial',
    question: 'Tôi nên ăn gì hôm nay?',
    spreadId: 'single',
    language: 'vi',
    profile: {
      name: 'nam de',
      birthDate: '1990-01-01',
      lifePath: '7',
      indicators: [
        {
          key: 'arrows',
          name: '8 Mũi tên cá tính 3x3',
          value: 'Mũi tên Kế hoạch (1-2-3): Có mặt (Mạnh); Mũi tên Quyết tâm (1-5-9): Có mặt (Mạnh); Mũi tên Nhạy cảm (2-5-8): Trống (Thách thức); Mũi tên Hoạt động (7-8-9): Có mặt (Mạnh)'
        }
      ]
    }
  });
  assert.equal(profileWithLongIndicator.success, true);
});

test('tarot regeneration can recover a session with an empty interpretation', () => {
  const payload = tarotReadingRequestSchema.safeParse({
    mode: 'regenerate',
    language: 'vi',
    reading: {
      originalQuestion: 'Tình cảm sắp tới thế nào?',
      spreadId: 'single',
      drawnCards: [{ cardId: 'major-00', isReversed: false, positionId: 'single-1' }],
      interpretation: '',
      priorFollowUps: []
    }
  });

  assert.equal(payload.success, true);
});

test('two-choice dilemmas enforce percentage balance and decisive leaning in prompts', () => {
  const twoOptionsSpread = getTarotSpread('two-options');
  assert.ok(twoOptionsSpread);
  assert.equal(isTwoChoiceContext(twoOptionsSpread, 'Bất kỳ câu hỏi nào'), true);

  const threeCardSpread = getTarotSpread('three-card');
  assert.ok(threeCardSpread);
  assert.equal(isTwoChoiceContext(threeCardSpread, 'Nên chọn công ty A hay công ty B?'), true);
  assert.equal(isTwoChoiceContext(threeCardSpread, 'Năng lượng tuần này thế nào?'), false);

  const cards = drawCardsForSpread(twoOptionsSpread);
  const promptVi = buildInitialReadingPrompt('Nên đi du học hay ở lại làm việc?', twoOptionsSpread, cards, undefined, 'vi');
  assert.match(promptVi, /CHỈ DẪN BẮT BUỘC CHO CÂU HỎI 2 LỰA CHỌN/);
  assert.match(promptVi, /tỷ lệ phần trăm \(%\)/);
  assert.match(promptVi, /## Kết luận nhanh/);
  assert.match(promptVi, /gọi tên lựa chọn được trải bài nghiêng về/);
  assert.match(promptVi, /120–180 từ/);
  assert.doesNotMatch(promptVi, /Đánh giá Hướng đi A/);

  const promptEn = buildInitialReadingPrompt('Should I take job A or job B?', twoOptionsSpread, cards, undefined, 'en');
  assert.match(promptEn, /MANDATORY INSTRUCTION FOR TWO-CHOICE DILEMMAS/);
  assert.match(promptEn, /## Quick conclusion/);
  assert.match(promptEn, /name the option favored/);
  assert.match(promptEn, /120–180 words/);
});

test('tarot prompts enforce conclusion-first concise answers for initial and follow-up readings', () => {
  const spread = getTarotSpread('three-card');
  assert.ok(spread);
  const cards = drawCardsForSpread(spread);

  const systemVi = buildTarotSystemPrompt('vi');
  assert.match(systemVi, /Câu đầu tiên phải trả lời trực tiếp/);
  assert.match(systemVi, /tối đa 3 tín hiệu mạnh nhất/);
  assert.match(systemVi, /Không kết luận bằng câu rỗng/);

  const initialVi = buildInitialReadingPrompt('Công việc mới có phù hợp với tôi không?', spread, cards, undefined, 'vi');
  assert.match(initialVi, /## Kết luận nhanh/);
  assert.match(initialVi, /## Vì sao/);
  assert.match(initialVi, /## Nên làm gì/);
  assert.match(initialVi, /Đúng 2 hành động/);

  const followUpEn = buildFollowUpReadingPrompt({
    originalQuestion: 'Is the new job right for me?',
    previousInterpretation: 'Previous concise reading.',
    followUpQuestion: 'What should I verify first?',
    spread,
    originalCards: cards,
    additionalCards: [],
    locale: 'en'
  });
  assert.match(followUpEn, /60–100 words/);
  assert.match(followUpEn, /## Quick conclusion/);
  assert.match(followUpEn, /Do not repeat the previous reading/);
});
