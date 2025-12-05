'use client';

import React, { forwardRef, useId } from 'react';

/**
 * Input Component - Design System Unified
 * 
 * Custom styled input with design tokens, focus ring, and accessibility support.
 * Overrides browser defaults for consistent cross-browser appearance.
 * 
 * @requirements 10.1 - Custom styling overriding browser defaults
 * @requirements 10.2 - Focus ring with action-primary color
 */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Element displayed before the input value */
  prefix?: React.ReactNode;
  /** Element displayed after the input value */
  suffix?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width mode */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      prefix,
      suffix,
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const helpTextId = `${inputId}-help`;

    const sizeClasses = {
      sm: 'input-sm',
      md: 'input-md',
      lg: 'input-lg',
    };

    const hasError = Boolean(error);

    return (
      <div
        className={`input-wrapper ${fullWidth ? 'input-full-width' : ''} ${className}`}
        data-testid="input-wrapper"
      >
        {label && (
          <label
            htmlFor={inputId}
            className="input-label"
            data-testid="input-label"
          >
            {label}
          </label>
        )}
        
        <div
          className={`input-container ${sizeClasses[size]} ${hasError ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}
          data-testid="input-container"
        >
          {prefix && (
            <span className="input-prefix" data-testid="input-prefix">
              {prefix}
            </span>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className="input-field"
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              [
                hasError ? errorId : null,
                helpText ? helpTextId : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            data-testid="input-field"
            {...props}
          />
          
          {suffix && (
            <span className="input-suffix" data-testid="input-suffix">
              {suffix}
            </span>
          )}
        </div>
        
        {hasError && (
          <span
            id={errorId}
            className="input-error-message"
            role="alert"
            data-testid="input-error-message"
          >
            {error}
          </span>
        )}
        
        {helpText && !hasError && (
          <span
            id={helpTextId}
            className="input-help-text"
            data-testid="input-help-text"
          >
            {helpText}
          </span>
        )}
        
        <style jsx>{`
          .input-wrapper {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }
          
          .input-full-width {
            width: 100%;
          }
          
          .input-label {
            font-size: var(--text-sm);
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
            margin-bottom: var(--space-1);
          }
          
          .input-container {
            display: flex;
            align-items: center;
            background: var(--bg-input);
            border: var(--input-border-width) solid var(--border-default);
            border-radius: var(--input-radius);
            transition: all var(--transition-fast);
            /* Override browser defaults - Requirement 10.1 */
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
          }
          
          .input-container:hover:not(.input-disabled) {
            border-color: var(--border-emphasis);
          }
          
          /* Focus ring with action-primary color - Requirement 10.2 */
          .input-container:focus-within:not(.input-disabled) {
            border-color: var(--accent-primary);
            outline: none;
            box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
          }
          
          .input-container.input-error {
            border-color: var(--accent-error);
          }
          
          .input-container.input-error:focus-within {
            box-shadow: 0 0 0 var(--focus-ring-width) rgba(239, 68, 68, 0.3);
          }
          
          .input-container.input-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: var(--bg-secondary);
          }
          
          /* Size variants */
          .input-sm {
            height: var(--input-height-sm);
            padding: 0 var(--space-2);
          }
          
          .input-md {
            height: var(--input-height-md);
            padding: 0 var(--space-3);
          }
          
          .input-lg {
            height: var(--input-height-lg);
            padding: 0 var(--space-4);
          }
          
          .input-field {
            flex: 1;
            min-width: 0;
            background: transparent;
            border: none;
            outline: none;
            font-size: var(--text-sm);
            font-family: var(--font-sans);
            color: var(--text-primary);
            /* Override browser defaults - Requirement 10.1 */
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
          }
          
          .input-field::placeholder {
            color: var(--text-tertiary);
          }
          
          .input-field:disabled {
            cursor: not-allowed;
          }
          
          /* Remove browser autofill styling */
          .input-field:-webkit-autofill,
          .input-field:-webkit-autofill:hover,
          .input-field:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset;
            -webkit-text-fill-color: var(--text-primary);
            transition: background-color 5000s ease-in-out 0s;
          }
          
          .input-prefix,
          .input-suffix {
            display: flex;
            align-items: center;
            color: var(--text-secondary);
            flex-shrink: 0;
          }
          
          .input-prefix {
            margin-right: var(--space-2);
          }
          
          .input-suffix {
            margin-left: var(--space-2);
          }
          
          .input-error-message {
            font-size: var(--text-xs);
            color: var(--accent-error);
            margin-top: var(--space-1);
          }
          
          .input-help-text {
            font-size: var(--text-xs);
            color: var(--text-secondary);
            margin-top: var(--space-1);
          }
        `}</style>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
