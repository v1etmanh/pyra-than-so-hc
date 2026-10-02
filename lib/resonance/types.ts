export const AXIS_KEYS = ['ACT', 'EMO', 'STR', 'RSK', 'INT'] as const;

export type AxisKey = (typeof AXIS_KEYS)[number];
export type EntityDomain = 'tarot' | 'numerology';

export interface AxisEvidence {
  score: number;
  evidenceQuote: string;
  rationale: string;
  evidenceStatus?: string;
  eligibleForRelations?: boolean;
}

export type FiveAxisVector = Record<AxisKey, AxisEvidence>;

export interface LabeledEntity {
  id: string;
  name: string;
  nameEn?: string;
  domain: EntityDomain;
  subType: string;
  numberValue?: string | number;
  orientation?: 'upright' | 'reversed';
  sourceSnippet?: string;
  core: FiveAxisVector;
  shadow: FiveAxisVector;
}

export interface TarotSelection {
  cardId?: string;
  isReversed?: boolean;
  orientation?: 'upright' | 'reversed';
  card?: { id?: string; cardId?: string; nameVi?: string; nameEn?: string; number?: number };
  nameVi?: string;
  nameEn?: string;
  position?: { nameVi?: string };
}

export interface IndicatorSelection {
  key: string;
  name: string;
  value: string | number;
}

export type InteractionType = 'synergy' | 'compensatory' | 'tension' | 'shadow_vortex';

export interface InteractionPair {
  type: InteractionType;
  tarotEntity: {
    id: string;
    name: string;
    orientation: 'upright' | 'reversed';
    score: number;
    evidenceQuote: string;
    rationale: string;
  };
  numerologyEntity: {
    id: string;
    name: string;
    indicatorKey: string;
    numberValue: string | number;
    score: number;
    evidenceQuote: string;
    rationale: string;
  };
  axis: AxisKey;
  intensity: number;
  interpretationVi: string;
}

export interface AxisSummary {
  axis: AxisKey;
  score: number;
}

export interface ResonanceAnalysisResult {
  netVector: Record<AxisKey, number>;
  synergies: InteractionPair[];
  compensatoryRemedies: InteractionPair[];
  tensions: InteractionPair[];
  shadowVortexes: InteractionPair[];
  weakestAxis: AxisSummary;
  strongestPositiveAxis: AxisSummary | null;
}

export interface RetrievalDiagnostic {
  domain: EntityDomain;
  key: string;
  reason: 'missing_entity' | 'missing_evidence' | 'invalid_score' | 'not_eligible';
}

export interface ResonanceContext extends ResonanceAnalysisResult {
  formattedAiPromptForm: string;
  diagnostics: RetrievalDiagnostic[];
  matchedTarotCount: number;
  matchedNumerologyCount: number;
}
