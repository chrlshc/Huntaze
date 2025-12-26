'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface ShopifyInputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size' | 'prefix'> {
  /** Label text for the input */
  label?: string;
  /** Helper text below the input */
  helpText?: string;
  /** Error message to display */
  error?: string;
  /** Whether the input is in an error state */
  hasError?: boolean;
  /** Prefix content (icon or text) */
  prefix?: React.ReactNode;
  /** Suffix content (icon or text) */
  suffix?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * ShopifyInput - Input component following Shopify design patterns
 * 
 * Features:
 * - Clean border and focus states
 * - Optional label, help text, and error messages
 * - Prefix and suffix support
 * - Proper accessibility with ARIA attributes
 * - Rounded corners (tokenized)
 */
export const ShopifyInput = forwardRef<React.ElementRef<'input'>, ShopifyInputProps>(
  function ShopifyInput(
    {
      label,
      helpText,
      error,
      hasError,
      prefix,
      suffix,
      className,
      id,
      disabled,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const reactId = useId();
    const inputId = id || `input-${reactId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;
    const helpTextId = `${inputId}-help`;
    const showError = hasError || !!error;

    return (
      <div className={cn('w-full', className)} data-testid={testId}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#1a1a1a] mb-2"
            data-testid="input-label"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Prefix */}
          {prefix && (
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 text-[#6b7177]"
              data-testid="input-prefix"
            >
              {prefix}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={showError || undefined}
            aria-describedby={
              error ? errorId : helpText ? helpTextId : undefined
            }
            className={cn(
              // Base styles
              'w-full h-10 px-6 rounded-[var(--input-radius)]',
              'text-sm text-[#1a1a1a]',
              'bg-white',
              'border transition-colors duration-200',
              // Border colors
              showError
                ? 'border-[#d72c0d]'
                : 'border-[var(--border-default)]',
              // Focus state
              'focus:outline-none focus-visible:outline-none focus:ring-1 focus:ring-offset-0',
              showError
                ? 'focus:ring-[#d72c0d] focus:border-[#d72c0d]'
                : 'focus:ring-[var(--shopify-border-focus)] focus:border-[var(--shopify-border-focus)]',
              // Hover state
              !disabled && !showError && 'hover:border-[var(--border-emphasis)]',
              // Disabled state
              disabled && 'bg-[#f6f6f7] text-[#8c9196] cursor-not-allowed',
              // Padding adjustments for prefix/suffix
              prefix && 'pl-14',
              suffix && 'pr-16'
            )}
            data-testid="input-field"
            {...props}
          />

          {/* Suffix */}
          {suffix && (
            <div
              className="absolute right-6 top-1/2 -translate-y-1/2 text-[#6b7177]"
              data-testid="input-suffix"
            >
              {suffix}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="text-sm text-[#d72c0d] mt-2"
            role="alert"
            data-testid="input-error"
          >
            {error}
          </p>
        )}

        {/* Help Text */}
        {helpText && !error && (
          <p
            id={helpTextId}
            className="text-sm text-[#6b7177] mt-2"
            data-testid="input-help"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

export default ShopifyInput;
