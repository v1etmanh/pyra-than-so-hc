'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
type WebCheckoutProvider = 'payos' | 'paypal';

export function PricingPage({ locale }: { locale: string }) {
  const vi = locale === 'vi';
  const { user, openAuthModal } = useAuth();
  const { trackEvent } = useAnalytics();
  const [method, setMethod] = useState<WebCheckoutProvider>(vi ? 'payos' : 'paypal');
  const [loading, setLoading] = useState<WebCheckoutProvider | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('pricing_view');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setMethod(vi || timezone === 'Asia/Ho_Chi_Minh' ? 'payos' : 'paypal');
  }, [trackEvent, vi]);

  const startCheckout = async (provider: WebCheckoutProvider) => {
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
      <Link className="legal-back" href={vi ? '/' : '/en/'}>← NUMELYRA</Link>
      <p className="batch-kicker">NUMELYRA / {vi ? 'BẢNG GIÁ' : 'PRICING'}</p>
      <h1>{vi ? 'Một không gian sâu hơn cho hành trình của bạn.' : 'A deeper space for your journey.'}</h1>
      <p className="pricing-lead">{vi ? 'Bắt đầu miễn phí. Nâng cấp bằng VietQR hoặc PayPal khi bạn cần thêm lượt.' : 'Start free. Upgrade with PayPal or VietQR when you need more readings.'}</p>
      <div className="pricing-grid">
        <article className="pricing-card">
          <p className="batch-kicker">FREE</p><h2>{vi ? 'Khởi đầu' : 'Beginning'}</h2>
          <strong>{vi ? '0đ' : '$0'} <small>/ {vi ? 'mãi mãi' : 'forever'}</small></strong>
          <ul><li>{vi ? '10 lượt AI/tháng' : '10 AI responses/month'}</li><li>{vi ? '7 ca dao và 10 mặt sau Daily Insight/tháng' : '7 daily verses and 10 Daily Insight backs/month'}</li><li>{vi ? '2 hình nền/tháng' : '2 wallpapers/month'}</li><li>{vi ? 'Tính toán cục bộ không giới hạn' : 'Unlimited local calculations'}</li></ul>
        </article>
        <article className="pricing-card pricing-card-featured">
          <p className="batch-kicker">PRO</p><h2>{vi ? 'Đồng hành' : 'Companion'}</h2>
          <ul><li>{vi ? '200 lượt AI/tháng' : '200 AI responses/month'}</li><li>{vi ? '31 ca dao và 31 mặt sau Daily Insight/kỳ' : '31 daily verses and 31 Daily Insight backs/period'}</li><li>{vi ? '30 hình nền/tháng' : '30 wallpapers/month'}</li><li>{vi ? 'Đồng bộ và lịch sử cloud đầy đủ' : 'Full cloud sync and history'}</li></ul>
          <div className="payment-methods" role="tablist" aria-label={vi ? 'Phương thức thanh toán' : 'Payment method'}>
            <button type="button" className={method === 'payos' ? 'is-selected' : ''} onClick={() => setMethod('payos')}>
              <span>VIETQR</span><strong>249.000đ</strong><small>{vi ? '30 ngày · thanh toán một lần' : '30 days · one-time'}</small>
            </button>
            <button type="button" className={method === 'paypal' ? 'is-selected' : ''} onClick={() => setMethod('paypal')}>
              <span>PAYPAL</span><strong>$9.99</strong><small>{vi ? 'mỗi tháng · tự gia hạn' : 'monthly · auto-renew'}</small>
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
      <p className="pricing-note">{vi ? 'Quyền Pro chỉ được kích hoạt sau khi PayPal hoặc payOS gửi xác nhận bảo mật tới NUMELYRA.' : 'Pro access activates only after NUMELYRA receives a verified confirmation from PayPal or payOS.'}</p>
    </div></main>
  );
}
