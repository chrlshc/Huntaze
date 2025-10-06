"use client";

import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[rgb(var(--color-header-bg))] text-[rgb(var(--color-header-fg))] border-b border-white/10" data-surface="dark">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:shadow"
      >
        Passer au contenu
      </a>
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Huntaze" width={24} height={24} priority />
          <span className="sr-only">Huntaze</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/pricing" className="hidden sm:inline text-sm opacity-90 hover:opacity-100">
            Tarifs
          </Link>
          <Button intent="brand">Essayer</Button>
        </nav>
      </div>
    </header>
  );
}

