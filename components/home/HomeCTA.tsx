'use client';

import Link from 'next/link';
import { StandardCTA } from '@/components/cta';

interface HomeCTAProps {
  title?: string;
  ctaText?: string;
  ctaHref?: string;
  ctaMicrocopy?: string;
  featuresLink?: string;
  pricingLink?: string;
  aboutLink?: string;
}

/**
 * HomeCTA Component
 * 
 * Final CTA section for the homepage.
 * Uses StandardCTA for consistent styling and authentication-aware behavior.
 */
export function HomeCTA({
  title = 'Ready to upgrade your workflow?',
  ctaText,
  ctaHref,
  ctaMicrocopy = 'Check your email',
  featuresLink = '/features',
  pricingLink = '/pricing',
  aboutLink = '/about',
}: HomeCTAProps) {
  return (
    <section 
      id="cta"
      className="relative min-h-screen flex items-center justify-center px-4 py-20 md:py-24 text-center md:px-6 overflow-hidden"
    >
      {/* Background gradient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-5xl w-full">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {title}
          </h2>
          
          {/* Primary CTA - Now using StandardCTA */}
          <div className="flex justify-center mb-10">
            <StandardCTA
              text={ctaText}
              href={ctaHref}
              microcopy={ctaMicrocopy}
              size="lg"
              variant="primary"
            />
          </div>
        
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-base">
            <Link
              href={featuresLink}
              className="text-gray-400 hover:text-white transition-colors no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none rounded px-2 py-1"
            >
              Explore Features →
            </Link>
            <Link
              href={pricingLink}
              className="text-gray-400 hover:text-white transition-colors no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none rounded px-2 py-1"
            >
              View Pricing →
            </Link>
            <Link
              href={aboutLink}
              className="text-gray-400 hover:text-white transition-colors no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none rounded px-2 py-1"
            >
              About Us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
