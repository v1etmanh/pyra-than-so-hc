import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadDataset, validateDataset, validateRecords } from '../scripts/tarot-labeling/validate.mjs';

const { records } = loadDataset();
const find = (id: string, state: string) => {
  const r = records.find((r: {cardId: string; state: string}) => r.cardId === id && r.state === state);
  assert.ok(r, `${id}/${state} missing`);
  return r;
};
const edit = (id: string, state: string) => {
  const data = structuredClone(records);
  return {data, row:data.find((r: {cardId: string; state: string}) => r.cardId === id && r.state === state)!};
};

test('all 156 annotations pass source, schema, provenance, manifest and queue validation', () => {
  const result = validateDataset();
  assert.deepEqual(result.errors, []);
  assert.equal(result.passed, true);
  assert.equal(result.stats.cards, 78);
  assert.equal(result.stats.records, 156);
  assert.equal(result.stats.cells, 1560);
});

test('a plausible invented quotation is rejected even when the score is in range', () => {
  const {data,row} = edit('swords-12','reversed');
  row.shadow.RSK.evidenceQuote = 'liều lĩnh mù quáng';
  row.shadow.RSK.evidenceQuotes[0].quote = 'liều lĩnh mù quáng';
  assert.equal(validateRecords(data).passed, false);
});

test('quotes from the opposite orientation and stale character spans are rejected', () => {
  const {data,row} = edit('cups-01','upright');
  row.core.INT.evidenceQuotes[0].sourceField = 'keywords.reversed.1.vi';
  assert.equal(validateRecords(data).passed, false);
  const other = edit('cups-01','upright');
  other.row.core.INT.evidenceQuotes[0].start = 1;
  assert.equal(validateRecords(other.data).passed, false);
});

test('a nonzero score without evidence or unknown axis cannot pass', () => {
  const {data,row} = edit('major-01','upright');
  row.shadow.EMO.score = -1;
  assert.equal(validateRecords(data).passed, false);
  const other = edit('major-01','upright');
  other.row.core.EXTRA = structuredClone(other.row.core.ACT);
  assert.equal(validateRecords(other.data).passed, false);
});

test('missing states and duplicates cannot masquerade as a complete deck', () => {
  assert.equal(validateRecords(records.slice(1)).passed, false);
  const duplicate = [...records.slice(1),records[1]];
  assert.equal(validateRecords(duplicate).passed, false);
});

test('opposing source readings are resolved by explicit inference without hiding uncertainty', () => {
  const cases = [
    ['major-00','reversed','core','RSK',-1],['major-04','reversed','core','STR',-1],
    ['major-04','reversed','shadow','STR',2],['major-05','reversed','core','STR',-1],
    ['major-05','reversed','shadow','STR',2],['major-18','upright','core','INT',1],
    ['wands-05','reversed','core','EMO',1],['wands-08','reversed','core','ACT',-1],
    ['wands-08','reversed','shadow','ACT',2]
  ] as const;
  for (const [id,state,aspect,axis,expected] of cases) {
    const cell = find(id,state)[aspect][axis];
    assert.equal(cell.evidenceStatus,'inferred');
    assert.equal(cell.score,expected);
    assert.equal(cell.eligibleForRelations,true);
    assert.ok(cell.rationale.startsWith('AI phán đoán'));
    assert.equal(cell.evidenceQuotes.length,1);
  }
  const {data,row} = edit('major-04','reversed');
  row.core.STR.eligibleForRelations = false;
  assert.equal(validateRecords(data).passed,false);
});

test('recklessness and rigidity retain the high end of their characteristic axes', () => {
  assert.equal(find('swords-12','reversed').shadow.RSK.score, 2);
  assert.equal(find('pentacles-04','reversed').shadow.STR.score, 2);
  assert.equal(find('pentacles-04','reversed').shadow.RSK.score, -1);
});

test('direct labels stay distinct from user-authorized inferred scores', () => {
  assert.equal(find('major-16','upright').core.RSK.score, 0);
  assert.equal(find('swords-01','upright').core.RSK.score, 0);
  assert.equal(find('cups-01','upright').shadow.STR.score, 0);
  assert.equal(find('pentacles-04','reversed').core.INT.score, 0);
  assert.equal(find('cups-01','reversed').core.EMO.score, -2);
  assert.equal(find('cups-01','reversed').core.INT.score, 0);
  assert.equal(find('cups-01','reversed').core.EMO.evidenceStatus,'supported');
  assert.equal(find('major-14','upright').core.STR.evidenceStatus,'inferred');
  const {data,row} = edit('major-14','upright');
  row.core.STR.inferenceMethod = undefined;
  assert.equal(validateRecords(data).passed,false);
});

test('uncalibrated confidence is explicit and cannot be promoted to fake certainty', () => {
  const {data,row} = edit('major-00','upright');
  assert.ok(records.every((r: {overallConfidence: unknown}) => r.overallConfidence === null));
  row.overallConfidence = 0.95;
  assert.equal(validateRecords(data).passed, false);
});

test('all 24 formerly unusable states now have at least one enabled inference', () => {
  const oldManifest=JSON.parse(fs.readFileSync(new URL('../data/tarot-labels/archive/v2.0.0/manifest.json',import.meta.url),'utf8'));
  const formerlyUnusable=new Set(oldManifest.files.flatMap((f: {filePath: string})=>JSON.parse(fs.readFileSync(new URL(`../data/tarot-labels/archive/v2.0.0/${f.filePath}`,import.meta.url),'utf8')))
    .filter((r: {reviewFlags: string[]})=>r.reviewFlags.includes('no-usable-axis'))
    .map((r: {cardId: string; state: string})=>`${r.cardId}:${r.state}`));
  assert.equal(formerlyUnusable.size,24);
  for(const key of Array.from(formerlyUnusable) as string[]) {
    const [cardId,state]=key.split(':');
    const row=find(cardId,state);
    const inferred=(['core','shadow'] as const).flatMap(aspect=>Object.values(row[aspect]) as Array<{evidenceStatus: string; eligibleForRelations: boolean}>).filter(c=>c.evidenceStatus==='inferred');
    assert.ok(inferred.length>0,key);
    assert.ok(inferred.some(c=>c.eligibleForRelations),key);
    assert.ok(!row.reviewFlags.includes('no-usable-axis'),key);
  }
  const {data,row}=edit('major-14','upright');
  row.core.STR.score=0;
  assert.equal(validateRecords(data).passed,false);
});

test('a changed source version is detected and v1 data remains preserved', () => {
  const result = validateRecords(records, {sourceSha256:'0'.repeat(64)});
  assert.equal(result.passed, false);
  const archive = new URL('../data/tarot-labels/archive/v1.0.0/manifest.json',import.meta.url);
  const old = JSON.parse(fs.readFileSync(archive,'utf8'));
  assert.equal(old.version,'1.0.0');
  const original = JSON.parse(fs.readFileSync(new URL('../data/tarot-labels/archive/v1.0.0/major-arcana.json',import.meta.url),'utf8'));
  assert.equal(original[0].core.RSK.score,2);
  assert.equal(original[0].overallConfidence,0.95);
});

test('the frozen human worksheet is balanced and does not contain AI answers', () => {
  const template = JSON.parse(fs.readFileSync(new URL('../data/tarot-labels/human-review-template-3.0.0.json',import.meta.url),'utf8'));
  assert.equal(template.status,'pending-human-labels');
  assert.equal(template.randomSampleSize,50);
  const sample = template.items.filter((r: {selectionReason: string}) => r.selectionReason==='random-stratified');
  assert.equal(sample.length,50);
  assert.equal(sample.filter((r: {state: string}) => r.state==='upright').length,25);
  assert.equal(sample.filter((r: {state: string}) => r.state==='reversed').length,25);
  assert.equal(new Set(template.items.map((r: {cardId: string; state: string}) => `${r.cardId}:${r.state}`)).size,template.items.length);
  for(const row of template.items) {
    assert.equal(row.reviewer,null);
    for(const aspect of ['core','shadow']) for(const cell of Object.values(row[aspect])) {
      assert.deepEqual(cell,{score:null,evidenceStatus:null,evidenceQuote:null,rationale:null});
    }
  }
});
