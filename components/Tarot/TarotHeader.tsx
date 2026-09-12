'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  FiBookOpen,
  FiChevronDown,
  FiGrid,
  FiHome,
  FiImage,
  FiLogOut,
  FiMenu,
  FiUser,
  FiX
} from 'react-icons/fi';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/hooks/useAuth';
import styles from './TarotDashboard.module.css';

interface TarotHeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
}

function withLocale(path: string, locale: string) {
  return locale === 'vi' && path === '/' ? '/' : `/${locale}${path === '/' ? '' : path}`;
}

export function TarotHeader({ historyCount, onOpenHistory }: TarotHeaderProps) {
  const locale = useLocale();
  const t = useTranslations('Tarot');
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut, openAuthModal, isLoading } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || t('header.account');
  const initial = displayName.charAt(0).toUpperCase();
  const localize = (path: string) => withLocale(path, locale);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [accountOpen]);

  const handleSignOut = async () => {
    setAccountOpen(false);
    await signOut();
    router.push(localize('/'));
  };

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href={localize('/')} aria-label={t('header.home')}>
        <span className={styles.brandStar} aria-hidden="true">✦</span>
        <span className={styles.brandText}>NUMELYRA TAROT</span>
        <span className={styles.brandLine}>{t('tagline')}</span>
      </Link>

      <button
        className={styles.menuButton}
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
      >
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>

      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label={t('header.primaryNavigation')}>
        <Link href={localize('/')}><FiHome aria-hidden="true" />{t('header.home')}</Link>
        <Link className={styles.activeNav} href={localize('/chat')}><FiBookOpen aria-hidden="true" />{t('header.tarot')}</Link>
        <button type="button" onClick={() => { onOpenHistory(); setMenuOpen(false); }}>
          <FiBookOpen aria-hidden="true" />{t('header.history')}
          {historyCount > 0 && <span className={styles.navCount}>{historyCount}</span>}
        </button>
        <Link href={localize('/indicators')}><FiGrid aria-hidden="true" />{t('header.numerology')}</Link>
        <Link href={localize('/lucky-wallpaper')}><FiImage aria-hidden="true" />{t('header.wallpaper')}</Link>
      </nav>

      <div className={styles.headerTools}>
        <div className={styles.language}><LanguageSwitcher isHeader /></div>
        {user ? (
          <div className={styles.accountWrap} ref={accountRef}>
            <button
              className={styles.accountButton}
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <span className={styles.avatar}>{initial}</span>
              <span className={styles.accountName}>{displayName}</span>
              <FiChevronDown aria-hidden="true" />
            </button>
            {accountOpen && (
              <div className={styles.accountMenu} role="menu">
                <Link href={localize('/account')} role="menuitem"><FiUser />{t('header.account')}</Link>
                <button type="button" role="menuitem" onClick={handleSignOut}><FiLogOut />{t('header.signOut')}</button>
              </div>
            )}
          </div>
        ) : (
          <button
            className={styles.accountButton}
            type="button"
            onClick={() => openAuthModal('signin')}
            disabled={isLoading}
          >
            <span className={styles.avatar}><FiUser aria-hidden="true" /></span>
            <span className={styles.accountName}>{t('header.signIn')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
