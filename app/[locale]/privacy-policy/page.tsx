import { LegalPage } from '@/components/Legal/LegalPage';

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage locale={locale} kind="privacy" />;
}

