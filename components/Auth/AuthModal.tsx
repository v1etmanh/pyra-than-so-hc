'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';

export function AuthModal() {
  const t = useTranslations('Auth');
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    signInWithPassword,
    signInWithGoogle,
    signUp,
    resetPasswordForEmail,
    updatePassword,
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
      setErrorMessage(t('requiredCredentials'));
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        setErrorMessage(t('invalidCredentials'));
      } else {
        setErrorMessage(t('signInFailed'));
      }
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage(t('requiredCredentials'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);
    const { error, session } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setErrorMessage(t('emailRegistered'));
      } else {
        setErrorMessage(t('signUpFailed'));
      }
    } else {
      if (!session) {
        setSuccessMessage(t('signUpCheckEmail'));
      } else {
        setSuccessMessage(t('signUpSuccess'));
      }
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage(t('emailRequired'));
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(t('resetFailed'));
    } else {
      setSuccessMessage(t('resetSent'));
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setIsLoading(false);
      setErrorMessage(t('googleSignInFailed'));
    }
  };

  const handleSetNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage(t('newPasswordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(t('updatePasswordFailed'));
    } else {
      setSuccessMessage(t('passwordUpdated'));
      setTimeout(() => {
        closeAuthModal();
      }, 2000);
    }
  };

  const renderGoogleButton = () => (
    <>
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
        {t('continueWithGoogle')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', opacity: 0.5 }}>
        <div style={{ flex: 1, height: '1px', background: '#2a2a2b' }} />
        <span style={{ fontSize: '11px', fontFamily: '"Courier New", monospace' }}>{t('orWithEmail')}</span>
        <div style={{ flex: 1, height: '1px', background: '#2a2a2b' }} />
      </div>
    </>
  );

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
          aria-label={t('close')}
        >
          ×
        </button>

        <div className="pyra-login-scroll">

        {authModalMode !== 'new_password' && (
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
              {t('signIn')}
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
              {t('signUp')}
            </button>
          </div>
        )}

        <p className="batch-kicker" style={{ margin: '0 0 8px', color: '#9b7746' }}>
          {t('sacredNumerology')}
        </p>

        <h2 id="auth-modal-title" style={{ fontSize: '38px', marginBottom: '10px' }}>
          {authModalMode === 'signin' && t('signInTitle')}
          {authModalMode === 'signup' && t('signUpTitle')}
          {authModalMode === 'forgot' && t('forgotTitle')}
          {authModalMode === 'new_password' && t('newPasswordTitle')}
        </h2>

        <p className="pyra-login-intro">
          {authModalMode === 'signin' && t('signInIntro')}
          {authModalMode === 'signup' && t('signUpIntro')}
          {authModalMode === 'forgot' && t('forgotIntro')}
          {authModalMode === 'new_password' && t('newPasswordIntro')}
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
          <>
            {renderGoogleButton()}
            <form onSubmit={handleSignIn}>
              <label>
                {t('email')}
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
                {t('password')}
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
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => openAuthModal('forgot')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#bda476',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontFamily: '"Courier New", monospace',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {t('forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                className="pyra-login-submit"
                disabled={isLoading}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {isLoading ? (
                  <span>{t('signingIn')}</span>
                ) : (
                  <>
                    <span aria-hidden="true">✦</span> {t('signIn')}
                  </>
                )}
              </button>

              <p className="pyra-login-signup">
                {t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                >
                  {t('createNow')} ↗
                </button>
              </p>
            </form>
          </>
        )}

        {authModalMode === 'signup' && (
          <>
            {renderGoogleButton()}
            <form onSubmit={handleSignUp}>
              <label>
                {t('fullName')}
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  autoComplete="name"
                  disabled={isLoading}
                />
              </label>

              <label>
                {t('email')}
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
                {t('minimumPassword')}
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
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </label>

              <label>
                {t('confirmPassword')}
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
                  <span>{t('creatingAccount')}</span>
                ) : (
                  <>
                    <span aria-hidden="true">✦</span> {t('createNewAccount')}
                  </>
                )}
              </button>

              <p className="pyra-login-signup">
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                >
                  {t('signIn')} ↗
                </button>
              </p>
            </form>
          </>
        )}

        {authModalMode === 'forgot' && (
          <form onSubmit={handleResetPassword}>
            <label>
              {t('accountEmail')}
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
                <span>{t('sendingReset')}</span>
              ) : (
                <>
                  <span aria-hidden="true">✦</span> {t('sendResetLink')}
                </>
              )}
            </button>

            <p className="pyra-login-signup">
              {t('backTo')}{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
              >
                {t('signIn')} ↗
              </button>
            </p>
          </form>
        )}

        {authModalMode === 'new_password' && (
          <form onSubmit={handleSetNewPassword}>
            <label style={{ position: 'relative' }}>
              {t('newPassword')}
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
                {showPassword ? t('hidePassword') : t('showPassword')}
              </button>
            </label>

            <label>
              {t('confirmNewPassword')}
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
                <span>{t('updatingPassword')}</span>
              ) : (
                <>
                  <span aria-hidden="true">✦</span> {t('saveNewPassword')}
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </section>
    </div>
  );
}
