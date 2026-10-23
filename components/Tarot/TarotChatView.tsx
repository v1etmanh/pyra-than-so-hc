'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MAX_SESSION_QUESTIONS } from '@/lib/chat/session-limits';
import {
  getTarotCardRevealKey,
  getTarotRevealProgress,
  normalizeTarotMarkdown
} from '@/lib/tarot/presentation';
import type { DrawnTarotCard, TarotLocale, TarotSession } from '@/lib/tarot/types';
import { TarotCardView } from './TarotCard';

interface TarotChatViewProps {
  session: TarotSession;
  locale: TarotLocale;
  questionCount: number;
  remainingQuestions: number;
  canAskFollowUp: boolean;
  isLoading: boolean;
  error: string | null;
  onAskFollowUp: (question: string) => Promise<boolean>;
  onBackToReading: () => void;
  onNewReading: () => void;
  onCancel: () => void;
  onRevealLegacyCard: (followUpId: string, card: DrawnTarotCard) => void;
}

const FOLLOW_UP_PROMPTS = {
  vi: [
    'Thông điệp quan trọng nhất tôi nên ghi nhớ là gì?',
    'Điều gì trong trải bài này tôi đang dễ bỏ sót?',
    'Bước đi thực tế tiếp theo phù hợp nhất là gì?',
    'Tôi nên tránh phản ứng nào trong tình huống này?'
  ],
  en: [
    'What is the most important message to remember?',
    'What might I be overlooking in this reading?',
    'What is the most practical next step?',
    'What reaction should I avoid in this situation?'
  ]
};

export function TarotChatView({
  session,
  locale,
  questionCount,
  remainingQuestions,
  canAskFollowUp,
  isLoading,
  error,
  onAskFollowUp,
  onBackToReading,
  onNewReading,
  onCancel,
  onRevealLegacyCard
}: TarotChatViewProps) {
  const isVi = locale === 'vi';
  const [question, setQuestion] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [session.followUps, isLoading]);

  const sendQuestion = async (value: string) => {
    const cleanQuestion = value.trim();
    if (cleanQuestion.length < 3 || isLoading || !canAskFollowUp) return;
    const sent = await onAskFollowUp(cleanQuestion);
    if (sent) setQuestion('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendQuestion(question);
  };

  return (
    <section className="numina-chat-main" aria-label={isVi ? 'Trò chuyện về trải bài Tarot' : 'Tarot reading conversation'}>
      <header className="numina-chat-header">
        <div>
          <p className="numina-section-kicker">{isVi ? 'ĐỐI THOẠI CÙNG NUMELYRA' : 'CHAT WITH NUMELYRA'}</p>
          <h2>{session.title}</h2>
          <p>{session.spread?.name[locale] ?? (isVi ? 'Trải bài Tarot' : 'Tarot reading')}</p>
        </div>
        <div className="numina-chat-progress" aria-label={isVi ? `Lượt ${questionCount} trên ${MAX_SESSION_QUESTIONS}` : `Question ${questionCount} of ${MAX_SESSION_QUESTIONS}`}>
          <strong>{isVi ? `Lượt ${questionCount}/${MAX_SESSION_QUESTIONS}` : `${questionCount}/${MAX_SESSION_QUESTIONS}`}</strong>
          <span>{isVi ? `Còn ${remainingQuestions} câu hỏi` : `${remainingQuestions} questions left`}</span>
        </div>
      </header>

      <div className="numina-chat-actions">
        <button type="button" onClick={onBackToReading} disabled={isLoading}>
          {isVi ? 'Xem lại trải bài' : 'Review reading'}
        </button>
        <button type="button" onClick={onNewReading} disabled={isLoading}>
          {isVi ? 'Trải bài mới' : 'New reading'}
        </button>
      </div>

      <div className="numina-chat-card-context">
        <span>{isVi ? 'Bộ bài đang dùng' : 'Cards in context'}</span>
        <p>
          {session.drawnCards.map((drawn) => drawn.card.name[locale]).join(', ')}
        </p>
      </div>

      <div className="numina-chat-messages" aria-live="polite">
        <div className="numina-chat-bubble is-user">{session.question}</div>
        <article className="numina-chat-bubble is-assistant">
          <ReactMarkdown>{normalizeTarotMarkdown(session.interpretation)}</ReactMarkdown>
        </article>

        {session.followUps.map((item) => {
          const revealProgress = getTarotRevealProgress(
            item.additionalCards,
            item.revealedAdditionalCardKeys
          );
          const legacyCardsUnlocked = item.additionalCards.length === 0 || revealProgress.complete;

          return (
            <div className="numina-chat-turn" key={item.id}>
              <div className="numina-chat-bubble is-user">{item.question}</div>

              {item.additionalCards.length > 0 && (
                <div className="numina-chat-legacy-cards">
                  <div className="numina-card-grid is-supplementary">
                    {item.additionalCards.map((drawn, index) => {
                      const key = getTarotCardRevealKey(drawn);
                      return (
                        <TarotCardView
                          key={key}
                          drawn={drawn}
                          index={index}
                          locale={locale}
                          compact
                          isRevealed={(item.revealedAdditionalCardKeys ?? []).includes(key)}
                          onReveal={() => onRevealLegacyCard(item.id, drawn)}
                        />
                      );
                    })}
                  </div>
                  {!legacyCardsUnlocked && (
                    <p className="numina-chat-reveal-note">
                      {isVi
                        ? `Phiên cũ có lá bổ sung. Hãy lật ${revealProgress.remaining} lá còn lại để xem lời giải.`
                        : `This earlier session has clarifying cards. Reveal ${revealProgress.remaining} remaining cards to view the answer.`}
                    </p>
                  )}
                </div>
              )}

              {legacyCardsUnlocked && (
                <article id={`tarot-follow-up-reading-${item.id}`} className="numina-chat-bubble is-assistant">
                  {item.interpretation
                    ? <ReactMarkdown>{normalizeTarotMarkdown(item.interpretation)}</ReactMarkdown>
                    : <div className="tarot-text-skeleton" />}
                </article>
              )}
            </div>
          );
        })}

        {error && <p className="numina-tarot-error" role="alert">{error}</p>}
        <div ref={endRef} />
      </div>

      {session.followUps.length === 0 && canAskFollowUp && (
        <div className="numina-chat-prompts" aria-label={isVi ? 'Gợi ý câu hỏi' : 'Suggested questions'}>
          {FOLLOW_UP_PROMPTS[locale].map((prompt) => (
            <button key={prompt} type="button" disabled={isLoading} onClick={() => void sendQuestion(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      {!canAskFollowUp ? (
        <div className="numina-chat-complete" role="status">
          <strong>{isVi ? 'Phiên trò chuyện đã hoàn thành 10 câu hỏi.' : 'This conversation has completed 10 questions.'}</strong>
          <p>{isVi ? 'Bạn có thể xem lại trải bài hoặc bắt đầu một phiên mới.' : 'Review the reading or start a new session to continue.'}</p>
        </div>
      ) : (
        <form className="numina-chat-composer" onSubmit={handleSubmit}>
          <label htmlFor="tarot-chat-follow-up">{isVi ? 'Câu hỏi tiếp theo' : 'Next question'}</label>
          <div>
            <textarea
              id="tarot-chat-follow-up"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendQuestion(question);
                }
              }}
              placeholder={isVi ? 'Hỏi tiếp dựa trên chính trải bài này…' : 'Ask a follow-up based on this spread…'}
              maxLength={4000}
              rows={2}
              disabled={isLoading}
            />
            {isLoading && (
              <button type="button" className="is-stop" onClick={onCancel}>
                {isVi ? 'Dừng' : 'Stop'}
              </button>
            )}
            <button type="submit" disabled={question.trim().length < 3 || isLoading}>
              {isVi ? 'Gửi câu hỏi' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
