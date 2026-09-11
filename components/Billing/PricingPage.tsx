'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { BillingProvider } from '@/lib/billing/types';

export function PricingPage({ locale }: { locale: string }) {
  const vi = locale === 'vi';
  const { user, openAuthModal } = useAuth();
  const { trackEvent } = useAnalytics();
  const [method, setMethod] = useState<BillingProvider>(vi ? 'payos' : 'paypal');
  const [loading, setLoading] = useState<BillingProvider | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('pricing_view');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setMethod(vi || timezone === 'Asia/Ho_Chi_Minh' ? 'payos' : 'paypal');
  }, [trackEvent, vi]);

  const startCheckout = async (provider: BillingProvider) => {
    if (!user) { openAuthModal('signin'); return; }
    setLoading(provider); setError(''); trackEvent('checkout_started', { plan: 'pro', provider });
    try {
      const response = await fetch(`/api/billing/${provider}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: vi ? 'vi' : 'en' })
      });
      const data = await response.json().catch(() => ({}));
      const url = provider === 'payos' ? data.checkoutUrl : data.approvalUrl;
      if (!response.ok || !url) throw new Error(data.error || (vi ? 'Không thể mở thanh toán.' : 'Checkout unavailable.'));
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : (vi ? 'Không thể mở thanh toán.' : 'Checkout unavailable.'));
      trackEvent('checkout_failed', { provider });
    } finally { setLoading(null); }
  };

  return (
    <main className="pricing-page"><div className="pricing-page-inner">
      <Link className="legal-back" href={vi ? '/' : '/en/'}>← NUMINA</Link>
      <p className="batch-kicker">NUMINA / {vi ? 'BẢNG GIÁ' : 'PRICING'}</p>
      <h1>{vi ? 'Một không gian sâu hơn cho hành trình của bạn.' : 'A deeper space for your journey.'}</h1>
      <p className="pricing-lead">{vi ? 'Bắt đầu miễn phí. Nâng cấp bằng VietQR hoặc PayPal khi bạn cần thêm lượt.' : 'Start free. Upgrade with PayPal or VietQR when you need more readings.'}</p>
      <div className="pricing-grid">
        <article className="pricing-card">
          <p className="batch-kicker">FREE</p><h2>{vi ? 'Khởi đầu' : 'Beginning'}</h2>
          <strong>{vi ? '0đ' : '$0'} <small>/ {vi ? 'mãi mãi' : 'forever'}</small></strong>
          <ul><li>{vi ? '15 lượt luận giải AI/ngày' : '15 AI readings/day'}</li><li>{vi ? '2 hình nền/ngày' : '2 wallpapers/day'}</li><li>{vi ? 'Lưu hồ sơ trên thiết bị' : 'Local profile storage'}</li><li>{vi ? 'Kho kiến thức fallback' : 'Knowledge fallback'}</li></ul>
        </article>
        <article className="pricing-card pricing-card-featured">
          <p className="batch-kicker">PRO</p><h2>{vi ? 'Đồng hành' : 'Companion'}</h2>
          <ul><li>{vi ? '100 lượt luận giải/ngày' : '100 AI readings/day'}</li><li>{vi ? '20 hình nền/ngày' : '20 wallpapers/day'}</li><li>{vi ? 'Ưu tiên tính năng premium' : 'Premium feature access'}</li><li>{vi ? 'Lịch sử thanh toán và đồng bộ cloud' : 'Cloud sync and payment history'}</li></ul>
          <div className="payment-methods" role="tablist" aria-label={vi ? 'Phương thức thanh toán' : 'Payment method'}>
            <button type="button" className={method === 'payos' ? 'is-selected' : ''} onClick={() => setMethod('payos')}>
              <span>VIETQR</span><strong>79.000đ</strong><small>{vi ? '30 ngày · thanh toán một lần' : '30 days · one-time'}</small>
            </button>
            <button type="button" className={method === 'paypal' ? 'is-selected' : ''} onClick={() => setMethod('paypal')}>
              <span>PAYPAL</span><strong>$3.99</strong><small>{vi ? 'mỗi tháng · tự gia hạn' : 'monthly · auto-renew'}</small>
            </button>
          </div>
          <button className="pricing-checkout-button" type="button" onClick={() => startCheckout(method)} disabled={Boolean(loading)}>
            {loading ? (vi ? 'ĐANG MỞ THANH TOÁN…' : 'OPENING CHECKOUT…') : !user ? (vi ? 'ĐĂNG NHẬP ĐỂ NÂNG CẤP' : 'SIGN IN TO UPGRADE') : method === 'payos' ? (vi ? 'THANH TOÁN VIETQR ↗' : 'PAY WITH VIETQR ↗') : (vi ? 'ĐĂNG KÝ QUA PAYPAL ↗' : 'SUBSCRIBE WITH PAYPAL ↗')}
          </button>
          <button className="payment-switch" type="button" onClick={() => setMethod(method === 'payos' ? 'paypal' : 'payos')}>
            {vi ? 'Dùng phương thức khác' : 'Use another payment method'}
          </button>
        </article>
      </div>
      {error && <p className="pricing-error" role="alert">{error}</p>}
      <p className="pricing-note">{vi ? 'Quyền Pro chỉ được kích hoạt sau khi PayPal hoặc payOS gửi xác nhận bảo mật tới Numina.' : 'Pro access activates only after Numina receives a verified confirmation from PayPal or payOS.'}</p>
    </div></main>
  );
}
