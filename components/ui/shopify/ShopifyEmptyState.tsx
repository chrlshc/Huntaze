'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ShopifyButton } from './ShopifyButton';
import { LucideIcon } from 'lucide-react';

export interface ShopifyEmptyStateProps {
  /** Title of the empty state */
  title: string;
  /** Description text */
  description?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Illustration image URL */
  illustration?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Variant for different contexts */
  variant?: 'default' | 'compact' | 'large';
  /** Additional class names */
  className?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * ShopifyEmptyState - Empty state component following Shopify Admin design
 * 
 * Features:
 * - Clear title and description
 * - Optional icon or illustration
 * - Primary and secondary action buttons
 * - Multiple size variants
 * - Centered layout with proper spacing
 */
export function ShopifyEmptyState({
  title,
  description,
  icon: Icon,
  illustration,
  action,
  secondaryAction,
  variant = 'default',
  className,
  'data-testid': testId,
}: ShopifyEmptyStateProps) {
  const variantStyles = {
    compact: {
      container: 'py-8',
      iconSize: 'w-12 h-12',
      titleSize: 'text-[16px]',
      descriptionSize: 'text-[13px]',
      maxWidth: 'max-w-md',
    },
    default: {
      container: 'py-12',
      iconSize: 'w-16 h-16',
      titleSize: 'text-[20px]',
      descriptionSize: 'text-[14px]',
      maxWidth: 'max-w-lg',
    },
    large: {
      container: 'py-16',
      iconSize: 'w-20 h-20',
      titleSize: 'text-[24px]',
      descriptionSize: 'text-[16px]',
      maxWidth: 'max-w-xl',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
      data-testid={testId}
    >
      <div className={cn('mx-auto', styles.maxWidth)}>
        {/* Icon or Illustration */}
        {illustration ? (
          <div className="mb-6">
            <img
              src={illustration}
              alt=""
              className="mx-auto max-w-[200px] h-auto"
              role="presentation"
            />
          </div>
        ) : Icon ? (
          <div className="mb-6">
            <div
              className={cn(
                'mx-auto rounded-full bg-[#f6f6f7] flex items-center justify-center',
                styles.iconSize
              )}
            >
              <Icon className="w-1/2 h-1/2 text-[#6b7177]" />
            </div>
          </div>
        ) : null}

        {/* Title */}
        <h3
          className={cn(
            'font-semibold text-[#202223] mb-2',
            styles.titleSize
          )}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            className={cn(
              'text-[#6b7177] mb-6',
              styles.descriptionSize
            )}
          >
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {action && (
              <ShopifyButton
                variant="primary"
                onClick={action.onClick}
                data-testid="empty-state-primary-action"
              >
                {action.label}
              </ShopifyButton>
            )}
            {secondaryAction && (
              <ShopifyButton
                variant="secondary"
                onClick={secondaryAction.onClick}
                data-testid="empty-state-secondary-action"
              >
                {secondaryAction.label}
              </ShopifyButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopifyEmptyState;
