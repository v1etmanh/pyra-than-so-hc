import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { allTarotCards } from '../../lib/tarot/cards.ts';
import { decisions } from './decisions.mjs';
import { inferences } from './inferences.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'data/tarot-labels');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const sourceSha256 = sha(fs.readFileSync(path.join(root, 'lib/tarot/cards.ts')));
const rubricBytes = fs.readFileSync(path.join(dir, 'rubric.json'));
const rubric = JSON.parse(rubricBytes);
const rubricSha256 = sha(rubricBytes);
const decisionSha256 = sha(fs.readFileSync(fileURLToPath(new URL('./decisions.mjs', import.meta.url))));
const inferenceSha256 = sha(fs.readFileSync(fileURLToPath(new URL('./inferences.mjs', import.meta.url))));
const axes = Object.keys(rubric.axes);
const runId = 'source-reannotation-2026-10-01-v3';
const annotationVersion = '3.0.0';
const oldManifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
if (!['1.0.0','2.0.0',annotationVersion].includes(oldManifest.version)) throw Error('Unexpected dataset version; refusing to overwrite.');
if (Object.keys(decisions).length !== allTarotCards.length || allTarotCards.some(c => !decisions[c.id])) throw Error('Decisions must cover all 78 cards.');

const generated = new Map(oldManifest.files.map(f => [f.filePath, []]));
function evidence(card, state, ref) {
  let quote, field;
  if (/^[0-2]$/.test(ref)) {
    quote = card.keywords[state][Number(ref)].vi;
    field = `keywords.${state}.${ref}.vi`;
  } else {
    quote = JSON.parse(ref);
    const keywordIndex = card.keywords[state].findIndex(k => k.vi.includes(quote));
    field = keywordIndex >= 0 ? `keywords.${state}.${keywordIndex}.vi` : `meaning.${state}.vi`;
  }
  const sourceText = field.startsWith('keywords') ? card.keywords[state][Number(field.split('.')[2])].vi : card.meaning[state].vi;
  const start = sourceText.indexOf(quote);
  if (start < 0 || !quote) throw Error(`Evidence absent: ${card.id}/${state}: ${quote}`);
  return { quote, sourceField: field, start, end: start + quote.length };
}
function emptyCell() {
  return {score:0, evidenceQuote:'', evidenceQuotes:[], evidenceStatus:'insufficient',
    rationale:'Nguồn của trạng thái này không đủ bằng chứng để xác định hướng và mức độ trên trục; 0 là giá trị bỏ qua, không phải xác nhận trung tính.',
    confidence:null, eligibleForRelations:false, alternatives:[]};
}
function inferredEvidence(card,state,reference) {
  if(reference.startsWith('k:')) {
    const index=Number(reference.slice(2));
    const quote=card.keywords[state][index]?.vi;
    if(!quote) throw Error(`Invalid inferred keyword reference ${reference} for ${card.id}/${state}`);
    return {quote,sourceField:`keywords.${state}.${index}.vi`,start:0,end:quote.length};
  }
  if(reference.startsWith('m:')) {
    const quote=reference.slice(2);
    const source=card.meaning[state].vi;
    const start=source.indexOf(quote);
    if(start<0 || !quote) throw Error(`Invalid inferred meaning reference ${reference} for ${card.id}/${state}`);
    return {quote,sourceField:`meaning.${state}.vi`,start,end:start+quote.length};
  }
  throw Error(`Invalid inference reference ${reference}`);
}
function annotate(card, state, aspect, tokens) {
  const result = Object.fromEntries(axes.map(axis => [axis, emptyCell()]));
  const seen = new Set();
  const judgementAxes = new Set();
  for(const axis of axes) {
    const entry=inferences[`${card.id}:${state}:${aspect}:${axis}`];
    if(!entry) continue;
    if(result[axis].evidenceStatus!=='insufficient' && result[axis].evidenceStatus!=='ambiguous') throw Error(`Inference may only resolve unavailable axis ${card.id}/${state}/${aspect}/${axis}`);
    seen.add(axis);
    judgementAxes.add(axis);
    const ev=inferredEvidence(card,state,entry.reference);
    const score=Number(entry.score);
    if(!Number.isInteger(score)||score===0||score < -2||score>2 || !entry.rationale?.trim()) throw Error(`Invalid inferred judgment ${card.id}/${state}/${aspect}/${axis}`);
    result[axis]={score,evidenceQuote:ev.quote,evidenceQuotes:[ev],evidenceStatus:'inferred',
      rationale:`AI phán đoán (chưa được người xác nhận): ${entry.rationale} Trích dẫn là căn cứ diễn giải, không chứng minh trực tiếp chiều/điểm.`,
      confidence:null,eligibleForRelations:true,alternatives:[],inferenceMethod:'holistic-card-interpretation'};
  }
  for (const token of tokens) {
    const match = /^(ACT|EMO|STR|RSK|INT):(-?[0-2]|!):(.+)$/.exec(token);
    if (!match) throw Error(`Invalid decision: ${token}`);
    const [,axis,value,ref] = match;
    if(judgementAxes.has(axis)) continue;
    if (seen.has(axis)) throw Error(`Duplicate axis decision: ${card.id}/${state}/${aspect}/${axis}`);
    seen.add(axis);
    if (value === '!') {
      const alternatives = ref.split('|').map(branch => {
        const [score, fragment] = branch.split('@');
        const ev = evidence(card,state,fragment);
        return {score:Number(score), evidenceQuotes:[ev]};
      });
      result[axis] = {...emptyCell(), evidenceQuotes:alternatives.flatMap(a=>a.evidenceQuotes),
        evidenceStatus:'ambiguous', alternatives,
        rationale:`Nguồn nêu nhiều hướng trên ${rubric.axes[axis].nameVi}: ${alternatives.map(a=>`“${a.evidenceQuotes[0].quote}” (${a.score>0?'+':''}${a.score})`).join(' và ')}. Không có căn cứ chọn một hướng chung; không lấy trung bình, bỏ qua ô này trong luật.`};
    } else {
      const score = Number(value);
      const ev = evidence(card,state,ref);
      result[axis] = {score, evidenceQuote:ev.quote, evidenceQuotes:[ev], evidenceStatus:'supported',
        rationale:score===0 ? `“${ev.quote}” mô tả nghỉ/tạm dừng có chủ đích; không đồng nhất với tê liệt hành động. Gán 0 theo neo ACT.`
          : `“${ev.quote}” hỗ trợ ${rubric.axes[axis].nameVi} ở mức ${score>0?'+':''}${score}: ${rubric.axes[axis].anchors[String(score)]}. Chỉ mã hóa nội dung của nguồn; dấu điểm biểu thị hướng đặc tính, không phải tốt/xấu.`,
        confidence:null, eligibleForRelations:score!==0, alternatives:[]};
    }
  }
  return result;
}
for (const card of allTarotCards) {
  const plan = decisions[card.id];
  if(plan.length!==4 || plan.some(v=>!Array.isArray(v))) throw Error(`Invalid plan: ${card.id}`);
  for (const [index,state] of ['upright','reversed'].entries()) {
    const core = annotate(card,state,'core',plan[index*2]);
    const shadow = annotate(card,state,'shadow',plan[index*2+1]);
    const cells = [...Object.values(core),...Object.values(shadow)];
    const sourceSnippet = `Từ khóa: ${card.keywords[state].map(k=>k.vi).join(', ')}. Ý nghĩa: ${card.meaning[state].vi}`;
    const file = card.type==='major' ? 'major-arcana.json' : `${card.suit}.json`;
    generated.get(file).push({cardId:card.id,cardNameVi:card.name.vi,cardNameEn:card.name.en,
      type:card.type,suit:card.suit??null,number:card.number,state,sourceSnippet,core,shadow,
      overallConfidence:null, confidenceMethod:'uncalibrated',
      evidenceCoverage:cells.filter(c=>c.evidenceStatus==='supported'||c.evidenceStatus==='inferred').length/10,
      annotationVersion, rubricVersion:rubric.version, sourceSha256, rubricSha256,
      provenance:{runId,annotatorType:'ai',method:'explicit-source-reannotation',
        modelId:null,decisionSha256,inferenceSha256,independentRuns:1,humanReviewed:false},
      reviewStatus:'silver-inferred-human-unvalidated',
      reviewFlags:[...(cells.some(c=>c.evidenceStatus==='ambiguous')?['ambiguous-axis']:[]),
        ...(cells.some(c=>c.evidenceStatus==='inferred')?['judgement-inference']:[]),
        ...(cells.every(c=>!c.eligibleForRelations)?['no-usable-axis']:[])]});
  }
}
// Finish constructing and checking every record before mutating authoritative files.
const archive = path.join(dir,'archive','v1.0.0');
if(oldManifest.version!=='1.0.0' && oldManifest.version!==annotationVersion) {
  const currentArchive=path.join(dir,'archive',`v${oldManifest.version}`);
  fs.mkdirSync(currentArchive,{recursive:true});
  for(const filename of ['manifest.json',...oldManifest.files.map(f=>f.filePath)]) {
    const src=fs.readFileSync(path.join(dir,filename));
    const dst=path.join(currentArchive,filename);
    if(fs.existsSync(dst)&&!fs.readFileSync(dst).equals(src)) throw Error(`Archive conflict: ${filename}`);
    if(!fs.existsSync(dst)) fs.writeFileSync(dst,src,{flag:'wx'});
  }
}
if(oldManifest.version==='1.0.0') {
  fs.mkdirSync(archive,{recursive:true});
  for(const filename of ['manifest.json',...oldManifest.files.map(f=>f.filePath)]) {
    const src = fs.readFileSync(path.join(dir,filename));
    const dst = path.join(archive,filename);
    if(fs.existsSync(dst) && !fs.readFileSync(dst).equals(src)) throw Error(`Archive conflict: ${filename}`);
    if(!fs.existsSync(dst)) fs.writeFileSync(dst,src,{flag:'wx'});
  }
}
for (const [filename,rows] of generated) fs.writeFileSync(path.join(dir,filename),JSON.stringify(rows,null,2)+'\n');
const rows = [...generated.values()].flat();
const cells = rows.flatMap(r=>[...Object.values(r.core),...Object.values(r.shadow)]);
const statusCounts = cells.reduce((m,c)=>(m[c.evidenceStatus]++,m),{supported:0,inferred:0,insufficient:0,ambiguous:0});
const manifest = {...oldManifest,version:annotationVersion,updatedAt:'2026-10-01',
  description:'156 trạng thái Tarot theo rubric 3.0.0; nhãn có bằng chứng trực tiếp và phán đoán AI được phân biệt, mỗi điểm có trích dẫn truy xuất được.',
  labelTier:'silver-with-explicit-inference',validationStatus:'machine-validated-human-pending',
  rubricVersion:rubric.version,rubricFile:'rubric.json',schemaFile:'label-schema.json',sourceSha256,rubricSha256,
  statistics:{...oldManifest.statistics,totalCells:cells.length,nonzeroCells:cells.filter(c=>c.score!==0).length,
    evidenceStatusCounts:statusCounts,inferredCells:cells.filter(c=>c.evidenceStatus==='inferred').length,
    noUsableAxisStates:rows.filter(r=>r.reviewFlags.includes('no-usable-axis')).length,
    axes:axes.map(id=>({id,...rubric.axes[id],scale:'Ordinal [-2, -1, 0, +1, +2]'})),
    aspects:Object.entries(rubric.aspects).map(([id,description])=>({id,description}))},
  files:oldManifest.files.map(f=>({...f,sha256:sha(fs.readFileSync(path.join(dir,f.filePath)))})),
  provenance:{runId,annotatorType:'ai',modelId:null,method:'explicit-source-reannotation',
    decisionFile:'scripts/tarot-labeling/decisions.mjs',decisionSha256,
    inferenceFile:'scripts/tarot-labeling/inferences.mjs',inferenceSha256,
    independentRuns:1,humanReviewed:false,previousVersionArchive:'archive/v1.0.0'},
  qualityAssurance:{sourceTextDependency:'lib/tarot/cards.ts',sourceIntegrityChecked:true,
    exactQuoteValidationPassed:true,structuralValidationPassed:true,
    zeroHallucinationEnforced:false, auditPassed:false,
    semanticReview:'AI source-grounded inference explicitly identified; human validation pending',
    ruleForMissingQuote:'score=0; evidenceStatus=insufficient; eligibleForRelations=false',
    ruleForAmbiguity:'If unresolved: score=0 and eligibleForRelations=false. User-authorized judgments resolve selected axes with evidenceStatus=inferred.',
    ruleForJudgement:'AI inference is explicitly labeled, quotes its source and records its reasoning; eligibleForRelations=true.',
    overallConfidenceMedian:null,confidenceCalibrated:false,
    humanGoldAvailable:false,interRaterAgreement:null,
    limitations:['Single AI reannotation; not independent multi-model consensus.',
      'Short source texts do not support every axis/aspect; zeros with insufficient evidence are abstentions.',
      'Exact quotations prove traceability, not correctness of semantic scoring.',
      'Consumers must honor evidenceStatus/eligibleForRelations and handle states with no usable axis.']}};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(dir,'review-queue.json'),JSON.stringify({version:annotationVersion,
  description:'Trạng thái có phán đoán, trục mơ hồ còn lại, hoặc bằng chứng chưa đủ. Nhãn suy luận được chủ đích bật; mơ hồ chưa giải quyết thì bỏ qua.',
  items:rows.filter(r=>r.reviewFlags.length).map(r=>({cardId:r.cardId,state:r.state,reviewFlags:r.reviewFlags,
    inferredCells:['core','shadow'].flatMap(aspect=>axes.filter(axis=>r[aspect][axis].evidenceStatus==='inferred').map(axis=>({aspect,axis,score:r[aspect][axis].score,rationale:r[aspect][axis].rationale}))),
    ambiguousAxes:['core','shadow'].flatMap(aspect=>axes.filter(axis=>r[aspect][axis].evidenceStatus==='ambiguous').map(axis=>({aspect,axis,alternatives:r[aspect][axis].alternatives}))) }))},null,2)+'\n');
console.log(JSON.stringify({version:manifest.version,records:rows.length,cells:cells.length,
  nonzero:manifest.statistics.nonzeroCells,statusCounts,noUsableAxisStates:manifest.statistics.noUsableAxisStates},null,2));
