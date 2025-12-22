'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface ShopifyTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text for the textarea */
  label?: string;
  /** Helper text below the textarea */
  helpText?: string;
  /** Error message to display */
  error?: string;
  /** Whether the textarea is in an error state */
  hasError?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * ShopifyTextarea - Textarea component following Shopify design patterns
 * 
 * Features:
 * - Clean border and focus states
 * - Optional label, help text, and error messages
 * - Proper accessibility with ARIA attributes
 * - Rounded corners (tokenized)
 * - Resizable by default
 */
export const ShopifyTextarea = forwardRef<HTMLTextAreaElement, ShopifyTextareaProps>(
  function ShopifyTextarea(
    {
      label,
      helpText,
      error,
      hasError,
      className,
      id,
      disabled,
      rows = 4,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const reactId = useId();
    const textareaId = id || `textarea-${reactId.replace(/:/g, '')}`;
    const errorId = `${textareaId}-error`;
    const helpTextId = `${textareaId}-help`;
    const showError = hasError || !!error;

    return (
      <div className={cn('w-full', className)} data-testid={testId}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#1a1a1a] mb-2"
            data-testid="textarea-label"
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={showError || undefined}
          aria-describedby={
            error ? errorId : helpText ? helpTextId : undefined
          }
          className={cn(
            // Base styles
            'w-full px-6 py-3 rounded-[var(--input-radius)]',
            'text-sm text-[#1a1a1a]',
            'bg-white',
            'border transition-colors duration-200',
            'resize-y', // Allow vertical resizing
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
            disabled && 'bg-[#f6f6f7] text-[#8c9196] cursor-not-allowed resize-none'
          )}
          data-testid="textarea-field"
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="text-sm text-[#d72c0d] mt-2"
            role="alert"
            data-testid="textarea-error"
          >
            {error}
          </p>
        )}

        {/* Help Text */}
        {helpText && !error && (
          <p
            id={helpTextId}
            className="text-sm text-[#6b7177] mt-2"
            data-testid="textarea-help"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

export default ShopifyTextarea;
