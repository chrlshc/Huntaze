import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./animations.css";
import "./glass.css";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import MobileBottomNav from "@/src/components/mobile-bottom-nav";
import PageTransition from "@/src/components/page-transition";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { SmoothScrollProvider } from "@/src/components/providers/SmoothScrollProvider";
import { FloatingAssistant } from "@/src/components/floating-assistant";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
  title: "Huntaze - Be the Next Million-Dollar Creator",
  description: "Join 10,000+ creators earning $50K+ monthly. AI that works 24/7, growing your empire while you sleep.",
  keywords: "OnlyFans automation, million dollar creator, AI empire builder, top 1% OnlyFans, creator success platform, passive income automation",
  icons: {
    icon: [
      { url: "/huntaze-favicon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Huntaze - Be the Next Million-Dollar Creator",
    description: "Join 10,000+ creators earning $50K+ monthly. AI that works 24/7, growing your empire while you sleep.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Huntaze - Be the Next Million-Dollar Creator",
    description: "Join 10,000+ creators earning $50K+ monthly. AI that works 24/7, growing your empire while you sleep.",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const minimal = (process.env.NEXT_PUBLIC_MINIMAL_UI || '').toLowerCase() === 'true';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333EA" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="stylesheet" href="/styles/design-system.css" />
        <script src="/scroll-fix.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolved = theme === 'system' ? systemTheme : theme;
                document.documentElement.setAttribute('data-theme', resolved);
              } catch {}
              
              // Force scroll to top on page load
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    registration => console.log('SW registered:', registration),
                    error => console.log('SW registration failed:', error)
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased" data-ui={minimal ? 'minimal' : undefined}>
        <GoogleAnalytics />
        <Providers>
          <SmoothScrollProvider>
            <HeaderImproved />
            <PageTransition>
              <main className="min-h-screen">
                {children}
              </main>
            </PageTransition>
            <FooterImproved />
            <MobileBottomNav />
            <FloatingAssistant />
          </SmoothScrollProvider>
        </Providers>
      </body>
    </html>
  );
}
