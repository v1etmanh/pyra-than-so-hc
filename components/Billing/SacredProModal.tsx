'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';
import { useAnalytics } from '@/hooks/useAnalytics';
type WebCheckoutProvider = 'payos' | 'paypal';

export function SacredProModal() {
  const pathname = usePathname();
  const isVietnamese = !pathname?.startsWith('/en');
  const { user, openAuthModal } = useAuth();
  const { isUpgradeModalOpen, closeUpgradeModal, modalContext, isPro } = useBilling();
  const { trackEvent } = useAnalytics();

  const [method, setMethod] = useState<WebCheckoutProvider>(isVietnamese ? 'payos' : 'paypal');
  const [loading, setLoading] = useState<WebCheckoutProvider | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isUpgradeModalOpen) {
      trackEvent('pricing_view', { feature: modalContext?.feature || 'general' });
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setMethod(isVietnamese || timezone === 'Asia/Ho_Chi_Minh' ? 'payos' : 'paypal');
      setError('');
    }
  }, [isUpgradeModalOpen, isVietnamese, modalContext, trackEvent]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isUpgradeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeUpgradeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUpgradeModalOpen, closeUpgradeModal]);

  if (!isUpgradeModalOpen) return null;

  const startCheckout = async (provider: WebCheckoutProvider) => {
    if (!user) {
      closeUpgradeModal();
      openAuthModal('signin');
      return;
    }
    setLoading(provider);
    setError('');
    trackEvent('checkout_started', { plan: 'pro', provider, source: modalContext?.feature || 'modal' });

    try {
      const response = await fetch(`/api/billing/${provider}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: isVietnamese ? 'vi' : 'en' }),
      });
      const data = await response.json().catch(() => ({}));
      const url = provider === 'payos' ? data.checkoutUrl : data.approvalUrl;
      if (!response.ok || !url) {
        throw new Error(data.error || (isVietnamese ? 'Không thể mở cổng thanh toán.' : 'Checkout unavailable.'));
      }
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isVietnamese ? 'Không thể mở thanh toán.' : 'Checkout unavailable.'));
      trackEvent('checkout_failed', { provider });
    } finally {
      setLoading(null);
    }
  };

  // Dynamic context titles and description
  const feature = modalContext?.feature || 'general';
  const headlines = {
    tarot: {
      kicker: isVietnamese ? 'NUMELYRA PRO / CHIÊM NGHIỆM' : 'NUMELYRA PRO / TAROT',
      title: isVietnamese ? 'Mở khóa Chiêm nghiệm Tarot Không Giới Hạn' : 'Unlock Unlimited Tarot Wisdom',
      desc: isVietnamese
        ? 'Nâng cấp lên 200 lượt AI mỗi tháng, bao gồm Tarot AI và các câu hỏi tiếp nối.'
        : 'Upgrade to 200 AI responses each month, including AI Tarot and follow-up questions.',
    },
    wallpaper: {
      kicker: isVietnamese ? 'NUMELYRA PRO / HÌNH NỀN' : 'NUMELYRA PRO / WALLPAPER',
      title: isVietnamese ? 'Mở khóa Studio Hình Nền Năng Lượng' : 'Unlock Lucky Wallpaper Studio',
      desc: isVietnamese
        ? 'Tạo tới 30 hình nền năng lượng mỗi tháng và tải ảnh sắc nét.'
        : 'Generate up to 30 lucky wallpapers each month and download high-quality images.',
    },
    indicators: {
      kicker: isVietnamese ? 'NUMELYRA PRO / THẦN SỐ HỌC' : 'NUMELYRA PRO / NUMEROLOGY',
      title: isVietnamese ? 'Mở khóa Toàn diện Bản đồ Thần số học' : 'Unlock Deep Numerology Insights',
      desc: isVietnamese
        ? '200 lượt AI mỗi tháng; các phép tính Thần số học cục bộ vẫn luôn không giới hạn.'
        : '200 AI responses each month; local numerology calculations always remain unlimited.',
    },
    general: {
      kicker: isVietnamese ? 'NUMELYRA PRO / ĐỒNG HÀNH' : 'NUMELYRA PRO / SANCTUARY',
      title: modalContext?.title || (isVietnamese ? 'Một Không Gian Sâu Hơn Cho Bạn' : 'A Deeper Space For Your Journey'),
      desc: modalContext?.description || (isVietnamese
        ? 'Đồng hành cùng NUMELYRA với 200 lượt AI, 31 lượt ca dao, 31 mặt sau Daily Insight và 30 hình nền mỗi kỳ.'
        : 'Experience NUMELYRA with 200 AI responses, 31 Ca Dao unlocks, 31 Daily Insight backs, and 30 wallpapers per period.'),
    },
  }[feature];

  return (
    <div className="sacred-pro-overlay" onClick={(e) => e.target === e.currentTarget && closeUpgradeModal()}>
      <div className="sacred-pro-modal" role="dialog" aria-modal="true" aria-labelledby="sacred-pro-title">
        {/* Close Button */}
        <button
          type="button"
          className="sacred-pro-close"
          onClick={closeUpgradeModal}
          aria-label={isVietnamese ? 'Đóng cửa sổ' : 'Close modal'}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="sacred-pro-header">
          <div className="sacred-pro-emblem" aria-hidden="true">✦</div>
          <span className="sacred-pro-kicker">{headlines.kicker}</span>
          <h2 id="sacred-pro-title">{headlines.title}</h2>
          <p className="sacred-pro-desc">{headlines.desc}</p>
        </div>

        {/* Pro Benefits Grid */}
        <div className="sacred-pro-benefits">
          <div className="sacred-benefit-card">
            <span className="benefit-icon">✦</span>
            <div className="benefit-text">
              <strong>{isVietnamese ? '200 lượt AI / tháng' : '200 AI responses / month'}</strong>
              <small>{isVietnamese ? 'Dùng chung cho chat, follow-up và luận giải AI' : 'Shared by chat, follow-ups, and AI readings'}</small>
            </div>
          </div>
          <div className="sacred-benefit-card">
            <span className="benefit-icon">🖼️</span>
            <div className="benefit-text">
              <strong>{isVietnamese ? '30 hình nền / tháng' : '30 wallpapers / month'}</strong>
              <small>{isVietnamese ? 'Tải ảnh 4K Ultra sắc nét & phong cách Pro' : '4K Ultra downloads & luxury styles'}</small>
            </div>
          </div>
          <div className="sacred-benefit-card">
            <span className="benefit-icon">🔮</span>
            <div className="benefit-text">
              <strong>{isVietnamese ? 'Trải bài chuyên sâu' : 'Advanced spreads'}</strong>
              <small>{isVietnamese ? 'Celtic Cross 10 lá & phân tích toàn cảnh' : '10-card Celtic Cross & deep insights'}</small>
            </div>
          </div>
          <div className="sacred-benefit-card">
            <span className="benefit-icon">☁️</span>
            <div className="benefit-text">
              <strong>{isVietnamese ? 'Đồng bộ & Lưu trữ' : 'Cloud sync & history'}</strong>
              <small>{isVietnamese ? 'Lưu giữ hành trình và lịch sử trọn vẹn' : 'Save your sacred journey securely'}</small>
            </div>
          </div>
        </div>

        {isPro ? (
          <div className="sacred-pro-active-banner">
            <p>
              {isVietnamese
                ? '✨ Bạn đang sở hữu gói NUMELYRA Pro. Cảm ơn bạn đã đồng hành!'
                : '✨ You are currently a NUMELYRA Pro Member. Thank you for your journey with us!'}
            </p>
          </div>
        ) : (
          <>
            {/* Payment Method Selector */}
            <div className="sacred-payment-methods" role="tablist">
              <button
                type="button"
                className={`sacred-method-btn ${method === 'payos' ? 'is-selected' : ''}`}
                onClick={() => setMethod('payos')}
              >
                <div className="method-pill-header">
                  <span>VIETQR / PAYOS</span>
                  <span className="method-badge">{isVietnamese ? 'Phổ biến' : 'Popular'}</span>
                </div>
                <strong>249.000đ</strong>
                <small>{isVietnamese ? '30 ngày · Quét mã mọi ngân hàng' : '30 days · All VN bank apps'}</small>
              </button>

              <button
                type="button"
                className={`sacred-method-btn ${method === 'paypal' ? 'is-selected' : ''}`}
                onClick={() => setMethod('paypal')}
              >
                <div className="method-pill-header">
                  <span>PAYPAL</span>
                  <span className="method-badge">Global</span>
                </div>
                <strong>$9.99</strong>
                <small>{isVietnamese ? 'mỗi tháng · Thẻ quốc tế' : 'monthly · Auto-renew'}</small>
              </button>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              className="sacred-checkout-submit"
              onClick={() => startCheckout(method)}
              disabled={Boolean(loading)}
            >
              {loading
                ? isVietnamese ? 'Đang mở cổng thanh toán…' : 'Opening checkout…'
                : !user
                  ? isVietnamese ? 'Đăng nhập để nâng cấp Pro' : 'Sign in to upgrade'
                  : method === 'payos'
                    ? isVietnamese ? 'Thanh toán 249.000đ qua VietQR ↗' : 'Pay 249,000đ with VietQR ↗'
                    : isVietnamese ? 'Đăng ký $9.99/tháng qua PayPal ↗' : 'Subscribe $9.99/mo via PayPal ↗'}
            </button>

            {error && <p className="sacred-pro-error" role="alert">{error}</p>}

            <p className="sacred-pro-guarantee">
              {isVietnamese
                ? '✦ Kích hoạt tự động ngay sau khi chuyển khoản · Hỗ trợ hủy bất kỳ lúc nào'
                : '✦ Instant activation upon payment · Cancel anytime'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
