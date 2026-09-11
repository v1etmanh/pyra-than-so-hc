import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { allTarotCards, majorArcanaCards, minorArcanaCards } from '../lib/tarot/cards.ts';
import { drawCardsForSpread, drawSupplementaryCards } from '../lib/tarot/draw.ts';
import { parseFollowUpDecision } from '../lib/tarot/prompts.ts';
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
