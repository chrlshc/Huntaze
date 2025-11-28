import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./responsive-enhancements.css";
import "./animations.css";
import "@/styles/design-system.css"; // Beta Launch Design System
import "@/styles/premium-design-tokens.css"; // Premium Homepage Design Tokens
import "@/styles/skeleton-animations.css"; // Phase 7: Enhanced Loading States
import "@/components/accessibility/skip-link.css"; // Phase 8: Accessibility
import { NextAuthProvider } from "@/components/auth/NextAuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SkipLink } from "@/components/accessibility/SkipLink";
import "@/lib/config/chartConfig"; // Register Chart.js components


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'),
  title: "Huntaze - Double Your Revenue, Half the Work",
  description: "Join 5,000+ creators who automated their business. Save 20+ hours weekly with smart AI.",
  keywords: "OnlyFans automation, creator growth, AI assistant, unified inbox, revenue analytics, productivity",
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
    title: "Huntaze - Double Your Revenue, Half the Work",
    description: "Join 5,000+ creators who automated their business. Save 20+ hours weekly with smart AI.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Huntaze - Double Your Revenue, Half the Work",
    description: "Join 5,000+ creators who automated their business. Save 20+ hours weekly with smart AI.",
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
      <body className="antialiased" suppressHydrationWarning>
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
