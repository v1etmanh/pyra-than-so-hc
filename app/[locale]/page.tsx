import type { Metadata } from 'next';
import ChaniHomePage from '@/components/sites/chani-com-6d20749d/root-8a5edab2/ChaniHomePage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '');
}

export default function HomePage() {
  return <ChaniHomePage />;
}
