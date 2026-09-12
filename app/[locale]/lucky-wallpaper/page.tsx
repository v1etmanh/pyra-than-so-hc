import type { Metadata } from 'next';
import { EditorsPicksPage } from '@/components/sites/chani-com-6d20749d/shared/ChaniInnerPages';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '/lucky-wallpaper');
}

export default function LuckyWallpaperPage() {
  return <EditorsPicksPage />;
}
