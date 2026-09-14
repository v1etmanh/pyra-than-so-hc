'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { useProfiles } from '@/hooks/useProfiles';
import { useProcessNumerology } from '@/hooks/useProcessNumerology';
import { useTarotReading } from '@/hooks/use-tarot-reading';
import { calculateLifePath } from '@/lib/numerology/calculator-engine';
import type { ProfileContext } from '@/lib/ai/types';
import {
  getTarotCardRevealKey,
  getTarotRevealProgress,
  normalizeTarotMarkdown,
} from '@/lib/tarot/presentation';
import { tarotSpreads } from '@/lib/tarot/spreads';
import type { DrawnTarotCard, TarotLocale } from '@/lib/tarot/types';
import { TarotCardView } from './TarotCard';
import { useBilling } from '@/hooks/useBilling';

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
  const router = useRouter();
  const locale = (useLocale() === 'en' ? 'en' : 'vi') as TarotLocale;
  const isVietnamese = locale === 'vi';
  const tarot = useTarotReading(locale);
  const { isPro, openUpgradeModal } = useBilling();
  const { profiles, isLoaded, saveProfile } = useProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedSpreadId, setSelectedSpreadId] = useState('three-card');
  const [question, setQuestion] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [showProfileRequiredModal, setShowProfileRequiredModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [inputProfileName, setInputProfileName] = useState('');
  const [inputProfileBirthDate, setInputProfileBirthDate] = useState('');
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const readingEndRef = useRef<HTMLDivElement>(null);
  const interpretationRef = useRef<HTMLElement>(null);
  const pendingMainRevealScrollRef = useRef<string | null>(null);
  const pendingFollowUpRevealScrollRef = useRef<{ sessionId: string; followUpId: string } | null>(null);

  const previewLifePath = useMemo(() => {
    if (!inputProfileBirthDate) return null;
    const parts = inputProfileBirthDate.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;
    try {
      const res = calculateLifePath(d, m, y);
      return res.value;
    } catch {
      return null;
    }
  }, [inputProfileBirthDate]);

  const handleOpenAddProfile = () => {
    setInputProfileName('');
    setInputProfileBirthDate('');
    setProfileFormError(null);
    setShowAddProfileModal(true);
  };

  const handleSaveAndApplyProfile = (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmed = inputProfileName.trim();
    if (!trimmed) {
      setProfileFormError(isVietnamese ? 'Vui lòng nhập họ và tên.' : 'Please enter full name.');
      return;
    }
    if (!inputProfileBirthDate) {
      setProfileFormError(isVietnamese ? 'Vui lòng chọn ngày tháng năm sinh.' : 'Please select date of birth.');
      return;
    }

    setIsSavingProfile(true);
    const result = saveProfile(trimmed, inputProfileBirthDate);
    setIsSavingProfile(false);

    if (result.isMaxReached) {
      setProfileFormError(
        isVietnamese
          ? 'Đã đạt giới hạn tối đa 10 hồ sơ. Bạn có thể chọn hồ sơ có sẵn ở bên dưới.'
          : 'Maximum 10 profiles reached. You can pick an existing profile below.'
      );
      return;
    }

    if (result.success && result.profile) {
      setSelectedProfileId(result.profile.id);
      setInputProfileName('');
      setInputProfileBirthDate('');
      setProfileFormError(null);
      setShowAddProfileModal(false);
      setShowProfileRequiredModal(false);
    }
  };

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
    if (selectedProfileId) return uniqueProfiles.find((profile) => profile.id === selectedProfileId) || uniqueProfiles[0] || null;
    if (uniqueProfiles.length > 0) return uniqueProfiles[0];
    return null;
  }, [selectedProfileId, uniqueProfiles]);

  const indicators = useProcessNumerology(activeProfile?.name || '', activeProfile?.birthDate || '');
  const profileContext = useMemo<ProfileContext | undefined>(() => activeProfile ? ({
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
  const mainRevealProgress = getTarotRevealProgress(
    current?.drawnCards ?? [],
    current?.revealedCardKeys
  );

  useEffect(() => {
    const pendingSessionId = pendingMainRevealScrollRef.current;
    if (!current || pendingSessionId !== current.id) return;
    if (!mainRevealProgress.complete || !current.interpretation) return;

    pendingMainRevealScrollRef.current = null;
    window.requestAnimationFrame(() => {
      interpretationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [current, mainRevealProgress.complete]);

  useEffect(() => {
    const pending = pendingFollowUpRevealScrollRef.current;
    if (!current || !pending || pending.sessionId !== current.id) return;
    const followUp = current.followUps.find((item) => item.id === pending.followUpId);
    if (!followUp || !followUp.interpretation) return;
    const progress = getTarotRevealProgress(
      followUp.additionalCards,
      followUp.revealedAdditionalCardKeys
    );
    if (!progress.complete) return;

    pendingFollowUpRevealScrollRef.current = null;
    window.requestAnimationFrame(() => {
      document.getElementById(`tarot-follow-up-reading-${followUp.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [current]);

  useEffect(() => {
    if (pendingMainRevealScrollRef.current && pendingMainRevealScrollRef.current !== current?.id) {
      pendingMainRevealScrollRef.current = null;
    }
    if (pendingFollowUpRevealScrollRef.current?.sessionId !== current?.id) {
      pendingFollowUpRevealScrollRef.current = null;
    }
  }, [current?.id]);

  if (!isLoaded) {
    return (
      <div className="tarot-papercut-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#8c7667', fontFamily: 'var(--chani-serif), Georgia, serif' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>✦</div>
          <p style={{ fontSize: '15px', letterSpacing: '0.05em' }}>
            {isVietnamese ? 'Đang chuẩn bị không gian Tarot…' : 'Preparing the Tarot sanctuary…'}
          </p>
        </div>
      </div>
    );
  }

  const selectedSpread = tarotSpreads.find((spread) => spread.id === selectedSpreadId) ?? tarotSpreads[1];

  const revealInitialCard = (card: DrawnTarotCard) => {
    if (!current) return;
    const key = getTarotCardRevealKey(card);
    if ((current.revealedCardKeys ?? []).includes(key)) return;
    if (mainRevealProgress.revealed + 1 >= mainRevealProgress.total) {
      pendingMainRevealScrollRef.current = current.id;
    }
    tarot.revealCard(card);
  };

  const revealFollowUpCard = (
    followUpId: string,
    card: DrawnTarotCard
  ) => {
    if (!current) return;
    const followUp = current.followUps.find((item) => item.id === followUpId);
    if (!followUp) return;
    const key = getTarotCardRevealKey(card);
    if ((followUp.revealedAdditionalCardKeys ?? []).includes(key)) return;
    const progress = getTarotRevealProgress(
      followUp.additionalCards,
      followUp.revealedAdditionalCardKeys
    );
    if (progress.revealed + 1 >= progress.total) {
      pendingFollowUpRevealScrollRef.current = { sessionId: current.id, followUpId };
    }
    tarot.revealFollowUpCard(followUpId, card);
  };

  const submitInitial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uniqueProfiles.length === 0) {
      handleOpenAddProfile();
      return;
    }
    const value = question.trim();
    if (value.length < 3 || tarot.isRunning) return;
    setQuestion('');
    await tarot.startReading(value, selectedSpreadId, profileContext);
    window.setTimeout(() => readingEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 250);
  };

  const submitFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uniqueProfiles.length === 0) {
      handleOpenAddProfile();
      return;
    }
    const value = followUp.trim();
    if (value.length < 3 || tarot.isRunning) return;
    setFollowUp('');
    await tarot.askFollowUp(value);
  };

  const statusLabel = (() => {
    if (current?.drawnCards.length && !mainRevealProgress.complete) {
      if (tarot.phase === 'ready' && current.interpretation) {
        return isVietnamese
          ? `Lời giải đã sẵn sàng · Lật ${mainRevealProgress.remaining} lá còn lại`
          : `Your reading is ready · Reveal ${mainRevealProgress.remaining} remaining ${mainRevealProgress.remaining === 1 ? 'card' : 'cards'}`;
      }
      return isVietnamese
        ? `Chạm vào từng lá để lật · Đã lật ${mainRevealProgress.revealed}/${mainRevealProgress.total} · NUMELYRA đang luận giải…`
        : `Tap each card to reveal · ${mainRevealProgress.revealed}/${mainRevealProgress.total} revealed · NUMELYRA is interpreting…`;
    }
    if (current?.drawnCards.length && mainRevealProgress.complete && tarot.isRunning && !current.interpretation) {
      return isVietnamese
        ? 'Đã lật đủ bài · NUMELYRA đang hoàn thiện lời giải…'
        : 'All cards revealed · NUMELYRA is finishing your reading…';
    }
    if (tarot.phase === 'drawing') return isVietnamese ? 'Đang xào và rút bài…' : 'Shuffling and drawing…';
    if (tarot.phase === 'revealing') return isVietnamese ? 'Những lá bài đang mở ra…' : 'The cards are revealing…';
    if (tarot.phase === 'deciding') return isVietnamese ? 'Đang xem có cần rút thêm lá…' : 'Considering another draw…';
    if (tarot.phase === 'interpreting') return isVietnamese ? 'NUMELYRA đang luận giải…' : 'NUMELYRA is interpreting…';
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
              <p>NUMELYRA TAROT</p>
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
                <div className="tarot-profile-header-row">
                  <span className="tarot-profile-caption">
                    {isVietnamese ? 'HỒ SƠ THAM KHẢO & NĂNG LƯỢNG' : 'ENERGY PROFILE & VIBRATION'}
                  </span>
                  <button
                    type="button"
                    className="tarot-btn-add-profile"
                    onClick={handleOpenAddProfile}
                    title={isVietnamese ? 'Thêm hồ sơ mới hoặc đổi thông tin' : 'Add new or change profile'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{isVietnamese ? 'Thêm / Đổi hồ sơ' : 'Add / Switch'}</span>
                  </button>
                </div>
                <div className="tarot-profile-selector-wrap">
                  <select
                    className="tarot-profile-dropdown"
                    value={activeProfile?.id ?? (uniqueProfiles.length === 0 ? 'create_profile' : 'demo')}
                    onChange={(event) => {
                      if (event.target.value === 'create_profile') {
                        handleOpenAddProfile();
                        return;
                      }
                      setSelectedProfileId(event.target.value);
                    }}
                  >
                    {uniqueProfiles.length === 0 ? (
                      <option value="create_profile">
                        {isVietnamese ? '✦ Bấm để nhập tên & ngày sinh…' : '✦ Click to enter name & birth date…'}
                      </option>
                    ) : (
                      <>
                        {uniqueProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name} · {profile.birthDate}
                          </option>
                        ))}
                        <option value="create_profile">
                          {isVietnamese ? '✦ + Thêm hồ sơ mới (Nhập tên & ngày sinh)...' : '✦ + Add new profile...'}
                        </option>
                      </>
                    )}
                  </select>
                  <div className="tarot-lifepath-badge">
                    <span>{isVietnamese ? 'Đường đời' : 'Life Path'}</span>
                    <strong>{profileContext?.lifePath || '—'}</strong>
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
                          {spread.id === 'celtic-cross' && <span className="tarot-pro-badge">PRO</span>}
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
                    {current.drawnCards.map((drawn, index) => {
                      const key = getTarotCardRevealKey(drawn);
                      return (
                        <TarotCardView
                          key={key}
                          drawn={drawn}
                          index={index}
                          locale={locale}
                          isRevealed={(current.revealedCardKeys ?? []).includes(key)}
                          onReveal={() => revealInitialCard(drawn)}
                        />
                      );
                    })}
                  </div>
                )}

                {statusLabel && (
                  <div className="numina-tarot-status" role="status" aria-live="polite">
                    <i /> {statusLabel}
                    {tarot.isRunning && <button type="button" onClick={tarot.cancel}>{isVietnamese ? 'Dừng' : 'Stop'}</button>}
                  </div>
                )}

                {mainRevealProgress.complete && (current.interpretation || tarot.isRunning) && (
                  <article ref={interpretationRef} className="numina-interpretation is-reveal-unlocked">
                    <p className="numina-section-kicker">{isVietnamese ? 'LỜI GIẢI TỪ NUMELYRA' : 'NUMELYRA’S READING'}</p>
                    {current.interpretation ? <ReactMarkdown>{normalizeTarotMarkdown(current.interpretation)}</ReactMarkdown> : <div className="tarot-text-skeleton" />}
                  </article>
                )}

                {current.followUps.map((item) => {
                  const revealProgress = getTarotRevealProgress(
                    item.additionalCards,
                    item.revealedAdditionalCardKeys
                  );
                  const isUnlocked = item.additionalCards.length === 0
                    ? item.decision !== 'draw'
                    : revealProgress.complete;
                  const followUpReadingReady = item.status === 'done' && Boolean(item.interpretation);

                  return (
                    <section className="numina-follow-up" key={item.id}>
                      <div className="numina-follow-up-question">
                        <span>{isVietnamese ? 'Hỏi tiếp' : 'Follow-up'}</span>
                        <p>{item.question}</p>
                      </div>
                      {item.additionalCards.length > 0 && (
                        <>
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
                                  onReveal={() => revealFollowUpCard(item.id, drawn)}
                                />
                              );
                            })}
                          </div>
                          {!isUnlocked && (
                            <div className="numina-reveal-progress" role="status" aria-live="polite">
                              <i />
                              {followUpReadingReady
                                ? (isVietnamese
                                  ? `Lời giải đã sẵn sàng · Lật ${revealProgress.remaining} lá còn lại`
                                  : `Your follow-up is ready · Reveal ${revealProgress.remaining} remaining ${revealProgress.remaining === 1 ? 'card' : 'cards'}`)
                                : (isVietnamese
                                  ? `Chạm để lật bài bổ sung · Đã lật ${revealProgress.revealed}/${revealProgress.total}`
                                  : `Tap to reveal the clarifying cards · ${revealProgress.revealed}/${revealProgress.total} revealed`)}
                            </div>
                          )}
                        </>
                      )}
                      {isUnlocked && item.reason && <p className="tarot-decision-note">{item.reason}</p>}
                      {isUnlocked && (item.interpretation || item.status === 'running') && (
                        <article
                          id={`tarot-follow-up-reading-${item.id}`}
                          className="numina-interpretation is-follow-up is-reveal-unlocked"
                        >
                          {item.interpretation ? <ReactMarkdown>{normalizeTarotMarkdown(item.interpretation)}</ReactMarkdown> : <div className="tarot-text-skeleton" />}
                        </article>
                      )}
                      {item.error && <p className="numina-tarot-error">{item.error}</p>}
                    </section>
                  );
                })}

                {tarot.error && (
                  <div className="numina-tarot-error-box" role="alert">
                    <p className="numina-tarot-error">{tarot.error}</p>
                    {!isPro && (
                      <button
                        type="button"
                        className="tarot-error-upgrade-btn"
                        onClick={() => openUpgradeModal({ feature: 'tarot' })}
                      >
                        ✦ {isVietnamese ? 'Nâng cấp NUMELYRA Pro (Không giới hạn)' : 'Upgrade to NUMELYRA Pro (Unlimited)'}
                      </button>
                    )}
                  </div>
                )}
                <div ref={readingEndRef} />

                {mainRevealProgress.complete && current.interpretation && (
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

                {!isPro && (
                  <div className="tarot-aside-pro-card">
                    <div className="aside-pro-header">
                      <span>✦ NUMELYRA PRO</span>
                      <small>79K/30D</small>
                    </div>
                    <p>
                      {isVietnamese
                        ? '100 lượt vấn an AI chuyên sâu mỗi ngày, không giới hạn câu hỏi tiếp theo và mở khóa toàn bộ trải bài thần thánh.'
                        : '100 deep AI readings daily, unlimited follow-ups, and all celestial spreads unlocked.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => openUpgradeModal({ feature: 'tarot' })}
                    >
                      {isVietnamese ? 'Nâng cấp ngay' : 'Upgrade Now'}
                    </button>
                  </div>
                )}

                {mainRevealProgress.complete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uniqueProfiles.length === 0) {
                        setShowProfileRequiredModal(true);
                        return;
                      }
                      tarot.regenerate();
                    }}
                    disabled={tarot.isRunning || !current.interpretation}
                  >
                    {isVietnamese ? 'Luận giải lại, giữ nguyên bài' : 'Regenerate with the same cards'}
                  </button>
                )}
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

      {/* Sacred Add / Switch Profile Modal */}
      {showAddProfileModal && (
        <div
          className="sacred-pro-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddProfileModal(false);
              setProfileFormError(null);
            }
          }}
        >
          <div
            className="sacred-pro-modal tarot-profile-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tarot-add-profile-title"
          >
            <button
              type="button"
              className="sacred-pro-close"
              onClick={() => {
                setShowAddProfileModal(false);
                setProfileFormError(null);
              }}
              aria-label={isVietnamese ? 'Đóng' : 'Close'}
            >
              ✕
            </button>

            <div className="sacred-pro-header" style={{ marginBottom: '16px', textAlign: 'center' }}>
              <div className="sacred-pro-emblem" aria-hidden="true" style={{ margin: '0 auto 10px' }}>✦</div>
              <span className="sacred-pro-kicker">
                {isVietnamese ? 'ĐỒNG BỘ TẦN SỐ THẦN SỐ HỌC' : 'ALIGN NUMEROLOGY FREQUENCY'}
              </span>
              <h2 id="tarot-add-profile-title" style={{ fontSize: '22px', margin: '6px 0 8px', fontFamily: 'var(--chani-serif, Georgia, serif)', color: '#fcf6ec' }}>
                {isVietnamese ? 'Thêm Hồ Sơ Năng Lượng' : 'Add Energy Profile'}
              </h2>
              <p className="sacred-pro-desc" style={{ fontSize: '13.5px', lineHeight: '1.55', color: '#dfcfd6', margin: '0 auto', maxWidth: '420px' }}>
                {isVietnamese
                  ? 'Nhập họ tên và ngày sinh để NUMELYRA tính số Đường Đời & các chỉ số rung động cá nhân, giúp giải nghĩa bài Tarot sâu sắc và chuẩn xác nhất.'
                  : 'Enter your name and date of birth so NUMELYRA can compute your Life Path & personal numerology vibration for the most resonant Tarot reading.'}
              </p>
            </div>

            <form onSubmit={handleSaveAndApplyProfile} className="tarot-modal-profile-form">
              <div className="tarot-form-group">
                <label htmlFor="tarot-profile-name-input" className="tarot-form-label">
                  {isVietnamese ? 'Họ và tên đầy đủ' : 'Full Name'}
                </label>
                <input
                  id="tarot-profile-name-input"
                  type="text"
                  className="tarot-form-input"
                  placeholder={isVietnamese ? 'Ví dụ: Nguyễn Văn An' : 'e.g. Eleanor Vance'}
                  value={inputProfileName}
                  onChange={(e) => {
                    setInputProfileName(e.target.value);
                    if (profileFormError) setProfileFormError(null);
                  }}
                  autoFocus
                  maxLength={60}
                />
              </div>

              <div className="tarot-form-group">
                <label htmlFor="tarot-profile-birth-input" className="tarot-form-label">
                  {isVietnamese ? 'Ngày tháng năm sinh (Dương lịch)' : 'Date of Birth (Solar Calendar)'}
                </label>
                <input
                  id="tarot-profile-birth-input"
                  type="date"
                  className="tarot-form-input tarot-form-date"
                  value={inputProfileBirthDate}
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setInputProfileBirthDate(e.target.value);
                    if (profileFormError) setProfileFormError(null);
                  }}
                />
              </div>

              {/* Instant Life Path Preview */}
              {previewLifePath !== null && (
                <div className="tarot-lifepath-preview-chip">
                  <span className="preview-star">✦</span>
                  <span className="preview-label">{isVietnamese ? 'Số Đường Đời tính được:' : 'Calculated Life Path:'}</span>
                  <span className="preview-number">{previewLifePath}</span>
                </div>
              )}

              {profileFormError && (
                <div className="tarot-form-error-msg" role="alert">
                  ⚠ {profileFormError}
                </div>
              )}

              <div className="tarot-modal-actions">
                <button
                  type="submit"
                  className="tarot-modal-btn-submit"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <span>{isVietnamese ? 'Đang lưu…' : 'Saving…'}</span>
                  ) : (
                    <span>✦ {isVietnamese ? 'Lưu & Sử dụng hồ sơ này' : 'Save & Use Profile'}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="tarot-modal-btn-cancel"
                  onClick={() => {
                    setShowAddProfileModal(false);
                    setProfileFormError(null);
                  }}
                >
                  {isVietnamese ? 'Huỷ' : 'Cancel'}
                </button>
              </div>
            </form>

            {/* Quick Switch from Saved Profiles */}
            {uniqueProfiles.length > 0 && (
              <div className="tarot-modal-existing-wrap">
                <div className="tarot-modal-existing-header">
                  <span className="tarot-modal-existing-title">
                    {isVietnamese ? 'Hoặc chọn nhanh hồ sơ đã lưu:' : 'Or quickly switch to a saved profile:'}
                  </span>
                </div>
                <div className="tarot-modal-profiles-pills">
                  {uniqueProfiles.map((p) => {
                    const isCurrent = p.id === activeProfile?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`tarot-profile-pill ${isCurrent ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedProfileId(p.id);
                          setShowAddProfileModal(false);
                          setShowProfileRequiredModal(false);
                        }}
                        title={isVietnamese ? `Chọn hồ sơ ${p.name}` : `Select ${p.name}`}
                      >
                        <span className="pill-name">{p.name}</span>
                        <span className="pill-dot">·</span>
                        <span className="pill-date">{p.birthDate}</span>
                        {isCurrent && <span className="pill-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Required Modal */}
      {showProfileRequiredModal && (
        <div
          className="sacred-pro-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileRequiredModal(false);
          }}
        >
          <div
            className="sacred-pro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tarot-profile-modal-title"
            style={{ width: 'min(460px, calc(100vw - 32px))', maxWidth: '460px', textAlign: 'center' }}
          >
            <button
              type="button"
              className="sacred-pro-close"
              onClick={() => setShowProfileRequiredModal(false)}
              aria-label={isVietnamese ? 'Đóng' : 'Close'}
            >
              ✕
            </button>
            <div className="sacred-pro-header" style={{ marginBottom: '16px' }}>
              <div className="sacred-pro-emblem" aria-hidden="true" style={{ margin: '0 auto 12px' }}>✦</div>
              <span className="sacred-pro-kicker">
                {isVietnamese ? 'KẾT NỐI TẦN SỐ NĂNG LƯỢNG' : 'ENERGY MAP REQUIRED'}
              </span>
              <h2 id="tarot-profile-modal-title" style={{ fontSize: '22px', margin: '8px 0 10px', fontFamily: 'var(--chani-serif, Georgia, serif)' }}>
                {isVietnamese ? 'Cần Bản Đồ Thần Số Học' : 'Numerology Map Required'}
              </h2>
              <p className="sacred-pro-desc" style={{ fontSize: '14px', lineHeight: '1.6', color: '#dfcfd6', margin: '0 auto' }}>
                {isVietnamese
                  ? 'Để NUMELYRA xào bài và luận giải Tarot chuẩn xác theo năng lượng riêng của bạn, hãy tạo bản đồ Thần số học trước nhé. Chỉ mất 30 giây!'
                  : 'To enable NUMELYRA to draw cards and interpret Tarot tailored to your unique vibration, please create your Numerology Map first. It only takes 30 seconds!'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setShowProfileRequiredModal(false);
                  handleOpenAddProfile();
                }}
                style={{
                  background: 'linear-gradient(135deg, #e6c88f 0%, #bd995c 100%)',
                  color: '#251520',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 14px rgba(230, 200, 143, 0.35)',
                }}
              >
                {isVietnamese ? 'Nhập tên & ngày sinh ngay ✦' : 'Enter Name & Birth Date ✦'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileRequiredModal(false);
                  router.push(locale === 'vi' ? '/indicators' : '/en/indicators');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(224, 197, 142, 0.3)',
                  color: '#e6d5de',
                  padding: '12px 20px',
                  borderRadius: '20px',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {isVietnamese ? 'Xem bản đồ chi tiết →' : 'Full Map Page →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
