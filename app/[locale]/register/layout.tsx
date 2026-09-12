import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata = privatePageMetadata;

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
