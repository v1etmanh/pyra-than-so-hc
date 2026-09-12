import type { Metadata } from 'next';
import { NuminaTarotPage } from '@/components/Tarot/NuminaTarotPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '/chat');
}

export default function ChatPage() {
  return <NuminaTarotPage />;
}
