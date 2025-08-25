import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HeaderImproved from "@/components/header-improved";
import FooterImproved from "@/components/footer-improved";
import MobileBottomNav from "@/components/mobile-bottom-nav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Huntaze - Keep 98% of Your Creator Revenue",
  description: "Stop paying 50% to agencies. Our AI handles everything 24/7 while you keep control and earnings. Join 500+ creators saving millions.",
  keywords: "OnlyFans automation, creator platform, AI chatbot, content creator tools, OnlyFans agency alternative",
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
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="/styles/design-system.css" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        <HeaderImproved />
        <main className="min-h-screen">
          {children}
        </main>
        <FooterImproved />
        <MobileBottomNav />
      </body>
    </html>
  );
}