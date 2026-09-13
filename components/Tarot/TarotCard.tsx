'use client';

import type { CSSProperties } from 'react';
import type { DrawnTarotCard, TarotLocale } from '@/lib/tarot/types';

interface TarotCardViewProps {
  drawn: DrawnTarotCard;
  index: number;
  locale: TarotLocale;
  compact?: boolean;
  isRevealed: boolean;
  onReveal: () => void;
}

export function TarotCardView({
  drawn,
  index,
  locale,
  compact = false,
  isRevealed,
  onReveal
}: TarotCardViewProps) {
  const direction = drawn.isReversed ? 'reversed' : 'upright';
  const directionLabel = drawn.isReversed
    ? (locale === 'vi' ? 'Ngược' : 'Reversed')
    : (locale === 'vi' ? 'Xuôi' : 'Upright');
  const style = { '--tarot-card-index': index } as CSSProperties;
  const revealLabel = locale === 'vi'
    ? `Lật lá ${drawn.position.name.vi}`
    : `Reveal ${drawn.position.name.en}`;

  return (
    <figure
      className={`numina-card ${compact ? 'is-compact' : ''} ${isRevealed ? 'is-revealed' : 'is-concealed'}`}
      style={style}
    >
      <button
        type="button"
        className="numina-card-stage"
        onClick={onReveal}
        disabled={isRevealed}
        aria-label={isRevealed ? `${drawn.card.name[locale]} — ${directionLabel}` : revealLabel}
        aria-expanded={isRevealed}
      >
        <div className="numina-card-inner">
          <div className="numina-card-back" aria-hidden={isRevealed}>
            <span>✦</span>
          </div>
          <div className="numina-card-front" aria-hidden={!isRevealed}>
            {/* The source scans are local development assets; release remains subject to the documented asset-license gate. */}
            <img
              src={drawn.card.image}
              alt={isRevealed ? `${drawn.card.name[locale]} — ${directionLabel}` : ''}
              className={drawn.isReversed ? 'is-reversed' : ''}
            />
          </div>
        </div>
      </button>
      <figcaption>
        <small>{drawn.position.name[locale]}</small>
        {isRevealed ? (
          <div className="numina-card-details">
            <strong>{drawn.card.name[locale]}</strong>
            <span>{directionLabel}</span>
            <p>{drawn.card.keywords[direction].slice(0, 3).map((keyword) => keyword[locale]).join(' · ')}</p>
          </div>
        ) : (
          <div
            className="numina-card-concealed-mark"
            onClick={onReveal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onReveal();
              }
            }}
            title={revealLabel}
          >
            <span className="numina-concealed-star">✦</span>
            <small className="numina-concealed-hint">
              {locale === 'vi' ? 'Chạm để lật bài' : 'Tap to reveal'}
            </small>
          </div>
        )}
      </figcaption>
    </figure>
  );
}
