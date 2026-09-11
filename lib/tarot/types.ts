import type { ChatProfileContext } from '@/hooks/chat-types';
import type { ProviderRequestConfig } from '@/hooks/provider-types';

export type TarotLocale = 'vi' | 'en';
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type TarotCardType = 'major' | 'minor';
export type TarotOrientation = 'upright' | 'reversed';
export type TarotPhase = 'idle' | 'drawing' | 'revealing' | 'deciding' | 'interpreting' | 'ready' | 'error';

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface TarotCard {
  id: string;
  name: LocalizedText;
  type: TarotCardType;
  suit?: TarotSuit;
  number: number;
  image: string;
  keywords: {
    upright: LocalizedText[];
    reversed: LocalizedText[];
  };
  meaning: {
    upright: LocalizedText;
    reversed: LocalizedText;
  };
}

export interface TarotSpreadPosition {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
}

export interface TarotSpread {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  positions: TarotSpreadPosition[];
}

export interface DrawnTarotCard {
  card: TarotCard;
  isReversed: boolean;
  position: TarotSpreadPosition;
}

export interface StoredDrawnTarotCard {
  cardId: string;
  isReversed: boolean;
  positionId: string;
}

export interface TarotFollowUp {
  id: string;
  question: string;
  decision: 'direct' | 'draw' | null;
  reason: string;
  additionalCards: DrawnTarotCard[];
  interpretation: string;
  status: 'running' | 'done' | 'error';
  error: string | null;
  createdAt: string;
}

export interface TarotSession {
  id: string;
  title: string;
  question: string;
  spreadId: string;
  spread: TarotSpread | null;
  drawnCards: DrawnTarotCard[];
  interpretation: string;
  followUps: TarotFollowUp[];
  profile?: ChatProfileContext;
  locale: TarotLocale;
  createdAt: string;
  updatedAt: string;
}

export interface TarotReadingContext {
  originalQuestion: string;
  spreadId: string;
  drawnCards: StoredDrawnTarotCard[];
  interpretation: string;
  priorFollowUps: Array<{
    question: string;
    interpretation: string;
    additionalCards: StoredDrawnTarotCard[];
  }>;
}

export type TarotReadingRequest =
  | {
      mode: 'initial';
      question: string;
      spreadId: string;
      language: TarotLocale;
      profile?: ChatProfileContext;
      providerConfig?: ProviderRequestConfig;
    }
  | {
      mode: 'follow-up';
      question: string;
      language: TarotLocale;
      reading: TarotReadingContext;
      profile?: ChatProfileContext;
      providerConfig?: ProviderRequestConfig;
    }
  | {
      mode: 'regenerate';
      language: TarotLocale;
      reading: TarotReadingContext;
      profile?: ChatProfileContext;
      providerConfig?: ProviderRequestConfig;
    };

export type TarotSSEEvent =
  | { type: 'status'; phase: TarotPhase; message: string }
  | { type: 'reading'; spread: TarotSpread; cards: DrawnTarotCard[] }
  | { type: 'follow_up_decision'; decision: 'direct' | 'draw'; drawCount: number; reason: string }
  | { type: 'supplementary_cards'; cards: DrawnTarotCard[] }
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

export function localize(text: LocalizedText, locale: TarotLocale): string {
  return text[locale];
}

