import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Huntaze — Dashboard",
  description: "A clean Next.js dashboard for social planning and tracking links."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-background text-foreground"}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
