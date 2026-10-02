import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { allTarotCards } from '../../lib/tarot/cards.ts';

export const axes = ['ACT','EMO','STR','RSK','INT'];
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root,'data/tarot-labels');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const scoreSchema = z.number().int().min(-2).max(2);
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const evidenceSchema = z.object({quote:z.string().min(1),
  sourceField:z.string().regex(/^(keywords\.(upright|reversed)\.[0-2]\.vi|meaning\.(upright|reversed)\.vi)$/),
  start:z.number().int().nonnegative(),end:z.number().int().positive()}).strict();
const alternativeSchema = z.object({score:scoreSchema,evidenceQuotes:z.array(evidenceSchema).min(1)}).strict();
const cellSchema = z.object({score:scoreSchema,evidenceQuote:z.string(),evidenceQuotes:z.array(evidenceSchema),
  evidenceStatus:z.enum(['supported','inferred','insufficient','ambiguous']),rationale:z.string().min(1),
  confidence:z.null(),eligibleForRelations:z.boolean(),alternatives:z.array(alternativeSchema),
  inferenceMethod:z.literal('holistic-card-interpretation').optional()}).strict().superRefine((c,ctx)=>{
    if(c.evidenceStatus==='inferred' && (c.score===0||!c.inferenceMethod||!c.rationale.startsWith('AI phán đoán (chưa được người xác nhận):'))) ctx.addIssue({code:'custom',message:'Inferred labels require nonzero score, method and caveat'});
    if(c.evidenceStatus!=='inferred' && c.inferenceMethod) ctx.addIssue({code:'custom',message:'Only inferred labels may carry inferenceMethod'});
    if(c.evidenceStatus==='supported' && c.eligibleForRelations!==(c.score!==0)) ctx.addIssue({code:'custom',message:'Supported score eligibility mismatch'});
    if(c.evidenceStatus!=='supported' && c.evidenceStatus!=='inferred' && (c.score!==0||c.eligibleForRelations||c.evidenceQuote!=='')) ctx.addIssue({code:'custom',message:'Abstentions must remain disabled'});
  });
const aspectSchema = z.object(Object.fromEntries(axes.map(axis=>[axis,cellSchema]))).strict();
export const recordSchema = z.object({
  cardId:z.string(),cardNameVi:z.string(),cardNameEn:z.string(),type:z.enum(['major','minor']),
  suit:z.enum(['wands','cups','swords','pentacles']).nullable(),number:z.number().int(),
  state:z.enum(['upright','reversed']),sourceSnippet:z.string(),core:aspectSchema,shadow:aspectSchema,
  overallConfidence:z.null(),confidenceMethod:z.literal('uncalibrated'),evidenceCoverage:z.number().min(0).max(1),
  annotationVersion:z.literal('3.0.0'),rubricVersion:z.literal('3.0.0'),sourceSha256:hashSchema,rubricSha256:hashSchema,
  provenance:z.object({runId:z.string().min(1),annotatorType:z.literal('ai'),method:z.literal('explicit-source-reannotation'),
    modelId:z.null(),decisionSha256:hashSchema,inferenceSha256:hashSchema,independentRuns:z.literal(1),humanReviewed:z.literal(false)}).strict(),
  reviewStatus:z.literal('silver-inferred-human-unvalidated'),reviewFlags:z.array(z.enum(['ambiguous-axis','judgement-inference','no-usable-axis']))
}).strict();

export function validateRecords(records, {sourceSha256,rubricSha256,decisionSha256,inferenceSha256,runId} = {}) {
  const errors = [];
  const seen = new Set();
  const stats = {records:records.length,cards:0,cells:0,nonzero:0,
    evidenceStatusCounts:{supported:0,inferred:0,insufficient:0,ambiguous:0},noUsableAxisStates:0,ambiguousStates:0,
    usableCoreStates:0,usableShadowStates:0,positiveReversedInt:0,exactEvidenceExcerpts:0,inferredNonzero:0};
  const fail = (key,message) => errors.push({key,message});
  for (const input of records) {
    const key = `${input?.cardId}:${input?.state}`;
    const parsed = recordSchema.safeParse(input);
    if(!parsed.success) {fail(key,parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));continue;}
    const r = parsed.data;
    if(seen.has(key)) fail(key,'Duplicate card/state');
    seen.add(key);
    const card = allTarotCards.find(c=>c.id===r.cardId);
    if(!card) {fail(key,'Unknown card');continue;}
    for(const [field,expected] of Object.entries({cardNameVi:card.name.vi,cardNameEn:card.name.en,
      type:card.type,suit:card.suit??null,number:card.number})) if(r[field]!==expected) fail(key,`Source metadata mismatch: ${field}`);
    const snippet = `Từ khóa: ${card.keywords[r.state].map(k=>k.vi).join(', ')}. Ý nghĩa: ${card.meaning[r.state].vi}`;
    if(r.sourceSnippet!==snippet) fail(key,'sourceSnippet differs from live card source');
    if(sourceSha256 && r.sourceSha256!==sourceSha256) fail(key,'Source hash is stale');
    if(rubricSha256 && r.rubricSha256!==rubricSha256) fail(key,'Rubric hash is stale');
    if(decisionSha256 && r.provenance.decisionSha256!==decisionSha256) fail(key,'Decision hash is stale');
    if(inferenceSha256 && r.provenance.inferenceSha256!==inferenceSha256) fail(key,'Judgment hash is stale');
    if(runId && r.provenance.runId!==runId) fail(key,'Run ID differs from manifest');
    const verifyEvidence = (ev,cellKey) => {
      const parts = ev.sourceField.split('.');
      if(parts[1]!==r.state) {fail(cellKey,'Evidence borrows the opposite orientation');return;}
      const source = parts[0]==='keywords' ? card.keywords[r.state][Number(parts[2])]?.vi : card.meaning[r.state].vi;
      if(!source || ev.end<=ev.start || ev.end>source.length || source.slice(ev.start,ev.end)!==ev.quote)
        fail(cellKey,'Evidence quote/span does not match the referenced source field');
      else stats.exactEvidenceExcerpts++;
      if(!r.sourceSnippet.includes(ev.quote)) fail(cellKey,'Evidence not contained in sourceSnippet');
    };
    const allCells = [];
    for(const aspect of ['core','shadow']) for(const axis of axes) {
      const cell = r[aspect][axis];
      const cellKey = `${key}/${aspect}.${axis}`;
      allCells.push(cell);stats.cells++;
      if(cell.score!==0) stats.nonzero++;
      stats.evidenceStatusCounts[cell.evidenceStatus]++;
      for(const ev of cell.evidenceQuotes) verifyEvidence(ev,cellKey);
      if(cell.evidenceStatus==='supported'||cell.evidenceStatus==='inferred') {
        if(!cell.evidenceQuotes.length || cell.evidenceQuote!==cell.evidenceQuotes[0]?.quote) fail(cellKey,'Supported score must reference its exact primary quote');
        if(cell.alternatives.length) fail(cellKey,'Supported cell cannot retain unresolved alternatives');
        if(cell.eligibleForRelations!==(cell.score!==0)) fail(cellKey,'Only supported nonzero scores are usable');
        if(cell.evidenceStatus==='inferred') {
          stats.inferredNonzero++;
          if(cell.score===0 || cell.inferenceMethod!=='holistic-card-interpretation' || !cell.rationale.startsWith('AI phán đoán (chưa được người xác nhận):')) fail(cellKey,'Inference needs a nonzero judgment, method, and explicit caveat');
        } else if(cell.inferenceMethod) fail(cellKey,'Directly supported score cannot claim an inference method');
      } else {
        if(cell.score!==0 || cell.eligibleForRelations || cell.evidenceQuote!=='') fail(cellKey,'Abstention must be score=0, unusable and have no scalar quote');
        if(cell.evidenceStatus==='insufficient' && (cell.evidenceQuotes.length || cell.alternatives.length)) fail(cellKey,'Insufficient cell cannot assert evidence or alternatives');
      if(cell.evidenceStatus==='ambiguous') {
          if(cell.alternatives.length<2 || new Set(cell.alternatives.map(a=>a.score)).size<2) fail(cellKey,'Ambiguity requires different supported alternatives');
          for(const alt of cell.alternatives) for(const ev of alt.evidenceQuotes) verifyEvidence(ev,`${cellKey}/alternative`);
          if(JSON.stringify(cell.evidenceQuotes)!==JSON.stringify(cell.alternatives.flatMap(a=>a.evidenceQuotes))) fail(cellKey,'Ambiguous evidence does not match alternatives');
        }
      }
      // Shared Minor Arcana boilerplate is not evidence for self-awareness.
      if(card.type==='minor' && axis==='INT' && cell.eligibleForRelations && cell.evidenceQuotes.some(e=>e.quote==='điểm cần nhìn lại')) fail(cellKey,'Generic advice is not INT evidence');
    }
    const coverage = allCells.filter(c=>c.evidenceStatus==='supported'||c.evidenceStatus==='inferred').length/10;
    if(r.evidenceCoverage!==coverage) fail(key,'evidenceCoverage differs from cells');
    const expectedFlags = [...(allCells.some(c=>c.evidenceStatus==='ambiguous')?['ambiguous-axis']:[]),
      ...(allCells.some(c=>c.evidenceStatus==='inferred')?['judgement-inference']:[]),
      ...(allCells.every(c=>!c.eligibleForRelations)?['no-usable-axis']:[])];
    if(JSON.stringify(r.reviewFlags)!==JSON.stringify(expectedFlags)) fail(key,'Review flags differ from cells');
    if(expectedFlags.includes('no-usable-axis')) stats.noUsableAxisStates++;
    if(expectedFlags.includes('ambiguous-axis')) stats.ambiguousStates++;
    if(axes.some(a=>r.core[a].eligibleForRelations)) stats.usableCoreStates++;
    if(axes.some(a=>r.shadow[a].eligibleForRelations)) stats.usableShadowStates++;
    if(r.state==='reversed' && r.core.INT.score>0) stats.positiveReversedInt++;
  }
  stats.cards = new Set(records.map(r=>r.cardId)).size;
  for(const card of allTarotCards) for(const state of ['upright','reversed']) if(!seen.has(`${card.id}:${state}`)) fail(`${card.id}:${state}`,'Missing state');
  return {passed:errors.length===0,stats,errors};
}

export function loadDataset() {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const records = manifest.files.flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f.filePath),'utf8')));
  return {manifest,records};
}
export function validateDataset() {
  const {manifest,records} = loadDataset();
  const hashes = {sourceSha256:sha(fs.readFileSync(path.join(root,'lib/tarot/cards.ts'))),
    rubricSha256:sha(fs.readFileSync(path.join(dir,'rubric.json'))),
    decisionSha256:sha(fs.readFileSync(path.join(root,'scripts/tarot-labeling/decisions.mjs'))),
    inferenceSha256:sha(fs.readFileSync(path.join(root,'scripts/tarot-labeling/inferences.mjs'))),runId:manifest.provenance.runId};
  const result = validateRecords(records,hashes);
  const fail = message => result.errors.push({key:'manifest',message});
  if(manifest.version!=='3.0.0' || manifest.labelTier!=='silver-with-explicit-inference' || manifest.validationStatus!=='machine-validated-human-pending') fail('Dataset tier/version/status is inaccurate');
  if(manifest.sourceSha256!==hashes.sourceSha256 || manifest.rubricSha256!==hashes.rubricSha256 || manifest.provenance.decisionSha256!==hashes.decisionSha256 || manifest.provenance.inferenceSha256!==hashes.inferenceSha256) fail('Manifest has stale dependency hashes');
  if(manifest.statistics.totalCardStates!==records.length || manifest.statistics.totalCards!==result.stats.cards || manifest.statistics.totalCells!==result.stats.cells || manifest.statistics.nonzeroCells!==result.stats.nonzero || manifest.statistics.noUsableAxisStates!==result.stats.noUsableAxisStates) fail('Manifest counts differ from records');
  if(JSON.stringify(manifest.statistics.evidenceStatusCounts)!==JSON.stringify(result.stats.evidenceStatusCounts) || manifest.statistics.inferredCells!==result.stats.inferredNonzero) fail('Manifest evidence counts differ');
  for(const f of manifest.files) {
    const bytes = fs.readFileSync(path.join(dir,f.filePath));
    const rows = JSON.parse(bytes);
    if(sha(bytes)!==f.sha256 || rows.length!==f.itemsCount || new Set(rows.map(r=>r.cardId)).size!==f.cardsCount) fail(`File hash/count mismatch: ${f.filePath}`);
    if(rows.some(r=>f.suit==='major'?r.type!=='major':r.suit!==f.suit)) fail(`File contains wrong suit: ${f.filePath}`);
  }
  const qa = manifest.qualityAssurance;
  if(qa.auditPassed!==false || qa.zeroHallucinationEnforced!==false || qa.confidenceCalibrated!==false || qa.humanGoldAvailable!==false || qa.overallConfidenceMedian!==null || qa.interRaterAgreement!==null || manifest.provenance.independentRuns!==1 || manifest.provenance.humanReviewed!==false) fail('QA claims exceed available validation');
  const queue = JSON.parse(fs.readFileSync(path.join(dir,'review-queue.json'),'utf8'));
    const expected = records.filter(r=>r.reviewFlags.length).map(r=>({cardId:r.cardId,state:r.state,reviewFlags:r.reviewFlags,
    inferredCells:['core','shadow'].flatMap(aspect=>axes.filter(axis=>r[aspect][axis].evidenceStatus==='inferred').map(axis=>({aspect,axis,score:r[aspect][axis].score,rationale:r[aspect][axis].rationale}))),
    ambiguousAxes:['core','shadow'].flatMap(aspect=>axes.filter(axis=>r[aspect][axis].evidenceStatus==='ambiguous').map(axis=>({aspect,axis,alternatives:r[aspect][axis].alternatives})))}));
  if(queue.version!==manifest.version || JSON.stringify(queue.items)!==JSON.stringify(expected)) fail('Review queue is stale or incomplete');
  result.passed=result.errors.length===0;
  return result;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const report = validateDataset();
  fs.writeFileSync(path.join(dir,'validation-report.json'),JSON.stringify({
    datasetVersion:'3.0.0',validationScope:'schema, all 156 states, exact source fields/spans, inference provenance, hashes, manifest, eligibility and review queue; semantic scoring and confidence are not human validated',
    ...report},null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(!report.passed) process.exitCode=1;
}
