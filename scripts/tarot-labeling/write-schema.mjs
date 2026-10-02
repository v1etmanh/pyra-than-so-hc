import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const object = properties => ({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const string = {type:'string'};
const hash = {type:'string',pattern:'^[a-f0-9]{64}$'};
const score = {type:'integer',minimum:-2,maximum:2};
const ref = name => ({$ref:`#/$defs/${name}`});
const array = (items,minItems=0) => ({type:'array',items,minItems});
const evidence = object({quote:{type:'string',minLength:1},sourceField:{type:'string',pattern:'^(keywords\\.(upright|reversed)\\.[0-2]\\.vi|meaning\\.(upright|reversed)\\.vi)$'},
  start:{type:'integer',minimum:0},end:{type:'integer',minimum:1}});
const alternative = object({score,evidenceQuotes:array(ref('evidence'),1)});
const cell = {...object({score,evidenceQuote:string,evidenceQuotes:array(ref('evidence')),
  evidenceStatus:{enum:['supported','inferred','insufficient','ambiguous']},rationale:{type:'string',minLength:1},
  confidence:{type:'null'},eligibleForRelations:{type:'boolean'},alternatives:array(ref('alternative')),
  inferenceMethod:{const:'holistic-card-interpretation'}}),
  allOf:[
    {if:{properties:{evidenceStatus:{const:'supported'}}},then:{properties:{evidenceQuote:{minLength:1},evidenceQuotes:{minItems:1},alternatives:{maxItems:0}},not:{required:['inferenceMethod']}}},
    {if:{properties:{evidenceStatus:{const:'inferred'}}},then:{properties:{score:{not:{const:0}},evidenceQuote:{minLength:1},evidenceQuotes:{minItems:1},eligibleForRelations:{const:true},alternatives:{maxItems:0}},required:['inferenceMethod']}},
    {if:{properties:{evidenceStatus:{const:'insufficient'}}},then:{properties:{score:{const:0},evidenceQuote:{const:''},evidenceQuotes:{maxItems:0},eligibleForRelations:{const:false},alternatives:{maxItems:0}}}},
    {if:{properties:{evidenceStatus:{const:'ambiguous'}}},then:{properties:{score:{const:0},evidenceQuote:{const:''},evidenceQuotes:{minItems:2},eligibleForRelations:{const:false},alternatives:{minItems:2}}}},
    {if:{properties:{score:{const:0}}},then:{properties:{eligibleForRelations:{const:false}}}},
    {if:{properties:{score:{not:{const:0}}}},then:{properties:{evidenceStatus:{enum:['supported','inferred']},eligibleForRelations:{const:true}}}},
    {if:{properties:{evidenceStatus:{const:'insufficient'}}},then:{not:{required:['inferenceMethod']}}},
    {if:{properties:{evidenceStatus:{const:'ambiguous'}}},then:{not:{required:['inferenceMethod']}}}
  ]};
cell.required.splice(cell.required.indexOf('inferenceMethod'),1);
const aspect = object(Object.fromEntries(['ACT','EMO','STR','RSK','INT'].map(a=>[a,ref('cell')])));
const provenance = object({runId:{type:'string',minLength:1},annotatorType:{const:'ai'},method:{const:'explicit-source-reannotation'},
  modelId:{type:'null'},decisionSha256:hash,inferenceSha256:hash,independentRuns:{const:1},humanReviewed:{const:false}});
const record = object({cardId:string,cardNameVi:string,cardNameEn:string,type:{enum:['major','minor']},
  suit:{enum:['wands','cups','swords','pentacles',null]},number:{type:'integer'},state:{enum:['upright','reversed']},
  sourceSnippet:string,core:ref('aspect'),shadow:ref('aspect'),overallConfidence:{type:'null'},confidenceMethod:{const:'uncalibrated'},
  evidenceCoverage:{type:'number',minimum:0,maximum:1},annotationVersion:{const:'3.0.0'},rubricVersion:{const:'3.0.0'},
  sourceSha256:hash,rubricSha256:hash,provenance:ref('provenance'),reviewStatus:{const:'silver-inferred-human-unvalidated'},
  reviewFlags:array({enum:['ambiguous-axis','judgement-inference','no-usable-axis']})});
const schema = {$schema:'https://json-schema.org/draft/2020-12/schema',title:'NUMELYRA Tarot annotation v3',
  description:'Schema distinguishes direct evidence from user-authorized AI judgment. Exact citations do not prove semantic correctness; human gold remains pending.',
  ...record,$defs:{evidence,alternative,cell,aspect,provenance}};
fs.writeFileSync(fileURLToPath(new URL('../../data/tarot-labels/label-schema.json',import.meta.url)),JSON.stringify(schema,null,2)+'\n');
console.log('Wrote label-schema.json');
