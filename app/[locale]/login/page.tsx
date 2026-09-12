'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { InnerFooter } from '@/components/sites/chani-com-6d20749d/shared/ChaniInnerPages';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithPassword, signInWithGoogle, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isAuthLoading) {
      router.push('/account');
    }
  }, [user, isAuthLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        setErrorMessage('Email hoặc mật khẩu không chính xác.');
      } else {
        setErrorMessage(error.message || 'Đăng nhập không thành công.');
      }
    } else {
      router.push('/account');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message || 'Đăng nhập bằng Google không thành công.');
    }
  };

  return (
    <main className="chani-site batch-site">
      <PyraHeader />
      <section
        className="numerology-profile-hero"
        style={{
          minHeight: '80vh',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          alignItems: 'center',
          gap: '60px',
          padding: '80px 10vw',
        }}
      >
        <div className="numerology-profile-intro">
          <p className="batch-kicker" style={{ color: '#bda476' }}>
            ✦ SACRED NUMEROLOGY / SECURE AUTHENTICATION
          </p>
          <h1 style={{ fontSize: 'clamp(46px, 6vw, 84px)', marginBottom: '20px' }}>
            Welcome back to your map.
          </h1>
          <p style={{ maxWidth: '480px', lineHeight: 1.7 }}>
            Đăng nhập để tiếp tục hành trình khám phá 24 chỉ số thần số học, mở khóa các phân tích chuyên sâu và đồng bộ dữ liệu của bạn trên mọi thiết bị.
          </p>
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              border: '1px solid rgba(189,164,118,0.35)',
              background: 'rgba(255,255,255,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '24px', color: '#bda476' }}>☼</span>
            <span style={{ fontSize: '12px', fontFamily: '"Courier New", monospace' }}>
              Dữ liệu của bạn được bảo mật an toàn với chuẩn mã hóa Supabase.
            </span>
          </div>
        </div>

        <div
          className="numerology-profile-form"
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <p className="batch-kicker" style={{ margin: '0 0 10px', color: '#9b7746' }}>
            SIGN IN
          </p>
          <h2 style={{ fontSize: '38px', marginBottom: '12px' }}>ĐĂNG NHẬP</h2>
          <p style={{ marginBottom: '24px' }}>Nhập thông tin tài khoản NUMELYRA của bạn.</p>

          {errorMessage && (
            <div
              style={{
                background: '#fae8e8',
                border: '1px solid #e0a3a3',
                color: '#942b2b',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '12px',
                fontFamily: '"Courier New", monospace',
              }}
              role="alert"
            >
              ✦ {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: '#ffffff',
              border: '1px solid rgba(42,42,43,.25)',
              borderRadius: '0',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              font: 'bold 12px "Courier New", monospace',
              letterSpacing: '0.05em',
              color: '#2a2a2b',
              boxShadow: '2px 2px 0 rgba(42,42,43,.1)',
              marginBottom: '16px',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            TIẾP TỤC VỚI GOOGLE
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', opacity: 0.5 }}>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2b' }} />
            <span style={{ fontSize: '11px', fontFamily: '"Courier New", monospace' }}>HOẶC QUA EMAIL</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2b' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              EMAIL
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </label>

            <label style={{ position: 'relative', marginTop: '16px' }}>
              MẬT KHẨU
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  bottom: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#777',
                  fontFamily: '"Courier New", monospace',
                }}
              >
                {showPassword ? 'ẨN' : 'HIỆN'}
              </button>
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                fontSize: '11px',
                fontFamily: '"Courier New", monospace',
              }}
            >
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Ghi nhớ
              </label>
              <Link href="/account" style={{ color: '#886a92', textDecoration: 'underline' }}>
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '24px' }}
            >
              {isLoading ? 'ĐANG XÁC THỰC…' : 'ĐĂNG NHẬP ↗'}
            </button>
          </form>

          <p
            style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '13px',
              fontFamily: 'var(--chani-serif)',
              fontStyle: 'italic',
              color: '#777',
            }}
          >
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              style={{ fontStyle: 'normal', color: '#886a92', textDecoration: 'underline', marginLeft: '4px' }}
            >
              Đăng ký tài khoản mới ↗
            </Link>
          </p>
        </div>
      </section>
      <InnerFooter />
    </main>
  );
}
