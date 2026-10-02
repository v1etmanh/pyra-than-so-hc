import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { minorArcanaCards } from '../lib/tarot/cards.ts';

const suitSymbols = {
  wands: '🔥', cups: '🏺', swords: '⚔️', pentacles: '✦'
};

const cards = minorArcanaCards.map((card) => ({
  id: card.id,
  nameVi: `${card.name.vi} (${card.name.en})`,
  nameEn: card.name.en,
  number: card.number,
  emoji: suitSymbols[card.suit] ?? '✦',
  keywordsUpright: card.keywords.upright.map((word) => word.vi),
  keywordsReversed: card.keywords.reversed.map((word) => word.vi),
  meaningUpright: card.meaning.upright.vi,
  meaningReversed: card.meaning.reversed.vi
}));

if (cards.length !== 56 || new Set(cards.map((card) => card.id)).size !== 56) {
  throw new Error('Expected 56 unique Minor Arcana cards');
}

const output = fileURLToPath(new URL('../mobile_app/src/services/minorArcana.generated.ts', import.meta.url));
writeFileSync(output, `// Generated from lib/tarot/cards.ts. Run: node --experimental-strip-types scripts/generate-mobile-minor-deck.mjs\nexport const MINOR_ARCANA_DATA = ${JSON.stringify(cards, null, 2)};\n`, 'utf8');
