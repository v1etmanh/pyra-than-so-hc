import type { Metadata } from 'next';
import { routing } from '@/src/i18n/routing';

export const siteBaseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://numelyra.online'
).replace(/\/$/, '');

export type PublicPagePath =
  | ''
  | '/chat'
  | '/love-compatibility'
  | '/indicators'
  | '/lucky-wallpaper'
  | '/assessment'
  | '/pricing'
  | '/privacy-policy'
  | '/terms-of-service'
  | '/life-path-number-calculator'
  | '/expression-number-calculator'
  | '/soul-urge-number-calculator'
  | '/personal-year-number-calculator'
  | '/personality-number-calculator'
  | '/birthday-number-calculator'
  | '/maturity-number-calculator';

type SupportedLocale = (typeof routing.locales)[number];
type PageCopy = { title: string; description: string };

const pageMetadata: Record<SupportedLocale, Record<PublicPagePath, PageCopy>> = {
  vi: {
    '': {
      title: 'NUMELYRA - Ứng dụng Nhân Số Học & Chiêm Tinh Học',
      description: 'Khám phá Nhân Số Học, Tarot và những luận giải cá nhân hóa cùng NUMELYRA.',
    },
    '/chat': {
      title: 'Tarot AI và luận giải cá nhân | NUMELYRA',
      description: 'Trải bài Tarot AI và nhận luận giải cá nhân hóa dựa trên câu hỏi của bạn.',
    },
    '/love-compatibility': {
      title: 'Ghép đôi Bát Tự & Thấu cảm tình duyên | NUMELYRA',
      description: 'Phân tích tương hợp Bát Tự, ngũ hành bổ khuyết và chu kỳ vận thế tình duyên cùng NUMELYRA AI.',
    },
    '/indicators': {
      title: 'Công cụ tính Thần số học miễn phí: Bản đồ 24 chỉ số | NUMELYRA',
      description: 'Khám phá trọn vẹn 24 chỉ số Thần số học Pythagoras từ ngày sinh và họ tên đầy đủ của bạn.',
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
    '/life-path-number-calculator': {
      title: 'Công cụ tính Số Đường Đời miễn phí | NUMELYRA',
      description: 'Tính Số Đường Đời (Life Path Number) chuẩn Thần số học Pythagoras. Khám phá bài học số mệnh, tài năng và con đường phát triển của bạn.',
    },
    '/expression-number-calculator': {
      title: 'Công cụ tính Số Sứ Mệnh miễn phí | NUMELYRA',
      description: 'Tính Số Sứ Mệnh (Expression Number) từ họ tên khai sinh. Khám phá mục tiêu cuộc đời, tài năng bẩm sinh và con đường thành tựu.',
    },
    '/soul-urge-number-calculator': {
      title: 'Công cụ tính Số Linh Hồn miễn phí | NUMELYRA',
      description: 'Tính Số Linh Hồn (Soul Urge Number) từ nguyên âm trong họ tên. Thấu hiểu khao khát nội tâm và động lực sâu kín nhất của trái tim.',
    },
    '/personal-year-number-calculator': {
      title: 'Công cụ tính Năm Cá Nhân miễn phí | NUMELYRA',
      description: 'Tính Năm Cá Nhân Thần số học trong chu kỳ 9 năm. Nắm bắt vận hạn, nhịp điệu năng lượng và thời điểm bứt phá lý tưởng.',
    },
    '/personality-number-calculator': {
      title: 'Công cụ tính Số Nhân Cách miễn phí | NUMELYRA',
      description: 'Tính Số Nhân Cách (Personality Number) từ phụ âm trong họ tên. Khám phá phong thái xã hội, ấn tượng ban đầu và lớp vỏ bảo vệ.',
    },
    '/birthday-number-calculator': {
      title: 'Công cụ tính Số Ngày Sinh miễn phí | NUMELYRA',
      description: 'Tính Số Ngày Sinh (Birthday Number) Thần số học chuẩn Pythagoras. Món quà tài năng bẩm sinh hỗ trợ bạn trên đường đời.',
    },
    '/maturity-number-calculator': {
      title: 'Công cụ tính Số Trưởng Thành miễn phí | NUMELYRA',
      description: 'Tính Số Trưởng Thành (Maturity Number) kết hợp Đường Đời và Sứ Mệnh. Khám phá đỉnh cao tiến hóa và thành tựu sau tuổi 35.',
    },
  },
  en: {
    '': {
      title: 'NUMELYRA - Sacred Numerology & Astrological Wisdom',
      description: 'Explore numerology, Tarot, and personalized readings with NUMELYRA.',
    },
    '/chat': {
      title: 'AI Tarot and Personalized Readings | NUMELYRA',
      description: 'Draw Tarot cards and receive an AI-powered interpretation tailored to your question.',
    },
    '/love-compatibility': {
      title: 'Bazi Love Compatibility & Relational AI | NUMELYRA',
      description: 'Explore Bazi synastry, elemental balance, and 5-year relational luck cycles with NUMELYRA AI.',
    },
    '/indicators': {
      title: 'Free Numerology Calculator: Your Full 24-Indicator Chart | NUMELYRA',
      description: 'Explore all 24 classical Pythagorean numerology indicators calculated from your birth date and full name.',
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
    '/life-path-number-calculator': {
      title: 'Free Life Path Number Calculator | NUMELYRA',
      description: 'Calculate your Life Path Number with classical Pythagorean numerology. Discover your soul blueprint, core lessons, and personal trajectory.',
    },
    '/expression-number-calculator': {
      title: 'Free Expression Number Calculator | NUMELYRA',
      description: 'Calculate your Expression Number from your full birth name. Unveil your vocational gifts, natural strengths, and destined calling.',
    },
    '/soul-urge-number-calculator': {
      title: 'Free Soul Urge Number Calculator | NUMELYRA',
      description: 'Calculate your Soul Urge Number from the vowels in your name. Discover your private emotional drives and deep heart desires.',
    },
    '/personal-year-number-calculator': {
      title: 'Free Personal Year Number Calculator | NUMELYRA',
      description: 'Calculate your Personal Year Number in the 9-year cycle. Align with annual energy shifts and optimize your life timing.',
    },
    '/personality-number-calculator': {
      title: 'Free Personality Number Calculator | NUMELYRA',
      description: 'Calculate your Personality Number from consonants in your name. Understand your social presentation and outer first impressions.',
    },
    '/birthday-number-calculator': {
      title: 'Free Birthday Number Calculator | NUMELYRA',
      description: 'Calculate your Birthday Number in Pythagorean numerology. Discover the innate specialized talent gifted on the day of your birth.',
    },
    '/maturity-number-calculator': {
      title: 'Free Maturity Number Calculator | NUMELYRA',
      description: 'Calculate your Maturity Number by synthesizing Life Path and Expression. Uncover your mid-life evolutionary summit after age 35.',
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
