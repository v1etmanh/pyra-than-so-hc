'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'numina-analytics-consent';

export function AnalyticsConsent({ analyticsId }: { analyticsId?: string }) {
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved === 'accepted' || saved === 'rejected') setConsent(saved);
  }, []);

  const choose = (value: 'accepted' | 'rejected') => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  };

  if (consent === 'accepted' && analyticsId) {
    return (
      <>
        <Script
          id="gtag-src"
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${analyticsId}',{page_path:window.location.pathname,anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
        </Script>
      </>
    );
  }

  if (consent !== null || !analyticsId) return null;

  return (
    <aside
      role="dialog"
      aria-label="Analytics consent"
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1000,
        maxWidth: 560, margin: '0 auto', padding: 16, background: '#fffdf8',
        border: '1px solid #c7b895', boxShadow: '0 8px 30px rgba(0,0,0,.12)',
        font: '12px/1.5 Courier New, monospace', color: '#2a2a2b'
      }}
    >
      <p style={{ margin: '0 0 12px' }}>
        Numina dùng cookie phân tích để cải thiện sản phẩm. Bạn có thể từ chối; dữ liệu ngày sinh không được gửi vào analytics.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => choose('rejected')} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #2a2a2b' }}>TỪ CHỐI</button>
        <button type="button" onClick={() => choose('accepted')} style={{ padding: '8px 12px', background: '#2a2a2b', color: '#fff', border: '1px solid #2a2a2b' }}>CHO PHÉP</button>
      </div>
    </aside>
  );
}

