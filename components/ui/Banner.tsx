/**
 * Banner Component
 * 
 * Displays contextual messages with semantic colors based on status.
 * Supports icon, title, description, action button, and dismiss functionality.
 * 
 * Feature: dashboard-design-refactor
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  X,
  LucideIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type BannerStatus = 'info' | 'warning' | 'critical' | 'success';

export interface BannerAction {
  label: string;
  onClick: () => void;
}

export interface BannerProps {
  /** Status determines semantic color */
  status: BannerStatus;
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Custom icon (overrides default status icon) */
  icon?: React.ReactNode;
  /** Action button configuration */
  action?: BannerAction;
  /** Dismiss callback - if provided, shows close button */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// Status to icon mapping
const statusIcons: Record<BannerStatus, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  success: CheckCircle,
};

// Status to color mapping using design tokens
// These colors ensure WCAG 4.5:1 contrast ratio
const statusStyles: Record<BannerStatus, {
  background: string;
  border: string;
  icon: string;
  text: string;
}> = {
  info: {
    background: 'bg-[#EBF5FF]', // Light blue
    border: 'border-[var(--color-status-info)]',
    icon: 'text-[var(--color-status-info)]',
    text: 'text-[#1E3A5F]', // Dark blue for contrast
  },
  warning: {
    background: 'bg-[#FFF8E6]', // Light yellow
    border: 'border-[var(--color-status-warning)]',
    icon: 'text-[var(--color-status-warning)]',
    text: 'text-[#5C4813]', // Dark yellow/brown for contrast
  },
  critical: {
    background: 'bg-[#FFF4F4]', // Light red
    border: 'border-[var(--color-status-critical)]',
    icon: 'text-[var(--color-status-critical)]',
    text: 'text-[#5C1A1A]', // Dark red for contrast
  },
  success: {
    background: 'bg-[#F0FDF4]', // Light green
    border: 'border-[var(--color-status-success)]',
    icon: 'text-[var(--color-status-success)]',
    text: 'text-[#14532D]', // Dark green for contrast
  },
};

/**
 * Banner component for displaying contextual messages.
 * 
 * @example
 * ```tsx
 * <Banner
 *   status="info"
 *   title="New feature available"
 *   description="Check out our new analytics dashboard."
 *   action={{ label: "Learn more", onClick: handleLearnMore }}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function Banner({
  status,
  title,
  description,
  icon,
  action,
  onDismiss,
  className,
}: BannerProps) {
  const IconComponent = statusIcons[status];
  const styles = statusStyles[status];

  return (
    <div
      className={cn(
        // Base styles
        'flex items-start gap-[var(--space-3)] p-[var(--space-4)]',
        'rounded-[var(--radius-base)] border',
        // Status-specific styles
        styles.background,
        styles.border,
        className
      )}
      role="alert"
      data-testid="banner"
      data-status={status}
    >
      {/* Icon */}
      <div 
        className={cn('flex-shrink-0 mt-0.5', styles.icon)}
        data-testid="banner-icon"
      >
        {icon || <IconComponent className="h-5 w-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 
          className={cn(
            'text-[var(--font-size-sm)] font-[var(--font-weight-semibold)]',
            styles.text
          )}
          data-testid="banner-title"
        >
          {title}
        </h4>
        
        {description && (
          <p 
            className={cn(
              'mt-1 text-[var(--font-size-sm)]',
              styles.text,
              'opacity-90'
            )}
            data-testid="banner-description"
          >
            {description}
          </p>
        )}

        {action && (
          <div className="mt-[var(--space-3)]" data-testid="banner-action">
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className={cn(
                'text-[var(--font-size-sm)]',
                styles.text,
                'border-current hover:bg-black/5'
              )}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-[var(--radius-sm)]',
            'hover:bg-black/10 transition-colors',
            styles.text
          )}
          aria-label="Dismiss"
          data-testid="banner-dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default Banner;
