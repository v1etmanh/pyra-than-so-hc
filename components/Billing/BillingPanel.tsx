'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isManageablePayPalStatus, isPendingPayPalStatus, type BillingProvider } from '@/lib/billing/types';

type Subscription = { plan: string; provider?: BillingProvider | null; status?: string; current_period_end?: string | null; cancel_at_period_end?: boolean };
type Payment = { id: string; provider: BillingProvider; amount: number; currency: string; status: string; created_at: string };

export function BillingPanel({ locale }: { locale: string }) {
  const vi = locale === 'vi';
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Payment[]>([]);
  const [managementUrl, setManagementUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'renew' | 'cancel' | null>(null);
  const [message, setMessage] = useState('');

  const loadBilling = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subscriptionResponse, historyResponse] = await Promise.all([fetch('/api/billing/subscription', { cache: 'no-store' }), fetch('/api/billing/history', { cache: 'no-store' })]);
      const subscriptionData = await subscriptionResponse.json();
      const historyData = await historyResponse.json();
      setSubscription(subscriptionData.subscription || { plan: subscriptionData.plan || 'free' });
      setManagementUrl(subscriptionData.managementUrl || null);
      setHistory(historyData.history || []);
    } catch { setMessage(vi ? 'Không thể tải thông tin thanh toán.' : 'Unable to load billing information.'); }
    finally { setLoading(false); }
  }, [user, vi]);

  useEffect(() => {
    void loadBilling();
    if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).get('billing')) return;
    setMessage(vi ? 'Đang chờ hệ thống thanh toán xác nhận…' : 'Waiting for payment confirmation…');
    const timers = [2000, 5000, 9000].map((delay) => window.setTimeout(() => void loadBilling(), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [loadBilling, vi]);

  const startPayosRenewal = async () => {
    setAction('renew'); setMessage('');
    try {
      const response = await fetch('/api/billing/payos/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: vi ? 'vi' : 'en' }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout unavailable');
      window.location.assign(data.checkoutUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Checkout unavailable'); }
    finally { setAction(null); }
  };

  const cancelPayPal = async (pending: boolean) => {
    const confirmation = pending
      ? (vi ? 'Hủy yêu cầu thanh toán PayPal chưa hoàn tất này?' : 'Discard this incomplete PayPal checkout?')
      : (vi ? 'Dừng tự động gia hạn PayPal? Bạn vẫn dùng Pro đến cuối kỳ đã thanh toán.' : 'Stop PayPal auto-renewal? Pro remains available through the paid period.');
    if (!window.confirm(confirmation)) return;
    setAction('cancel'); setMessage('');
    try {
      const response = await fetch('/api/billing/paypal/cancel', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Cancellation unavailable');
      setMessage(data.abandoned
        ? (vi ? 'Đã hủy yêu cầu PayPal chưa hoàn tất. Bạn có thể thanh toán lại.' : 'Incomplete PayPal checkout discarded. You can try again.')
        : (vi ? 'Đã dừng gia hạn. Quyền Pro được giữ đến cuối kỳ.' : 'Renewal canceled. Pro remains active through the paid period.'));
      await loadBilling();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Cancellation unavailable'); }
    finally { setAction(null); }
  };

  const formatMoney = (payment: Payment) => new Intl.NumberFormat(locale, { style: 'currency', currency: payment.currency.toUpperCase(), maximumFractionDigits: payment.currency.toLowerCase() === 'vnd' ? 0 : 2 }).format(payment.currency.toLowerCase() === 'vnd' ? payment.amount : payment.amount / 100);
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const endLabel = periodEnd && Number.isFinite(periodEnd.getTime()) ? periodEnd.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
  const paypalPending = subscription?.provider === 'paypal' && isPendingPayPalStatus(subscription.status);
  const paypalManageable = subscription?.provider === 'paypal'
    && isManageablePayPalStatus(subscription.status);

  return <section className="billing-panel">
    <div><p className="batch-kicker">NUMINA / BILLING</p><h2>{vi ? 'Gói của bạn' : 'Your plan'}</h2></div>
    {!user ? <p>{vi ? 'Đăng nhập để xem gói và lịch sử thanh toán.' : 'Sign in to view your plan and payment history.'} <Link href={vi ? '/pricing' : '/en/pricing'}>{vi ? 'Xem bảng giá' : 'View pricing'} →</Link></p> : <>
      {loading && !subscription ? <p>{vi ? 'Đang tải…' : 'Loading…'}</p> : <>
        <p className="billing-plan"><strong>{(subscription?.plan || 'free').toUpperCase()}</strong>{subscription?.provider ? ` · ${subscription.provider === 'payos' ? 'VietQR / payOS' : paypalPending ? (vi ? 'PayPal chưa hoàn tất' : 'PayPal incomplete') : 'PayPal'}` : ''}</p>
        {endLabel && <p>{subscription?.cancel_at_period_end || subscription?.provider === 'payos' ? (vi ? `Có hiệu lực đến ${endLabel}` : `Active until ${endLabel}`) : (vi ? `Gia hạn tiếp theo: ${endLabel}` : `Next renewal: ${endLabel}`)}</p>}
        {paypalPending && <p className="billing-warning">{vi ? 'Bạn chưa xác nhận thanh toán trên PayPal. Yêu cầu này không trừ tiền và có thể hủy để thử lại.' : 'You did not confirm payment on PayPal. This request did not charge you and can be discarded before retrying.'}</p>}
        {subscription?.status === 'PAST_DUE' && <p className="billing-warning">{vi ? 'Thanh toán PayPal gặp lỗi. Vui lòng cập nhật phương thức thanh toán trong PayPal.' : 'Your PayPal payment failed. Please update the payment method in PayPal.'}</p>}
        <div className="billing-actions">
          {subscription?.provider === 'payos' && <button type="button" onClick={startPayosRenewal} disabled={Boolean(action)}>{action === 'renew' ? (vi ? 'ĐANG MỞ…' : 'OPENING…') : (vi ? 'MUA THÊM 30 NGÀY' : 'ADD 30 DAYS')}</button>}
          {paypalManageable && managementUrl && <a className="billing-external-link" href={managementUrl} target="_blank" rel="noreferrer">{vi ? 'QUẢN LÝ THANH TOÁN TRONG PAYPAL ↗' : 'MANAGE PAYMENT IN PAYPAL ↗'}</a>}
          {paypalManageable && !subscription?.cancel_at_period_end && <button type="button" onClick={() => cancelPayPal(false)} disabled={Boolean(action)}>{action === 'cancel' ? (vi ? 'ĐANG HỦY…' : 'CANCELLING…') : (vi ? 'DỪNG GIA HẠN PAYPAL' : 'CANCEL PAYPAL RENEWAL')}</button>}
          {paypalPending && <button type="button" onClick={() => cancelPayPal(true)} disabled={Boolean(action)}>{action === 'cancel' ? (vi ? 'ĐANG HỦY…' : 'DISCARDING…') : (vi ? 'HỦY YÊU CẦU PAYPAL' : 'DISCARD PAYPAL CHECKOUT')}</button>}
          {subscription?.plan !== 'pro' && subscription?.provider !== 'payos' && !paypalPending && <Link className="legal-back" href={vi ? '/pricing' : '/en/pricing'}>{vi ? 'Nâng cấp lại Pro →' : 'Upgrade to Pro again →'}</Link>}
        </div>
      </>}
      {message && <p className="billing-message" role="status">{message}</p>}
      {history.length > 0 && <div className="billing-history"><h3>{vi ? 'Lịch sử thanh toán' : 'Payment history'}</h3>{history.map((payment) => <p key={payment.id}>{new Date(payment.created_at).toLocaleDateString(locale)} · {payment.provider.toUpperCase()} · {formatMoney(payment)} · {payment.status}</p>)}</div>}
    </>}
  </section>;
}
