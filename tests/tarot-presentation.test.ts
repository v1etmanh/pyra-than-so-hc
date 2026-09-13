import test from 'node:test';
import assert from 'node:assert/strict';
import { allTarotCards } from '../lib/tarot/cards.ts';
import {
  deriveTarotEnergyKeywords,
  getTarotCardRevealKey,
  getTarotRevealProgress,
  getTarotSpreadLayout,
  getTarotStageMode,
  normalizeTarotMarkdown,
  normalizeTarotRevealKeys
} from '../lib/tarot/presentation.ts';

test('tarot reveal progress counts only keys belonging to the current draw', () => {
  const cards = allTarotCards.slice(0, 3).map((card, index) => ({
    card,
    isReversed: false,
    position: {
      id: `position-${index}`,
      name: { vi: `Vị trí ${index}`, en: `Position ${index}` },
      description: { vi: '', en: '' }
    }
  }));
  const firstKey = getTarotCardRevealKey(cards[0]);
  const secondKey = getTarotCardRevealKey(cards[1]);

  assert.deepEqual(getTarotRevealProgress(cards, []), {
    revealed: 0,
    total: 3,
    remaining: 3,
    complete: false
  });
  assert.deepEqual(getTarotRevealProgress(cards, [firstKey, firstKey, 'not-in-this-draw']), {
    revealed: 1,
    total: 3,
    remaining: 2,
    complete: false
  });
  assert.deepEqual(getTarotRevealProgress(cards, [secondKey, firstKey, getTarotCardRevealKey(cards[2])]), {
    revealed: 3,
    total: 3,
    remaining: 0,
    complete: true
  });
  assert.equal(getTarotRevealProgress([], []).complete, false);

  assert.deepEqual(normalizeTarotRevealKeys(cards, undefined, true), cards.map(getTarotCardRevealKey));
  assert.deepEqual(normalizeTarotRevealKeys(cards, [], true), []);
  assert.deepEqual(
    normalizeTarotRevealKeys(cards, [firstKey, firstKey, 'not-in-this-draw'], true),
    [firstKey]
  );
});

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

test('tarot Markdown tables are converted into mobile-safe bullet lists', () => {
  const markdown = `## Cán cân quyết định

| Tiêu chí | Lựa chọn A | Lựa chọn B |
|:---|---:|:---:|
| Cơ hội | 65% | 35% |
| Thử thách | Cần kiên nhẫn | Dễ phân tâm |

Hãy chọn điều phù hợp.`;

  const normalized = normalizeTarotMarkdown(markdown);

  assert.doesNotMatch(normalized, /^\s*\|.*\|\s*$/m);
  assert.match(normalized, /- \*\*Tiêu chí:\*\* Cơ hội; \*\*Lựa chọn A:\*\* 65%; \*\*Lựa chọn B:\*\* 35%/);
  assert.match(normalized, /Hãy chọn điều phù hợp\./);
});

test('ordinary Tarot prose containing a pipe is left unchanged', () => {
  const markdown = 'Lựa chọn A: 65% | Lựa chọn B: 35%';
  assert.equal(normalizeTarotMarkdown(markdown), markdown);
});
