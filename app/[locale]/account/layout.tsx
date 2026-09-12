import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata = privatePageMetadata;

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
