import { analyzeResonance } from './analyzer.ts';
import { formatAiPromptForm } from './formatter.ts';
import { getNumerologyEntities, getTarotEntity } from './retriever.ts';
import type { IndicatorSelection, ResonanceContext, RetrievalDiagnostic, TarotSelection } from './types.ts';

export * from './types.ts';
export * from './analyzer.ts';
export * from './formatter.ts';
export * from './retriever.ts';

export function selectRequestedIndicators(
  supplied: IndicatorSelection[],
  requestedKeys: string[],
  limit = 5
): IndicatorSelection[] {
  const requested = new Set(requestedKeys.slice(0, limit));
  return supplied.filter((indicator) => requested.has(indicator.key));
}

export function generateResonanceContext(cards: TarotSelection[], indicators: IndicatorSelection[]): ResonanceContext {
  const diagnostics: RetrievalDiagnostic[] = [];
  const tarotEntities = cards.flatMap((card) => {
    const entity = getTarotEntity(card, diagnostics);
    return entity ? [entity] : [];
  });
  const numerologyEntities = indicators.flatMap((indicator) => getNumerologyEntities(indicator, diagnostics));
  const analysis = analyzeResonance(tarotEntities, numerologyEntities);
  return {
    ...analysis,
    formattedAiPromptForm: formatAiPromptForm(analysis),
    diagnostics,
    matchedTarotCount: tarotEntities.length,
    matchedNumerologyCount: numerologyEntities.length
  };
}
