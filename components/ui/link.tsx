"use client";

import { forwardRef } from "react";
import NextLink from "next/link";

import { cn } from "@/lib/utils";

/**
 * Link Component - Task 41: Visual Distinction for Interactive Elements
 * 
 * Requirements: 9.4 - Interactive elements must have clear visual affordance
 * 
 * All link variants include:
 * - Distinct color to indicate interactivity
 * - Underline or clear hover effect
 * - Smooth transitions for better UX
 * 
 * Variants:
 * - default: Accent color + underline on hover
 * - subtle: Secondary color + underline on hover
 * - inline: Underlined by default (for body text)
 * - nav: Navigation link style with background hover
 */

type LinkVariant = "default" | "subtle" | "inline" | "nav";

export type LinkProps = Omit<React.ComponentPropsWithoutRef<typeof NextLink>, "className"> & {
  variant?: LinkVariant;
  className?: string;
  external?: boolean;
};

const variantClasses: Record<LinkVariant, string> = {
  // Default: Accent color with underline on hover
  default:
    "text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] underline-offset-4 hover:underline transition-[color,text-decoration] duration-[var(--transition-base)]",
  
  // Subtle: Secondary text color with underline on hover
  subtle:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-4 hover:underline transition-[color,text-decoration] duration-[var(--transition-base)]",
  
  // Inline: Always underlined for body text (clear affordance)
  inline:
    "text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] underline underline-offset-4 transition-colors duration-[var(--transition-base)]",
  
  // Nav: Navigation link with background hover
  nav:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] transition-[color,background-color] duration-[var(--transition-base)]",
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { variant = "default", className, external = false, children, ...props },
  ref,
) {
  const combinedClassName = cn(
    // Base styles for all links
    "inline-flex items-center gap-[var(--space-1)]",
    "focus-visible:outline-none",
    "focus-visible:ring-[length:var(--focus-ring-width)]",
    "focus-visible:ring-[var(--focus-ring-color)]",
    "focus-visible:ring-offset-[length:var(--focus-ring-offset)]",
    "rounded-[var(--radius-sm)]",
    // Variant-specific styles
    variantClasses[variant],
    className,
  );

  // External links
  if (external) {
    return (
      <a
        ref={ref}
        className={combinedClassName}
        target="_blank"
        rel="noopener noreferrer"
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
        {/* External link icon for accessibility */}
        <svg
          className="w-3 h-3 opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    );
  }

  // Internal Next.js links
  return (
    <NextLink ref={ref} className={combinedClassName} {...props}>
      {children}
    </NextLink>
  );
});
