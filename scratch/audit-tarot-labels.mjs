import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { allTarotCards } from '../lib/tarot/cards.ts';

const root = process.cwd();
const dir = path.join(root, 'data/tarot-labels');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const axes = ['ACT', 'EMO', 'STR', 'RSK', 'INT'];
const normalize = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const issues = [];
const records = [];
const seen = new Set();
const stats = { records: 0, cards: 0, cells: 0, nonzero: 0, nonemptyQuotes: 0,
  exactQuotes: 0, fragmentOnlyQuotes: 0, unsupportedQuotes: 0,
  nonzeroEmptyQuotes: 0, nonzeroUnsupportedQuotes: 0, zeroNonemptyQuotes: 0,
  sourceMismatches: 0, metadataMismatches: 0, schemaErrors: 0,
  byFile: {}, byAspectState: {}, byAxis: {}, confidence: {} };
const issue = (code, r, detail, aspect, axis, cell) => issues.push({code,
  file:r.file, line:r.line, cardId:r.cardId, state:r.state, aspect, axis,
  score:cell?.score, evidenceQuote:cell?.evidenceQuote, rationale:cell?.rationale, detail});
for (const entry of manifest.files) {
  const raw = fs.readFileSync(path.join(dir, entry.filePath), 'utf8');
  const data = JSON.parse(raw);
  stats.byFile[entry.filePath] = {records:data.length, unsupportedQuotes:0, nonzeroUnsupportedQuotes:0, nonzeroEmptyQuotes:0};
  if (data.length !== entry.itemsCount) issues.push({code:'manifest_count',file:entry.filePath});
  let cursor = 0;
  for (const item of data) {
    const position = raw.indexOf('"cardId"', cursor);
    cursor = position + 8;
    const r = {...item, file:entry.filePath, line:raw.slice(0,position).split('\n').length};
    records.push(r); stats.records++;
    const key = `${r.cardId}:${r.state}`;
    if (seen.has(key)) issue('duplicate',r,key);
    seen.add(key);
    const card = allTarotCards.find(c => c.id === r.cardId);
    if (!card || !['upright','reversed'].includes(r.state)) {issue('unknown_card_or_state',r,key); continue;}
    const expected = `Từ khóa: ${card.keywords[r.state].map(k=>k.vi).join(', ')}. Ý nghĩa: ${card.meaning[r.state].vi}`;
    if (normalize(expected) !== normalize(r.sourceSnippet)) {stats.sourceMismatches++; issue('source_mismatch',r,expected);}
    for (const [field,value] of Object.entries({cardNameVi:card.name.vi,cardNameEn:card.name.en,type:card.type,suit:card.suit??null,number:card.number})) {
      if(r[field]!==value) {stats.metadataMismatches++; issue('metadata_mismatch',r,field);}
    }
    stats.confidence[r.overallConfidence] = (stats.confidence[r.overallConfidence]??0)+1;
    const uncalibratedV2 = manifest.version === '2.0.0' && r.overallConfidence === null && r.confidenceMethod === 'uncalibrated';
    if (!uncalibratedV2 && (typeof r.overallConfidence !== 'number' || r.overallConfidence < 0 || r.overallConfidence > 1)) {stats.schemaErrors++;issue('invalid_confidence',r,'');}
    for(const aspect of ['core','shadow']) {
      if(!r[aspect] || Object.keys(r[aspect]).sort().join()!==axes.slice().sort().join()) {stats.schemaErrors++;issue('invalid_axes',r,'',aspect);}
      const group = `${aspect}:${r.state}`;
      stats.byAspectState[group] ??= {distribution:{},nonzero:0,positive:0,negative:0};
      for(const axis of axes) {
        const cell = r[aspect]?.[axis];
        if(!cell || !Number.isInteger(cell.score) || cell.score < -2 || cell.score > 2 || typeof cell.evidenceQuote !== 'string' || typeof cell.rationale !== 'string' || !cell.rationale.trim()) {stats.schemaErrors++;issue('invalid_cell',r,'',aspect,axis,cell);continue;}
        stats.cells++;
        const score = cell.score;
        const g = stats.byAspectState[group];
        g.distribution[score] = (g.distribution[score]??0)+1;
        if(score!==0) {stats.nonzero++;g.nonzero++;}
        if(score>0) g.positive++;
        if(score<0) g.negative++;
        stats.byAxis[`${group}:${axis}`] ??= {};
        const dist = stats.byAxis[`${group}:${axis}`];
        dist[score]=(dist[score]??0)+1;
        const quote = normalize(cell.evidenceQuote);
        if (!quote && score!==0) {stats.nonzeroEmptyQuotes++;stats.byFile[r.file].nonzeroEmptyQuotes++;issue('nonzero_empty_quote',r,'Nonzero score has no evidence.',aspect,axis,cell);}
        if (quote) {
          stats.nonemptyQuotes++;
          if(score===0) stats.zeroNonemptyQuotes++;
          const source = normalize(r.sourceSnippet);
          if(source.includes(quote)) stats.exactQuotes++;
          else {
            const fragments = quote.split(/[,;]|\.{3}|…/).map(s=>s.trim()).filter(Boolean);
            if(fragments.length>1 && fragments.every(f=>source.includes(f))) {
              stats.fragmentOnlyQuotes++;
              issue('fragmented_quote',r,'Every comma/semicolon-separated fragment occurs in source; whole quote is not contiguous.',aspect,axis,cell);
            } else {
              stats.unsupportedQuotes++;stats.byFile[r.file].unsupportedQuotes++;
              if(score!==0) {stats.nonzeroUnsupportedQuotes++;stats.byFile[r.file].nonzeroUnsupportedQuotes++;}
              issue('quote_not_found',r,'Not exact or fully supported comma/semicolon-separated excerpts; may be paraphrase, expansion, or invention. Requires semantic review.',aspect,axis,cell);
            }
          }
        }
      }
    }
  }
}
stats.cards = new Set(records.map(r=>r.cardId)).size;
for(const card of allTarotCards) for(const state of ['upright','reversed']) {
  if(!seen.has(`${card.id}:${state}`)) issues.push({code:'missing_state',cardId:card.id,state});
}
const flagged = new Set(issues.filter(i=>['quote_not_found','nonzero_empty_quote'].includes(i.code)).map(i=>`${i.cardId}:${i.state}`));
stats.recordsWithEvidenceFlags=flagged.size;
stats.provenanceFields=Object.keys(records[0]).filter(k=>!['file','line'].includes(k));
const result = {method:'Local structural audit and source/excerpt matching. Quote-not-found is a review flag, not proof of semantic hallucination. No human-gold or multi-rater agreement measurement.',
  sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'lib/tarot/cards.ts'))).digest('hex'),
  datasetSha256:Object.fromEntries(manifest.files.map(e=>[e.filePath,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,e.filePath))).digest('hex')])),
  stats,issues};
fs.writeFileSync(path.join(root,'scratch/tarot-label-audit.json'),JSON.stringify(result,null,2)+'\n');
const cols=['code','file','line','cardId','state','aspect','axis','score','evidenceQuote','rationale','detail'];
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync(path.join(root,'scratch/tarot-label-audit-issues.csv'),'\ufeff'+[cols.join(','),...issues.map(i=>cols.map(k=>csv(i[k])).join(','))].join('\r\n'));
console.log(JSON.stringify(stats,null,2));
