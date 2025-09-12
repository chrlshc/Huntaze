import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./mobile-emergency-fix.css";
import "./nuclear-mobile-fix.css";
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
import "../styles/link-hover.css"; // Link hover effects
import "../styles/nebula-background.css"; // Purple nebula effects
import "../styles/mobile-standards.css"; // Mobile design standards
import "../styles/viewport-fixes.css"; // Fix viewport units for mobile
import "../styles/button-mobile-optimized.css"; // Mobile-optimized buttons
import "../styles/spacing-grid-system.css"; // 8px baseline grid system
import "../styles/safe-zones-dead-areas.css"; // Safe zones and gesture areas
import "../styles/mobile-responsive-fix.css"; // Mobile responsive fixes
// import "../styles/mobile-force-light.css"; // DISABLED - Using dark theme
import "../styles/header-mobile-fix.css"; // Fix header on mobile
import "../styles/high-contrast.css"; // High contrast for better readability
// import "../styles/dark-theme-pro.css"; // Professional dark theme (disabled for now)
import "../styles/contrast-improvements.css"; // AA compliance contrast fixes
import "../styles/section-separation.css"; // Section visual separation
import "../styles/cta-buttons.css"; // Unified CTA button styles
import "../styles/typography-fixes.css"; // Typography visibility fixes
import "../styles/enterprise.css"; // Enterprise landing page styles
import "../styles/clean-dark-theme.css"; // Clean dark theme
// import HeaderShopify from "@/src/components/header-shopify";
// import FooterImproved from "@/src/components/footer-improved";
// import MobileBottomNav from "@/src/components/mobile-bottom-nav";
// import PageTransition from "@/src/components/page-transition";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import RemoveDarkOverlay from "@/components/RemoveDarkOverlay";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import MobileLightTheme from "@/components/MobileLightTheme";
import MobileForceLightCSS from "@/components/MobileForceLightCSS";
// Sidebar disabled on marketing pages to avoid overlay
// import AppSidebar from "@/src/components/app-sidebar";


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
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="stylesheet" href="/styles/design-system.css?v=dev" />
        <link rel="stylesheet" href="/styles/linear-typography.css?v=dev" />
        <link rel="stylesheet" href="/styles/minimal.css?v=dev" />
        {/* Linear-inspired dark mode system */}
        <link rel="stylesheet" href="/styles/design-tokens-dark.css?v=dev" />
        <link rel="stylesheet" href="/styles/linear-style-dark.css?v=dev" />
        <link rel="stylesheet" href="/styles/section-styles-dark.css?v=dev" />
        <link rel="stylesheet" href="/styles/theme-transitions.css?v=dev" />
        <link rel="stylesheet" href="/styles/colorblind-filters.css?v=dev" />
        {/* Huntaze premium tokens (override) */}
        <link rel="stylesheet" href="/styles/huntaze-tokens.css?v=dev" />
        <link rel="stylesheet" href="/styles/amoled-mode.css?v=dev" />
        {/* Force dark mode - MUST be last */}
        <link rel="stylesheet" href="/styles/force-dark-mode.css?v=dev" />
        {/* Clean dark theme - No purple, pure black */}
        <link rel="stylesheet" href="/styles/clean-dark-theme.css?v=dev" />
        {/* Linear exact theme - Match Linear.app */}
        <link rel="stylesheet" href="/styles/linear-exact-theme.css?v=dev" />
        {/* CTA button fixes */}
        <link rel="stylesheet" href="/styles/cta-button-fixes.css?v=dev" />
        {/* Full site fixes */}
        <link rel="stylesheet" href="/styles/full-site-fixes.css?v=dev" />
        {/* Final button fix - MUST be last */}
        <link rel="stylesheet" href="/styles/final-button-fix.css?v=dev" />
        {/* Emergency fix - Remove all borders */}
        <link rel="stylesheet" href="/styles/emergency-fix.css?v=dev" />
        {/* Linear dropdown fix - Match Linear.app */}
        <link rel="stylesheet" href="/styles/linear-dropdown-fix.css?v=dev" />
        {/* Remove purple sections - CRITICAL */}
        <link rel="stylesheet" href="/styles/remove-purple-sections.css?v=dev" />
        {/* FORCE BLACK EVERYWHERE - ABSOLUTELY NO PURPLE */}
        <link rel="stylesheet" href="/styles/force-black-everywhere.css?v=dev" />
        {/* Remove white backgrounds from nav */}
        <link rel="stylesheet" href="/styles/remove-white-backgrounds.css?v=dev" />
        {/* Mobile fixes script - must run early */}
        <script src="/mobile-fix.js" async />
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
        {/* Force remove ALL nav borders - MUST BE LAST */}
        <link rel="stylesheet" href="/styles/nav-no-borders.css?v=dev" />
        {/* Remove selection effect */}
        <link rel="stylesheet" href="/styles/remove-selection-effect.css?v=dev" />
        {/* Force remove nav borders with JS */}
        <script src="/remove-nav-borders.js" defer></script>
      </head>
      <body className="antialiased dark-mode theme-dark" data-ui={minimal ? 'minimal' : undefined}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded" aria-label="Skip to content">Skip to content</a>
        <GoogleAnalytics />
        <RemoveDarkOverlay />
        <PerformanceMonitor />
        {/* <MobileLightTheme />
        <MobileForceLightCSS /> */}
        {/* Colorblind filters */}
        <div dangerouslySetInnerHTML={{ __html: `
          <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
            <defs>
              <filter id="protanopia-filter">
                <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
              </filter>
              <filter id="deuteranopia-filter">
                <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
              </filter>
              <filter id="tritanopia-filter">
                <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
              </filter>
            </defs>
          </svg>
        ` }} />
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
