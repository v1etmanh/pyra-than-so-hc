'use client';

import type { CSSProperties } from 'react';
import type { DrawnTarotCard, TarotLocale } from '@/lib/tarot/types';

interface TarotCardViewProps {
  drawn: DrawnTarotCard;
  index: number;
  locale: TarotLocale;
  compact?: boolean;
}

export function TarotCardView({ drawn, index, locale, compact = false }: TarotCardViewProps) {
  const direction = drawn.isReversed ? 'reversed' : 'upright';
  const directionLabel = drawn.isReversed
    ? (locale === 'vi' ? 'Ngược' : 'Reversed')
    : (locale === 'vi' ? 'Xuôi' : 'Upright');
  const style = { '--tarot-reveal-delay': `${index * 170}ms` } as CSSProperties;

  return (
    <figure className={`numina-card ${compact ? 'is-compact' : ''}`} style={style}>
      <div className="numina-card-stage">
        <div className="numina-card-inner">
          <div className="numina-card-back" aria-hidden="true">
            <span>✦</span>
          </div>
          <div className="numina-card-front">
            {/* The source scans are local development assets; release remains subject to the documented asset-license gate. */}
            <img
              src={drawn.card.image}
              alt={`${drawn.card.name[locale]} — ${directionLabel}`}
              className={drawn.isReversed ? 'is-reversed' : ''}
            />
          </div>
        </div>
      </div>
      <figcaption>
        <small>{drawn.position.name[locale]}</small>
        <strong>{drawn.card.name[locale]}</strong>
        <span>{directionLabel}</span>
        <p>{drawn.card.keywords[direction].slice(0, 3).map((keyword) => keyword[locale]).join(' · ')}</p>
      </figcaption>
    </figure>
  );
}
