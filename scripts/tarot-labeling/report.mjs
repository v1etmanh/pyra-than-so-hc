import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { axes, loadDataset, validateDataset } from './validate.mjs';

const dir = fileURLToPath(new URL('../../data/tarot-labels/',import.meta.url));
const {manifest,records} = loadDataset();
const validation = validateDataset();
if(!validation.passed) throw Error('Refusing to report an invalid dataset.');
const oldManifest = JSON.parse(fs.readFileSync(dir+'archive/v2.0.0/manifest.json','utf8'));
const oldRecords = oldManifest.files.flatMap(f=>JSON.parse(fs.readFileSync(dir+'archive/v2.0.0/'+f.filePath,'utf8')));
const oldMap = new Map(oldRecords.map(r=>[`${r.cardId}:${r.state}`,r]));
const differences = [];
let changedScores=0,unchangedScores=0,removedNonzero=0,correctedRetainedNonzero=0;
for(const r of records) {
  const previous = oldMap.get(`${r.cardId}:${r.state}`);
  for(const aspect of ['core','shadow']) for(const axis of axes) {
    const oldCell = previous[aspect][axis];
    const cell = r[aspect][axis];
    if(oldCell.score===cell.score) unchangedScores++;else changedScores++;
    if(oldCell.score!==0 && cell.score===0) removedNonzero++;
    if(oldCell.score!==0 && cell.score!==0 && oldCell.score!==cell.score) correctedRetainedNonzero++;
    differences.push({cardId:r.cardId,state:r.state,aspect,axis,previousScore:oldCell.score,score:cell.score,
      previousEvidenceQuote:oldCell.evidenceQuote,evidenceQuote:cell.evidenceQuote,evidenceStatus:cell.evidenceStatus,
      eligibleForRelations:cell.eligibleForRelations,rationale:cell.rationale,
      inferenceMethod:cell.inferenceMethod??null});
  }
}
const report = {previousVersion:'1.0.0',currentVersion:manifest.version,
  scope:'Every cell reannotated from current source. This report does not measure accuracy against human gold.',
  changedScores,unchangedScores,removedNonzero,correctedRetainedNonzero,
  validation:validation.stats,differences};
fs.writeFileSync(dir+'reannotation-report.json',JSON.stringify(report,null,2)+'\n');

// Freeze a blinded reviewer worksheet. It is intentionally not a completed gold dataset.
const seed = 'NUMELYRA-TAROT-V3-HUMAN-SAMPLE-2026-10-01';
const hash = key => crypto.createHash('sha256').update(seed+'|'+key).digest('hex');
const groups = [{suit:'major',upright:7,reversed:7},{suit:'wands',upright:5,reversed:4},
  {suit:'cups',upright:4,reversed:5},{suit:'swords',upright:5,reversed:4},{suit:'pentacles',upright:4,reversed:5}];
const sample = groups.flatMap(g=>['upright','reversed'].flatMap(state=>records
  .filter(r=>(r.suit??'major')===g.suit&&r.state===state)
  .sort((a,b)=>hash(`${a.cardId}:${a.state}`).localeCompare(hash(`${b.cardId}:${b.state}`)))
  .slice(0,g[state])));
const keys = new Set(sample.map(r=>`${r.cardId}:${r.state}`));
const extra = records.filter(r=>r.reviewFlags.length&&!keys.has(`${r.cardId}:${r.state}`));
const template = {purpose:'Blinded human review worksheet, NOT gold until filled and signed by a human reviewer.',
  status:'pending-human-labels',version:manifest.version,rubricVersion:manifest.rubricVersion??'3.0.0',
  sourceSha256:manifest.sourceSha256,rubricSha256:manifest.rubricSha256,seed,
  samplingMethod:'Stratified pseudo-random sample by suit and orientation; additional source ambiguity/insufficiency cases.',
  freezeStage:'after-v3-source-and-judgment-annotation-before-human-review',randomSampleSize:sample.length,
  additionalFlaggedItems:extra.length,totalItems:sample.length+extra.length,
  instructions:['Read the rubric and source without viewing AI score files.',
    'Fill every cell with your ordinal score and source evidence, or an explicit insufficient/ambiguous status.',
    'Do not treat unfilled null fields as zeros. Record reviewer identity and date.',
    'After labels are complete, compare the random sample separately from added flagged cases.'],
  items:[...sample,...extra].map(r=>({cardId:r.cardId,state:r.state,sourceSnippet:r.sourceSnippet,
    selectionReason:keys.has(`${r.cardId}:${r.state}`)?'random-stratified':'additional-source-review',
    core:Object.fromEntries(axes.map(axis=>[axis,{score:null,evidenceStatus:null,evidenceQuote:null,rationale:null}])),
    shadow:Object.fromEntries(axes.map(axis=>[axis,{score:null,evidenceStatus:null,evidenceQuote:null,rationale:null}])),
    reviewer:null,reviewedAt:null}))};
const templateFile = dir+'human-review-template-3.0.0.json';
if(fs.existsSync(templateFile)) {
  const existing = JSON.parse(fs.readFileSync(templateFile,'utf8'));
  if(JSON.stringify(existing)!==JSON.stringify(template)) throw Error('Frozen reviewer worksheet differs; preserve user labels and sample, create a new version instead.');
} else fs.writeFileSync(templateFile,JSON.stringify(template,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({changedScores,unchangedScores,removedNonzero,correctedRetainedNonzero,
  randomSampleSize:template.randomSampleSize,additionalFlaggedItems:template.additionalFlaggedItems},null,2));
