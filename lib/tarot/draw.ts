import { allTarotCards } from './cards.ts';
import type { DrawnTarotCard, LocalizedText, TarotSpread, TarotSpreadPosition } from './types.ts';

function secureRandomIndex(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }

  const ceiling = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= ceiling);
  return values[0] % maxExclusive;
}

function shuffledCards(excludedCardIds: ReadonlySet<string>) {
  const cards = allTarotCards.filter((card) => !excludedCardIds.has(card.id));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  return cards;
}

export function drawCardsForSpread(
  spread: TarotSpread,
  excludedCardIds: ReadonlySet<string> = new Set()
): DrawnTarotCard[] {
  if (spread.positions.length > allTarotCards.length - excludedCardIds.size) {
    throw new Error('Not enough cards remain for this spread');
  }
  const cards = shuffledCards(excludedCardIds);
  return spread.positions.map((position, index) => ({
    card: cards[index],
    isReversed: secureRandomIndex(2) === 1,
    position
  }));
}

const supplementaryLabel = (index: number): LocalizedText => ({
  vi: `Lá bổ sung ${index}`,
  en: `Supplementary card ${index}`
});

export function drawSupplementaryCards(
  count: number,
  excludedCardIds: ReadonlySet<string>,
  startIndex = 0
): DrawnTarotCard[] {
  const safeCount = Math.max(1, Math.min(3, Math.floor(count)));
  const positions: TarotSpreadPosition[] = Array.from({ length: safeCount }, (_, index) => {
    const number = startIndex + index + 1;
    return {
      id: `supplementary-${number}`,
      name: supplementaryLabel(number),
      description: {
        vi: 'Thông tin bổ sung để làm rõ câu hỏi tiếp theo.',
        en: 'Additional guidance for the follow-up question.'
      }
    };
  });
  return drawCardsForSpread(
    {
      id: 'supplementary',
      name: { vi: 'Bài bổ sung', en: 'Supplementary cards' },
      description: { vi: 'Các lá làm rõ.', en: 'Clarifying cards.' },
      positions
    },
    excludedCardIds
  );
}
