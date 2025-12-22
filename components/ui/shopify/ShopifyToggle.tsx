'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ShopifyToggleProps {
  /** Unique identifier for the toggle */
  id: string;
  /** Whether the toggle is checked */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Label text for the toggle */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Hide the visible label/description (keeps SR label) */
  hideLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * ShopifyToggle - Toggle switch component following Shopify design patterns
 * 
 * Features:
 * - Smooth animation (200ms transition)
 * - Clear on/off states with color coding
 * - Accessible with keyboard support
 * - Proper focus indicators
 * - Optional label and description
 */
export function ShopifyToggle({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  hideLabel = false,
  className,
  'data-testid': testId,
}: ShopifyToggleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cn('flex items-start gap-3', className)} data-testid={testId}>
      {/* Toggle Switch */}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full',
          'min-h-0',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]',
          checked ? 'bg-slate-900' : 'bg-slate-200',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        )}
        data-testid="toggle-switch"
      >
        <span className="sr-only">{label || 'Toggle'}</span>
        <span
          className={cn(
            'pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow',
            'transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
          data-testid="toggle-knob"
        />
      </button>

      {/* Label and Description */}
      {!hideLabel && (label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'block text-sm font-medium text-[#1a1a1a]',
                !disabled && 'cursor-pointer'
              )}
              data-testid="toggle-label"
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className="text-sm text-[#6b7177] mt-1"
              data-testid="toggle-description"
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ShopifyToggle;
