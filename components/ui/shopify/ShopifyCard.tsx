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
 * - 1px border (#e1e3e5)
 * - Subtle shadow (0 1px 3px rgba(0,0,0,0.08))
 * - 8px border-radius
 * - Configurable padding (default 20px)
 */
export function ShopifyCard({
  children,
  className,
  padding = 'lg',
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
        // Base styles - Shopify card design
        'bg-white rounded-lg',
        // Border
        bordered && 'border border-[#e1e3e5]',
        // Shadow - Shopify subtle shadow
        shadow && 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        // Interactive states
        isInteractive && [
          'cursor-pointer',
          'transition-shadow duration-200',
          'hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]',
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
          'border-b border-[#e1e3e5]',
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
          'border-t border-[#e1e3e5]',
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
        divided && 'border-t border-[#e1e3e5] pt-4 mt-4',
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
