import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHANI — Astrology for radical self-acceptance",
  description: "A visual recreation of the CHANI homepage for UI study.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
