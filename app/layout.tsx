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
import { PolarisProvider } from "@/components/providers/PolarisProvider";
import { MockApiProvider } from "@/components/providers/MockApiProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";
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
      { url: "/logos/huntaze-vertical.svg", type: "image/svg+xml" },
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="var(--accent-info)" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: '#F1F2F4' }}
        suppressHydrationWarning
      >
        <MockApiProvider>
          <ThemeProvider>
            <PolarisProvider>
              <NextAuthProvider>
                <SWRProvider>
                  <div className="app-wrapper flex min-h-screen flex-col">
                    {children}
                  </div>
                </SWRProvider>
              </NextAuthProvider>
            </PolarisProvider>
          </ThemeProvider>
        </MockApiProvider>
      </body>
    </html>
  );
}
