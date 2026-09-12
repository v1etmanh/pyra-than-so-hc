import type { Metadata } from 'next';
import { routing } from '@/src/i18n/routing';

export const siteBaseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://numelyra.online'
).replace(/\/$/, '');

export type PublicPagePath =
  | ''
  | '/chat'
  | '/indicators'
  | '/lucky-wallpaper'
  | '/assessment'
  | '/pricing'
  | '/privacy-policy'
  | '/terms-of-service';

type SupportedLocale = (typeof routing.locales)[number];
type PageCopy = { title: string; description: string };

const pageMetadata: Record<SupportedLocale, Record<PublicPagePath, PageCopy>> = {
  vi: {
    '': {
      title: 'NUMELYRA - Ứng dụng Nhân Số Học',
      description: 'Khám phá Nhân Số Học, Tarot và những luận giải cá nhân hóa cùng NUMELYRA.',
    },
    '/chat': {
      title: 'Tarot AI và luận giải cá nhân | NUMELYRA',
      description: 'Trải bài Tarot AI và nhận luận giải cá nhân hóa dựa trên câu hỏi của bạn.',
    },
    '/indicators': {
      title: '24 chỉ số Nhân Số Học | NUMELYRA',
      description: 'Khám phá 24 chỉ số Nhân Số Học từ ngày sinh và họ tên của bạn.',
    },
    '/lucky-wallpaper': {
      title: 'Hình nền may mắn cá nhân hóa | NUMELYRA',
      description: 'Tạo hình nền may mắn dựa trên bản đồ Nhân Số Học và mong muốn của bạn.',
    },
    '/assessment': {
      title: 'Bản đồ tính cách cá nhân | NUMELYRA',
      description: 'Thực hiện bài đánh giá tính cách và kết hợp kết quả với bản đồ Nhân Số Học.',
    },
    '/pricing': {
      title: 'Bảng giá NUMELYRA Pro',
      description: 'Xem quyền lợi và lựa chọn gói NUMELYRA Pro phù hợp với bạn.',
    },
    '/privacy-policy': {
      title: 'Chính sách quyền riêng tư | NUMELYRA',
      description: 'Tìm hiểu cách NUMELYRA thu thập, sử dụng và bảo vệ dữ liệu của bạn.',
    },
    '/terms-of-service': {
      title: 'Điều khoản sử dụng | NUMELYRA',
      description: 'Đọc các điều khoản áp dụng khi sử dụng dịch vụ NUMELYRA.',
    },
  },
  en: {
    '': {
      title: 'NUMELYRA - Numerology App',
      description: 'Explore numerology, Tarot, and personalized readings with NUMELYRA.',
    },
    '/chat': {
      title: 'AI Tarot and Personalized Readings | NUMELYRA',
      description: 'Draw Tarot cards and receive an AI-powered interpretation tailored to your question.',
    },
    '/indicators': {
      title: '24 Numerology Indicators | NUMELYRA',
      description: 'Explore 24 numerology indicators calculated from your birth date and full name.',
    },
    '/lucky-wallpaper': {
      title: 'Personalized Lucky Wallpaper | NUMELYRA',
      description: 'Create a lucky wallpaper inspired by your numerology map and personal intention.',
    },
    '/assessment': {
      title: 'Personalized Personality Map | NUMELYRA',
      description: 'Take a personality assessment and combine the result with your numerology map.',
    },
    '/pricing': {
      title: 'NUMELYRA Pro Pricing',
      description: 'Compare NUMELYRA Pro benefits and choose the plan that fits your journey.',
    },
    '/privacy-policy': {
      title: 'Privacy Policy | NUMELYRA',
      description: 'Learn how NUMELYRA collects, uses, and protects your information.',
    },
    '/terms-of-service': {
      title: 'Terms of Service | NUMELYRA',
      description: 'Read the terms that apply when you use NUMELYRA services.',
    },
  },
};

function normalizeLocale(locale: string): SupportedLocale {
  return routing.locales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : routing.defaultLocale;
}

export function localizedUrl(locale: string, path: string): string {
  const normalizedLocale = normalizeLocale(locale);
  const localePrefix = normalizedLocale === routing.defaultLocale ? '' : `/${normalizedLocale}`;
  return `${siteBaseUrl}${localePrefix}${path}`;
}

export function buildPageMetadata(locale: string, path: PublicPagePath): Metadata {
  const normalizedLocale = normalizeLocale(locale);
  const copy = pageMetadata[normalizedLocale][path];
  const canonical = localizedUrl(normalizedLocale, path);
  const languages = Object.fromEntries(
    routing.locales.map((supportedLocale) => [
      supportedLocale,
      localizedUrl(supportedLocale, path),
    ])
  );

  languages['x-default'] = localizedUrl(routing.defaultLocale, path);

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical, languages },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: 'NUMELYRA Numerology',
      locale: normalizedLocale === 'vi' ? 'vi_VN' : 'en_US',
      alternateLocale: normalizedLocale === 'vi' ? ['en_US'] : ['vi_VN'],
      type: 'website',
      images: [
        {
          url: '/logo/436f1399-6171-4441-8654-6711279d206b.png',
          width: 512,
          height: 512,
          alt: 'NUMELYRA Sacred Numerology Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: ['/logo/436f1399-6171-4441-8654-6711279d206b.png'],
    },
  };
}

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};
