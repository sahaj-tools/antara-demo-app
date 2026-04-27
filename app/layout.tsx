import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Why this exists:
 * Shared HTML shell for the Antara demo app pages.
 *
 * What Antara expects:
 * Nothing directly here; this layout ensures consistent UX while testing auth states.
 *
 * Alternatives:
 * Teams can replace this with brand-specific layout components and analytics wrappers.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antara External IdP Demo",
  description: "Reference Next.js app for integrating Antara OAuth identity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
