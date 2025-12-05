/**
 * Badge Component
 * 
 * Displays status indicators with consistent styling.
 * Uses semantic colors for different statuses.
 * 
 * Feature: dashboard-design-refactor
 * Validates: Requirements 6.3
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatus = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

export interface BadgeProps {
  /** Status determines the color */
  status: BadgeStatus;
  /** Badge text content */
  children: string;
  /** Size variant */
  size?: 'sm' | 'base';
  /** Additional CSS classes */
  className?: string;
}

// Status to color mapping using design tokens
const statusStyles: Record<BadgeStatus, {
  background: string;
  text: string;
  border: string;
}> = {
  success: {
    background: 'bg-[#E6F4EA]',
    text: 'text-[var(--color-status-success)]',
    border: 'border-[var(--color-status-success)]/20',
  },
  warning: {
    background: 'bg-[#FEF7E0]',
    text: 'text-[var(--color-status-warning)]',
    border: 'border-[var(--color-status-warning)]/20',
  },
  critical: {
    background: 'bg-[#FBEAE5]',
    text: 'text-[var(--color-status-critical)]',
    border: 'border-[var(--color-status-critical)]/20',
  },
  info: {
    background: 'bg-[#E8F4FD]',
    text: 'text-[var(--color-status-info)]',
    border: 'border-[var(--color-status-info)]/20',
  },
  neutral: {
    background: 'bg-[var(--color-surface-subdued)]',
    text: 'text-[var(--color-text-secondary)]',
    border: 'border-[var(--border-default)]',
  },
};

// Size configurations - consistent 12px font and 4px radius per design spec
const sizeStyles: Record<'sm' | 'base', {
  padding: string;
  fontSize: string;
}> = {
  sm: {
    padding: 'px-[var(--space-1)] py-0.5',
    fontSize: 'text-[11px]',
  },
  base: {
    padding: 'px-[var(--space-2)] py-[var(--space-1)]',
    fontSize: 'text-[12px]', // 12px as per design spec
  },
};

/**
 * Badge component for displaying status indicators.
 * 
 * @example
 * ```tsx
 * <Badge status="success">Active</Badge>
 * <Badge status="warning">Pending</Badge>
 * <Badge status="critical">Expired</Badge>
 * ```
 */
export function Badge({
  status,
  children,
  size = 'base',
  className,
}: BadgeProps) {
  const colors = statusStyles[status];
  const sizes = sizeStyles[size];

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center font-[var(--font-weight-medium)]',
        // Consistent 4px radius as per design spec
        'rounded-[4px]',
        // Border
        'border',
        // Size-specific styles
        sizes.padding,
        sizes.fontSize,
        // Status-specific colors
        colors.background,
        colors.text,
        colors.border,
        // Prevent text wrapping
        'whitespace-nowrap',
        className
      )}
      data-testid="badge"
      data-status={status}
      data-size={size}
    >
      {children}
    </span>
  );
}

export default Badge;
