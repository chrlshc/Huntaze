'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

export type CTAVariant = 'primary' | 'secondary' | 'outline';
export type CTASize = 'sm' | 'md' | 'lg';

interface StandardCTAProps {
  /**
   * CTA text - defaults to "Join Beta" for unauthenticated, "Go to Dashboard" for authenticated
   */
  text?: string;
  /**
   * Destination URL - defaults to /signup for unauthenticated, /dashboard for authenticated
   */
  href?: string;
  /**
   * Visual variant
   */
  variant?: CTAVariant;
  /**
   * Size variant
   */
  size?: CTASize;
  /**
   * Microcopy displayed below the button (e.g., "Check your email")
   */
  microcopy?: string;
  /**
   * Show arrow icon
   */
  showArrow?: boolean;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Override authentication-aware behavior
   */
  ignoreAuth?: boolean;
  /**
   * Icon to display (overrides arrow)
   */
  icon?: ReactNode;
  /**
   * Full width button
   */
  fullWidth?: boolean;
}

const sizeClasses: Record<CTASize, string> = {
  sm: 'px-6 py-2.5 text-sm',
  md: 'px-8 py-4 text-base',
  lg: 'px-10 py-5 text-lg',
};

const variantClasses: Record<CTAVariant, string> = {
  primary:
    'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)]',
  secondary:
    'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm',
  outline:
    'bg-transparent text-purple-600 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
};

/**
 * StandardCTA Component
 * 
 * Provides consistent CTA styling and behavior across the application.
 * Automatically adapts text and destination based on authentication status.
 * 
 * @example
 * ```tsx
 * // Basic usage (authentication-aware)
 * <StandardCTA />
 * 
 * // With microcopy
 * <StandardCTA microcopy="Check your email" />
 * 
 * // Custom text and destination
 * <StandardCTA text="Learn More" href="/features" variant="secondary" />
 * 
 * // Secondary CTA
 * <StandardCTA variant="secondary" text="View Pricing" href="/pricing" />
 * ```
 */
export function StandardCTA({
  text,
  href,
  variant = 'primary',
  size = 'md',
  microcopy,
  showArrow = false,
  className = '',
  ignoreAuth = false,
  icon,
  fullWidth = false,
}: StandardCTAProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = !ignoreAuth && status === 'authenticated';

  // Default text based on authentication status
  const defaultText = isAuthenticated ? 'Go to Dashboard' : 'Join Beta';
  const defaultHref = isAuthenticated ? '/dashboard' : '/signup';

  const finalText = text || defaultText;
  const finalHref = href || defaultHref;

  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] focus:outline-none';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`flex flex-col items-center gap-2 ${fullWidth ? 'w-full' : ''}`}>
      <Link
        href={finalHref}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${widthClass}
          ${className}
        `}
      >
        {finalText}
        {icon || (showArrow && <ArrowRight className="ml-2 h-5 w-5" />)}
      </Link>
      
      {microcopy && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {microcopy}
        </p>
      )}
    </div>
  );
}
