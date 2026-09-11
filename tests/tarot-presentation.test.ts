import test from 'node:test';
import assert from 'node:assert/strict';
import { allTarotCards } from '../lib/tarot/cards.ts';
import {
  deriveTarotEnergyKeywords,
  getTarotSpreadLayout,
  getTarotStageMode
} from '../lib/tarot/presentation.ts';

test('tarot presentation state keeps fresh cards concealed until reveal', () => {
  assert.equal(getTarotStageMode(false, false, false, 'idle'), 'setup');
  assert.equal(getTarotStageMode(true, false, true, 'drawing'), 'drawing');
  assert.equal(getTarotStageMode(true, true, true, 'interpreting'), 'concealed');
  assert.equal(getTarotStageMode(true, true, false, 'interpreting'), 'reading');
  assert.equal(getTarotStageMode(true, false, false, 'error'), 'error');
  assert.equal(getTarotStageMode(true, false, false, 'ready'), 'cancelled');
});

test('tarot spread layouts cover every supported card count', () => {
  assert.equal(getTarotSpreadLayout('single'), 'single');
  assert.equal(getTarotSpreadLayout('three-card'), 'three');
  assert.equal(getTarotSpreadLayout('relationship'), 'five');
  assert.equal(getTarotSpreadLayout('two-options'), 'five');
  assert.equal(getTarotSpreadLayout('timeline'), 'five');
  assert.equal(getTarotSpreadLayout('celtic-cross'), 'celtic');
});

test('energy chips are localized, deduplicated and limited to three', () => {
  const card = allTarotCards[0];
  const cards = [
    { card, isReversed: false, position: { id: 'one', name: { vi: 'Một', en: 'One' }, description: { vi: '', en: '' } } },
    { card, isReversed: false, position: { id: 'two', name: { vi: 'Hai', en: 'Two' }, description: { vi: '', en: '' } } }
  ];
  const keywords = deriveTarotEnergyKeywords(cards, 'vi');
  assert.equal(keywords.length, 3);
  assert.equal(new Set(keywords.map((item) => item.toLocaleLowerCase('vi'))).size, 3);
  assert.ok(keywords.every(Boolean));
});
