"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const nav = [
  ["map", "/"],
  ["account", "/account"],
  ["wallpaper", "/lucky-wallpaper"],
  ["chat", "/chat"],
  ["indicators", "/indicators"],
] as const;

function getActivePath(pathname: string) {
  const normalizedPath = pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "/";
  if (normalizedPath === "/") return "/";
  if (normalizedPath === "/account") return "/account";
  if (normalizedPath === "/lucky-wallpaper") return "/lucky-wallpaper";
  if (normalizedPath === "/chat") return "/chat";
  if (normalizedPath === "/indicators") return "/indicators";
  return "";
}

function withLocale(path: string, locale: string) {
  return locale === "vi" && path === "/" ? "/" : `/${locale}${path === "/" ? "" : path}`;
}

export default function PyraHeader() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("ChaniHeader");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activePath = getActivePath(pathname);
  const { user, profile, signOut, openAuthModal, isLoading } = useAuth();
  const localize = (path: string) => withLocale(path, locale);

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : t("myAccount"));
  const userEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push(localize("/"));
  };

  return (
    <>
      <header className="pyra-header">
        <Link className="pyra-wordmark" href={localize("/")} aria-label={t("home")}>
          <img
            src="/logo/436f1399-6171-4441-8654-6711279d206b.png"
            alt="NUMINA Logo"
            className="pyra-logo-img"
          />
          <span>NUMINA</span>
        </Link>
        <button
          className="pyra-menu-button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={t("toggleNavigation")}
        >
          {open ? t("close") : t("menu")}
        </button>
        <nav className={`pyra-nav ${open ? "is-open" : ""}`} aria-label={t("primaryNavigation")}>
          {nav.map(([labelKey, href]) => (
            <Link
              className={activePath === href ? "is-active" : ""}
              href={localize(href)}
              key={labelKey}
              onClick={() => setOpen(false)}
            >
              {t(`nav.${labelKey}`)}
            </Link>
          ))}
        </nav>
        <div className="pyra-header-tools">
          <LanguageSwitcher isHeader />
          <button className="pyra-theme-button" type="button" aria-label={t("themePreview")}>
            ☼
          </button>
          {user ? (
            <div className="pyra-profile-wrapper" ref={dropdownRef}>
              <button
                className={`pyra-profile-button ${dropdownOpen ? 'is-active' : ''}`}
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label={t("userMenu")}
              >
                <span className="pyra-profile-mark">{initial}</span>
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName.toUpperCase()}
                </span>
                <span className={`pyra-profile-chevron ${dropdownOpen ? 'is-open' : ''}`}>⌄</span>
              </button>

              {dropdownOpen && (
                <div className="pyra-profile-dropdown" role="menu">
                  <div className="pyra-dropdown-header">
                    <span className="pyra-dropdown-name">{displayName}</span>
                    {userEmail && <span className="pyra-dropdown-email">{userEmail}</span>}
                  </div>
                  <div className="pyra-dropdown-divider" />
                  <Link
                    href={localize("/account")}
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">👤</span>
                    <span>{t("profile")}</span>
                  </Link>
                  <Link
                    href={localize("/chat")}
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">✦</span>
                    <span>{t("aiChat")}</span>
                  </Link>
                  <Link
                    href={localize("/lucky-wallpaper")}
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">🖼️</span>
                    <span>{t("wallpaper")}</span>
                  </Link>
                  <Link
                    href={localize("/indicators")}
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">📊</span>
                    <span>{t("indicators")}</span>
                  </Link>
                  <div className="pyra-dropdown-divider" />
                  <button
                    type="button"
                    className="pyra-dropdown-item pyra-dropdown-logout"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">🚪</span>
                    <span>{t("signOut")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="pyra-profile-button"
              type="button"
              onClick={() => openAuthModal('signin')}
              aria-label={t("signIn")}
              disabled={isLoading}
              style={{ cursor: 'pointer' }}
            >
              <span className="pyra-profile-mark">✦</span>
              <span>{t("signIn")}</span>
              <span className="pyra-profile-chevron">↗</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
}
