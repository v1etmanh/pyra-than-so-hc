"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  ["MAP", "/"],
  ["MY ACCOUNT", "/account"],
  ["WALLPAPER STUDIO", "/lucky-wallpaper"],
  ["NUMINA AI", "/chat"],
  ["24 INDICATORS", "/indicators"],
];

function getActivePath(pathname: string) {
  if (pathname === "/") return "/";
  if (pathname === "/account") return "/account";
  if (pathname === "/lucky-wallpaper") return "/lucky-wallpaper";
  if (pathname === "/chat") return "/chat";
  if (pathname === "/indicators") return "/indicators";
  return "";
}

export default function PyraHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activePath = getActivePath(pathname);
  const { user, profile, signOut, openAuthModal, isLoading } = useAuth();

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'MY ACCOUNT');
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
    router.push("/");
  };

  return (
    <>
      <header className="pyra-header">
        <Link className="pyra-wordmark" href="/" aria-label="NUMINA home">
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
          aria-label="Toggle navigation"
        >
          {open ? "CLOSE" : "MENU"}
        </button>
        <nav className={`pyra-nav ${open ? "is-open" : ""}`} aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link
              className={activePath === href ? "is-active" : ""}
              href={href}
              key={label}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="pyra-header-tools">
          <button className="pyra-theme-button" type="button" aria-label="Theme preview">
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
                aria-label="User menu"
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
                    href="/account"
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">👤</span>
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    href="/chat"
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">✦</span>
                    <span>NUMINA AI Chat</span>
                  </Link>
                  <Link
                    href="/lucky-wallpaper"
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">🖼️</span>
                    <span>Wallpaper Studio</span>
                  </Link>
                  <Link
                    href="/indicators"
                    className="pyra-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">📊</span>
                    <span>24 Chỉ số</span>
                  </Link>
                  <div className="pyra-dropdown-divider" />
                  <button
                    type="button"
                    className="pyra-dropdown-item pyra-dropdown-logout"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <span className="pyra-dropdown-icon">🚪</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="pyra-profile-button"
              type="button"
              onClick={() => openAuthModal('signin')}
              aria-label="Sign in"
              disabled={isLoading}
              style={{ cursor: 'pointer' }}
            >
              <span className="pyra-profile-mark">✦</span>
              <span>ĐĂNG NHẬP</span>
              <span className="pyra-profile-chevron">↗</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
}
