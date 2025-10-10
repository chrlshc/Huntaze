import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";

import "@/styles/globals.css";
import "@/styles/hz-theme.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ToastProvider>
        <div className={`${inter.variable} font-sans min-h-screen bg-background-primary text-text-primary`}>
          <Component {...pageProps} />
        </div>
      </ToastProvider>
    </>
  );
}
