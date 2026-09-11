'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiUser, FiChevronDown, FiCheck, FiPlus, FiStar } from 'react-icons/fi';
import type { NumerologyProfile } from '@/hooks/useProfiles';
import type { TarotLocale } from '@/lib/tarot/types';
import styles from './MysticalTarot.module.css';

interface TarotProfileSelectorProps {
  profiles: NumerologyProfile[];
  activeProfile: NumerologyProfile | null;
  onSelectProfile: (profile: NumerologyProfile) => void;
  locale: TarotLocale;
  lifePathNumber?: string | number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '✦';
}

function formatBirthDate(birthDate: string): string {
  const parts = birthDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return birthDate;
}

export function TarotProfileSelector({
  profiles,
  activeProfile,
  onSelectProfile,
  locale,
  lifePathNumber
}: TarotProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const hasProfiles = profiles.length > 0;

  return (
    <div className={styles.profileSelectorWrapper} ref={containerRef}>
      <button
        type="button"
        className={styles.profileBadgeBtn}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={locale === 'vi' ? 'Chọn hồ sơ Thần số học xem Tarot' : 'Select Numerology profile for Tarot reading'}
      >
        <span className={styles.profileAvatarIcon}>
          {activeProfile ? getInitials(activeProfile.name) : <FiUser />}
        </span>

        <span className={styles.profileNameText}>
          {activeProfile ? activeProfile.name : (locale === 'vi' ? 'Hồ sơ năng lượng' : 'Energy Profile')}
        </span>

        {lifePathNumber && (
          <span className={styles.lifePathBadge} title={locale === 'vi' ? `Số chủ đạo ${lifePathNumber}` : `Life Path ${lifePathNumber}`}>
            <FiStar className={styles.lifePathIcon} />
            <span>{locale === 'vi' ? `Số ${lifePathNumber}` : `LP ${lifePathNumber}`}</span>
          </span>
        )}

        <FiChevronDown className={`${styles.profileChevron} ${isOpen ? styles.profileChevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.profileDropdownMenu} role="menu">
          <div className={styles.dropdownHeader}>
            <span>{locale === 'vi' ? 'HỒ SƠ THẦN SỐ HỌC' : 'NUMEROLOGY PROFILES'}</span>
            <small>{locale === 'vi' ? 'Kết nối năng lượng xem bài' : 'Channel personal energy'}</small>
          </div>

          <div className={styles.profileItemsList}>
            {hasProfiles ? (
              profiles.map((p) => {
                const isSelected = activeProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.profileItem} ${isSelected ? styles.profileItemActive : ''}`}
                    onClick={() => {
                      onSelectProfile(p);
                      setIsOpen(false);
                    }}
                    role="menuitem"
                  >
                    <div className={styles.profileItemLeft}>
                      <span className={styles.profileItemInitials}>{getInitials(p.name)}</span>
                      <div className={styles.profileItemInfo}>
                        <span className={styles.profileItemName}>{p.name}</span>
                        <span className={styles.profileItemDate}>{formatBirthDate(p.birthDate)}</span>
                      </div>
                    </div>
                    {isSelected && <FiCheck className={styles.profileCheckIcon} />}
                  </button>
                );
              })
            ) : (
              <div className={styles.profileEmptyState}>
                <p>{locale === 'vi' ? 'Chưa có hồ sơ nào được lưu.' : 'No profiles saved yet.'}</p>
              </div>
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <Link
              href={`/${locale}/numerology`}
              className={styles.addProfileLink}
              onClick={() => setIsOpen(false)}
            >
              <FiPlus />
              <span>{locale === 'vi' ? 'Quản lý & Thêm hồ sơ' : 'Manage & Add Profiles'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
