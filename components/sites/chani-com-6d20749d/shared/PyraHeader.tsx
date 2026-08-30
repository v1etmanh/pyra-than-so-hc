"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const activePath = getActivePath(pathname);
  const { user, profile, openAuthModal, isLoading } = useAuth();

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'MY ACCOUNT');
  const initial = displayName.charAt(0).toUpperCase();

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
            <Link
              className="pyra-profile-button"
              href="/account"
              aria-label="Open my account"
            >
              <span className="pyra-profile-mark">{initial}</span>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName.toUpperCase()}
              </span>
              <span className="pyra-profile-chevron">⌄</span>
            </Link>
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
