'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Subscription = { plan: string; status?: string; current_period_end?: string | null };
type Payment = { id: string; amount: number; currency: string; status: string; created_at: string };

export function BillingPanel({ locale }: { locale: string }) {
  const vi = locale === 'vi';
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetch('/api/billing/subscription'), fetch('/api/billing/history')])
      .then(async ([subscriptionResponse, historyResponse]) => {
        const subscriptionData = await subscriptionResponse.json();
        const historyData = await historyResponse.json();
        setSubscription(subscriptionData.subscription || { plan: subscriptionData.plan || 'free' });
        setHistory(historyData.history || []);
      }).catch(() => undefined);
  }, [user]);

  return <section className="billing-panel"><div><p className="batch-kicker">NUMINA / BILLING</p><h2>{vi ? 'Gói của bạn' : 'Your plan'}</h2></div>{!user ? <p>{vi ? 'Đăng nhập để xem gói và lịch sử thanh toán.' : 'Sign in to view your plan and payment history.'} <Link href={vi ? '/pricing' : '/en/pricing'}>{vi ? 'Xem bảng giá' : 'View pricing'} →</Link></p> : <><p className="billing-plan"><strong>{(subscription?.plan || 'free').toUpperCase()}</strong> · {subscription?.status || 'active'}</p><Link className="legal-back" href={vi ? '/pricing' : '/en/pricing'}>{vi ? 'Quản lý gói →' : 'Manage plan →'}</Link>{history.length > 0 && <div className="billing-history"><h3>{vi ? 'Lịch sử thanh toán' : 'Payment history'}</h3>{history.map((payment) => <p key={payment.id}>{new Date(payment.created_at).toLocaleDateString(locale)} · {(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()} · {payment.status}</p>)}</div>}</>}</section>;
}

