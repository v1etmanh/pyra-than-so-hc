import type { Metadata } from 'next';
import ChaniAppPage from '@/components/sites/chani-com-6d20749d/app-f53b52ad/ChaniAppPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '/assessment');
}

export default function AssessmentPage() {
  return <ChaniAppPage />;
}
