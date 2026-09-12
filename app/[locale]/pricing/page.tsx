import type { Metadata } from 'next';
import { PricingPage } from '@/components/Billing/PricingPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '/pricing');
}

export default async function PricingRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <PricingPage locale={locale} />;
}
