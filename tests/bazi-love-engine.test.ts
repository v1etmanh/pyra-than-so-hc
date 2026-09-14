import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateBaziCompatibility,
  solveSingleChart,
  calcShishen,
  scoreWuxingComplement,
  scoreGanzhiInteractions,
  scoreShishenMatch,
  scoreDayunSync,
  calcClimateProfile,
  SAMPLE_HOURS
} from '../lib/bazi-love/engine.ts';

test('Golden fixture: Person A chart matches Python solve_bazi', () => {
  const chartA = solveSingleChart({
    name: 'Nguyễn Văn A',
    birthDate: '1990-05-12',
    birthTime: '14:30',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'male'
  });

  const pillarsStr = chartA.pillars.map((p) => `${p.gan}${p.zhi}`).join(' ');
  assert.equal(pillarsStr, '庚午 辛巳 丁丑 丁未');
  assert.equal(chartA.dayMaster, '丁');
  assert.equal(chartA.dayMasterElement, 'fire');
  assert.equal(chartA.yongshenZh, '水');
  assert.equal(chartA.jishenZh, '火');
  assert.equal(chartA.strengthLabel, '中和');
  assert.equal(chartA.qiyunAge, 8);
});

test('Golden fixture: Person B chart matches Python solve_bazi', () => {
  const chartB = solveSingleChart({
    name: 'Trần Thị B',
    birthDate: '1992-08-20',
    birthTime: '09:15',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'female'
  });

  const pillarsStr = chartB.pillars.map((p) => `${p.gan}${p.zhi}`).join(' ');
  assert.equal(pillarsStr, '壬申 戊申 戊辰 丁巳');
  assert.equal(chartB.dayMaster, '戊');
  assert.equal(chartB.dayMasterElement, 'earth');
  assert.equal(chartB.yongshenZh, '火');
  assert.equal(chartB.jishenZh, '火');
});

test('Golden fixture: Pair synastry layers match Python he_pan scores', () => {
  const chartA = solveSingleChart({
    name: 'Person A',
    birthDate: '1990-05-12',
    birthTime: '14:30',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'male'
  });

  const chartB = solveSingleChart({
    name: 'Person B',
    birthDate: '1992-08-20',
    birthTime: '09:15',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'female'
  });

  // Layer 1: Five elements
  const layer1 = scoreWuxingComplement(chartA, chartB);
  assert.equal(layer1.score, 2.6);

  // Layer 2: Ganzhi interactions
  const layer2 = scoreGanzhiInteractions(chartA, chartB);
  assert.ok(Math.abs(layer2.score - 29.2) <= 0.2); // 29.2 - 29.3 due to rounding

  // Layer 3: source-compatible score with identity-neutral wording
  const layer3 = scoreShishenMatch(chartA, chartB);
  assert.equal(layer3.score, 0.0);
  assert.ok(layer3.notes.every((note) => !/wife|husband|nam\)|nữ\)/i.test(`${note.text.vi} ${note.text.en}`)));

  // Layer 4: Dayun sync over 2026-2030
  const layer4 = scoreDayunSync(chartA, chartB, [2026, 2027, 2028, 2029, 2030]);
  assert.equal(layer4.score, 0.0);
});

test('Confidence levels based on birth time specification', () => {
  // Both known -> high
  const bothKnown = evaluateBaziCompatibility(
    { name: 'A', birthDate: '1990-05-12', birthTime: '14:30', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'male' },
    { name: 'B', birthDate: '1992-08-20', birthTime: '09:15', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'female' },
    2026
  );
  assert.equal(bothKnown.confidence, 'high');
  assert.equal(bothKnown.charts[0].timeKnown, true);
  assert.equal(bothKnown.charts[1].timeKnown, true);
  assert.ok(!bothKnown.layers[0].uncertain);

  // One unknown -> medium
  const oneKnown = evaluateBaziCompatibility(
    { name: 'A', birthDate: '1990-05-12', birthTime: '14:30', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'male' },
    { name: 'B', birthDate: '1992-08-20', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'female' },
    2026
  );
  assert.equal(oneKnown.confidence, 'medium');
  assert.equal(oneKnown.charts[0].timeKnown, true);
  assert.equal(oneKnown.charts[1].timeKnown, false);
  assert.equal(oneKnown.charts[1].pillars[3], null);
  assert.equal(oneKnown.layers[0].uncertain, true);

  // Both unknown -> low
  const bothUnknown = evaluateBaziCompatibility(
    { name: 'A', birthDate: '1990-05-12', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'male' },
    { name: 'B', birthDate: '1992-08-20', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'female' },
    2026
  );
  assert.equal(bothUnknown.confidence, 'low');
  assert.equal(bothUnknown.charts[0].timeKnown, false);
  assert.equal(bothUnknown.charts[1].timeKnown, false);
  assert.equal(bothUnknown.charts[0].pillars[3], null);
  assert.equal(bothUnknown.charts[1].pillars[3], null);
  assert.ok(bothUnknown.assumptions.length > 0);
});

test('Unknown hours scan produces proper minScore <= score <= maxScore', () => {
  const result = evaluateBaziCompatibility(
    { name: 'A', birthDate: '1995-11-04', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'male' },
    { name: 'B', birthDate: '1998-02-14', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'female' },
    2026
  );

  for (const layer of result.layers) {
    assert.ok(layer.minScore <= layer.score, `${layer.id}: minScore ${layer.minScore} should be <= score ${layer.score}`);
    assert.ok(layer.score <= layer.maxScore, `${layer.id}: score ${layer.score} should be <= maxScore ${layer.maxScore}`);
    assert.ok(layer.notes.every((note) => (note.occurrenceRate || 0) >= 0.25));
  }
});

test('Unknown-hour samples cover both sides of the Zi boundary', () => {
  assert.ok(SAMPLE_HOURS.includes('00:30'));
  assert.ok(SAMPLE_HOURS.includes('23:30'));
  assert.equal(SAMPLE_HOURS.length, 13);
});

test('Climate profile keeps Hai and Chen at the source weight', () => {
  const climate = calcClimateProfile([
    { gan: '甲', zhi: '亥' },
    { gan: '甲', zhi: '亥' },
    { gan: '甲', zhi: '亥' },
    { gan: '甲', zhi: '亥' }
  ]);
  assert.equal(climate.total, -2.6);
  assert.equal(climate.label, '偏湿');
});

test('Handles midnight / Zi hour without throwing', () => {
  const lateZi = solveSingleChart({
    name: 'Night Born',
    birthDate: '2000-01-01',
    birthTime: '23:45',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'male'
  });
  assert.ok(lateZi.pillars[3].zhi === '子');

  const earlyZi = solveSingleChart({
    name: 'Early Morning Born',
    birthDate: '2000-01-01',
    birthTime: '00:15',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'male'
  });
  assert.ok(earlyZi.pillars[3].zhi === '子');
});

test('Shishen calculation covers all 10 relationship roles', () => {
  // Day master Jia (Wood +)
  assert.equal(calcShishen('甲', '甲'), '比肩'); // Friend
  assert.equal(calcShishen('甲', '乙'), '劫财'); // Rob Wealth
  assert.equal(calcShishen('甲', '丙'), '食神'); // Eating God
  assert.equal(calcShishen('甲', '丁'), '伤官'); // Hurting Officer
  assert.equal(calcShishen('甲', '戊'), '偏财'); // Indirect Wealth
  assert.equal(calcShishen('甲', '己'), '正财'); // Direct Wealth
  assert.equal(calcShishen('甲', '庚'), '七杀'); // Seven Killings
  assert.equal(calcShishen('甲', '辛'), '正官'); // Direct Officer
  assert.equal(calcShishen('甲', '壬'), '偏印'); // Indirect Resource
  assert.equal(calcShishen('甲', '癸'), '正印'); // Direct Resource
});
