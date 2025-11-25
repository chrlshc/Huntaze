'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface HeroSectionProps {
  badge?: string;
  title: string | ReactNode;
  subtitle: string;
  ctaText?: string;
  ctaHref?: string;
}

export function HeroSection({
  badge = 'Closed Beta • Invite only',
  title,
  subtitle,
  ctaText = 'Request Early Access',
  ctaHref = '/auth/register',
}: HeroSectionProps) {
  return (
    <section 
      id="hero"
      className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center px-4 py-20 md:py-24 text-center md:px-6 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Beta Badge */}
        <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-6 backdrop-blur-sm">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse motion-reduce:animate-none" />
          {badge}
        </div>
        
        {/* Title */}
        <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-400">
          {subtitle}
        </p>
        
        {/* CTA Button */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={ctaHref}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none text-base font-medium text-white no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}
