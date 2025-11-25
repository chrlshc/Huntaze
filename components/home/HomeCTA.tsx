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
    <section className="px-4 py-16 md:py-20 lg:py-24 text-center md:px-6">
      <div className="mx-auto max-w-[600px]">
        <h2 className="mb-8 text-3xl md:text-4xl lg:text-5xl font-medium text-white">
          {title}
        </h2>
        
        {/* Primary CTA */}
        <Link
          href={ctaHref}
          className="inline-block rounded-md bg-[#7D57C1] px-8 py-3 text-base font-medium text-white no-underline hover:bg-[#8E65D4] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none transition-colors"
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
    </section>
  );
}
