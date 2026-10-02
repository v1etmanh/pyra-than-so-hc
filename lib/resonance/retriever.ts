import fs from 'node:fs';
import path from 'node:path';
import type {
  AxisEvidence,
  AxisKey,
  EntityDomain,
  FiveAxisVector,
  IndicatorSelection,
  LabeledEntity,
  RetrievalDiagnostic,
  TarotSelection
} from './types.ts';
import { AXIS_KEYS } from './types.ts';

let tarotCache: Map<string, LabeledEntity> | undefined;
let numerologyCache: Map<string, LabeledEntity[]> | undefined;

function normalizeKey(value: string | number): string {
  return String(value).trim().toLocaleLowerCase('en-US').replace(/\s+/g, '');
}

function normalizeVector(raw: Record<string, unknown> | undefined): FiveAxisVector {
  const result = {} as FiveAxisVector;
  for (const axis of AXIS_KEYS) {
    const rawEvidence = raw?.[axis] && typeof raw[axis] === 'object'
      ? raw[axis] as Record<string, unknown>
      : {};
    result[axis] = {
      score: typeof rawEvidence.score === 'number' ? rawEvidence.score : 0,
      evidenceQuote: typeof rawEvidence.evidenceQuote === 'string' ? rawEvidence.evidenceQuote : '',
      rationale: typeof rawEvidence.rationale === 'string' ? rawEvidence.rationale : '',
      evidenceStatus: typeof rawEvidence.evidenceStatus === 'string' ? rawEvidence.evidenceStatus : undefined,
      eligibleForRelations: typeof rawEvidence.eligibleForRelations === 'boolean'
        ? rawEvidence.eligibleForRelations
        : undefined
    };
  }
  return result;
}

function makeEntity(raw: Record<string, unknown>, domain: EntityDomain): LabeledEntity | null {
  const id = domain === 'tarot' ? raw.cardId : raw.id;
  const name = domain === 'tarot' ? raw.cardNameVi : raw.indicatorNameVi;
  const key = domain === 'tarot' ? raw.type : raw.indicatorKey;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof key !== 'string') return null;

  const orientation = domain === 'tarot' && raw.state === 'reversed' ? 'reversed' : 'upright';
  return {
    id,
    name: domain === 'tarot' ? `${name} (${orientation === 'reversed' ? 'Ngược' : 'Xuôi'})` : name,
    nameEn: domain === 'tarot' && typeof raw.cardNameEn === 'string' ? raw.cardNameEn : undefined,
    domain,
    subType: key,
    numberValue: domain === 'numerology' && (typeof raw.numberValue === 'string' || typeof raw.numberValue === 'number')
      ? raw.numberValue
      : undefined,
    orientation: domain === 'tarot' ? orientation : undefined,
    sourceSnippet: typeof raw.sourceSnippet === 'string' ? raw.sourceSnippet : undefined,
    core: normalizeVector(raw.core as Record<string, unknown> | undefined),
    shadow: normalizeVector(raw.shadow as Record<string, unknown> | undefined)
  };
}

function readJsonArray(filePath: string): Array<Record<string, unknown>> {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
}

export function loadTarotLabels(): Map<string, LabeledEntity> {
  if (tarotCache) return tarotCache;
  const dir = path.resolve(process.cwd(), 'data', 'tarot-labels');
  const cache = new Map<string, LabeledEntity>();
  for (const file of ['major-arcana.json', 'wands.json', 'cups.json', 'swords.json', 'pentacles.json']) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;
    for (const raw of readJsonArray(filePath)) {
      const entity = makeEntity(raw, 'tarot');
      if (entity) cache.set(`${entity.id}:${entity.orientation}`, entity);
    }
  }
  tarotCache = cache;
  return cache;
}

export function loadNumerologyLabels(): Map<string, LabeledEntity[]> {
  if (numerologyCache) return numerologyCache;
  const dir = path.resolve(process.cwd(), 'data', 'numerology-labels');
  const cache = new Map<string, LabeledEntity[]>();
  if (!fs.existsSync(dir)) return (numerologyCache = cache);
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'manifest.json').sort()) {
    for (const raw of readJsonArray(path.join(dir, file))) {
      const entity = makeEntity(raw, 'numerology');
      if (!entity || entity.numberValue === undefined) continue;
      const key = `${normalizeKey(entity.subType)}:${normalizeKey(entity.numberValue)}`;
      const values = cache.get(key) ?? [];
      values.push(entity);
      cache.set(key, values);
    }
  }
  numerologyCache = cache;
  return cache;
}

function eligibleScore(evidence: AxisEvidence, domain: EntityDomain, key: string, axis: AxisKey, diagnostics: RetrievalDiagnostic[]): number {
  if (!Number.isInteger(evidence.score) || evidence.score < -2 || evidence.score > 2) {
    diagnostics.push({ domain, key: `${key}.${axis}`, reason: 'invalid_score' });
    return 0;
  }
  if (evidence.score === 0) return 0;
  if (evidence.eligibleForRelations === false) {
    diagnostics.push({ domain, key: `${key}.${axis}`, reason: 'not_eligible' });
    return 0;
  }
  if (!evidence.evidenceQuote.trim()) {
    diagnostics.push({ domain, key: `${key}.${axis}`, reason: 'missing_evidence' });
    return 0;
  }
  return evidence.score;
}

export function sanitizeEntity(entity: LabeledEntity, diagnostics: RetrievalDiagnostic[]): LabeledEntity {
  const makeVector = (vector: FiveAxisVector): FiveAxisVector => Object.fromEntries(
    AXIS_KEYS.map((axis) => [axis, {
      ...vector[axis],
      score: eligibleScore(vector[axis], entity.domain, entity.id, axis, diagnostics)
    }])
  ) as FiveAxisVector;
  return { ...entity, core: makeVector(entity.core), shadow: makeVector(entity.shadow) };
}

export function getTarotEntity(selection: TarotSelection, diagnostics: RetrievalDiagnostic[] = []): LabeledEntity | null {
  const cardId = selection.cardId ?? selection.card?.id ?? selection.card?.cardId;
  const orientation = selection.orientation ?? (selection.isReversed ? 'reversed' : 'upright');
  const cardName = selection.card?.nameVi ?? selection.nameVi;
  const englishName = selection.card?.nameEn ?? selection.nameEn;
  const cache = loadTarotLabels();
  // The mobile deck uses IDs such as "18-moon" and names such as
  // "Mặt Trăng (The Moon)"; labels use "major-18" and "Mặt Trăng".
  const entityById = cardId ? cache.get(`${cardId}:${orientation}`) : undefined;
  const mobileMajorNumber = cardId?.match(/^(\d{1,2})-[a-z]/i)?.[1];
  const mobileMajorId = mobileMajorNumber ? `major-${mobileMajorNumber.padStart(2, '0')}` : undefined;
  const entityByMobileId = mobileMajorId ? cache.get(`${mobileMajorId}:${orientation}`) : undefined;
  const matchingEnglishName = (candidate: LabeledEntity) =>
    typeof englishName === 'string' && candidate.nameEn?.toLocaleLowerCase('en-US') === englishName.trim().toLocaleLowerCase('en-US');
  const verifiedMobileEntity = entityByMobileId && (!englishName || matchingEnglishName(entityByMobileId))
    ? entityByMobileId
    : undefined;
  const entityByEnglishName = englishName
    ? Array.from(cache.values()).find((candidate) => candidate.orientation === orientation && matchingEnglishName(candidate))
    : undefined;
  const plainVietnameseName = cardName?.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const entityByVietnameseName = plainVietnameseName
    ? Array.from(cache.values()).find((candidate) => candidate.orientation === orientation && candidate.name === `${plainVietnameseName} (${orientation === 'reversed' ? 'Ngược' : 'Xuôi'})`)
    : undefined;
  const entity = entityById ?? verifiedMobileEntity ?? entityByEnglishName ?? entityByVietnameseName;
  if (!entity) {
    diagnostics.push({ domain: 'tarot', key: cardId ? `${cardId}:${orientation}` : cardName ?? 'unknown-card', reason: 'missing_entity' });
    return null;
  }
  return sanitizeEntity({
    ...entity,
    name: selection.card?.nameVi || entity.name,
    orientation,
    sourceSnippet: entity.sourceSnippet
  }, diagnostics);
}

function splitIndicatorValues(indicator: IndicatorSelection): Array<string | number> {
  const key = indicator.key;
  const rawValue = String(indicator.value).trim();
  if (key === 'way' || key === 'challenges') {
    return rawValue.split(/\s*[-–—,]\s*/).filter(Boolean);
  }
  if (key === 'missingNumbers') {
    if (/không thiếu/i.test(rawValue)) return [];
    return rawValue.split(/\s*[,;]\s*/).filter(Boolean);
  }
  if (key === 'karmicDebts') {
    return rawValue.match(/(?:13\/4|14\/5|16\/7|19\/1)/g) ?? [];
  }
  if (key === 'arrows') {
    return rawValue.split(';').flatMap((segment) => {
      const match = segment.match(/([1-9]-[1-9]-[1-9])/);
      if (!match) return [];
      if (/trống/i.test(segment)) return [`empty-${match[1]}`];
      if (/có mặt/i.test(segment)) return [match[1]];
      return [];
    });
  }
  if (key === 'nameChart' || key === 'birthChart') return ['matrix'];
  return [indicator.value];
}

export function getNumerologyEntities(
  indicator: IndicatorSelection,
  diagnostics: RetrievalDiagnostic[] = []
): LabeledEntity[] {
  const values = splitIndicatorValues(indicator);
  const matches: LabeledEntity[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = `${normalizeKey(indicator.key)}:${normalizeKey(value)}`;
    const candidates = loadNumerologyLabels().get(key);
    if (!candidates?.length) continue;
    for (const entity of candidates) {
      if (seen.has(entity.id)) continue;
      seen.add(entity.id);
      matches.push(sanitizeEntity({ ...entity, name: indicator.name || entity.name }, diagnostics));
    }
  }
  if (!matches.length) diagnostics.push({ domain: 'numerology', key: indicator.key, reason: 'missing_entity' });
  return matches;
}
