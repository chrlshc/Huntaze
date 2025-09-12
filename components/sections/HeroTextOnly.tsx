"use client";

import Link from 'next/link';

export default function HeroTextOnly() {
  return (
    <section className="section-block bg-white dark:bg-gray-800">
      <div className="container-mobile">
        {/* Logo placeholder */}
        <div className="mb-[40px]">
          <span className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white">HUNTAZE</span>
        </div>

        {/* Headline */}
        <h1 className="h1-mobile">
          <span className="block">DOUBLEZ VOS REVENUS</span>
          <span className="block">ONLYFANS EN 30 JOURS</span>
        </h1>

        {/* Subtext */}
        <p className="body-mobile mt-[40px] max-w-[36ch]">
          La plateforme IA qui automatise vos conversations et booste vos gains.
        </p>

        {/* CTA */}
        <div className="mt-[60px] max-w-md">
          <Link href="/auth" className="cta-full">COMMENCER GRATUITEMENT</Link>
        </div>
      </div>
    </section>
  );
}

