'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { InnerFooter } from '@/components/sites/chani-com-6d20749d/shared/ChaniInnerPages';

export default function RegisterPage() {
  const router = useRouter();
  const { user, signUp, isLoading: isAuthLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isAuthLoading) {
      router.push('/account');
    }
  }, [user, isAuthLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);
    const { error, session } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setErrorMessage('Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.');
      } else {
        setErrorMessage(error.message || 'Đăng ký không thành công.');
      }
    } else {
      if (session) {
        router.push('/account');
      } else {
        setSuccessMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
      }
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
            ✦ SACRED NUMEROLOGY / GET STARTED
          </p>
          <h1 style={{ fontSize: 'clamp(46px, 6vw, 84px)', marginBottom: '20px' }}>
            Begin your personal map.
          </h1>
          <p style={{ maxWidth: '480px', lineHeight: 1.7 }}>
            Tạo tài khoản miễn phí để lưu giữ vĩnh viễn các hồ sơ thần số học, theo dõi chu kỳ năm/tháng/ngày cá nhân và nhận những lời luận giải từ Pyra AI.
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
            <span style={{ fontSize: '24px', color: '#bda476' }}>✦</span>
            <span style={{ fontSize: '12px', fontFamily: '"Courier New", monospace' }}>
              Tự động đồng bộ các hồ sơ bạn đã tạo trên thiết bị này.
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
            CREATE ACCOUNT
          </p>
          <h2 style={{ fontSize: '38px', marginBottom: '12px' }}>ĐĂNG KÝ</h2>
          <p style={{ marginBottom: '24px' }}>Khởi tạo tài khoản chỉ trong 30 giây.</p>

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

          {successMessage && (
            <div
              style={{
                background: '#e9f5ec',
                border: '1px solid #a3d9b0',
                color: '#2b7842',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '12px',
                fontFamily: '"Courier New", monospace',
              }}
              role="status"
            >
              ✓ {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              HỌ VÀ TÊN
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                disabled={isLoading}
              />
            </label>

            <label style={{ marginTop: '16px' }}>
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
              MẬT KHẨU (TỐI THIỂU 6 KÝ TỰ)
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
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

            <label style={{ marginTop: '16px' }}>
              XÁC NHẬN MẬT KHẨU
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '24px' }}
            >
              {isLoading ? 'ĐANG TẠO TÀI KHOẢN…' : 'TẠO TÀI KHOẢN ↗'}
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
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              style={{ fontStyle: 'normal', color: '#886a92', textDecoration: 'underline', marginLeft: '4px' }}
            >
              Đăng nhập ngay ↗
            </Link>
          </p>
        </div>
      </section>
      <InnerFooter />
    </main>
  );
}
