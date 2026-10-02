import type { InteractionPair, ResonanceAnalysisResult } from './types.ts';

function safeQuote(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 240);
}

function formatPair(item: InteractionPair, index: number): string {
  const labels: Record<InteractionPair['type'], string> = {
    synergy: 'Cộng hưởng core',
    compensatory: 'Nguồn lực đối diện shadow',
    tension: 'Hai core đối hướng',
    shadow_vortex: 'Hai shadow cùng âm (Tarot ngược)'
  };
  return `${index + 1}. ${labels[item.type]} — ${item.tarotEntity.name} (${item.tarotEntity.orientation === 'reversed' ? 'ngược' : 'xuôi'}) × ${item.numerologyEntity.name} ${item.numerologyEntity.numberValue}, trục ${item.axis}.\n` +
    `   Bằng chứng Tarot: “${safeQuote(item.tarotEntity.evidenceQuote)}” (${item.tarotEntity.score > 0 ? '+' : ''}${item.tarotEntity.score}).\n` +
    `   Bằng chứng Thần số học: “${safeQuote(item.numerologyEntity.evidenceQuote)}” (${item.numerologyEntity.score > 0 ? '+' : ''}${item.numerologyEntity.score}).\n` +
    `   Gợi ý: ${item.interpretationVi}`;
}

export function formatAiPromptForm(result: ResonanceAnalysisResult): string {
  const pairs = [
    ...result.synergies.slice(0, 3),
    ...result.compensatoryRemedies.slice(0, 2),
    ...result.tensions.slice(0, 2),
    ...result.shadowVortexes.slice(0, 2)
  ];
  const profile = Object.entries(result.netVector).map(([axis, score]) => `${axis} ${score > 0 ? '+' : ''}${score}`).join(' · ');
  const lines = [
    'BẢN ĐỒ TƯƠNG TÁC 5 TRỤC (tín hiệu tham khảo từ các nhãn đã truy xuất):',
    `Net vector: ${profile}.`,
    `Trục cần quan sát: ${result.weakestAxis.axis} (${result.weakestAxis.score}).`,
    result.strongestPositiveAxis
      ? `Điểm tựa dương nổi bật: ${result.strongestPositiveAxis.axis} (+${result.strongestPositiveAxis.score}).`
      : 'Không có trục dương nổi bật để đề xuất làm điểm tựa.',
    pairs.length ? 'Các cặp có bằng chứng:' : 'Không có cặp tương tác đủ bằng chứng trong tập dữ liệu đã chọn.'
  ];
  pairs.forEach((item, index) => lines.push(formatPair(item, index)));
  lines.push('Chỉ diễn giải các cặp và trích dẫn có trong phần này. Đây là gợi ý tự soi chiếu, không phải quan hệ nhân quả hay dự báo chắc chắn.');
  return lines.join('\n');
}
