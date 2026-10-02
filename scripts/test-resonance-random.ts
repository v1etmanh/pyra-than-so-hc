import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeResonance } from '../lib/resonance/analyzer.ts';
import { loadNumerologyLabels, loadTarotLabels } from '../lib/resonance/retriever.ts';
import type { AxisKey, LabeledEntity } from '../lib/resonance/types.ts';
import { generateResonanceContext } from '../lib/resonance/index.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AXES: AxisKey[] = ['ACT', 'EMO', 'STR', 'RSK', 'INT'];
const SEED = Number.parseInt(process.env.RESONANCE_SEED ?? '20261001', 10);
const RANDOM_CASES = Math.max(1, Number.parseInt(process.env.RESONANCE_CASES ?? '1000', 10));

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMany<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const index = Math.floor(random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
}

function loadRawFiles(dir: string, accept: (name: string) => boolean) {
  const files = fs.readdirSync(dir).filter(accept).sort();
  return files.flatMap((file) => {
    const parsed: unknown = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!Array.isArray(parsed)) throw new Error(`${file}: expected JSON array`);
    return parsed as Array<Record<string, any>>;
  });
}

function scoreAudit(items: Array<Record<string, any>>) {
  const findings = { invalidScores: 0, missingEvidenceOnNonZero: 0, unsupportedNonZero: 0, totalAxes: 0, missingEvidenceExamples: [] as string[] };
  for (const item of items) {
    for (const field of ['core', 'shadow']) {
      for (const axis of AXES) {
        const value = item[field]?.[axis];
        if (!value) continue;
        findings.totalAxes++;
        if (!Number.isInteger(value.score) || value.score < -2 || value.score > 2) findings.invalidScores++;
        if (value.score !== 0 && !String(value.evidenceQuote ?? '').trim()) {
          findings.missingEvidenceOnNonZero++;
          if (findings.missingEvidenceExamples.length < 20) findings.missingEvidenceExamples.push(`${item.id}.${field}.${axis}=${value.score}`);
        }
        if (value.score !== 0 && value.eligibleForRelations === false) findings.unsupportedNonZero++;
      }
    }
  }
  return findings;
}

function canonical(result: ReturnType<typeof generateResonanceContext>) {
  const stablePairs = (pairs: typeof result.synergies) => pairs
    .map((pair) => `${pair.type}|${pair.tarotEntity.id}|${pair.tarotEntity.orientation}|${pair.numerologyEntity.id}|${pair.axis}|${pair.intensity}`)
    .sort();
  return JSON.stringify({
    netVector: result.netVector,
    weakestAxis: result.weakestAxis,
    strongestPositiveAxis: result.strongestPositiveAxis,
    synergies: stablePairs(result.synergies),
    compensatoryRemedies: stablePairs(result.compensatoryRemedies),
    tensions: stablePairs(result.tensions),
    shadowVortexes: stablePairs(result.shadowVortexes)
  });
}

function expectPairRule(pair: { type: string; tarotScore: number; numerologyScore: number }) {
  switch (pair.type) {
    case 'synergy': assert.ok(pair.tarotScore > 0 && pair.numerologyScore > 0); break;
    case 'compensatory': assert.ok(pair.tarotScore > 0 && pair.numerologyScore < 0); break;
    case 'tension': assert.ok(pair.tarotScore * pair.numerologyScore <= -2); break;
    case 'shadow_vortex': assert.ok(pair.tarotScore < 0 && pair.numerologyScore < 0); break;
    default: assert.fail(`Unknown interaction type: ${pair.type}`);
  }
}

function syntheticRuleChecks() {
  const vector = (scores: number[]): LabeledEntity['core'] => Object.fromEntries(
    AXES.map((axis, index) => [axis, { score: scores[index], evidenceQuote: 'fixture', rationale: 'fixture' }])
  ) as LabeledEntity['core'];
  const tarot: LabeledEntity = {
    id: 'fixture-card', name: 'Fixture Tarot', domain: 'tarot', subType: 'major', orientation: 'reversed',
    core: vector([2, 1, 2, -2, 0]), shadow: vector([-2, 0, 0, -1, 0])
  };
  const numerology: LabeledEntity = {
    id: 'fixture-number', name: 'Fixture Number', domain: 'numerology', subType: 'fixture', numberValue: '1',
    core: vector([1, -1, 0, 2, 0]), shadow: vector([-1, -2, 0, -2, 0])
  };
  const result = analyzeResonance([tarot], [numerology]);
  assert.deepEqual(result.netVector, { ACT: 3, EMO: 0, STR: 2, RSK: 0, INT: 0 });
  assert.equal(result.weakestAxis.axis, 'EMO');
  assert.deepEqual(result.strongestPositiveAxis, { axis: 'ACT', score: 3 });
  assert.equal(result.synergies.length, 1);
  assert.equal(result.compensatoryRemedies.length, 2);
  assert.equal(result.tensions.length, 1);
  assert.equal(result.shadowVortexes.length, 2);
  for (const pair of result.synergies) expectPairRule({ type: pair.type, tarotScore: pair.tarotEntity.score, numerologyScore: pair.numerologyEntity.score });
  const empty = analyzeResonance([], []);
  assert.ok(Object.values(empty.netVector).every((score) => score === 0));
  assert.equal(empty.strongestPositiveAxis, null);
}

function main() {
  const tarotRaw = loadRawFiles(path.join(ROOT, 'data', 'tarot-labels'), (name) =>
    ['major-arcana.json', 'wands.json', 'cups.json', 'swords.json', 'pentacles.json'].includes(name));
  const numerologyRaw = loadRawFiles(path.join(ROOT, 'data', 'numerology-labels'), (name) => name.endsWith('.json') && name !== 'manifest.json');
  const tarotManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tarot-labels', 'manifest.json'), 'utf8'));
  const numerologyManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'numerology-labels', 'manifest.json'), 'utf8'));
  const tarot = [...loadTarotLabels().values()];
  const numerology = [...loadNumerologyLabels().values()].flat();
  const numerologyByKey = new Map<string, typeof numerology>();
  for (const entity of numerology) numerologyByKey.set(entity.subType, [...(numerologyByKey.get(entity.subType) ?? []), entity]);
  const indicatorGroups = [...numerologyByKey.entries()];
  const tarotByCard = new Map<string, typeof tarot>();
  for (const entity of tarot) tarotByCard.set(entity.id, [...(tarotByCard.get(entity.id) ?? []), entity]);
  const tarotGroups = [...tarotByCard.values()];
  assert.ok(tarot.length > 0 && numerology.length > 0, 'Both JSON datasets must load at least one entity');
  syntheticRuleChecks();

  const random = rng(SEED);
  const totals = { synergy: 0, compensatory: 0, tension: 0, shadowVortex: 0 };
  const findings: string[] = [];
  let reorderedMismatches = 0;
  let nondeterministicMismatches = 0;
  let invalidOutputs = 0;
  const combinations = new Set<string>();

  for (let i = 0; i < RANDOM_CASES; i++) {
    const chosenTarot = pickMany(tarotGroups, 1 + Math.floor(random() * 3), random)
      .map((states) => states[Math.floor(random() * states.length)]);
    const chosenNumerology = pickMany(indicatorGroups, 1 + Math.floor(random() * 5), random)
      .map(([key, entities]) => {
        const entity = entities[Math.floor(random() * entities.length)];
        return { key, name: entity.name, value: entity.numberValue ?? '' };
      });
    const cards = chosenTarot.map((entity) => ({ cardId: entity.id, isReversed: entity.orientation === 'reversed' }));
    const indicators = chosenNumerology;
    combinations.add(`${cards.map((c) => `${c.cardId}:${c.isReversed}`).join(',')}|${indicators.map((n) => `${n.key}:${n.value}`).join(',')}`);

    const result = generateResonanceContext(cards, indicators);
    const again = generateResonanceContext(cards, indicators);
    if (canonical(result) !== canonical(again)) nondeterministicMismatches++;
    const permuted = generateResonanceContext([...cards].reverse(), [...indicators].reverse());
    if (canonical(result) !== canonical(permuted)) reorderedMismatches++;

    for (const pair of result.synergies) { totals.synergy++; expectPairRule({ type: pair.type, tarotScore: pair.tarotEntity.score, numerologyScore: pair.numerologyEntity.score }); }
    for (const pair of result.compensatoryRemedies) { totals.compensatory++; expectPairRule({ type: pair.type, tarotScore: pair.tarotEntity.score, numerologyScore: pair.numerologyEntity.score }); }
    for (const pair of result.tensions) { totals.tension++; expectPairRule({ type: pair.type, tarotScore: pair.tarotEntity.score, numerologyScore: pair.numerologyEntity.score }); }
    for (const pair of result.shadowVortexes) { totals.shadowVortex++; expectPairRule({ type: pair.type, tarotScore: pair.tarotEntity.score, numerologyScore: pair.numerologyEntity.score }); }
    const scores = [...Object.values(result.netVector), result.weakestAxis.score, ...(result.strongestPositiveAxis ? [result.strongestPositiveAxis.score] : [])];
    if (scores.some((score) => !Number.isFinite(score)) || !result.formattedAiPromptForm.trim()) invalidOutputs++;
  }

  const tarotAudit = scoreAudit(tarotRaw);
  const numerologyAudit = scoreAudit(numerologyRaw);
  if (tarotRaw.length !== tarotManifest.statistics.totalCardStates) {
    findings.push(`Tarot: JSON có ${tarotRaw.length} trạng thái nhưng manifest khai báo ${tarotManifest.statistics.totalCardStates}`);
  }
  if (numerologyRaw.length !== numerologyManifest.statistics.totalItems) {
    findings.push(`Thần số học: JSON có ${numerologyRaw.length} mục nhưng manifest khai báo ${numerologyManifest.statistics.totalItems}`);
  }
  for (const [name, audit] of [['Tarot', tarotAudit], ['Thần số học', numerologyAudit]] as const) {
    if (audit.invalidScores) findings.push(`${name}: ${audit.invalidScores} score ngoài số nguyên -2..+2`);
    if (audit.missingEvidenceOnNonZero) findings.push(`${name}: ${audit.missingEvidenceOnNonZero} score khác 0 thiếu evidenceQuote`);
    if (audit.unsupportedNonZero) findings.push(`${name}: ${audit.unsupportedNonZero} score khác 0 bị đánh dấu không đủ điều kiện relation`);
  }
  if (reorderedMismatches) findings.push(`${reorderedMismatches}/${RANDOM_CASES} ca đổi thứ tự input làm thay đổi kết quả`);
  if (nondeterministicMismatches) findings.push(`${nondeterministicMismatches}/${RANDOM_CASES} ca lặp lại cùng input nhưng kết quả khác`);
  if (invalidOutputs) findings.push(`${invalidOutputs}/${RANDOM_CASES} ca cho output không hữu hạn hoặc prompt rỗng`);

  const report = {
    seed: SEED, randomCases: RANDOM_CASES, uniqueInputSets: combinations.size,
    dataset: {
      tarotEntities: tarot.length, numerologyEntities: numerology.length,
      manifestExpected: { tarot: tarotManifest.statistics.totalCardStates, numerology: numerologyManifest.statistics.totalItems },
      tarotRawAudit: tarotAudit, numerologyRawAudit: numerologyAudit
    },
    interactionsFound: totals,
    runtimeChecks: { syntheticRuleChecks: 'passed', nondeterministicMismatches, reorderedMismatches, invalidOutputs },
    findings
  };
  const reportPath = path.join(ROOT, 'scratch', 'resonance-random-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
  if (findings.length) process.exitCode = 1;
}

main();
