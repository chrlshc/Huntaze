import type { Metadata } from "next";
import "./globals.css";
import "../styles/hz-theme.css";
// import HeaderShopify from "@/src/components/header-shopify";
// import FooterImproved from "@/src/components/footer-improved";
// import MobileBottomNav from "@/src/components/mobile-bottom-nav";
// import PageTransition from "@/src/components/page-transition";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";
// Trimmed overlay components to avoid stacked styles
// Sidebar disabled on marketing pages to avoid overlay
// import AppSidebar from "@/src/components/app-sidebar";


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
  const minimal = (process.env.NEXT_PUBLIC_MINIMAL_UI || '').toLowerCase() === 'true';
  const disableOverlays = (process.env.NEXT_PUBLIC_DISABLE_OVERLAYS || '').toLowerCase() === 'true';
  const forceDark = false; // Disabled to fix blank page issue
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Critical: Theme initialization MUST be first to prevent FOUC */}
        <script src="/theme-init.js" />
        {/* Inter font (Linear-style) */}
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333EA" />
        <link rel="apple-touch-icon" href="/icon-512x512.png" />
        {forceDark && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Always use dark theme
                localStorage.setItem('theme', 'dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.classList.add('dark');
                document.body?.classList.add('dark', 'bg-black', 'text-white');
                document.body?.classList.remove('bg-white', 'text-gray-900');
                document.body?.style.backgroundColor = 'black';
                document.body?.style.color = '#e5e7eb';
              } catch {}
              
              // Force overlay suppression
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

              // Force scroll to top on page load
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              
              // Register service worker only outside localhost to avoid dev caching issues
              if ('serviceWorker' in navigator && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    registration => console.log('SW registered:', registration),
                    error => console.log('SW registration failed:', error)
                  );
                });
              }
            `,
          }}
        />)}
        {/* No additional global styles injected to prevent overlap */}
      </head>
      <body className="antialiased" data-ui={minimal ? 'minimal' : undefined}>
        <GoogleAnalytics />
        <Providers>
          {/* Enterprise page has its own navigation and footer */}
          <main id="main" className="app-main content min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
