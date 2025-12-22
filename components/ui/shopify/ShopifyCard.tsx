'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ShopifyCardProps {
  children: React.ReactNode;
  className?: string;
  /** Padding size: 'sm' = 12px, 'md' = 16px, 'lg' = 20px, 'xl' = 24px */
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  /** Whether to show the border */
  bordered?: boolean;
  /** Whether to show the shadow */
  shadow?: boolean;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Test ID for testing */
  'data-testid'?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-3',    // 12px
  md: 'p-4',    // 16px
  lg: 'p-5',    // 20px
  xl: 'p-6',    // 24px
};

/**
 * ShopifyCard - A card component following Shopify Admin design patterns
 * 
 * Features:
 * - White background (#ffffff)
 * - 1px border (tokenized)
 * - Subtle shadow (tokenized)
 * - Rounded corners (tokenized)
 * - Configurable padding (default 24px)
 */
export function ShopifyCard({
  children,
  className,
  padding = 'xl',
  bordered = true,
  shadow = true,
  header,
  footer,
  onClick,
  'data-testid': testId,
}: ShopifyCardProps) {
  const isInteractive = !!onClick;

  return (
    <div
      className={cn(
        // Base styles - Shopify card design + FORCE WIDTH
        'w-full min-w-0 bg-white rounded-[var(--radius-card)] overflow-hidden transition-shadow duration-200',
        // Border
        bordered && 'border border-[var(--border-default)] hover:border-[var(--border-emphasis)]',
        // Shadow - Shopify subtle shadow
        shadow && 'shadow-[var(--of-shadow-card-saas)] hover:shadow-[var(--of-shadow-card-hover-saas)]',
        // Interactive states
        isInteractive && [
          'cursor-pointer',
          // Focus indicator for accessibility
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-offset-2',
          'focus-visible:ring-[var(--shopify-border-focus)]',
        ],
        className
      )}
      onClick={onClick}
      data-testid={testId}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Header */}
      {header && (
        <div className={cn(
          'border-b border-[var(--border-default)]',
          paddingMap[padding]
        )}>
          {header}
        </div>
      )}

      {/* Content */}
      <div className={cn(paddingMap[padding])}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={cn(
          'border-t border-[var(--border-default)]',
          paddingMap[padding]
        )}>
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * ShopifyCardSection - A section within a ShopifyCard
 * Used to divide card content with visual separators
 */
export interface ShopifyCardSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Title for the section */
  title?: string;
  /** Whether this section has a top border */
  divided?: boolean;
}

export function ShopifyCardSection({
  children,
  className,
  title,
  divided = false,
}: ShopifyCardSectionProps) {
  return (
    <div
      className={cn(
        divided && 'border-t border-[var(--border-default)] pt-4 mt-4',
        className
      )}
    >
      {title && (
        <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

export default ShopifyCard;
