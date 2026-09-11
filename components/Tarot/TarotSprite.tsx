'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './TarotDashboard.module.css';

type SpriteKind = 'orb' | 'candle' | 'deck';

interface TarotSpriteProps {
  kind: SpriteKind;
  className?: string;
  active?: boolean;
}

const FRAME_COUNT = 6;
const FRAME_DELAYS: Record<SpriteKind, number> = {
  orb: 720,
  candle: 360,
  deck: 520
};

export function TarotSprite({ kind, className = '', active = true }: TarotSpriteProps) {
  const [frame, setFrame] = useState(0);
  const sources = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, index) => `/tarot/ui/${kind}-frame-${index + 1}.webp`),
    [kind]
  );

  useEffect(() => {
    sources.forEach((source) => {
      const image = new window.Image();
      image.src = source;
    });
  }, [sources]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!active || media.matches) {
      setFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % FRAME_COUNT);
    }, FRAME_DELAYS[kind]);
    return () => window.clearInterval(timer);
  }, [active, kind]);

  return (
    <img
      className={`${styles.sprite} ${className}`}
      src={sources[frame]}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
