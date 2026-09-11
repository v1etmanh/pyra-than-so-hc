'use client';

import { useMemo } from 'react';
import { FiCalendar, FiMessageSquare, FiBookmark, FiActivity, FiFeather, FiUser } from 'react-icons/fi';
import type { DrawnTarotCard, TarotLocale, TarotSpread } from '@/lib/tarot/types';
import type { NumerologyProfile } from '@/hooks/useProfiles';
import styles from './MysticalTarot.module.css';

interface MysticalTarotSidebarProps {
  dateFormatted: string;
  selectedSpread: TarotSpread;
  drawnCards: DrawnTarotCard[];
  onRevealAll: () => void;
  isRunning: boolean;
  cardsRevealed: boolean;
  hasDrawnCards: boolean;
  locale: TarotLocale;
  activeProfile?: NumerologyProfile | null;
  lifePathNumber?: string | number;
}

const DEFAULT_ENERGY_CHIPS: Record<TarotLocale, string[]> = {
  vi: ['Tò Mò', 'Hi Vọng', 'Khai Mở'],
  en: ['Curious', 'Hopeful', 'Open']
};

export function MysticalTarotSidebar({
  dateFormatted,
  selectedSpread,
  drawnCards,
  onRevealAll,
  isRunning,
  cardsRevealed,
  hasDrawnCards,
  locale,
  activeProfile,
  lifePathNumber
}: MysticalTarotSidebarProps) {
  const energyChips = useMemo(() => {
    if (drawnCards.length > 0) {
      const keywords: string[] = [];
      for (const d of drawnCards) {
        const dir = d.isReversed ? 'reversed' : 'upright';
        const kw = d.card.keywords[dir]?.[0]?.[locale];
        if (kw && !keywords.includes(kw)) {
          keywords.push(kw);
        }
      }
      if (keywords.length >= 2) return keywords.slice(0, 3);
    }
    return DEFAULT_ENERGY_CHIPS[locale];
  }, [drawnCards, locale]);

  return (
    <aside className={styles.sidebarPanel} aria-label="Reading Information">
      {/* 1. YOUR READING */}
      <section className={styles.sidebarSection}>
        <div className={styles.sectionHeader}>
          <span aria-hidden="true">✦</span>
          <span>{locale === 'vi' ? 'PHIÊN TRẢI BÀI' : 'YOUR READING'}</span>
        </div>

        <div className={styles.metaList}>
          <div className={styles.metaItem}>
            <FiCalendar className={styles.metaIcon} aria-hidden="true" />
            <div className={styles.metaContent}>
              <span className={styles.metaPrimary} suppressHydrationWarning>
                {dateFormatted}
              </span>
            </div>
          </div>

          {activeProfile && (
            <div className={styles.metaItem}>
              <FiUser className={styles.metaIcon} aria-hidden="true" />
              <div className={styles.metaContent}>
                <span className={styles.metaPrimary}>
                  {activeProfile.name} {lifePathNumber ? `(Số ${lifePathNumber})` : ''}
                </span>
                <span className={styles.metaSecondary}>
                  {locale === 'vi' ? 'Hồ sơ năng lượng Thần số học' : 'Channeling personal energy'}
                </span>
              </div>
            </div>
          )}

          <div className={styles.metaItem}>
            <FiMessageSquare className={styles.metaIcon} aria-hidden="true" />
            <div className={styles.metaContent}>
              <span className={styles.metaPrimary}>{selectedSpread.name[locale]}</span>
              <span className={styles.metaSecondary}>
                {selectedSpread.description[locale].slice(0, 48)}…
              </span>
            </div>
          </div>

          <div className={styles.metaItem}>
            <FiBookmark className={styles.metaIcon} aria-hidden="true" />
            <div className={styles.metaContent}>
              <span className={styles.metaPrimary}>
                {locale === 'vi' ? 'Phiên Chiêm Nghiệm' : 'Personal Session'}
              </span>
              <span className={styles.metaSecondary}>
                {locale === 'vi' ? 'Đã lưu vào nhật ký cá nhân' : 'Saved to your journal'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. YOUR ENERGY */}
      <section className={styles.sidebarSection}>
        <div className={styles.sectionHeader}>
          <FiActivity aria-hidden="true" />
          <span>{locale === 'vi' ? 'NĂNG LƯỢNG CỦA BẠN' : 'YOUR ENERGY'}</span>
        </div>

        <div className={styles.energyChips}>
          {energyChips.map((chip, i) => (
            <span key={i} className={styles.energyChip}>
              {chip}
            </span>
          ))}
        </div>

        <p className={styles.energyQuote}>
          {locale === 'vi' ? 'Một chương mới luôn mở ra phía trước.' : 'A new chapter is always possible.'}
        </p>
      </section>

      {/* 3. A LITTLE REMINDER */}
      <section className={styles.sidebarSection}>
        <div className={styles.sectionHeader}>
          <FiFeather aria-hidden="true" />
          <span>{locale === 'vi' ? 'LỜI NHẮN TỪ VŨ TRỤ' : 'A LITTLE REMINDER'}</span>
        </div>

        <div className={styles.reminderCard}>
          <p className={styles.reminderQuote}>
            {locale === 'vi'
              ? '“Bạn là một phần trong câu chuyện vĩ đại của vũ trụ.”'
              : '“You are part of a much bigger story.”'}
          </p>
          <span className={styles.reminderAuthor}>
            — {locale === 'vi' ? 'VŨ TRỤ' : 'THE UNIVERSE'}
          </span>
        </div>
      </section>

      {/* 4. MAIN ACTION BUTTON (CTA) */}
      <button
        type="button"
        className={styles.ctaButton}
        onClick={onRevealAll}
        disabled={isRunning}
      >
        <span>✦</span>
        <span>
          {isRunning
            ? (locale === 'vi' ? 'Đang Lắng Nghe Vũ Trụ…' : 'Consulting The Stars…')
            : hasDrawnCards && !cardsRevealed
            ? (locale === 'vi' ? 'Lật Mở Cả 3 Lá Bài' : 'Reveal My Cards >')
            : (locale === 'vi' ? 'Luận Giải Ngay >' : 'Start Reading >')}
        </span>
      </button>

      {/* 5. FOOTER TAGLINE */}
      <p className={styles.sidebarFooterTagline}>
        {locale === 'vi' ? 'CÙNG MỘT BẦU TRỜ SAO. MỘT BẠN TỎA SÁNG HƠN.' : 'SAME STARS. A BRIGHTER YOU.'}
      </p>
    </aside>
  );
}
