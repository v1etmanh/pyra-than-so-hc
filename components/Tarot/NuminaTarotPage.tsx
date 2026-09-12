'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { useProfiles } from '@/hooks/useProfiles';
import { useProcessNumerology } from '@/hooks/useProcessNumerology';
import { useTarotReading } from '@/hooks/use-tarot-reading';
import type { ProfileContext } from '@/lib/ai/types';
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

function getSpreadSvgIcon(spreadId: string) {
  switch (spreadId) {
    case 'single':
      return (
        <svg viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="24" rx="2" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <circle cx="12" cy="14" r="4" stroke="currentColor" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
          <path d="M12 7v2M12 19v2M5 14h2M17 14h2" />
          <path d="M7 9l1.5 1.5M15.5 17.5L17 19M7 19l1.5-1.5M15.5 10.5L17 9" />
        </svg>
      );
    case 'three-card':
      return (
        <svg viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="11" height="19" rx="1.5" transform="rotate(-12 7 14)" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <rect x="19" y="5" width="11" height="19" rx="1.5" transform="rotate(12 25 14)" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <rect x="10.5" y="3" width="11" height="22" rx="1.5" stroke="currentColor" fill="rgba(224, 197, 142, 0.16)" />
          <circle cx="16" cy="14" r="2.5" stroke="currentColor" />
        </svg>
      );
    case 'two-options':
      return (
        <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="11" height="20" rx="1.5" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <rect x="15" y="4" width="11" height="20" rx="1.5" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <circle cx="7.5" cy="14" r="2" stroke="currentColor" />
          <circle cx="20.5" cy="14" r="2" stroke="currentColor" />
        </svg>
      );
    case 'relationship':
      return (
        <svg viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="24" rx="2" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <path d="M12 18.2s-5-3.2-5-6.2a3 3 0 0 1 5-2.2 3 3 0 0 1 5 2.2c0 3-5 6.2-5 6.2z" fill="currentColor" stroke="currentColor" />
        </svg>
      );
    case 'timeline':
      return (
        <svg viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="6" width="9" height="16" rx="1.2" transform="rotate(-16 5.5 14)" stroke="currentColor" fill="rgba(224, 197, 142, 0.06)" />
          <rect x="6" y="5" width="9" height="17" rx="1.2" transform="rotate(-8 10.5 13.5)" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <rect x="11.5" y="4" width="9" height="18" rx="1.2" stroke="currentColor" fill="rgba(224, 197, 142, 0.12)" />
          <rect x="17" y="5" width="9" height="17" rx="1.2" transform="rotate(8 21.5 13.5)" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <rect x="22" y="6" width="9" height="16" rx="1.2" transform="rotate(16 26.5 14)" stroke="currentColor" fill="rgba(224, 197, 142, 0.06)" />
        </svg>
      );
    case 'celtic-cross':
    default:
      return (
        <svg viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="24" rx="2" stroke="currentColor" fill="rgba(224, 197, 142, 0.08)" />
          <circle cx="12" cy="14" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M12 7v14M5 14h14" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}

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
    if (uniqueProfiles.length > 0) return uniqueProfiles[0];
    return { id: 'demo', name: 'Lê Viết Mạnh', birthDate: '2005-02-07' };
  }, [selectedProfileId, uniqueProfiles]);

  const indicators = useProcessNumerology(activeProfile?.name || 'Lê Viết Mạnh', activeProfile?.birthDate || '2005-02-07');
  const profileContext = useMemo<ProfileContext | undefined>(() => activeProfile ? ({
    name: activeProfile.name,
    birthDate: activeProfile.birthDate,
    lifePath: String(indicators[0]?.value ?? '7'),
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
    <main className="chani-site numina-tarot-sanctuary numina-tarot-page">
      <PyraHeader />

      <div className="tarot-sanctuary-stage">
        {/* Left Outer Sanctuary Flank */}
        <aside className="sanctuary-flank sanctuary-flank-left" aria-hidden="true">
          <img
            src="/tarot/UI_item/flank_left_authentic.png"
            alt="Celestial Crescent Moon & Flank"
            className="flank-bar-img"
          />
          <img
            src="/tarot/UI_item/cat_transparent_overlay.png"
            alt="Guardian Black Cat"
            className="flank-cat-foreground"
          />
        </aside>

        {/* Right Outer Sanctuary Flank */}
        <aside className="sanctuary-flank sanctuary-flank-right" aria-hidden="true">
          <img
            src="/tarot/UI_item/flank_right_authentic.png"
            alt="Celestial Arch Portal & Books Flank"
            className="flank-authentic-img"
          />
        </aside>

        {/* Top Mountain Banner */}
        <header className="tarot-sanctuary-banner">
          <div className="tarot-banner-brand">
            <div className="tarot-banner-emblem" aria-hidden="true">✦</div>
            <div className="tarot-banner-title">
              <p>NUMINA TAROT</p>
              <h1>{isVietnamese ? 'Một câu hỏi. Một khoảng lặng.' : 'One question. One quiet moment.'}</h1>
            </div>
          </div>

          <div className="tarot-banner-center-group">
            <div className="tarot-banner-center-mountain" aria-hidden="true">
              <img
                src="/tarot/UI_item/Celestial%20Paper-Cut%20Mountain%20Banner.png"
                alt=""
                className="tarot-banner-mountain-art"
              />
            </div>

            <div className="tarot-banner-quote">
              {isVietnamese ? (
                <>
                  Đôi khi, vũ trụ trả lời
                  <br />
                  bằng sự tĩnh lặng.
                </>
              ) : (
                <>
                  Sometimes the universe
                  <br />
                  whispers.
                </>
              )}
            </div>
          </div>

          <div className="tarot-banner-tools">
            <div className="tarot-history-box">
              <span>{isVietnamese ? 'LỊCH SỬ' : 'HISTORY'}</span>
              <select
                className="tarot-history-select"
                value={tarot.activeSessionId ?? ''}
                onChange={(event) => event.target.value && tarot.switchSession(event.target.value)}
                disabled={tarot.isRunning}
              >
                <option value="">—</option>
                {tarot.sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="tarot-btn-new-reading"
              onClick={tarot.newReading}
              disabled={tarot.isRunning && !current}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              {isVietnamese ? 'Trải bài mới' : 'New reading'}
            </button>
          </div>
        </header>

        {!current ? (
          <div className="tarot-stage-grid">
            {/* Step 01: Torn Parchment Question Board */}
            <section className="tarot-board-parchment">
              <div className="tarot-step-badge">
                <span className="tarot-step-number">01</span>
                <span className="tarot-step-text">{isVietnamese ? 'Đặt câu hỏi' : 'Ask a question'}</span>
              </div>

              <h2 className="tarot-question-headline">
                {isVietnamese ? 'Điều gì đang cần được nhìn rõ?' : 'What is asking to be seen clearly?'}
              </h2>
              <p className="tarot-question-subtitle">
                {isVietnamese
                  ? 'Câu hỏi mở thường mang lại chỉ dẫn hữu ích hơn câu hỏi chỉ cần "có" hoặc "không".'
                  : 'Open questions usually offer more useful guidance than a simple yes or no.'}
              </p>

              <div className="tarot-board-divider" aria-hidden="true">
                <span className="divider-star">✦</span>
                <span className="divider-line" />
              </div>

              <div className="tarot-profile-container">
                <span className="tarot-profile-caption">{isVietnamese ? 'HỒ SƠ THAM KHẢO' : 'OPTIONAL PROFILE'}</span>
                <div className="tarot-profile-selector-wrap">
                  <select
                    className="tarot-profile-dropdown"
                    value={activeProfile?.id ?? 'demo'}
                    onChange={(event) => setSelectedProfileId(event.target.value)}
                  >
                    {uniqueProfiles.length === 0 ? (
                      <option value="demo">Lê Viết Mạnh · 2005-02-07</option>
                    ) : (
                      uniqueProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} · {profile.birthDate}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="tarot-lifepath-badge">
                    <span>{isVietnamese ? 'Đường đời' : 'Life Path'}</span>
                    <strong>{profileContext?.lifePath || '7'}</strong>
                  </div>
                </div>
              </div>

              <form onSubmit={submitInitial} className="tarot-question-form">
                <div className="tarot-input-card">
                  <textarea
                    className="tarot-input-textarea"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={
                      isVietnamese
                        ? 'Ví dụ: Tôi nên nhìn nhận mối quan hệ này như thế nào?'
                        : 'For example: How should I understand this relationship?'
                    }
                    maxLength={4000}
                    rows={5}
                    autoFocus
                  />
                  <div className="tarot-input-bottom-bar">
                    <span className="tarot-char-counter">{question.trim().length}/4000</span>
                    <button
                      type="submit"
                      className="tarot-btn-draw-cards"
                      disabled={question.trim().length < 3 || tarot.isRunning || !tarot.isHydrated}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                      <span>
                        {isVietnamese
                          ? `Rút ${selectedSpread.positions.length} lá`
                          : `Draw ${selectedSpread.positions.length} ${selectedSpread.positions.length === 1 ? 'card' : 'cards'}`}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Overlapping Decorative Collage on Right Edge of Left Board */}
              <div className="tarot-parchment-accents" aria-hidden="true">
                <img
                  src="/tarot/UI_item/Mystical%20Sun%20Tarot%20Card%20Collage.png"
                  alt="Celestial Sun Collage"
                  className="sun-card-collage"
                />
                <div className="torn-note-sticker">
                  <img
                    src="/tarot/UI_item/Layered%20Torn%20Parchment%20Note.png"
                    alt=""
                    className="torn-note-bg"
                  />
                  <p className="torn-note-text">
                    {isVietnamese ? (
                      <>
                        <span>Những</span>
                        <span>câu hỏi chân thành</span>
                        <span>luôn tìm thấy</span>
                        <span>ánh sáng.</span>
                      </>
                    ) : (
                      <>
                        <span>Sincere questions</span>
                        <span>always find</span>
                        <span>the light.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Step 02: Deep Plum Spreads Board */}
            <aside className="tarot-board-plum">
              <div className="tarot-plum-header">
                <div className="tarot-step-badge">
                  <span className="tarot-step-number">02</span>
                  <span className="tarot-step-text">{isVietnamese ? 'Chọn trải bài' : 'Choose a spread'}</span>
                </div>
                <span className="tarot-plum-motto">
                  {isVietnamese ? 'CÙNG NHỮNG LÁ BÀI, BẠN LUÔN CÓ THÊM MỘT GÓC NHÌN ✦' : 'A DEEPER PERSPECTIVE ✦'}
                </span>
              </div>

              <div className="tarot-spreads-list">
                {tarotSpreads.map((spread) => {
                  const isSelected = spread.id === selectedSpreadId;
                  const spreadIconFile = `/tarot/UI_item/spread_${spread.id.replace('-', '_')}.png`;
                  return (
                    <button
                      type="button"
                      key={spread.id}
                      onClick={() => setSelectedSpreadId(spread.id)}
                      className={`tarot-spread-item ${isSelected ? 'is-active' : ''}`}
                      aria-pressed={isSelected}
                    >
                      <div className="spread-icon-box" aria-hidden="true">
                        <img
                          src={spreadIconFile}
                          alt=""
                          className="spread-icon-art"
                        />
                      </div>

                      <div className="spread-info-content">
                        <div className="spread-title-row">
                          <strong>{spread.name[locale]}</strong>
                          <span>
                            {spread.positions.length} {isVietnamese ? 'lá' : spread.positions.length === 1 ? 'card' : 'cards'}
                          </span>
                        </div>
                        <p>{spread.description[locale]}</p>
                      </div>

                      <div className="spread-indicator-mark" aria-hidden="true">
                        {isSelected ? '✓' : '›'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        ) : (
          <div className="tarot-reading-container">
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
          </div>
        )}
      </div>
    </main>
  );
}
