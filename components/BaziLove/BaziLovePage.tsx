'use client';

import { useLocale } from 'next-intl';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { useBaziLove } from '@/hooks/use-bazi-love';
import type { BaziLoveLocale } from '@/lib/bazi-love/types';
import { BaziLoveForm } from './BaziLoveForm';
import { BaziLoveResultView } from './BaziLoveResultView';
import { BaziLoveChat } from './BaziLoveChat';
import styles from './BaziLove.module.css';

export function BaziLovePage() {
  const locale = (useLocale() === 'en' ? 'en' : 'vi') as BaziLoveLocale;
  const isVi = locale === 'vi';

  const {
    sessions,
    currentSession,
    activeSessionId,
    statusMessage,
    error,
    isRunning,
    startReading,
    askFollowUp,
    regenerate,
    newReading,
    switchSession,
    deleteSession,
    clearHistory
  } = useBaziLove(locale);

  const handleClearHistory = () => {
    const confirmMsg = isVi
      ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử ghép đôi trên thiết bị này không?'
      : 'Are you sure you want to delete all saved Bazi reading sessions on this device?';
    if (window.confirm(confirmMsg)) {
      clearHistory();
    }
  };

  return (
    <div className={styles.sanctuaryContainer}>
      {/* Universal NUMELYRA Header */}
      <PyraHeader />

      <div className={styles.sanctuaryStage}>
        {/* Left Outer Sanctuary Flank */}
        <aside className={`${styles.sanctuaryFlank} ${styles.sanctuaryFlankLeft}`} aria-hidden="true">
          <img
            src="/bazi-love/bazi_flank_left.jpg"
            alt="Bazi Celestial Moon & Peach Blossom Flank"
            className={styles.flankImg}
          />
        </aside>

        {/* Right Outer Sanctuary Flank */}
        <aside className={`${styles.sanctuaryFlank} ${styles.sanctuaryFlankRight}`} aria-hidden="true">
          <img
            src="/bazi-love/bazi_flank_left.jpg"
            alt="Bazi Celestial Harmony Flank"
            className={`${styles.flankImg} ${styles.flankImgRight}`}
          />
        </aside>

        {/* Top Sanctuary Banner (Matching Tarot Sanctuary Banner) */}
        <header className={styles.sanctuaryBanner}>
          <div className={styles.bannerBrand}>
            <div className={styles.bannerEmblem} aria-hidden="true">☯</div>
            <div className={styles.bannerTitle}>
              <p>NUMELYRA BÁT TỰ</p>
              <h1>{isVi ? 'Ghép đôi Bát Tự & Tình duyên' : 'Bazi Synastry & Love Dynamics'}</h1>
            </div>
          </div>

          <div className={styles.bannerCenterGroup}>
            <div className={styles.bannerCenterMountain} aria-hidden="true">
              <img
                src="/bazi-love/bazi_banner_love.jpg"
                alt="Eastern Love Celestial Harmony"
                className={styles.bannerMountainArt}
              />
            </div>

            <div className={styles.bannerQuote}>
              {isVi ? (
                <>
                  Vạn duyên hội ngộ,
                  <br />
                  âm dương hòa điệu.
                </>
              ) : (
                <>
                  Destinies intertwine,
                  <br />
                  guided by celestial harmony.
                </>
              )}
            </div>
          </div>

          <div className={styles.bannerTools}>
            <button
              type="button"
              className={styles.bannerBtnNew}
              onClick={newReading}
              disabled={isRunning}
            >
              <span>✦</span>
              <span>{isVi ? 'Ghép đôi mới' : 'New Synastry'}</span>
            </button>
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              background: 'var(--bazi-negative-bg)',
              border: '1px solid var(--bazi-negative-border)',
              color: 'var(--bazi-negative-text)',
              padding: '12px 18px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              marginBottom: '20px'
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Status Processing Indicator */}
        {isRunning && (
          <div
            style={{
              background: '#fdfbf7',
              border: '1px solid rgba(220, 195, 145, 0.45)',
              padding: '12px 18px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              color: '#5c4639',
              marginBottom: '20px'
            }}
          >
            <span className={styles.spinner} />
            <span>{statusMessage || (isVi ? 'Đang giải mã và phân tích Bát Tự…' : 'Processing charts…')}</span>
          </div>
        )}

        {/* ==================================================================
            MAIN CONTENT & SIDEBAR
            ================================================================== */}
        <div className={styles.readingLayout}>
          <div className={styles.mainColumn}>
            {/* When NO active session, show the 2-Person Input Form */}
            {!currentSession && (
              <BaziLoveForm
                locale={locale}
                onSubmit={startReading}
                isLoading={isRunning}
              />
            )}

            {/* When an active session exists, show Result View & Chat */}
            {currentSession && (
              <>
                {currentSession.compatibility && (
                  <BaziLoveResultView
                    compatibility={currentSession.compatibility}
                    people={currentSession.people}
                    locale={locale}
                  />
                )}

                <BaziLoveChat
                  interpretation={currentSession.interpretation}
                  messages={currentSession.messages}
                  locale={locale}
                  onAskFollowUp={askFollowUp}
                  onRegenerate={regenerate}
                  isLoading={isRunning}
                />
              </>
            )}
          </div>

          {/* Right Aside: Deep Plum Velvet Card (Matching Image 2) */}
          <aside className={styles.plumAside}>
            <p className={styles.asideKicker}>{isVi ? 'PHIÊN GHÉP ĐÔI' : 'SYNASTRY SESSION'}</p>

            {currentSession ? (
              <dl className={styles.asideMetaList}>
                <div className={styles.asideMetaItem}>
                  <dt>{isVi ? 'Người A' : 'Person A'}</dt>
                  <dd>{currentSession.people[0].name} ({currentSession.people[0].calculationSex === 'male' ? (isVi ? 'Nam' : 'M') : (isVi ? 'Nữ' : 'F')})</dd>
                </div>
                <div className={styles.asideMetaItem}>
                  <dt>{isVi ? 'Người B' : 'Person B'}</dt>
                  <dd>{currentSession.people[1].name} ({currentSession.people[1].calculationSex === 'male' ? (isVi ? 'Nam' : 'M') : (isVi ? 'Nữ' : 'F')})</dd>
                </div>
                <div className={styles.asideMetaItem}>
                  <dt>{isVi ? 'Giờ sinh' : 'Birth Times'}</dt>
                  <dd>
                    {!currentSession.people[0].birthTime || !currentSession.people[1].birthTime
                      ? (isVi ? 'Quét 12 giờ' : '12-Hour Scan')
                      : (isVi ? 'Đầy đủ' : 'Exact')}
                  </dd>
                </div>
                <div className={styles.asideMetaItem}>
                  <dt>{isVi ? 'Hỏi tiếp' : 'Follow-ups'}</dt>
                  <dd>{currentSession.messages.filter((m) => m.role === 'user').length}</dd>
                </div>
              </dl>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'rgba(246, 232, 204, 0.7)', margin: '4px 0 10px' }}>
                {isVi ? 'Nhập thông tin hai người bên cạnh để bắt đầu giải mã tương hợp Bát Tự.' : 'Enter details for two people on the left to begin synastry reading.'}
              </p>
            )}

            {/* Pro Card */}
            <div className={styles.asideProCard}>
              <div className={styles.asideProHeader}>
                <span className={styles.asideProBadge}>✦ NUMELYRA PRO</span>
                <span className={styles.asideProPrice}>79K/30D</span>
              </div>
              <p className={styles.asideProDesc}>
                {isVi
                  ? 'Mở khóa phân tích đại vận sâu, không giới hạn câu hỏi tiếp theo và lời khuyên dung hòa chuyên biệt.'
                  : 'Unlock deep luck cycle insights, unlimited follow-ups, and specialized harmony guidance.'}
              </p>
              <button type="button" className={styles.asideProBtn}>
                {isVi ? 'NÂNG CẤP NGAY' : 'UPGRADE NOW'}
              </button>
            </div>

            {/* Actions for current session */}
            {currentSession && (
              <div className={styles.asideActions}>
                <button
                  type="button"
                  className={styles.asideBtn}
                  onClick={regenerate}
                  disabled={isRunning}
                >
                  ↻ {isVi ? 'Luận giải lại, giữ nguyên lá số' : 'Re-interpret reading'}
                </button>
                <button
                  type="button"
                  className={styles.asideBtn}
                  onClick={newReading}
                  disabled={isRunning}
                >
                  ✦ {isVi ? 'Bắt đầu ghép đôi mới' : 'Start new synastry'}
                </button>
                <button
                  type="button"
                  className={`${styles.asideBtn} ${styles.asideBtnDanger}`}
                  onClick={() => deleteSession(currentSession.id)}
                  disabled={isRunning}
                >
                  ✕ {isVi ? 'Xóa phiên này' : 'Delete this session'}
                </button>
              </div>
            )}

            {/* Saved Sessions in Aside */}
            <div className={styles.asideHistorySection}>
              <div className={styles.asideHistoryTitle}>
                <span>{isVi ? 'LỊCH SỬ GHÉP ĐÔI' : 'SAVED SESSIONS'}</span>
                <span>({sessions.length})</span>
              </div>

              {sessions.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'rgba(246, 232, 204, 0.45)', margin: '4px 0' }}>
                  {isVi ? 'Chưa có phiên lưu trữ nào.' : 'No saved sessions yet.'}
                </p>
              ) : (
                <div className={styles.asideHistoryList}>
                  {sessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const dateStr = new Date(session.updatedAt || session.createdAt).toLocaleDateString(
                      isVi ? 'vi-VN' : 'en-US',
                      { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    );

                    return (
                      <div
                        key={session.id}
                        className={`${styles.asideHistoryItem} ${isActive ? styles.asideHistoryItemActive : ''}`}
                        onClick={() => switchSession(session.id)}
                      >
                        <div>
                          <div className={styles.asideHistoryText}>{session.title}</div>
                          <div className={styles.asideHistoryDate}>{dateStr}</div>
                        </div>
                        <button
                          type="button"
                          className={styles.asideHistoryDelete}
                          title={isVi ? 'Xóa' : 'Delete'}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 150, 150, 0.7)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    padding: '4px 0',
                    textAlign: 'center',
                    marginTop: '4px'
                  }}
                >
                  {isVi ? 'Xóa toàn bộ lịch sử' : 'Clear all history'}
                </button>
              )}
            </div>

            <p className={styles.asideLocalNote}>
              {isVi
                ? 'Lịch sử được lưu trên thiết bị này, tối đa 50 phiên.'
                : 'History is saved on this device, up to 50 sessions.'}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
