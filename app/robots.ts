import { MetadataRoute } from 'next';
import { siteBaseUrl } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${siteBaseUrl}/sitemap.xml`,
  };
}
