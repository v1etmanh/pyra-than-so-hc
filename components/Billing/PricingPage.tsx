'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';

export function PricingPage({ locale }: { locale: string }) {
  const vi = locale === 'vi';
  const { user, openAuthModal } = useAuth();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { trackEvent('pricing_view'); }, [trackEvent]);

  const startCheckout = async () => {
    if (!user) { openAuthModal('signin'); return; }
    setLoading(true); setError(''); trackEvent('checkout_started', { plan: 'pro' });
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', locale })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout unavailable');
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout unavailable');
      trackEvent('checkout_failed');
    } finally { setLoading(false); }
  };

  return (
    <main className="pricing-page"><div className="pricing-page-inner">
      <Link className="legal-back" href={vi ? '/' : '/en/'}>← NUMINA</Link>
      <p className="batch-kicker">NUMINA / {vi ? 'BẢNG GIÁ' : 'PRICING'}</p>
      <h1>{vi ? 'Một không gian sâu hơn cho hành trình của bạn.' : 'A deeper space for your journey.'}</h1>
      <p className="pricing-lead">{vi ? 'Bắt đầu miễn phí. Chỉ nâng cấp khi bạn muốn đọc nhiều hơn và lưu trọn hành trình.' : 'Start free. Upgrade when you want more readings and a fuller archive of your journey.'}</p>
      <div className="pricing-grid">
        <article className="pricing-card"><p className="batch-kicker">FREE</p><h2>{vi ? 'Khởi đầu' : 'Beginning'}</h2><strong>{vi ? '0đ' : '$0'} <small>/ {vi ? 'mãi mãi' : 'forever'}</small></strong><ul><li>{vi ? '15 lượt luận giải AI/ngày' : '15 AI readings/day'}</li><li>{vi ? '2 hình nền/ngày' : '2 wallpapers/day'}</li><li>{vi ? 'Lưu hồ sơ trên thiết bị' : 'Local profile storage'}</li><li>{vi ? 'Kho kiến thức fallback' : 'Knowledge fallback'}</li></ul></article>
        <article className="pricing-card pricing-card-featured"><p className="batch-kicker">PRO</p><h2>{vi ? 'Đồng hành' : 'Companion'}</h2><strong>{process.env.NEXT_PUBLIC_PRO_PRICE_LABEL || (vi ? 'Đang mở đăng ký' : 'Coming soon')} <small>/ {vi ? 'tháng' : 'month'}</small></strong><ul><li>{vi ? '100 lượt luận giải/ngày' : '100 AI readings/day'}</li><li>{vi ? '20 hình nền/ngày' : '20 wallpapers/day'}</li><li>{vi ? 'Ưu tiên tính năng premium' : 'Premium feature access'}</li><li>{vi ? 'Lịch sử thanh toán và đồng bộ cloud' : 'Cloud sync and payment history'}</li></ul><button type="button" onClick={startCheckout} disabled={loading}>{loading ? 'ĐANG MỞ CHECKOUT…' : user ? (vi ? 'NÂNG CẤP PRO ↗' : 'UPGRADE TO PRO ↗') : (vi ? 'ĐĂNG NHẬP ĐỂ NÂNG CẤP' : 'SIGN IN TO UPGRADE')}</button></article>
      </div>
      {error && <p className="pricing-error">{error}</p>}
      <p className="pricing-note">{vi ? 'Thanh toán chỉ hoạt động sau khi cấu hình Stripe. Numina không hiển thị giao dịch thành công trước khi webhook xác nhận.' : 'Payments activate only after Stripe is configured. Numina never grants paid access before webhook confirmation.'}</p>
    </div></main>
  );
}
