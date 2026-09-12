import { MetadataRoute } from 'next';
import { routing } from '@/src/i18n/routing';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://numelyra.online').replace(/\/$/, '');

const routes = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/indicators', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/chat', changeFrequency: 'daily', priority: 0.8 },
  { path: '/lucky-wallpaper', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/assessment', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
] as const;

function localizedUrl(locale: string, path: string) {
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${baseUrl}${localePrefix}${path}`;
}

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
