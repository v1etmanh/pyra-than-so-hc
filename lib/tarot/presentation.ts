import type { DrawnTarotCard, TarotLocale, TarotPhase } from './types.ts';

export type TarotStageMode = 'setup' | 'drawing' | 'concealed' | 'reading' | 'error' | 'cancelled';
export type TarotSpreadLayout = 'single' | 'three' | 'five' | 'celtic';

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
