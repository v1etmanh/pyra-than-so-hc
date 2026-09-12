import type { Metadata } from 'next';
import CalculatorShell from '@/components/calculator/CalculatorShell';
import { CALCULATOR_PAGES } from '@/lib/numerology/calculator-content';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, '/personality-number-calculator');
}

export default function PersonalityCalculatorPage() {
  return <CalculatorShell data={CALCULATOR_PAGES['personality-number-calculator']} />;
}
