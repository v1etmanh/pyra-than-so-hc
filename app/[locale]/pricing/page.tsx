import { PricingPage } from '@/components/Billing/PricingPage';

export default async function PricingRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <PricingPage locale={locale} />;
}

