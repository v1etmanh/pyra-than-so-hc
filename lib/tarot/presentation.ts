import type { DrawnTarotCard, TarotLocale, TarotPhase } from './types.ts';

export type TarotStageMode = 'setup' | 'drawing' | 'concealed' | 'reading' | 'error' | 'cancelled';
export type TarotSpreadLayout = 'single' | 'three' | 'five' | 'celtic';

export interface TarotRevealProgress {
  revealed: number;
  total: number;
  remaining: number;
  complete: boolean;
}

export function getTarotCardRevealKey(drawn: DrawnTarotCard): string {
  return `${drawn.position.id}:${drawn.card.id}`;
}

export function normalizeTarotRevealKeys(
  cards: DrawnTarotCard[],
  storedKeys: unknown,
  revealLegacyCards = false
): string[] {
  const validKeys = new Set(cards.map(getTarotCardRevealKey));
  if (!Array.isArray(storedKeys)) return revealLegacyCards ? Array.from(validKeys) : [];
  return Array.from(new Set(
    storedKeys.filter((key): key is string => typeof key === 'string' && validKeys.has(key))
  ));
}

export function getTarotRevealProgress(
  cards: DrawnTarotCard[],
  revealedCardKeys: string[] | undefined
): TarotRevealProgress {
  const revealedKeys = new Set(revealedCardKeys ?? []);
  const revealed = cards.reduce(
    (count, card) => count + (revealedKeys.has(getTarotCardRevealKey(card)) ? 1 : 0),
    0
  );
  const total = cards.length;

  return {
    revealed,
    total,
    remaining: Math.max(0, total - revealed),
    complete: total > 0 && revealed === total
  };
}

export function getTarotStageMode(
  hasSession: boolean,
  hasCards: boolean,
  awaitingReveal: boolean,
  phase: TarotPhase
): TarotStageMode {
  if (!hasSession) return 'setup';
  if (hasCards && awaitingReveal) return 'concealed';
  if (hasCards) return 'reading';
  if (phase === 'error') return 'error';
  if (['drawing', 'revealing', 'deciding', 'interpreting'].includes(phase)) return 'drawing';
  return 'cancelled';
}

export function getTarotSpreadLayout(spreadId: string): TarotSpreadLayout {
  if (spreadId === 'single') return 'single';
  if (spreadId === 'three-card') return 'three';
  if (spreadId === 'celtic-cross') return 'celtic';
  return 'five';
}

export function deriveTarotEnergyKeywords(
  cards: DrawnTarotCard[],
  locale: TarotLocale,
  limit = 3
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const drawn of cards) {
    const direction = drawn.isReversed ? 'reversed' : 'upright';
    for (const keyword of drawn.card.keywords[direction]) {
      const value = keyword[locale].trim();
      const key = value.toLocaleLowerCase(locale);
      if (value && !seen.has(key)) {
        seen.add(key);
        result.push(value);
      }
      if (result.length === limit) return result;
    }
  }
  return result;
}
