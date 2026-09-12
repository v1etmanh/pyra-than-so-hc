import { MetadataRoute } from 'next';
import { routing } from '@/src/i18n/routing';
import { localizedUrl } from '@/lib/seo/metadata';

const routes = [
  { path: '', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/indicators', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/life-path-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/expression-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/soul-urge-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/personal-year-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/personality-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/birthday-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/maturity-number-calculator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/chat', changeFrequency: 'daily', priority: 0.8 },
  { path: '/lucky-wallpaper', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/assessment', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) => {
    const alternates = routing.locales.reduce((acc, locale) => {
      acc[locale] = localizedUrl(locale, route.path);
      return acc;
    }, {} as Record<string, string>);

    alternates['x-default'] = localizedUrl(routing.defaultLocale, route.path);

    return routing.locales.map((locale) => ({
      url: localizedUrl(locale, route.path),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: alternates },
    }));
  });
}
