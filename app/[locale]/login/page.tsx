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
  const { user, signInWithPassword, isLoading: isAuthLoading } = useAuth();

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
          <p style={{ marginBottom: '24px' }}>Nhập thông tin tài khoản PYRA của bạn.</p>

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
              fontFamily: 'Georgia, serif',
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
