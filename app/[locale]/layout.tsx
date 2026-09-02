import { ReactNode } from 'react';
import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';

import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';

import { Providers } from '@/app/providers';
import { getMessages, getTranslations } from 'next-intl/server';
import '@/styles/chani-globals.css';
import { AnalyticsConsent } from '@/components/AnalyticsConsent';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://numerology-app.site';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const alternates = routing.locales.reduce(
    (acc, l) => {
      acc[l] = `${baseUrl}/${l}`;
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: alternates
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${baseUrl}/${locale}`,
      siteName: 'NUMINA Numerology',
      images: [
        {
          url: '/logo/436f1399-6171-4441-8654-6711279d206b.png',
          width: 512,
          height: 512,
          alt: 'NUMINA Sacred Numerology Logo'
        }
      ],
      locale: locale,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/logo/436f1399-6171-4441-8654-6711279d206b.png']
    },
    icons: {
      icon: [
        { url: '/logo/436f1399-6171-4441-8654-6711279d206b.png', type: 'image/png' },
        { url: '/favicon.ico' }
      ],
      shortcut: '/logo/436f1399-6171-4441-8654-6711279d206b.png',
      apple: '/logo/436f1399-6171-4441-8654-6711279d206b.png'
    }
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo/436f1399-6171-4441-8654-6711279d206b.png" type="image/png" />
        <link rel="shortcut icon" href="/logo/436f1399-6171-4441-8654-6711279d206b.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/436f1399-6171-4441-8654-6711279d206b.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'NUMINA Numerology',
              url: baseUrl,
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'All',
              description:
                'Professional Numerology Analysis and RAG AI Chatbot.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
              }
            })
          }}
        />
      </head>

      <body suppressHydrationWarning>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>

        <AnalyticsConsent analyticsId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
      </body>
    </html>
  );
}
