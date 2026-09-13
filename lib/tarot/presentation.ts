import type { DrawnTarotCard, TarotLocale, TarotPhase } from './types.ts';

export type TarotStageMode = 'setup' | 'drawing' | 'concealed' | 'reading' | 'error' | 'cancelled';
export type TarotSpreadLayout = 'single' | 'three' | 'five' | 'celtic';

export interface TarotRevealProgress {
  revealed: number;
  total: number;
  remaining: number;
  complete: boolean;
}

function splitMarkdownTableRow(line: string): string[] {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  return value.split('|').map((cell) => cell.trim());
}

function isMarkdownTableDivider(line: string): boolean {
  const cells = splitMarkdownTableRow(line);
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function cleanTableHeader(value: string): string {
  return value.replace(/[*_`\[\]]/g, '').trim();
}

/**
 * Converts GFM-style tables into wrapping bullet lists before ReactMarkdown
 * renders them. This keeps provider output safe on narrow screens even when a
 * model ignores the Tarot prompt's no-table instruction.
 */
export function normalizeTarotMarkdown(markdown: string): string {
  if (!markdown.includes('|')) return markdown;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];

  for (let index = 0; index < lines.length;) {
    const headerLine = lines[index];
    const dividerLine = lines[index + 1];
    if (!headerLine.includes('|') || !dividerLine || !isMarkdownTableDivider(dividerLine)) {
      output.push(headerLine);
      index += 1;
      continue;
    }

    const headers = splitMarkdownTableRow(headerLine).map(cleanTableHeader);
    const rows: string[][] = [];
    index += 2;

    while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
      if (!isMarkdownTableDivider(lines[index])) {
        rows.push(splitMarkdownTableRow(lines[index]));
      }
      index += 1;
    }

    if (rows.length === 0) {
      output.push(headerLine, dividerLine);
      continue;
    }

    for (const row of rows) {
      const parts = row.flatMap((cell, cellIndex) => {
        if (!cell) return [];
        const header = headers[cellIndex];
        return header ? [`**${header}:** ${cell}`] : [cell];
      });
      if (parts.length > 0) output.push(`- ${parts.join('; ')}`);
    }
  }

  return output.join('\n');
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
