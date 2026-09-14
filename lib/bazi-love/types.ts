import type { ProviderRequestConfig } from '@/lib/ai/types';

export type BaziLoveLocale = 'vi' | 'en';
export type CalculationSex = 'male' | 'female';
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

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
  confidence: ConfidenceLevel;
  focusYears: number[];
  charts: [BaziPublicChart, BaziPublicChart];
  layers: CompatibilityLayer[];
  strengths: CompatibilityNote[];
  frictions: CompatibilityNote[];
  assumptions: LocalizedText[];
  yearlyTimeline?: YearlyPillarDynamic[];
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
