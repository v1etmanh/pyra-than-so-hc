'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    signInWithPassword,
    signUp,
    resetPasswordForEmail,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPassword('');
      setConfirmPassword('');
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    const { error, session } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setErrorMessage('Email này đã được đăng ký. Vui lòng đăng nhập.');
      } else {
        setErrorMessage(error.message || 'Đăng ký không thành công.');
      }
    } else {
      if (!session) {
        setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận (hoặc đăng nhập).');
      } else {
        setSuccessMessage('Đăng ký thành công! Đang chuyển hướng...');
      }
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Vui lòng nhập email của bạn.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Không thể gửi email khôi phục.');
    } else {
      setSuccessMessage('Đã gửi liên kết đặt lại mật khẩu về email của bạn.');
    }
  };

  return (
    <div
      className="pyra-login-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          closeAuthModal();
        }
      }}
    >
      <section
        className="pyra-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 15px 15px 0 rgba(42,42,43,.18)',
        }}
      >
        <button
          type="button"
          className="pyra-login-close"
          onClick={closeAuthModal}
          disabled={isLoading}
          aria-label="Đóng cửa sổ"
        >
          ×
        </button>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(42,42,43,.15)', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => openAuthModal('signin')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              font: authModalMode === 'signin' ? 'bold 12px "Courier New", monospace' : '12px "Courier New", monospace',
              color: authModalMode === 'signin' ? '#2a2a2b' : '#888',
              borderBottom: authModalMode === 'signin' ? '2px solid #bda476' : 'none',
              padding: '6px 12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              font: authModalMode === 'signup' ? 'bold 12px "Courier New", monospace' : '12px "Courier New", monospace',
              color: authModalMode === 'signup' ? '#2a2a2b' : '#888',
              borderBottom: authModalMode === 'signup' ? '2px solid #bda476' : 'none',
              padding: '6px 12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ĐĂNG KÝ
          </button>
        </div>

        <p className="batch-kicker" style={{ margin: '0 0 8px', color: '#9b7746' }}>
          PYRA / SACRED NUMEROLOGY
        </p>

        <h2 id="auth-modal-title" style={{ fontSize: '38px', marginBottom: '10px' }}>
          {authModalMode === 'signin' && 'Welcome back.'}
          {authModalMode === 'signup' && 'Begin your map.'}
          {authModalMode === 'forgot' && 'Reset password.'}
        </h2>

        <p className="pyra-login-intro">
          {authModalMode === 'signin' && 'Đăng nhập để đồng bộ bản đồ 24 chỉ số và các bài đọc cá nhân của bạn.'}
          {authModalMode === 'signup' && 'Tạo tài khoản để lưu trữ vĩnh viễn hành trình thần số học của bạn trên đám mây.'}
          {authModalMode === 'forgot' && 'Nhập email để nhận liên kết khôi phục mật khẩu tài khoản PYRA.'}
        </p>

        {errorMessage && (
          <div
            style={{
              background: '#fae8e8',
              border: '1px solid #e0a3a3',
              color: '#942b2b',
              padding: '10px 14px',
              marginBottom: '16px',
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
              marginBottom: '16px',
              fontSize: '12px',
              fontFamily: '"Courier New", monospace',
            }}
            role="status"
          >
            ✓ {successMessage}
          </div>
        )}

        {authModalMode === 'signin' && (
          <form onSubmit={handleSignIn}>
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

            <label style={{ position: 'relative' }}>
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
                  bottom: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#777',
                  fontFamily: '"Courier New", monospace',
                }}
              >
                {showPassword ? 'ẨN' : 'HIỆN'}
              </button>
            </label>

            <div className="pyra-login-options">
              <label>
                <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
              </label>
              <button
                type="button"
                onClick={() => openAuthModal('forgot')}
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              className="pyra-login-submit"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {isLoading ? (
                <span>ĐANG XÁC THỰC…</span>
              ) : (
                <>
                  <span>✦</span> ĐĂNG NHẬP
                </>
              )}
            </button>

            <p className="pyra-login-signup">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
              >
                Đăng ký ngay ↗
              </button>
            </p>
          </form>
        )}

        {authModalMode === 'signup' && (
          <form onSubmit={handleSignUp}>
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

            <label style={{ position: 'relative' }}>
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
                  bottom: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#777',
                  fontFamily: '"Courier New", monospace',
                }}
              >
                {showPassword ? 'ẨN' : 'HIỆN'}
              </button>
            </label>

            <label>
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
              className="pyra-login-submit"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {isLoading ? (
                <span>ĐANG KHỞI TẠO…</span>
              ) : (
                <>
                  <span>✦</span> TẠO TÀI KHOẢN MỚI
                </>
              )}
            </button>

            <p className="pyra-login-signup">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
              >
                Đăng nhập ↗
              </button>
            </p>
          </form>
        )}

        {authModalMode === 'forgot' && (
          <form onSubmit={handleResetPassword}>
            <label>
              EMAIL TÀI KHOẢN
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

            <button
              type="submit"
              className="pyra-login-submit"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {isLoading ? (
                <span>ĐANG GỬI…</span>
              ) : (
                <>
                  <span>✦</span> GỬI LIÊN KẾT KHÔI PHỤC
                </>
              )}
            </button>

            <p className="pyra-login-signup">
              Quay lại{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
              >
                Đăng nhập ↗
              </button>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
