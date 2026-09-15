import type {
  BaziPillarPosition,
  BranchInteractionCell,
  ConfidenceLevel,
  DirectionalPerspectiveProfile,
  DirectionalRelationProfile,
  RelationDimension,
  RelationDimensionProfile,
  RelationDirection,
  RelationEvidence,
  RelationPolarity,
  RelationQuestionIntent,
  RelationQuestionIntentId,
  RelationTendency
} from './types.ts';

export type ScenarioRelationEvidence = Omit<RelationEvidence, 'occurrenceRate' | 'confidence'>;

const ALL_DIMENSIONS: RelationDimension[] = [
  'attraction',
  'emotional_connection',
  'emotional_safety',
  'perception',
  'communication',
  'expression',
  'initiative',
  'trust',
  'closeness',
  'independence',
  'conflict',
  'conflict_repair',
  'power_balance',
  'pressure',
  'support',
  'dependency',
  'values',
  'daily_life',
  'family_context',
  'commitment',
  'marriage',
  'long_term',
  'growth',
  'timing',
  'reconnection',
  'instability'
];

const PILLAR_POSITIONS: BaziPillarPosition[] = ['year', 'month', 'day', 'hour'];

const INTENT_DIMENSIONS: Record<RelationQuestionIntentId, RelationDimension[]> = {
  overview: ['emotional_connection', 'communication', 'support', 'conflict', 'commitment', 'growth'],
  perception: ['perception', 'emotional_safety', 'expression', 'pressure'],
  emotional_connection: ['emotional_connection', 'emotional_safety', 'closeness', 'expression', 'attraction'],
  attraction: ['attraction', 'emotional_connection', 'closeness', 'initiative'],
  initiative: ['initiative', 'attraction', 'expression', 'power_balance', 'independence'],
  communication: ['communication', 'expression', 'emotional_safety', 'conflict_repair'],
  conflict: ['conflict', 'pressure', 'power_balance', 'instability', 'conflict_repair'],
  power_balance: ['power_balance', 'pressure', 'initiative', 'independence', 'conflict'],
  support: ['support', 'emotional_safety', 'growth', 'dependency'],
  trust: ['trust', 'emotional_safety', 'closeness', 'independence'],
  independence: ['independence', 'dependency', 'closeness', 'power_balance', 'emotional_safety'],
  values: ['values', 'daily_life', 'long_term', 'family_context', 'growth'],
  commitment: ['commitment', 'marriage', 'long_term', 'family_context', 'daily_life'],
  timing: ['timing', 'commitment', 'marriage', 'reconnection', 'growth'],
  reconnection: ['reconnection', 'timing', 'communication', 'conflict_repair', 'closeness'],
  daily_life: ['daily_life', 'values', 'communication', 'independence', 'support'],
  family: ['family_context', 'commitment', 'marriage', 'values', 'daily_life'],
  growth: ['growth', 'support', 'conflict_repair', 'values', 'long_term']
};

const INTENT_KEYWORDS: Array<{ id: RelationQuestionIntentId; terms: string[] }> = [
  { id: 'timing', terms: ['thoi diem', 'khi nao', 'nam nao', '5 nam', 'dai van', 'luu nien', 'when', 'which year', 'timing', 'next year'] },
  { id: 'reconnection', terms: ['quay lai', 'tai hop', 'noi lai', 'ket noi lai', 'reconnect', 'get back', 'come back'] },
  { id: 'perception', terms: ['nhin nhan', 'nhin nguoi', 'cam nhan nguoi', 'nghi ve', 'perceive', 'see person', 'view person', 'feel about'] },
  { id: 'emotional_connection', terms: ['cam xuc', 'tinh cam', 'yeu nhieu', 'gan bo', 'dong dieu', 'emotion', 'feelings', 'love more', 'bond'] },
  { id: 'initiative', terms: ['chu dong', 'theo duoi', 'mo loi', 'dan dat', 'first move', 'initiate', 'pursue', 'take the lead'] },
  { id: 'communication', terms: ['giao tiep', 'noi chuyen', 'bieu dat', 'lang nghe', 'communication', 'communicate', 'talk', 'express'] },
  { id: 'conflict', terms: ['xung dot', 'mau thuan', 'tranh cai', 'ma sat', 'ap luc', 'conflict', 'argument', 'friction', 'pressure'] },
  { id: 'power_balance', terms: ['quyen luc', 'lan at', 'kiem soat', 'quyet dinh', 'power balance', 'power dynamic', 'control', 'dominate'] },
  { id: 'support', terms: ['nang do', 'ho tro', 'boi duong', 'dua dam', 'support', 'nourish', 'rely on'] },
  { id: 'trust', terms: ['tin tuong', 'an toan', 'ghen', 'trust', 'safe', 'jealous'] },
  { id: 'independence', terms: ['khong gian rieng', 'tu do', 'doc lap', 'phu thuoc', 'independence', 'personal space', 'freedom', 'dependency'] },
  { id: 'values', terms: ['gia tri song', 'quan diem song', 'uu tien', 'muc tieu chung', 'values', 'priorities', 'shared goals'] },
  { id: 'commitment', terms: ['ket hon', 'hon nhan', 'cuoi', 'gan ket', 'lau dai', 'commitment', 'marriage', 'wedding', 'long-term'] },
  { id: 'attraction', terms: ['thu hut', 'hap dan', 'hoa hoc', 'lang man', 'attraction', 'chemistry', 'romantic'] },
  { id: 'daily_life', terms: ['song chung', 'hang ngay', 'tai chinh', 'thoi quen', 'daily', 'live together', 'money', 'habit'] },
  { id: 'family', terms: ['gia dinh', 'gia dao', 'con cai', 'bo me', 'family', 'children', 'parents'] },
  { id: 'growth', terms: ['phat trien', 'truong thanh', 'bai hoc', 'cai thien', 'growth', 'develop', 'improve', 'lesson'] }
];

function round(value: number, digits = 3): number {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}

function normalizeQuestion(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

function polaritySign(polarity: RelationPolarity): number {
  if (polarity === 'supportive') return 1;
  if (polarity === 'challenging') return -1;
  return 0;
}

function tendencyFor(score: number, hasEvidence: boolean): RelationTendency {
  if (!hasEvidence) return 'insufficient_evidence';
  if (score >= 12) return 'strong_support';
  if (score >= 3) return 'supportive';
  if (score <= -12) return 'strong_challenge';
  if (score <= -3) return 'challenging';
  return 'mixed';
}

function profileConfidence(evidence: RelationEvidence[]): ConfidenceLevel {
  if (evidence.length === 0) return 'low';
  if (evidence.every((item) => item.confidence === 'high')) return 'high';
  if (evidence.some((item) => item.confidence !== 'low')) return 'medium';
  return 'low';
}

function evidenceConfidence(
  occurrenceRate: number,
  hourSensitive: boolean,
  scenarioCount: number
): ConfidenceLevel {
  if (scenarioCount === 1) return 'high';
  if (!hourSensitive && occurrenceRate >= 0.999) return 'high';
  if (occurrenceRate >= 0.75) return 'medium';
  return 'low';
}

function uniqueScenarioEvidence(items: ScenarioRelationEvidence[]): ScenarioRelationEvidence[] {
  const byId = new Map<string, ScenarioRelationEvidence>();
  for (const item of items) {
    const prior = byId.get(item.id);
    if (!prior || Math.abs(item.weight) > Math.abs(prior.weight)) byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

export function aggregateRelationEvidence(
  scenarios: ScenarioRelationEvidence[][],
  minimumOccurrenceRate = 0.25
): RelationEvidence[] {
  const scenarioCount = Math.max(1, scenarios.length);
  const aggregated = new Map<string, {
    sample: ScenarioRelationEvidence;
    count: number;
    weightTotal: number;
    numericFacts: Map<string, { total: number; count: number }>;
  }>();

  for (const scenario of scenarios) {
    for (const item of uniqueScenarioEvidence(scenario)) {
      const prior = aggregated.get(item.id);
      const entry = prior || {
        sample: item,
        count: 0,
        weightTotal: 0,
        numericFacts: new Map<string, { total: number; count: number }>()
      };
      entry.count += 1;
      entry.weightTotal += item.weight;
      for (const [key, value] of Object.entries(item.facts)) {
        if (typeof value !== 'number') continue;
        const fact = entry.numericFacts.get(key) || { total: 0, count: 0 };
        fact.total += value;
        fact.count += 1;
        entry.numericFacts.set(key, fact);
      }
      aggregated.set(item.id, entry);
    }
  }

  return Array.from(aggregated.values())
    .map(({ sample, count, weightTotal, numericFacts }) => {
      const occurrenceRate = round(count / scenarioCount);
      const facts = { ...sample.facts };
      numericFacts.forEach(({ total, count: factCount }, key) => {
        facts[key] = round(total / factCount);
      });
      const hourSensitive = sample.hourSensitive || occurrenceRate < 0.999;
      return {
        ...sample,
        weight: round(weightTotal / count),
        occurrenceRate,
        confidence: evidenceConfidence(occurrenceRate, hourSensitive, scenarioCount),
        hourSensitive,
        facts
      };
    })
    .filter((item) => scenarioCount === 1 || item.occurrenceRate >= minimumOccurrenceRate)
    .sort((a, b) => {
      const importance = Math.abs(b.weight) * b.occurrenceRate - Math.abs(a.weight) * a.occurrenceRate;
      return importance || a.id.localeCompare(b.id);
    });
}

function buildDimensionProfile(
  dimension: RelationDimension,
  evidence: RelationEvidence[],
  scenarios: ScenarioRelationEvidence[][],
  allowedDirections?: ReadonlySet<RelationDirection>
): RelationDimensionProfile {
  const selected = evidence.filter((item) =>
    item.dimensions.includes(dimension)
    && (!allowedDirections || allowedDirections.has(item.direction))
  );
  const selectedIds = new Set(selected.map((item) => item.id));
  const scenarioScores = scenarios.map((scenario) => round(uniqueScenarioEvidence(scenario).reduce((total, item) => {
    if (!selectedIds.has(item.id) || !item.dimensions.includes(dimension)) return total;
    return total + polaritySign(item.polarity) * Math.abs(item.weight);
  }, 0)));
  const score = scenarioScores.length
    ? round(scenarioScores.reduce((sum, value) => sum + value, 0) / scenarioScores.length, 1)
    : 0;
  const minScore = scenarioScores.length ? Math.min(...scenarioScores) : 0;
  const maxScore = scenarioScores.length ? Math.max(...scenarioScores) : 0;

  return {
    dimension,
    tendency: tendencyFor(score, selected.length > 0),
    score,
    minScore,
    maxScore,
    evidenceIds: selected.map((item) => item.id),
    confidence: profileConfidence(selected)
  };
}

export function buildRelationDimensionProfiles(
  evidence: RelationEvidence[],
  scenarios: ScenarioRelationEvidence[][]
): RelationDimensionProfile[] {
  return ALL_DIMENSIONS.map((dimension) => buildDimensionProfile(dimension, evidence, scenarios));
}

function buildPerspective(
  evidence: RelationEvidence[],
  scenarios: ScenarioRelationEvidence[][],
  directDirection: 'A_TO_B' | 'B_TO_A'
): DirectionalPerspectiveProfile {
  const allowed = new Set<RelationDirection>([directDirection, 'MUTUAL']);
  return {
    perception: buildDimensionProfile('perception', evidence, scenarios, allowed),
    attraction: buildDimensionProfile('attraction', evidence, scenarios, allowed),
    support: buildDimensionProfile('support', evidence, scenarios, allowed),
    pressure: buildDimensionProfile('pressure', evidence, scenarios, allowed),
    initiative: buildDimensionProfile('initiative', evidence, scenarios, allowed),
    closeness: buildDimensionProfile('closeness', evidence, scenarios, allowed)
  };
}

export function buildDirectionalRelationProfile(
  evidence: RelationEvidence[],
  scenarios: ScenarioRelationEvidence[][]
): DirectionalRelationProfile {
  return {
    // B_TO_A means B is the stimulus as experienced by A.
    aTowardB: buildPerspective(evidence, scenarios, 'B_TO_A'),
    // A_TO_B means A is the stimulus as experienced by B.
    bTowardA: buildPerspective(evidence, scenarios, 'A_TO_B')
  };
}

export function buildBranchInteractionMatrix(evidence: RelationEvidence[]): BranchInteractionCell[] {
  return PILLAR_POSITIONS.flatMap((aPillar) => PILLAR_POSITIONS.map((bPillar) => {
    const cellEvidence = evidence.filter((item) =>
      (item.source === 'branch_relation' || item.source === 'spouse_palace')
      && item.facts.aPillar === aPillar
      && item.facts.bPillar === bPillar
    );
    const spousePalace = aPillar === 'day' && bPillar === 'day';
    return {
      aPillar,
      bPillar,
      spousePalace,
      importance: spousePalace ? 'highest' : (aPillar === 'day' || bPillar === 'day' ? 'high' : 'medium'),
      hourSensitive: aPillar === 'hour' || bPillar === 'hour' || cellEvidence.some((item) => item.hourSensitive),
      relations: cellEvidence.map((item) => ({
        evidenceId: item.id,
        subtype: item.subtype,
        polarity: item.polarity,
        occurrenceRate: item.occurrenceRate
      }))
    };
  }));
}

function questionDirections(normalized: string, intent: RelationQuestionIntentId): RelationDirection[] {
  if (intent === 'timing') return ['TIMING_A', 'TIMING_B', 'TIMING_MUTUAL', 'MUTUAL'];

  const aActsOnB = /(?:nguoi a|person a).{0,28}(?:ho tro|gay ap luc|chu dong|anh huong|support|pressure|affect).{0,20}(?:nguoi b|person b)/.test(normalized);
  const bActsOnA = /(?:nguoi b|person b).{0,28}(?:ho tro|gay ap luc|chu dong|anh huong|support|pressure|affect).{0,20}(?:nguoi a|person a)/.test(normalized);
  const aExperiencesB = /(?:nguoi a|person a).{0,24}(?:nhin|cam nhan|nghi ve|see|view|feel).{0,20}(?:nguoi b|person b)/.test(normalized);
  const bExperiencesA = /(?:nguoi b|person b).{0,24}(?:nhin|cam nhan|nghi ve|see|view|feel).{0,20}(?:nguoi a|person a)/.test(normalized);

  if (aActsOnB || bExperiencesA) return ['A_TO_B', 'MUTUAL'];
  if (bActsOnA || aExperiencesB) return ['B_TO_A', 'MUTUAL'];
  return ['A_TO_B', 'B_TO_A', 'MUTUAL'];
}

export function routeRelationQuestion(question?: string): RelationQuestionIntent {
  const normalized = normalizeQuestion(question || '');
  if (!normalized.trim()) {
    return {
      id: 'overview',
      dimensions: INTENT_DIMENSIONS.overview,
      directions: ['A_TO_B', 'B_TO_A', 'MUTUAL', 'TIMING_A', 'TIMING_B', 'TIMING_MUTUAL']
    };
  }

  const matches = INTENT_KEYWORDS
    .map((entry) => ({
      id: entry.id,
      score: entry.terms.reduce((count, term) => count + (normalized.includes(term) ? 1 : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const id = matches[0]?.id || 'overview';
  const dimensions = Array.from(new Set(
    (matches.length > 0 ? matches : [{ id: 'overview' as const, score: 1 }])
      .flatMap((entry) => INTENT_DIMENSIONS[entry.id])
  ));
  return { id, dimensions, directions: questionDirections(normalized, id) };
}

export function selectRelationEvidence(
  evidence: RelationEvidence[],
  question?: string,
  limit = 18
): { intent: RelationQuestionIntent; evidence: RelationEvidence[] } {
  const intent = routeRelationQuestion(question);
  const dimensionSet = new Set(intent.dimensions);
  const directionSet = new Set(intent.directions);

  const scoreEvidence = (item: RelationEvidence): number => {
    const dimensionMatches = item.dimensions.filter((dimension) => dimensionSet.has(dimension)).length;
    const directionMatch = directionSet.has(item.direction) ? 1 : 0;
    const spouseBoost = item.facts.spousePalace === true ? 4 : 0;
    return dimensionMatches * 8
      + directionMatch * 3
      + Math.abs(item.weight) * item.occurrenceRate
      + spouseBoost
      + (item.confidence === 'high' ? 2 : item.confidence === 'medium' ? 1 : 0);
  };

  let candidates = evidence.filter((item) =>
    item.dimensions.some((dimension) => dimensionSet.has(dimension))
    && directionSet.has(item.direction)
  );
  if (candidates.length === 0) {
    candidates = evidence.filter((item) => item.dimensions.some((dimension) => dimensionSet.has(dimension)));
  }
  if (candidates.length === 0) candidates = evidence;

  return {
    intent,
    evidence: candidates
      .slice()
      .sort((a, b) => scoreEvidence(b) - scoreEvidence(a) || a.id.localeCompare(b.id))
      .slice(0, limit)
  };
}
