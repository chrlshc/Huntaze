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
      
      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mx-auto max-w-[600px]">
          <h2 className="mb-8 text-3xl md:text-4xl lg:text-5xl font-medium text-white">
            {title}
          </h2>
          
          {/* Primary CTA */}
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none text-base font-medium text-white no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none whitespace-nowrap"
          >
            {ctaText}
          </Link>
        
          {/* Navigation Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href={featuresLink}
              className="text-gray-400 hover:text-white transition-colors no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none rounded"
            >
              Explore Features →
            </Link>
            <Link
              href={pricingLink}
              className="text-gray-400 hover:text-white transition-colors no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none rounded"
            >
              View Pricing →
            </Link>
            <Link
              href={aboutLink}
              className="text-gray-400 hover:text-white transition-colors no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none rounded"
            >
              About Us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
