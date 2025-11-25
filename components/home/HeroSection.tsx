'use client';

import { ReactNode } from 'react';
import { StandardCTA } from '@/components/cta';

interface HeroSectionProps {
  badge?: string;
  title: string | ReactNode;
  subtitle: string;
  ctaText?: string;
  ctaHref?: string;
  ctaMicrocopy?: string;
}

/**
 * HeroSection Component
 * 
 * Hero section with badge, title, subtitle, and CTA.
 * Uses StandardCTA for consistent styling and authentication-aware behavior.
 */
export function HeroSection({
  badge = 'Closed Beta • Invite only',
  title,
  subtitle,
  ctaText,
  ctaHref,
  ctaMicrocopy = 'Check your email',
}: HeroSectionProps) {
  return (
    <section 
      id="hero"
      className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center px-4 py-20 md:py-24 text-center md:px-6 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-5xl w-full">
        {/* Beta Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse motion-reduce:animate-none" />
            {badge}
          </div>
        </div>
        
        {/* Title */}
        <h1 className="mb-8 text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-3xl text-xl md:text-2xl lg:text-3xl leading-relaxed text-gray-400">
          {subtitle}
        </p>
        
        {/* CTA Button - Now using StandardCTA */}
        <div className="flex justify-center">
          <StandardCTA
            text={ctaText}
            href={ctaHref}
            microcopy={ctaMicrocopy}
            size="lg"
            variant="primary"
          />
        </div>
      </div>
    </section>
  );
}
