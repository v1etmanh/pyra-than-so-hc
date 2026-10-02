import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { analyzeResonance } from '../../lib/resonance/analyzer.ts';
import { generateResonanceContext, selectRequestedIndicators } from '../../lib/resonance/index.ts';
import { getNumerologyEntities, getTarotEntity, loadNumerologyLabels, loadTarotLabels } from '../../lib/resonance/retriever.ts';
import { AXIS_KEYS, type AxisKey, type LabeledEntity } from '../../lib/resonance/types.ts';
import { MAJOR_ARCANA, TAROT_DECK, drawCardsForSpread } from '../../mobile_app/src/services/tarotService.ts';

function vector(scores: Partial<Record<AxisKey, number>> = {}, quotes: Partial<Record<AxisKey, string>> = {}): LabeledEntity['core'] {
  return Object.fromEntries(AXIS_KEYS.map((axis) => [axis, {
    score: scores[axis] ?? 0,
    evidenceQuote: scores[axis] ? quotes[axis] ?? `source ${axis}` : '',
    rationale: `reason ${axis}`
  }])) as LabeledEntity['core'];
}

function entity(input: {
  id: string; domain: 'tarot' | 'numerology'; core?: Partial<Record<AxisKey, number>>;
  shadow?: Partial<Record<AxisKey, number>>; orientation?: 'upright' | 'reversed';
}): LabeledEntity {
  return {
    id: input.id, name: input.id, domain: input.domain, subType: input.domain === 'tarot' ? 'major' : 'fixture',
    numberValue: input.domain === 'numerology' ? '1' : undefined, orientation: input.orientation,
    core: vector(input.core), shadow: vector(input.shadow)
  };
}

test('resonance rules use selected entities and exact score thresholds', () => {
  const tarot = entity({ id: 'selected-card', domain: 'tarot', orientation: 'reversed', core: { ACT: 1, EMO: 1, STR: 2, RSK: -2 }, shadow: { ACT: -2, EMO: -1, RSK: -1 } });
  const number = entity({ id: 'selected-indicator', domain: 'numerology', core: { ACT: 2, EMO: -2, RSK: 2 }, shadow: { ACT: -1, EMO: -1, RSK: -2 } });
  const result = analyzeResonance([tarot], [number]);

  assert.equal(result.synergies.length, 1);
  assert.equal(result.synergies[0].axis, 'ACT');
  assert.deepEqual(result.compensatoryRemedies.map((pair) => pair.axis), ['ACT', 'EMO']);
  assert.deepEqual(result.tensions.map((pair) => pair.axis).sort(), ['EMO', 'RSK']);
  assert.deepEqual(result.shadowVortexes.map((pair) => pair.axis).sort(), ['ACT', 'EMO', 'RSK']);
  assert.equal(result.tensions.some((pair) => pair.axis === 'ACT'), false, 'same direction is not a tension');
  assert.equal(result.weakestAxis.axis, 'EMO');
  assert.deepEqual(result.strongestPositiveAxis, { axis: 'ACT', score: 3 });
});

test('tension excludes +1/-1 and vortex is limited to reversed Tarot', () => {
  const upright = entity({ id: 'upright-card', domain: 'tarot', orientation: 'upright', core: { ACT: 1 }, shadow: { ACT: -2 } });
  const number = entity({ id: 'number', domain: 'numerology', core: { ACT: -1 }, shadow: { ACT: -2 } });
  assert.equal(analyzeResonance([upright], [number]).tensions.length, 0);
  assert.equal(analyzeResonance([upright], [number]).shadowVortexes.length, 0);
  const reversed = { ...upright, orientation: 'reversed' as const };
  assert.equal(analyzeResonance([reversed], [number]).shadowVortexes.length, 1);
  const strongOpposition = { ...number, core: vector({ ACT: -2 }) };
  assert.equal(analyzeResonance([upright], [strongOpposition]).tensions.length, 1);
});

test('empty analysis returns no positive anchor and stable zero vector', () => {
  const result = analyzeResonance([], []);
  assert.deepEqual(result.netVector, { ACT: 0, EMO: 0, STR: 0, RSK: 0, INT: 0 });
  assert.deepEqual(result.weakestAxis, { axis: 'ACT', score: 0 });
  assert.equal(result.strongestPositiveAxis, null);
});

test('retriever loads complete inventories and keeps evidence/provenance', () => {
  const tarot = loadTarotLabels();
  const numerology = loadNumerologyLabels();
  assert.equal(tarot.size, 156);
  assert.equal(Array.from(numerology.values()).reduce((count, items) => count + items.length, 0), 223);
  const fool = getTarotEntity({ cardId: 'major-00', isReversed: false });
  assert.ok(fool);
  assert.equal(fool.orientation, 'upright');
  assert.equal(fool.core.ACT.evidenceQuote, 'khởi đầu');
  assert.equal(fool.core.ACT.evidenceStatus, 'supported');
  assert.equal(getTarotEntity({ card: { nameVi: 'Kẻ Khờ' } })?.id, 'major-00');
  assert.equal(getTarotEntity({ card: { id: 'magician', nameVi: 'Nhà Ảo Thuật' }, isReversed: true })?.id, 'major-01');
  assert.equal(getTarotEntity({ card: { id: 'magician', nameVi: 'Nhà Ảo Thuật' }, isReversed: true })?.orientation, 'reversed');
  assert.equal(getTarotEntity({ cardId: 'not-a-card', isReversed: false }), null);
});

test('all 78 cards sent by the mobile Tarot deck resolve in both orientations', () => {
  assert.equal(MAJOR_ARCANA.length, 22);
  assert.equal(TAROT_DECK.length, 78);
  assert.equal(new Set(TAROT_DECK.map((card) => card.id)).size, 78);
  for (const card of TAROT_DECK) {
    for (const isReversed of [false, true]) {
      const diagnostics: Parameters<typeof getTarotEntity>[1] = [];
      const match = getTarotEntity({ card, isReversed }, diagnostics);
      const expectedId = card.id.includes('-') && /^\d/.test(card.id)
        ? `major-${String(card.number).padStart(2, '0')}`
        : card.id;
      assert.equal(match?.id, expectedId, `${card.id} (${isReversed ? 'reversed' : 'upright'})`);
      assert.equal(match?.orientation, isReversed ? 'reversed' : 'upright');
      assert.equal(diagnostics.some((item) => item.reason === 'missing_entity'), false);
    }
  }
  const spread = drawCardsForSpread('two-options');
  assert.equal(spread.length, 5);
  assert.equal(new Set(spread.map(({ card }) => card.id)).size, 5);
});

test('every mobile Tarot card has an image copied from the complete backend deck', () => {
  const assetMapPath = new URL('../../mobile_app/src/services/tarotAssets.ts', import.meta.url);
  const assetMap = readFileSync(assetMapPath, 'utf8');
  const entries = Array.from(assetMap.matchAll(/'([^']+)': require\('([^']+)'\)/g));
  const imagePaths = new Map(entries.map(([, id, assetPath]) => [id, assetPath]));
  assert.equal(imagePaths.size, 78);
  for (const card of TAROT_DECK) {
    const relativePath = imagePaths.get(card.id);
    assert.ok(relativePath, `no image mapping for ${card.id}`);
    const mobileImage = new URL(relativePath, assetMapPath);
    assert.ok(existsSync(mobileImage), `missing mobile image for ${card.id}`);
    if (/^(wands|cups|swords|pentacles)-/.test(card.id)) {
      const backendImage = new URL(`../../public/tarot/cards/minor/${card.id.replace('-', '/')}.jpg`, import.meta.url);
      assert.deepEqual(readFileSync(mobileImage), readFileSync(backendImage), `wrong image copied for ${card.id}`);
    }
  }
});

test('selected indicator resolution supports compound profile formats without fuzzy lookup', () => {
  const missing = getNumerologyEntities({ key: 'missingNumbers', name: 'Số thiếu', value: '1, 4' });
  assert.deepEqual(missing.map((item) => item.numberValue), ['1', '4']);
  const karmic = getNumerologyEntities({ key: 'karmicDebts', name: 'Nợ nghiệp', value: '13/4, 16/7' });
  assert.deepEqual(karmic.map((item) => item.numberValue), ['13/4', '16/7']);
  const noMatchDiagnostics: Parameters<typeof getNumerologyEntities>[1] = [];
  assert.deepEqual(getNumerologyEntities({ key: 'walksOfLife', name: 'Đường đời', value: '999' }, noMatchDiagnostics), []);
  assert.ok(noMatchDiagnostics.some((item) => item.reason === 'missing_entity'));
});

test('selector handoff keeps only indicators selected by the classifier and caps them at five', () => {
  const supplied = Array.from({ length: 24 }, (_, index) => ({
    key: `indicator-${index + 1}`, name: `Chỉ số ${index + 1}`, value: index + 1
  }));
  const selected = selectRequestedIndicators(supplied, ['indicator-4', 'indicator-9', 'indicator-12', 'indicator-18', 'indicator-21', 'indicator-24']);
  assert.deepEqual(selected.map((item) => item.key), ['indicator-4', 'indicator-9', 'indicator-12', 'indicator-18', 'indicator-21']);
});

test('AI context uses only passed selections and includes the cited evidence', () => {
  const result = generateResonanceContext(
    [{ cardId: 'major-00', isReversed: false, position: { nameVi: 'Hiện tại' } }],
    [{ key: 'walksOfLife', name: 'Đường đời', value: '1' }]
  );
  assert.equal(result.matchedTarotCount, 1);
  assert.equal(result.matchedNumerologyCount, 1);
  assert.match(result.formattedAiPromptForm, /Kẻ Khờ/);
  assert.match(result.formattedAiPromptForm, /Đường đời/);
  assert.match(result.formattedAiPromptForm, /khởi đầu/);
  assert.doesNotMatch(result.formattedAiPromptForm, /Ngôi Sao/);
});
