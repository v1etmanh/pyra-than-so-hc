'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { useProfiles } from '@/hooks/useProfiles';
import { useProcessNumerology } from '@/hooks/useProcessNumerology';
import { useTarotReading } from '@/hooks/use-tarot-reading';
import type { ChatProfileContext } from '@/hooks/chat-types';
import { tarotSpreads } from '@/lib/tarot/spreads';
import type { TarotLocale } from '@/lib/tarot/types';
import { TarotCardView } from './TarotCard';

const quickPrompts = {
  vi: [
    'Tôi cần hiểu điều gì về năng lượng của mình hôm nay?',
    'Mối quan hệ này đang dạy tôi điều gì?',
    'Tôi nên cân nhắc điều gì trước quyết định sắp tới?',
    'Bước đi thực tế nào sẽ giúp công việc của tôi tiến triển?'
  ],
  en: [
    'What should I understand about my energy today?',
    'What is this relationship teaching me?',
    'What should I consider before my next decision?',
    'What practical step could move my work forward?'
  ]
};

export function NuminaTarotPage() {
  const locale = (useLocale() === 'en' ? 'en' : 'vi') as TarotLocale;
  const isVietnamese = locale === 'vi';
  const tarot = useTarotReading(locale);
  const { profiles } = useProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedSpreadId, setSelectedSpreadId] = useState('three-card');
  const [question, setQuestion] = useState('');
  const [followUp, setFollowUp] = useState('');
  const readingEndRef = useRef<HTMLDivElement>(null);

  const uniqueProfiles = useMemo(() => {
    const seen = new Set<string>();
    return profiles.filter((profile) => {
      const key = `${profile.name.trim().toLowerCase()}_${profile.birthDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profiles]);

  const activeProfile = useMemo(() => {
    if (selectedProfileId) return uniqueProfiles.find((profile) => profile.id === selectedProfileId);
    return uniqueProfiles[0];
  }, [selectedProfileId, uniqueProfiles]);
  const indicators = useProcessNumerology(activeProfile?.name || '', activeProfile?.birthDate || '');
  const profileContext = useMemo<ChatProfileContext | undefined>(() => activeProfile ? ({
    name: activeProfile.name,
    birthDate: activeProfile.birthDate,
    lifePath: String(indicators[0]?.value ?? ''),
    indicators: indicators.map((indicator) => ({
      key: indicator.key,
      name: indicator.name,
      value: String(indicator.value ?? '')
    }))
  }) : undefined, [activeProfile, indicators]);

  const current = tarot.currentSession;
  const selectedSpread = tarotSpreads.find((spread) => spread.id === selectedSpreadId) ?? tarotSpreads[1];

  const submitInitial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = question.trim();
    if (value.length < 3 || tarot.isRunning) return;
    setQuestion('');
    await tarot.startReading(value, selectedSpreadId, profileContext);
    window.setTimeout(() => readingEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 250);
  };

  const submitFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = followUp.trim();
    if (value.length < 3 || tarot.isRunning) return;
    setFollowUp('');
    await tarot.askFollowUp(value);
  };

  const statusLabel = (() => {
    if (tarot.phase === 'drawing') return isVietnamese ? 'Đang xào và rút bài…' : 'Shuffling and drawing…';
    if (tarot.phase === 'revealing') return isVietnamese ? 'Những lá bài đang mở ra…' : 'The cards are revealing…';
    if (tarot.phase === 'deciding') return isVietnamese ? 'Đang xem có cần rút thêm lá…' : 'Considering another draw…';
    if (tarot.phase === 'interpreting') return isVietnamese ? 'Numina đang luận giải…' : 'Numina is interpreting…';
    return '';
  })();

  return (
    <main className="chani-site numina-tarot-page">
      <PyraHeader />
      <section className="numina-tarot-shell">
        <header className="numina-tarot-header">
          <div className="numina-tarot-brand">
            <span aria-hidden="true">✦</span>
            <div>
              <p>NUMINA TAROT</p>
              <h1>{isVietnamese ? 'Một câu hỏi. Một khoảng lặng.' : 'One question. One quiet moment.'}</h1>
            </div>
          </div>
          <div className="numina-tarot-tools">
            {tarot.sessions.length > 0 && (
              <label>
                <span>{isVietnamese ? 'Lịch sử' : 'History'}</span>
                <select
                  value={tarot.activeSessionId ?? ''}
                  onChange={(event) => event.target.value && tarot.switchSession(event.target.value)}
                  disabled={tarot.isRunning}
                >
                  {!tarot.activeSessionId && <option value="">—</option>}
                  {tarot.sessions.map((session) => (
                    <option key={session.id} value={session.id}>{session.title}</option>
                  ))}
                </select>
              </label>
            )}
            <button type="button" className="tarot-quiet-button" onClick={tarot.newReading} disabled={tarot.isRunning && !current}>
              {isVietnamese ? 'Trải bài mới' : 'New reading'}
            </button>
          </div>
        </header>

        {!current ? (
          <div className="numina-tarot-start">
            <section className="numina-tarot-question-panel">
              <div className="tarot-step-label"><span>01</span>{isVietnamese ? 'Đặt câu hỏi' : 'Ask a question'}</div>
              <h2>{isVietnamese ? 'Điều gì đang cần được nhìn rõ?' : 'What is asking to be seen clearly?'}</h2>
              <p className="tarot-help-copy">
                {isVietnamese
                  ? 'Câu hỏi mở thường mang lại chỉ dẫn hữu ích hơn câu hỏi chỉ cần “có” hoặc “không”.'
                  : 'Open questions usually offer more useful guidance than a simple yes or no.'}
              </p>

              <div className="tarot-profile-row">
                <label>
                  <span>{isVietnamese ? 'Hồ sơ tham khảo' : 'Optional profile'}</span>
                  <select
                    value={activeProfile?.id ?? ''}
                    onChange={(event) => setSelectedProfileId(event.target.value)}
                  >
                    {uniqueProfiles.length === 0 && <option value="">{isVietnamese ? 'Không dùng hồ sơ' : 'No profile'}</option>}
                    {uniqueProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.name} · {profile.birthDate}</option>
                    ))}
                  </select>
                </label>
                {profileContext?.lifePath && (
                  <span className="tarot-life-path">{isVietnamese ? 'Đường đời' : 'Life Path'} <b>{profileContext.lifePath}</b></span>
                )}
              </div>

              <form onSubmit={submitInitial} className="numina-tarot-question-form">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={isVietnamese ? 'Ví dụ: Tôi nên nhìn nhận mối quan hệ này như thế nào?' : 'For example: How should I understand this relationship?'}
                  maxLength={4000}
                  rows={5}
                  autoFocus
                />
                <div>
                  <span>{question.trim().length}/4000</span>
                  <button type="submit" disabled={question.trim().length < 3 || tarot.isRunning || !tarot.isHydrated}>
                    {isVietnamese ? `Rút ${selectedSpread.positions.length} lá` : `Draw ${selectedSpread.positions.length} ${selectedSpread.positions.length === 1 ? 'card' : 'cards'}`}
                  </button>
                </div>
              </form>

              <div className="tarot-prompt-chips" aria-label={isVietnamese ? 'Câu hỏi gợi ý' : 'Suggested questions'}>
                {quickPrompts[locale].map((prompt) => (
                  <button type="button" key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>
                ))}
              </div>
              <p className="tarot-disclaimer">
                {isVietnamese
                  ? 'Tarot là công cụ tự soi chiếu, không thay thế tư vấn y tế, pháp lý hoặc tài chính.'
                  : 'Tarot is a reflective tool and does not replace medical, legal or financial advice.'}
              </p>
            </section>

            <aside className="numina-tarot-spreads">
              <div className="tarot-step-label"><span>02</span>{isVietnamese ? 'Chọn trải bài' : 'Choose a spread'}</div>
              <div className="numina-spread-grid">
                {tarotSpreads.map((spread) => (
                  <button
                    type="button"
                    key={spread.id}
                    onClick={() => setSelectedSpreadId(spread.id)}
                    className={spread.id === selectedSpreadId ? 'is-selected' : ''}
                    aria-pressed={spread.id === selectedSpreadId}
                  >
                    <span className="spread-card-stack" aria-hidden="true">
                      {Array.from({ length: Math.min(3, spread.positions.length) }, (_, index) => <i key={index} />)}
                    </span>
                    <span className="spread-copy">
                      <strong>{spread.name[locale]}</strong>
                      <small>{spread.positions.length} {isVietnamese ? 'lá' : spread.positions.length === 1 ? 'card' : 'cards'}</small>
                      <p>{spread.description[locale]}</p>
                    </span>
                    <b aria-hidden="true">{spread.id === selectedSpreadId ? '✓' : '›'}</b>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div className="numina-reading-layout">
            <section className="numina-reading-main">
              <div className="numina-reading-question">
                <p>{isVietnamese ? 'CÂU HỎI CỦA BẠN' : 'YOUR QUESTION'}</p>
                <h2>{current.question}</h2>
                <span>{current.spread?.name[locale] ?? selectedSpread.name[locale]}</span>
              </div>

              {current.drawnCards.length > 0 && (
                <div className={`numina-card-grid ${current.spreadId === 'celtic-cross' ? 'is-celtic' : ''}`}>
                  {current.drawnCards.map((drawn, index) => (
                    <TarotCardView key={`${drawn.position.id}-${drawn.card.id}`} drawn={drawn} index={index} locale={locale} />
                  ))}
                </div>
              )}

              {statusLabel && (
                <div className="numina-tarot-status" role="status" aria-live="polite">
                  <i /> {statusLabel}
                  {tarot.isRunning && <button type="button" onClick={tarot.cancel}>{isVietnamese ? 'Dừng' : 'Stop'}</button>}
                </div>
              )}

              {(current.interpretation || tarot.phase === 'interpreting') && (
                <article className="numina-interpretation">
                  <p className="numina-section-kicker">{isVietnamese ? 'LỜI GIẢI TỪ NUMINA' : 'NUMINA’S READING'}</p>
                  {current.interpretation ? <ReactMarkdown>{current.interpretation}</ReactMarkdown> : <div className="tarot-text-skeleton" />}
                </article>
              )}

              {current.followUps.map((item) => (
                <section className="numina-follow-up" key={item.id}>
                  <div className="numina-follow-up-question">
                    <span>{isVietnamese ? 'Hỏi tiếp' : 'Follow-up'}</span>
                    <p>{item.question}</p>
                  </div>
                  {item.additionalCards.length > 0 && (
                    <div className="numina-card-grid is-supplementary">
                      {item.additionalCards.map((drawn, index) => (
                        <TarotCardView key={`${drawn.position.id}-${drawn.card.id}`} drawn={drawn} index={index} locale={locale} compact />
                      ))}
                    </div>
                  )}
                  {item.reason && <p className="tarot-decision-note">{item.reason}</p>}
                  <article className="numina-interpretation is-follow-up">
                    {item.interpretation ? <ReactMarkdown>{item.interpretation}</ReactMarkdown> : item.status === 'running' ? <div className="tarot-text-skeleton" /> : null}
                    {item.error && <p className="numina-tarot-error">{item.error}</p>}
                  </article>
                </section>
              ))}

              {tarot.error && <p className="numina-tarot-error" role="alert">{tarot.error}</p>}
              <div ref={readingEndRef} />

              {current.interpretation && (
                <form className="numina-follow-up-form" onSubmit={submitFollowUp}>
                  <label htmlFor="tarot-follow-up">{isVietnamese ? 'Bạn muốn hỏi thêm điều gì?' : 'What would you like to ask next?'}</label>
                  <div>
                    <input
                      id="tarot-follow-up"
                      value={followUp}
                      onChange={(event) => setFollowUp(event.target.value)}
                      placeholder={isVietnamese ? 'Hỏi tiếp về trải bài này…' : 'Ask about this reading…'}
                      maxLength={4000}
                      disabled={tarot.isRunning}
                    />
                    <button type="submit" disabled={followUp.trim().length < 3 || tarot.isRunning}>➤</button>
                  </div>
                </form>
              )}
            </section>

            <aside className="numina-reading-aside">
              <p className="numina-section-kicker">{isVietnamese ? 'PHIÊN XEM BÀI' : 'READING'}</p>
              <dl>
                <div><dt>{isVietnamese ? 'Trải bài' : 'Spread'}</dt><dd>{current.spread?.name[locale] ?? '—'}</dd></div>
                <div><dt>{isVietnamese ? 'Số lá' : 'Cards'}</dt><dd>{current.drawnCards.length}</dd></div>
                <div><dt>{isVietnamese ? 'Hồ sơ' : 'Profile'}</dt><dd>{current.profile?.name ?? (isVietnamese ? 'Không dùng' : 'None')}</dd></div>
                <div><dt>{isVietnamese ? 'Hỏi tiếp' : 'Follow-ups'}</dt><dd>{current.followUps.length}</dd></div>
              </dl>
              <button type="button" onClick={tarot.regenerate} disabled={tarot.isRunning || !current.interpretation}>
                {isVietnamese ? 'Luận giải lại, giữ nguyên bài' : 'Regenerate with the same cards'}
              </button>
              <button type="button" onClick={tarot.newReading} disabled={tarot.isRunning}>
                {isVietnamese ? 'Bắt đầu trải bài mới' : 'Start a new reading'}
              </button>
              <button
                type="button"
                className="is-danger"
                disabled={tarot.isRunning}
                onClick={() => {
                  if (window.confirm(isVietnamese ? 'Xóa phiên xem bài này?' : 'Delete this reading?')) tarot.deleteSession(current.id);
                }}
              >
                {isVietnamese ? 'Xóa phiên này' : 'Delete this reading'}
              </button>
              <p className="tarot-local-note">{isVietnamese ? 'Lịch sử được lưu trên thiết bị này, tối đa 50 phiên.' : 'History stays on this device, up to 50 readings.'}</p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
