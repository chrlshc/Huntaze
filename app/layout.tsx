import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HeaderImproved from "@/components/header-improved";
import FooterImproved from "@/components/footer-improved";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import PageTransition from "@/components/page-transition";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Huntaze - Keep 98% of Your Creator Revenue",
  description: "Stop paying 50% to agencies. Our AI handles everything 24/7 while you keep control and earnings. Join 500+ creators saving millions.",
  keywords: "OnlyFans automation, creator platform, AI chatbot, content creator tools, OnlyFans agency alternative",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Huntaze - Keep 98% of Your Creator Revenue",
    description: "Stop paying 50% to agencies. Our AI handles everything 24/7.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Huntaze - Keep 98% of Your Creator Revenue",
    description: "Stop paying 50% to agencies. Our AI handles everything 24/7.",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles/design-system.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolved = theme === 'system' ? systemTheme : theme;
                document.documentElement.classList.add(resolved);
              } catch {}
              
              // Scroll to top on page load
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              window.scrollTo(0, 0);
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <ThemeProvider>
          <HeaderImproved />
          <PageTransition>
            <main className="min-h-screen">
              {children}
            </main>
          </PageTransition>
          <FooterImproved />
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}