import type { ProviderRequestConfig } from '@/lib/ai/types';

export type BaziLoveLocale = 'vi' | 'en';
export type CalculationSex = 'male' | 'female';
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type RelationDirection =
  | 'A_TO_B'
  | 'B_TO_A'
  | 'MUTUAL'
  | 'TIMING_A'
  | 'TIMING_B'
  | 'TIMING_MUTUAL';

export type RelationPolarity = 'supportive' | 'challenging' | 'mixed' | 'neutral';

export type RelationDimension =
  | 'attraction'
  | 'emotional_connection'
  | 'emotional_safety'
  | 'perception'
  | 'communication'
  | 'expression'
  | 'initiative'
  | 'trust'
  | 'closeness'
  | 'independence'
  | 'conflict'
  | 'conflict_repair'
  | 'power_balance'
  | 'pressure'
  | 'support'
  | 'dependency'
  | 'values'
  | 'daily_life'
  | 'family_context'
  | 'commitment'
  | 'marriage'
  | 'long_term'
  | 'growth'
  | 'timing'
  | 'reconnection'
  | 'instability';

export type RelationEvidenceSource =
  | 'wuxing'
  | 'day_master'
  | 'ten_god'
  | 'stem_relation'
  | 'branch_relation'
  | 'spouse_palace'
  | 'useful_element'
  | 'challenging_element'
  | 'nobleman'
  | 'dayun'
  | 'liunian';

export interface RelationEvidence {
  /** Stable semantic fingerprint. Never derived from localized prose. */
  id: string;
  source: RelationEvidenceSource;
  subtype: string;
  direction: RelationDirection;
  dimensions: RelationDimension[];
  polarity: RelationPolarity;
  weight: number;
  occurrenceRate: number;
  confidence: ConfidenceLevel;
  hourSensitive: boolean;
  facts: Record<string, string | number | boolean | null>;
  text: LocalizedText;
}

export type RelationTendency =
  | 'strong_support'
  | 'supportive'
  | 'mixed'
  | 'challenging'
  | 'strong_challenge'
  | 'insufficient_evidence';

export interface RelationDimensionProfile {
  dimension: RelationDimension;
  tendency: RelationTendency;
  /** Internal relative score. This is not a probability or scientific measure. */
  score: number;
  minScore?: number;
  maxScore?: number;
  evidenceIds: string[];
  confidence: ConfidenceLevel;
}

export interface DirectionalPerspectiveProfile {
  perception: RelationDimensionProfile;
  attraction: RelationDimensionProfile;
  support: RelationDimensionProfile;
  pressure: RelationDimensionProfile;
  initiative: RelationDimensionProfile;
  closeness: RelationDimensionProfile;
}

export interface DirectionalRelationProfile {
  /** How Person A is inclined to experience Person B (evidence flowing B_TO_A). */
  aTowardB: DirectionalPerspectiveProfile;
  /** How Person B is inclined to experience Person A (evidence flowing A_TO_B). */
  bTowardA: DirectionalPerspectiveProfile;
}

export type BaziPillarPosition = 'year' | 'month' | 'day' | 'hour';

export interface BranchInteractionObservation {
  evidenceId: string;
  subtype: string;
  polarity: RelationPolarity;
  occurrenceRate: number;
}

export interface BranchInteractionCell {
  aPillar: BaziPillarPosition;
  bPillar: BaziPillarPosition;
  spousePalace: boolean;
  importance: 'highest' | 'high' | 'medium';
  hourSensitive: boolean;
  relations: BranchInteractionObservation[];
}

export type RelationQuestionIntentId =
  | 'overview'
  | 'perception'
  | 'emotional_connection'
  | 'attraction'
  | 'initiative'
  | 'communication'
  | 'conflict'
  | 'power_balance'
  | 'support'
  | 'trust'
  | 'independence'
  | 'values'
  | 'commitment'
  | 'timing'
  | 'reconnection'
  | 'daily_life'
  | 'family'
  | 'growth';

export interface RelationQuestionIntent {
  id: RelationQuestionIntentId;
  dimensions: RelationDimension[];
  directions: RelationDirection[];
}

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface BaziLovePersonInput {
  name: string;
  birthDate: string;
  birthTime?: string;
  timezone: string;
  calculationSex: CalculationSex;
}

export interface BaziPillar {
  gan: string;
  zhi: string;
}

export interface BaziPublicChart {
  label: 'A' | 'B';
  pillars: [BaziPillar, BaziPillar, BaziPillar, BaziPillar | null];
  dayMaster: string;
  dayMasterElement: FiveElement;
  usefulElement: FiveElement;
  challengingElement: FiveElement;
  timeKnown: boolean;
  birthYear?: number;
  currentAge?: number;
}

export interface CompatibilityNote {
  kind: 'positive' | 'negative' | 'neutral';
  value: number;
  text: LocalizedText;
  /** Share of evaluated birth-hour scenarios in which this note occurred. */
  occurrenceRate?: number;
}

export type CompatibilityLayerId = 'elements' | 'interactions' | 'roles' | 'cycles';

export interface CompatibilityLayer {
  id: CompatibilityLayerId;
  label: LocalizedText;
  score: number;
  minScore: number;
  maxScore: number;
  uncertain: boolean;
  notes: CompatibilityNote[];
}

export interface YearlyPillarDynamic {
  year: number;
  gan: string;
  zhi: string;
  ganName: LocalizedText;
  zhiName: LocalizedText;
  element: FiveElement;
  elementName: LocalizedText;
  interactionsA: LocalizedText[];
  interactionsB: LocalizedText[];
  marriageSignal?: {
    favorable: boolean;
    note: LocalizedText;
  };
}

export interface BaziCompatibilityResult {
  engineVersion: 'bazi-love-ts-v1';
  relationEngineVersion: 'relation-intelligence-v2';
  confidence: ConfidenceLevel;
  evaluatedScenarios: number;
  focusYears: number[];
  charts: [BaziPublicChart, BaziPublicChart];
  layers: CompatibilityLayer[];
  strengths: CompatibilityNote[];
  frictions: CompatibilityNote[];
  assumptions: LocalizedText[];
  yearlyTimeline?: YearlyPillarDynamic[];
  /** Full post-uncertainty evidence pool. UI summaries remain intentionally capped. */
  relationEvidence: RelationEvidence[];
  dimensionProfiles: RelationDimensionProfile[];
  directionalProfile: DirectionalRelationProfile;
  branchInteractionMatrix: BranchInteractionCell[];
}

export interface BaziLoveChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'streaming' | 'done' | 'error';
  error?: string | null;
  createdAt: string;
}

export interface BaziLoveSession {
  id: string;
  title: string;
  people: [BaziLovePersonInput, BaziLovePersonInput];
  originalQuestion: string;
  compatibility: BaziCompatibilityResult | null;
  interpretation: string;
  messages: BaziLoveChatMessage[];
  locale: BaziLoveLocale;
  createdAt: string;
  updatedAt: string;
}

export type BaziLovePhase = 'idle' | 'calculating' | 'interpreting' | 'ready' | 'error';

export type BaziLoveSSEEvent =
  | { type: 'status'; phase: 'calculating' | 'interpreting'; message: string }
  | { type: 'compatibility'; result: BaziCompatibilityResult }
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

interface RequestCommon {
  people: [BaziLovePersonInput, BaziLovePersonInput];
  language: BaziLoveLocale;
  providerConfig?: ProviderRequestConfig;
}

export type BaziLoveReadingRequest =
  | (RequestCommon & { mode: 'initial'; question?: string })
  | (RequestCommon & {
      mode: 'follow-up';
      question: string;
      history: Array<Pick<BaziLoveChatMessage, 'role' | 'content'>>;
    })
  | (RequestCommon & { mode: 'regenerate'; question?: string });
