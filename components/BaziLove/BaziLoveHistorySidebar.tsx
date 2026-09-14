'use client';

import type { BaziLoveLocale, BaziLoveSession } from '@/lib/bazi-love/types';
import styles from './BaziLove.module.css';

interface BaziLoveHistorySidebarProps {
  sessions: BaziLoveSession[];
  activeSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNewReading: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearHistory: () => void;
  locale: BaziLoveLocale;
}

export function BaziLoveHistorySidebar({
  sessions,
  activeSessionId,
  isOpen,
  onClose,
  onNewReading,
  onSelectSession,
  onDeleteSession,
  onClearHistory,
  locale
}: BaziLoveHistorySidebarProps) {
  const isVi = locale === 'vi';

  const handleSelect = (id: string) => {
    onSelectSession(id);
    onClose();
  };

  const handleNew = () => {
    onNewReading();
    onClose();
  };

  const handleClear = () => {
    const confirmMsg = isVi
      ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử ghép đôi trên thiết bị này không?'
      : 'Are you sure you want to delete all saved Bazi reading sessions on this device?';
    if (window.confirm(confirmMsg)) {
      onClearHistory();
      onClose();
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarTitle}>
          <span>📖</span>
          <span>{isVi ? 'Lịch Sử Ghép Đôi' : 'Saved Sessions'}</span>
        </div>
        <button type="button" className={styles.newButton} onClick={handleNew}>
          <span>+</span>
          <span>{isVi ? 'Ghép Mới' : 'New'}</span>
        </button>
      </div>

      <div className={styles.sessionList}>
        {sessions.length === 0 && (
          <div className={styles.emptySessions}>
            <p>{isVi ? 'Chưa có phiên ghép đôi nào được lưu.' : 'No saved sessions yet.'}</p>
            <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--bazi-muted)' }}>
              {isVi
                ? 'Lịch sử được lưu trữ bảo mật cục bộ trên thiết bị của bạn.'
                : 'Sessions are stored securely on your local device.'}
            </p>
          </div>
        )}

        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const dateStr = new Date(session.updatedAt || session.createdAt).toLocaleDateString(
            isVi ? 'vi-VN' : 'en-US',
            { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
          );

          return (
            <div
              key={session.id}
              className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ''}`}
              onClick={() => handleSelect(session.id)}
            >
              <div className={styles.sessionInfo}>
                <div className={styles.sessionItemTitle}>{session.title}</div>
                <div className={styles.sessionItemDate}>{dateStr}</div>
              </div>
              <button
                type="button"
                className={styles.sessionDeleteBtn}
                title={isVi ? 'Xóa phiên này' : 'Delete session'}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {sessions.length > 0 && (
        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.clearAllBtn} onClick={handleClear}>
            {isVi ? 'Xóa toàn bộ lịch sử' : 'Clear all history'}
          </button>
        </div>
      )}
    </aside>
  );
}
