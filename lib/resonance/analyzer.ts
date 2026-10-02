import { AXIS_KEYS, type AxisKey, type AxisSummary, type InteractionPair, type LabeledEntity, type ResonanceAnalysisResult } from './types.ts';

const AXIS_NAMES: Record<AxisKey, string> = {
  ACT: 'Hành động & Tiên phong',
  EMO: 'Cảm xúc & Gắn kết',
  STR: 'Cấu trúc & Kỷ luật',
  RSK: 'Dấn thân & Chấp nhận rủi ro',
  INT: 'Trực giác & Minh triết nội tại'
};

function pair(
  type: InteractionPair['type'],
  tarot: LabeledEntity,
  numerology: LabeledEntity,
  axis: AxisKey,
  tarotEvidence: LabeledEntity['core'][AxisKey],
  numerologyEvidence: LabeledEntity['core'][AxisKey],
  intensity: number,
  interpretationVi: string
): InteractionPair {
  return {
    type,
    tarotEntity: {
      id: tarot.id, name: tarot.name, orientation: tarot.orientation ?? 'upright',
      score: tarotEvidence.score, evidenceQuote: tarotEvidence.evidenceQuote, rationale: tarotEvidence.rationale
    },
    numerologyEntity: {
      id: numerology.id, name: numerology.name, indicatorKey: numerology.subType,
      numberValue: numerology.numberValue ?? '', score: numerologyEvidence.score,
      evidenceQuote: numerologyEvidence.evidenceQuote, rationale: numerologyEvidence.rationale
    },
    axis, intensity, interpretationVi
  };
}

function sortPairs(items: InteractionPair[]): InteractionPair[] {
  return items.sort((a, b) => b.intensity - a.intensity || a.tarotEntity.id.localeCompare(b.tarotEntity.id) || a.numerologyEntity.id.localeCompare(b.numerologyEntity.id) || a.axis.localeCompare(b.axis));
}

function summarizeAxis(netVector: Record<AxisKey, number>, maximize: boolean): AxisSummary {
  const initial: AxisSummary = { axis: AXIS_KEYS[0], score: netVector[AXIS_KEYS[0]] };
  return AXIS_KEYS.reduce<AxisSummary>((best, axis) => {
    const current = netVector[axis];
    const bestScore = netVector[best.axis];
    return maximize ? (current > bestScore ? { axis, score: current } : best) : (current < bestScore ? { axis, score: current } : best);
  }, initial);
}

export function analyzeResonance(tarotEntities: LabeledEntity[], numerologyEntities: LabeledEntity[]): ResonanceAnalysisResult {
  const netVector: Record<AxisKey, number> = { ACT: 0, EMO: 0, STR: 0, RSK: 0, INT: 0 };
  for (const entity of [...tarotEntities, ...numerologyEntities]) {
    for (const axis of AXIS_KEYS) netVector[axis] += entity.core[axis].score;
  }

  const synergies: InteractionPair[] = [];
  const compensatoryRemedies: InteractionPair[] = [];
  const tensions: InteractionPair[] = [];
  const shadowVortexes: InteractionPair[] = [];

  for (const tarot of tarotEntities) {
    for (const numerology of numerologyEntities) {
      for (const axis of AXIS_KEYS) {
        const tarotCore = tarot.core[axis];
        const numerologyCore = numerology.core[axis];
        const tarotShadow = tarot.shadow[axis];
        const numerologyShadow = numerology.shadow[axis];
        const axisName = AXIS_NAMES[axis];

        if (tarotCore.score > 0 && numerologyCore.score > 0) {
          synergies.push(pair('synergy', tarot, numerology, axis, tarotCore, numerologyCore, tarotCore.score * numerologyCore.score,
            `Hai core cùng dương trên trục ${axisName}; đây là điểm tương đồng để người hỏi tự soi chiếu.`));
        }
        if (tarotCore.score > 0 && numerologyShadow.score < 0) {
          compensatoryRemedies.push(pair('compensatory', tarot, numerology, axis, tarotCore, numerologyShadow, tarotCore.score + Math.abs(numerologyShadow.score),
            `Core Tarot dương có thể gợi một nguồn lực để đối diện shadow số học trên trục ${axisName}; không xem đây là sự hóa giải chắc chắn.`));
        }
        if (tarotCore.score * numerologyCore.score <= -2) {
          tensions.push(pair('tension', tarot, numerology, axis, tarotCore, numerologyCore, Math.abs(tarotCore.score * numerologyCore.score),
            `Hai core đối hướng trên trục ${axisName}; đây là một điểm cần cân nhắc trong bối cảnh câu hỏi.`));
        }
        if (tarot.orientation === 'reversed' && tarotShadow.score < 0 && numerologyShadow.score < 0) {
          shadowVortexes.push(pair('shadow_vortex', tarot, numerology, axis, tarotShadow, numerologyShadow, Math.abs(tarotShadow.score * numerologyShadow.score),
            `Hai shadow cùng âm trên trục ${axisName}; xem đây là tín hiệu thận trọng để tự quan sát, không phải dự báo.`));
        }
      }
    }
  }

  const weakestAxis = summarizeAxis(netVector, false);
  const strongest = summarizeAxis(netVector, true);
  return {
    netVector,
    synergies: sortPairs(synergies),
    compensatoryRemedies: sortPairs(compensatoryRemedies),
    tensions: sortPairs(tensions),
    shadowVortexes: sortPairs(shadowVortexes),
    weakestAxis,
    strongestPositiveAxis: strongest.score > 0 ? strongest : null
  };
}
