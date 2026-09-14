'use client';

import type {
  BaziCompatibilityResult,
  BaziLoveLocale,
  BaziLovePersonInput,
  CompatibilityNote
} from '@/lib/bazi-love/types';
import {
  GAN_NAMES,
  PILLAR_NAMES,
  WUXING_NAMES,
  ZHI_NAMES
} from '@/lib/bazi-love/engine';
import styles from './BaziLove.module.css';

interface BaziLoveResultViewProps {
  compatibility: BaziCompatibilityResult;
  people: [BaziLovePersonInput, BaziLovePersonInput];
  locale: BaziLoveLocale;
}

export function BaziLoveResultView({
  compatibility,
  people,
  locale
}: BaziLoveResultViewProps) {
  const isVi = locale === 'vi';
  const chartA = compatibility.charts[0];
  const chartB = compatibility.charts[1];

  const getNoteText = (note: CompatibilityNote) => {
    const text = isVi ? note.text.vi : note.text.en;
    if (note.occurrenceRate === undefined || note.occurrenceRate >= 0.999) return text;
    const rate = Math.round(note.occurrenceRate * 100);
    return isVi
      ? `${text} — phụ thuộc giờ sinh (${rate}% kịch bản)`
      : `${text} — birth-hour dependent (${rate}% of scenarios)`;
  };

  const getPillarReading = (gan?: string, zhi?: string) => {
    if (!gan || !zhi) return isVi ? 'Chưa rõ' : 'Unknown';
    const gName = isVi ? (GAN_NAMES[gan]?.vi || gan) : (GAN_NAMES[gan]?.en || gan);
    const zName = isVi ? (ZHI_NAMES[zhi]?.vi || zhi) : (ZHI_NAMES[zhi]?.en || zhi);
    return `${gName} ${zName}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Four Pillars of Both People */}
      <div className={styles.chartsSummary}>
        {/* Person A Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartName}>
              <span>{people[0].name}</span>
              <span className={styles.chartRoleBadge}>
                {isVi ? 'Người A' : 'Person A'}
              </span>
            </div>
            <div className={styles.chartYinYangSeal} aria-hidden="true">☯</div>
          </div>

          <div className={styles.pillarsRow}>
            {chartA.pillars.map((pillar, idx) => (
              <div key={idx} className={styles.pillarCell}>
                <div className={styles.pillarLabel}>
                  {isVi ? PILLAR_NAMES[idx].vi : PILLAR_NAMES[idx].en}
                </div>
                <div className={styles.pillarChars}>
                  {pillar ? `${pillar.gan}${pillar.zhi}` : (isVi ? '??' : '??')}
                </div>
                <div className={styles.pillarViReading}>
                  {getPillarReading(pillar?.gan, pillar?.zhi)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.elementChips}>
            <span className={`${styles.elementChip} ${styles.elementChipGold}`}>
              {isVi ? 'Nhật chủ: ' : 'Day Master: '}
              <strong>
                {chartA.dayMaster} ({isVi ? WUXING_NAMES[chartA.dayMasterElement === 'wood' ? '木' : chartA.dayMasterElement === 'fire' ? '火' : chartA.dayMasterElement === 'earth' ? '土' : chartA.dayMasterElement === 'metal' ? '金' : '水']?.vi : chartA.dayMasterElement})
              </strong>
            </span>
            <span className={styles.elementChip}>
              {isVi ? 'Dụng thần: ' : 'Useful God: '}
              <strong>
                {isVi ? WUXING_NAMES[chartA.usefulElement === 'wood' ? '木' : chartA.usefulElement === 'fire' ? '火' : chartA.usefulElement === 'earth' ? '土' : chartA.usefulElement === 'metal' ? '金' : '水']?.vi : chartA.usefulElement}
              </strong>
            </span>
            <span className={styles.elementChip}>
              {isVi ? 'Kỵ thần: ' : 'Challenging: '}
              <strong>
                {isVi ? WUXING_NAMES[chartA.challengingElement === 'wood' ? '木' : chartA.challengingElement === 'fire' ? '火' : chartA.challengingElement === 'earth' ? '土' : chartA.challengingElement === 'metal' ? '金' : '水']?.vi : chartA.challengingElement}
              </strong>
            </span>
          </div>
        </div>

        {/* Person B Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartName}>
              <span>{people[1].name}</span>
              <span className={styles.chartRoleBadge}>
                {isVi ? 'Người B' : 'Person B'}
              </span>
            </div>
            <div className={styles.chartYinYangSeal} aria-hidden="true">☯</div>
          </div>

          <div className={styles.pillarsRow}>
            {chartB.pillars.map((pillar, idx) => (
              <div key={idx} className={styles.pillarCell}>
                <div className={styles.pillarLabel}>
                  {isVi ? PILLAR_NAMES[idx].vi : PILLAR_NAMES[idx].en}
                </div>
                <div className={styles.pillarChars}>
                  {pillar ? `${pillar.gan}${pillar.zhi}` : (isVi ? '??' : '??')}
                </div>
                <div className={styles.pillarViReading}>
                  {getPillarReading(pillar?.gan, pillar?.zhi)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.elementChips}>
            <span className={`${styles.elementChip} ${styles.elementChipGold}`}>
              {isVi ? 'Nhật chủ: ' : 'Day Master: '}
              <strong>
                {chartB.dayMaster} ({isVi ? WUXING_NAMES[chartB.dayMasterElement === 'wood' ? '木' : chartB.dayMasterElement === 'fire' ? '火' : chartB.dayMasterElement === 'earth' ? '土' : chartB.dayMasterElement === 'metal' ? '金' : '水']?.vi : chartB.dayMasterElement})
              </strong>
            </span>
            <span className={styles.elementChip}>
              {isVi ? 'Dụng thần: ' : 'Useful God: '}
              <strong>
                {isVi ? WUXING_NAMES[chartB.usefulElement === 'wood' ? '木' : chartB.usefulElement === 'fire' ? '火' : chartB.usefulElement === 'earth' ? '土' : chartB.usefulElement === 'metal' ? '金' : '水']?.vi : chartB.usefulElement}
              </strong>
            </span>
            <span className={styles.elementChip}>
              {isVi ? 'Kỵ thần: ' : 'Challenging: '}
              <strong>
                {isVi ? WUXING_NAMES[chartB.challengingElement === 'wood' ? '木' : chartB.challengingElement === 'fire' ? '火' : chartB.challengingElement === 'earth' ? '土' : chartB.challengingElement === 'metal' ? '金' : '水']?.vi : chartB.challengingElement}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Assumptions Notice if unknown hours */}
      {compatibility.assumptions.length > 0 && (
        <div className={styles.disclaimerBox}>
          {compatibility.assumptions.map((item, index) => (
            <p key={index}>✦ {isVi ? item.vi : item.en}</p>
          ))}
        </div>
      )}

      {/* 4 Aspect Cards (2x2 Grid) */}
      <div className={styles.aspectsGrid}>
        {compatibility.layers.map((layer) => {
          const isPos = layer.score > 0;
          const isNeg = layer.score < 0;
          const scoreClass = isPos
            ? styles.aspectScorePositive
            : isNeg
            ? styles.aspectScoreNegative
            : styles.aspectScoreNeutral;

          const scoreText = layer.uncertain
            ? `[${layer.minScore > 0 ? '+' : ''}${layer.minScore} ~ ${layer.maxScore > 0 ? '+' : ''}${layer.maxScore}]`
            : `${layer.score > 0 ? '+' : ''}${layer.score}`;

          return (
            <div key={layer.id} className={styles.aspectCard}>
              <div className={styles.aspectHeader}>
                <span className={styles.aspectTitle}>{isVi ? layer.label.vi : layer.label.en}</span>
                <span className={`${styles.aspectScore} ${scoreClass}`}>{scoreText}</span>
              </div>
              <ul className={styles.aspectNotes}>
                {layer.notes.slice(0, 4).map((note, noteIdx) => {
                  const badgeClass =
                    note.kind === 'positive'
                      ? styles.notePlus
                      : note.kind === 'negative'
                      ? styles.noteMinus
                      : styles.noteDot;
                  const sign = note.kind === 'positive' ? '+' : note.kind === 'negative' ? '−' : '·';
                  return (
                    <li key={noteIdx} className={styles.aspectNoteItem}>
                      <span className={`${styles.noteBadge} ${badgeClass}`}>{sign}</span>
                      <span>{getNoteText(note)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Strengths & Frictions Highlights */}
      <div className={styles.highlightsGrid}>
        <div className={`${styles.highlightCard} ${styles.highlightCardPositive}`}>
          <div className={`${styles.highlightTitle} ${styles.highlightTitlePositive}`}>
            <span>✦</span>
            <span>{isVi ? 'Điểm Hỗ Trợ & Nâng Đỡ Nổi Bật' : 'Key Supportive Connections'}</span>
          </div>
          <ul className={styles.highlightList}>
            {compatibility.strengths.slice(0, 5).map((s, idx) => (
              <li key={idx}>
                <span style={{ color: '#246834', fontWeight: 700 }}>✓</span>
                <span>{getNoteText(s)}</span>
              </li>
            ))}
            {compatibility.strengths.length === 0 && (
              <li>
                <span style={{ color: '#888' }}>·</span>
                <span>{isVi ? 'Không có điểm nâng đỡ cực đoan, năng lượng tương đối trung hòa.' : 'Neutral supportive baseline.'}</span>
              </li>
            )}
          </ul>
        </div>

        <div className={`${styles.highlightCard} ${styles.highlightCardNegative}`}>
          <div className={`${styles.highlightTitle} ${styles.highlightTitleNegative}`}>
            <span>✦</span>
            <span>{isVi ? 'Vùng Dễ Nảy Sinh Ma Sát Cần Thấu Cảm' : 'Growth & Friction Areas'}</span>
          </div>
          <ul className={styles.highlightList}>
            {compatibility.frictions.slice(0, 5).map((f, idx) => (
              <li key={idx}>
                <span style={{ color: '#9a2b25', fontWeight: 700 }}>!</span>
                <span>{getNoteText(f)}</span>
              </li>
            ))}
            {compatibility.frictions.length === 0 && (
              <li>
                <span style={{ color: '#888' }}>·</span>
                <span>{isVi ? 'Ít điểm xung khắc gay gắt, nền tảng êm ả.' : 'Minimal direct astrological friction.'}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Philosophy & Disclaimer Box */}
      <div className={styles.disclaimerBox}>
        <p>
          {isVi
            ? '✦ Lưu ý chiêm nghiệm: Bát Tự phản ánh xu hướng năng lượng tự nhiên giữa hai cá nhân, không phải kết luận định mệnh bất biến. Mọi mối quan hệ bền vững đều khởi sinh từ sự lắng nghe, tôn trọng và ý thức cùng vun đắp.'
            : '✦ Contemplative Note: Bazi reflects innate energetic predispositions, not an unchangeable fate. Long-lasting harmony is nurtured through conscious listening, mutual respect, and dedicated emotional presence.'}
        </p>
      </div>
    </div>
  );
}
