import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./animations.css";
import "./glass.css";
import "../styles/remove-dark-overlay.css";
import "../styles/no-dark-filters.css";
import "../styles/mockups.css";
import "../styles/shopify-typography.css";
import "../styles/app-visuals.css";
import "../styles/performance-optimizations.css";
import "../styles/fix-animations.css"; // MUST BE LAST to fix animations
import "../styles/simple-animations.css"; // Simple CSS animations
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import MobileBottomNav from "@/src/components/mobile-bottom-nav";
import PageTransition from "@/src/components/page-transition";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { FloatingAssistant } from "@/src/components/floating-assistant";
import RemoveDarkOverlay from "@/components/RemoveDarkOverlay";
import AppSidebar from "@/src/components/app-sidebar";
import PerformanceMonitor from "@/components/PerformanceMonitor";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
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
  const minimal = (process.env.NEXT_PUBLIC_MINIMAL_UI || '').toLowerCase() === 'true';
  const disableOverlays = (process.env.NEXT_PUBLIC_DISABLE_OVERLAYS || '').toLowerCase() === 'true';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333EA" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="stylesheet" href="/styles/design-system.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolved = theme === 'system' ? systemTheme : theme;
                document.documentElement.setAttribute('data-theme', resolved);
                document.documentElement.classList.add(resolved);
                if (resolved === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.body?.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.body?.classList.remove('dark');
                }
              } catch {}
              
              // Optional overlay suppression (only when explicitly enabled)
              if (${(process.env.NEXT_PUBLIC_DISABLE_OVERLAYS || '').toLowerCase() === 'true'}) {
                const style = document.createElement('style');
                style.textContent = \`
                  body[data-no-overlay="true"] *, 
                  body[data-no-overlay="true"] *::before, 
                  body[data-no-overlay="true"] *::after { 
                    filter: none !important; 
                    backdrop-filter: none !important; 
                    -webkit-backdrop-filter: none !important; 
                  }
                  body[data-no-overlay="true"] *:hover { 
                    filter: none !important; 
                    backdrop-filter: none !important; 
                    opacity: 1 !important; 
                    background: transparent !important;
                  }
                \`;
                document.head.appendChild(style);
              }

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
      <body className="antialiased bg-white dark:bg-black text-gray-900 dark:text-white" data-ui={minimal ? 'minimal' : undefined} data-no-overlay={disableOverlays ? 'true' : undefined}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded" aria-label="Skip to content">Skip to content</a>
        <GoogleAnalytics />
        <RemoveDarkOverlay />
        <PerformanceMonitor />
        <Providers>
          {/* Sidebar app (affiche seulement sur routes post-login) */}
          <AppSidebar />
          <HeaderImproved />
          <PageTransition>
            <main id="main" className="app-main min-h-screen">
              {children}
            </main>
          </PageTransition>
          <FooterImproved />
          <MobileBottomNav />
          <FloatingAssistant />
        </Providers>
      </body>
    </html>
  );
}
