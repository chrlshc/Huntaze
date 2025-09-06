"use client";

import { NavigationPro } from "./NavigationPro";
import { FooterPro } from "./FooterPro";

interface LayoutProProps {
  children: React.ReactNode;
}

export function LayoutPro({ children }: LayoutProProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationPro />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <FooterPro />
    </div>
  );
}