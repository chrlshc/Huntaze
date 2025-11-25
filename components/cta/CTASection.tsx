'use client';

import { ReactNode } from 'react';
import { StandardCTA, CTAVariant, CTASize } from './StandardCTA';

interface CTAConfig {
  text?: string;
  href?: string;
  variant?: CTAVariant;
  microcopy?: string;
  showArrow?: boolean;
}

interface CTASectionProps {
  /**
   * Section title
   */
  title: string;
  /**
   * Section subtitle/description
   */
  subtitle?: string;
  /**
   * Primary CTA configuration
   */
  primaryCTA?: CTAConfig;
  /**
   * Secondary CTA configuration (optional)
   */
  secondaryCTA?: CTAConfig;
  /**
   * CTA size
   */
  size?: CTASize;
  /**
   * Background variant
   */
  background?: 'dark' | 'light' | 'gradient';
  /**
   * Custom className
   */
  className?: string;
  /**
   * Additional content to render below CTAs
   */
  children?: ReactNode;
}

const backgroundClasses = {
  dark: 'bg-gray-900 text-white',
  light: 'bg-white text-gray-900',
  gradient: 'bg-gradient-to-br from-purple-900 via-gray-900 to-gray-900 text-white',
};

/**
 * CTASection Component
 * 
 * Pre-built section component for CTAs with title, subtitle, and up to 2 CTAs.
 * Enforces the max 2 CTAs per section rule.
 * 
 * @example
 * ```tsx
 * <CTASection
 *   title="Ready to get started?"
 *   subtitle="Join thousands of creators already using Huntaze"
 *   primaryCTA={{ microcopy: "Check your email" }}
 *   secondaryCTA={{ text: "Learn More", href: "/features", variant: "secondary" }}
 * />
 * ```
 */
export function CTASection({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  size = 'lg',
  background = 'dark',
  className = '',
  children,
}: CTASectionProps) {
  return (
    <section
      className={`
        relative py-20 md:py-24 px-4 md:px-6 text-center overflow-hidden
        ${backgroundClasses[background]}
        ${className}
      `}
    >
      {/* Background glow for gradient variant */}
      {background === 'gradient' && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />
      )}

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Title */}
        <h2 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="mb-10 text-xl md:text-2xl text-gray-400 dark:text-gray-300 leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {/* Primary CTA */}
          <StandardCTA
            size={size}
            variant="primary"
            {...primaryCTA}
          />

          {/* Secondary CTA (optional) */}
          {secondaryCTA && (
            <StandardCTA
              size={size}
              variant="secondary"
              {...secondaryCTA}
            />
          )}
        </div>

        {/* Additional content */}
        {children}
      </div>
    </section>
  );
}
