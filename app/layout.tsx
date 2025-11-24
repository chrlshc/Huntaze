import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import "./mobile.css";
import "./mobile-optimized.css";
import "./responsive-enhancements.css";
import "./animations.css";
import "@/styles/design-system.css"; // Beta Launch Design System
import "@/styles/skeleton-animations.css"; // Phase 7: Enhanced Loading States
import "@/components/accessibility/skip-link.css"; // Phase 8: Accessibility
import { NextAuthProvider } from "@/components/auth/NextAuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SkipLink } from "@/components/accessibility/SkipLink";
import "@/lib/config/chartConfig"; // Register Chart.js components

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'),
  title: "Huntaze - Run Your Creator Business on Autopilot",
  description: "Focus on creating content. We handle the analytics, marketing, and growth. Closed Beta.",
  keywords: "creator automation, AI assistant, analytics, marketing automation, content creator tools",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      ['max-snippet']: -1,
      ['max-image-preview']: 'large',
      ['max-video-preview']: -1,
    },
  },
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: "/huntaze-favicon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Huntaze - Run Your Creator Business on Autopilot",
    description: "Focus on creating content. We handle the analytics, marketing, and growth.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Huntaze - Run Your Creator Business on Autopilot",
    description: "Focus on creating content. We handle the analytics, marketing, and growth.",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <SkipLink />
        <ThemeProvider>
          <NextAuthProvider>
            <main id="main-content" className="min-h-screen" role="main">
              {children}
            </main>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
