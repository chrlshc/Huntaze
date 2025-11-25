'use client';

import Link from 'next/link';

interface HomeCTAProps {
  title?: string;
  ctaText?: string;
  ctaHref?: string;
  featuresLink?: string;
  pricingLink?: string;
  aboutLink?: string;
}

export function HomeCTA({
  title = 'Ready to upgrade your workflow?',
  ctaText = 'Request Access',
  ctaHref = '/auth/register',
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
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-5xl w-full">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {title}
          </h2>
          
          {/* Primary CTA */}
          <div className="flex justify-center mb-10">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none text-lg font-semibold text-white no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none whitespace-nowrap"
            >
              {ctaText}
            </Link>
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
