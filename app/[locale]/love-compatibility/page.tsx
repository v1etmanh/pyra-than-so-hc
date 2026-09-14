import type { Metadata } from 'next';
import { BaziLovePage } from '@/components/BaziLove/BaziLovePage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '/love-compatibility');
}

export default function LoveCompatibilityRoute() {
  return <BaziLovePage />;
}
