import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata = privatePageMetadata;

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
