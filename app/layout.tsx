import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import HeaderImproved from "@/components/header-improved";
import FooterImproved from "@/components/footer-improved";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import PageTransition from "@/components/page-transition";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
  title: "Huntaze - Keep More of Your Creator Revenue",
  description: "Stop paying 50% to agencies. Automate fan conversations with AI while you keep control and earnings.",
  keywords: "OnlyFans automation, creator platform, AI chatbot, content creator tools, OnlyFans agency alternative",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Huntaze - Keep More of Your Creator Revenue",
    description: "Stop paying 50% to agencies. Automate fan conversations with AI.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Huntaze - Keep More of Your Creator Revenue",
    description: "Stop paying 50% to agencies. Automate fan conversations with AI.",
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
        <link rel="stylesheet" href="/styles/design-system.css" />
        <script src="/scroll-fix.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolved = theme === 'system' ? systemTheme : theme;
                document.documentElement.classList.add(resolved);
              } catch {}
              
              // Force scroll to top on page load
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors" data-ui={minimal ? 'minimal' : undefined}>
        <ThemeProvider>
          <NotificationProvider>
            <HeaderImproved />
            <PageTransition>
              <main className="min-h-screen">
                {children}
              </main>
            </PageTransition>
            <FooterImproved />
            <MobileBottomNav />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
