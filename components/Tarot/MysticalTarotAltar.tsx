'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { FiEdit2, FiCheck } from 'react-icons/fi';
import type { DrawnTarotCard, TarotLocale, TarotPhase } from '@/lib/tarot/types';
import styles from './MysticalTarot.module.css';

interface MysticalTarotAltarProps {
  question: string;
  onQuestionChange: (val: string) => void;
  onSubmitQuestion: () => void;
  isRunning: boolean;
  phase: TarotPhase;
  drawnCards: DrawnTarotCard[];
  revealedIndices: Set<number>;
  onToggleCardReveal: (index: number) => void;
  onDeckClick: () => void;
  isDeckShimmering: boolean;
  locale: TarotLocale;
}

const CARD_BACKS = [
  '/tarot/ui/card-back-past.webp',
  '/tarot/ui/card-back-present.webp',
  '/tarot/ui/card-back-future.webp'
];

const POSITION_LABELS: Record<TarotLocale, string[]> = {
  vi: ['QUÁ KHỨ', 'HIỆN TẠI', 'TƯƠNG LAI'],
  en: ['PAST', 'PRESENT', 'FUTURE']
};

const QUICK_PROMPTS: Record<TarotLocale, string[]> = {
  vi: [
    'Điều gì đang chờ đợi tôi sắp tới?',
    'Tình cảm & Mối quan hệ sắp tới',
    'Sự nghiệp & Bước tiến mới',
    'Thông điệp vũ trụ hôm nay'
  ],
  en: [
    'What does the universe hold for me?',
    'Love & Relationships ahead',
    'Career & Growth ahead',
    'Cosmic message for today'
  ]
};

export function MysticalTarotAltar({
  question,
  onQuestionChange,
  onSubmitQuestion,
  isRunning,
  phase,
  drawnCards,
  revealedIndices,
  onToggleCardReveal,
  onDeckClick,
  isDeckShimmering,
  locale
}: MysticalTarotAltarProps) {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const isInterpretingOrDrawing = isRunning || phase === 'drawing' || phase === 'revealing' || phase === 'interpreting';

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim().length >= 3 && !isRunning) {
      setIsEditingQuestion(false);
      onSubmitQuestion();
    }
  };

  return (
    <div className={styles.stageContainer} role="region" aria-label="Tarot Mystic Altar">
      {/* 1. Question Overlay */}
      <div className={styles.questionOverlay}>
        <div className={styles.moonGlyphs} aria-hidden="true">( ( 🌕 ) )</div>
        <div className={styles.questionKicker}>
          {locale === 'vi' ? 'CÂU HỎI CỦA BẠN:' : 'YOUR QUESTION:'}
        </div>

        {isEditingQuestion ? (
          <form className={styles.questionInputForm} onSubmit={handleFormSubmit}>
            <input
              type="text"
              className={styles.questionInput}
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder={locale === 'vi' ? 'Nhập điều bạn trăn trở...' : 'Ask what is on your mind...'}
              autoFocus
              onBlur={() => {
                if (question.trim().length >= 3) setIsEditingQuestion(false);
              }}
            />
            <button
              type="submit"
              className={styles.questionSaveBtn}
              title={locale === 'vi' ? 'Xác nhận câu hỏi' : 'Confirm question'}
            >
              <FiCheck />
            </button>
          </form>
        ) : (
          <div
            className={styles.questionTitleWrapper}
            onClick={() => !isRunning && setIsEditingQuestion(true)}
            style={{ cursor: isRunning ? 'default' : 'pointer' }}
            title={locale === 'vi' ? 'Nhấp để chỉnh sửa câu hỏi' : 'Click to edit question'}
          >
            <h1 className={styles.questionDisplay}>
              {question.trim() || (locale === 'vi' ? 'Điều gì đang chờ đợi tôi sắp tới?' : 'What does the universe hold for me?')}
            </h1>
            {!isRunning && (
              <span className={styles.questionEditBadge}>
                <FiEdit2 aria-hidden="true" />
                <span>{locale === 'vi' ? 'Đổi' : 'Edit'}</span>
              </span>
            )}
          </div>
        )}

        {/* Quick Prompt Chips */}
        {!isRunning && (
          <div className={styles.quickPromptChips}>
            {QUICK_PROMPTS[locale].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.quickPromptChip} ${question === prompt ? styles.quickPromptChipActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuestionChange(prompt);
                  setIsEditingQuestion(false);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className={styles.questionSubtitle}>
          {locale === 'vi' ? 'HÃY TIN VÀO VŨ TRỤ' : 'TRUST THE UNIVERSE'}
        </div>
      </div>

      {/* 2. Crystal Ball (Static Orb or Video on Reading) */}
      <div className={styles.crystalBallSlot}>
        {isInterpretingOrDrawing ? (
          <video
            className={`${styles.crystalBallMedia} ${styles.crystalBallActive}`}
            autoPlay
            loop
            muted
            playsInline
            aria-label="Magical crystal ball swirling galaxy"
          >
            <source src="/tarot/ui/crystal-ball-reading.webm" type="video/webm" />
            <source src="/tarot/ui/crystal-ball-reading.mp4" type="video/mp4" />
            <img src="/tarot/ui/crystal-ball-reading-anim.webp" alt="Crystal Ball Active" />
          </video>
        ) : (
          <img
            src="/tarot/ui/oracle-orb.webp"
            alt="Cosmic Crystal Ball"
            className={styles.crystalBallMedia}
            draggable={false}
          />
        )}
      </div>

      {/* 3. Magical Candle (Continuous Looping Video) */}
      <div className={styles.candleSlot}>
        <video
          className={styles.candleMedia}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        >
          <source src="/tarot/ui/candle.webm" type="video/webm" />
          <source src="/tarot/ui/candle.mp4" type="video/mp4" />
          <img src="/tarot/ui/candle-anim.webp" alt="Magical Candle" />
        </video>
      </div>

      {/* 4. Card Deck (Static Idle, Video on Shimmer / Click) */}
      <div
        className={styles.deckSlot}
        onClick={onDeckClick}
        title={locale === 'vi' ? 'Nhấp để xáo bài' : 'Click to shuffle deck'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onDeckClick();
        }}
      >
        {isDeckShimmering ? (
          <video
            className={styles.deckMedia}
            autoPlay
            loop
            muted
            playsInline
            aria-label="Deck shuffling with celestial sparks"
          >
            <source src="/tarot/ui/deck-shimmer.webm" type="video/webm" />
            <source src="/tarot/ui/deck-shimmer.mp4" type="video/mp4" />
            <img src="/tarot/ui/deck-shimmer-anim.webp" alt="Deck shimmering" />
          </video>
        ) : (
          <img
            src="/tarot/ui/deck-idle.webp"
            alt="Tarot Card Deck"
            className={styles.deckMedia}
            draggable={false}
          />
        )}
      </div>

      {/* 5. Three Tarot Cards on Zodiac Mat (Past, Present, Future) */}
      {[0, 1, 2].map((index) => {
        const drawn = drawnCards[index];
        const isRevealed = Boolean(drawn && revealedIndices.has(index));
        const slotClass = index === 0 ? styles.cardSlotPast : index === 1 ? styles.cardSlotPresent : styles.cardSlotFuture;
        const positionLabel = drawn?.position?.name?.[locale] || POSITION_LABELS[locale][index];

        return (
          <div
            key={index}
            className={`${styles.cardSlot} ${slotClass} ${isRevealed ? styles.cardRevealed : ''}`}
            onClick={() => onToggleCardReveal(index)}
            role="button"
            tabIndex={0}
            aria-label={`${positionLabel}: ${isRevealed && drawn ? drawn.card.name[locale] : (locale === 'vi' ? 'Chưa lật' : 'Hidden')}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onToggleCardReveal(index);
            }}
          >
            <div className={styles.cardFlipper}>
              {/* Back Face */}
              <div className={styles.cardFaceBack}>
                <img src={CARD_BACKS[index]} alt="Card Back" draggable={false} />
              </div>

              {/* Front Face (Revealed Tarot Card) */}
              <div className={`${styles.cardFaceFront} ${drawn?.isReversed ? styles.cardReversed : ''}`}>
                {drawn ? (
                  <img
                    src={drawn.card.image}
                    alt={drawn.card.name[locale]}
                    draggable={false}
                  />
                ) : (
                  <img src={CARD_BACKS[index]} alt="" draggable={false} />
                )}
              </div>
            </div>

            <div className={styles.cardSlotLabel}>
              {positionLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}
