'use client';

/**
 * FormInput Component
 * 
 * Standardized input component based on OnlyFans design system
 * with Shopify-like polish and consistent styling.
 */

import React, { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text below input */
  helperText?: string;
  /** Input width variant */
  width?: 'full' | 'medium' | 'small';
  /** Optional left icon */
  leftIcon?: React.ReactNode;
  /** Optional right icon */
  rightIcon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      width = 'full',
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Width class
    const widthClass = {
      full: 'w-full',
      medium: 'w-80',
      small: 'w-60',
    }[width];

    return (
      <div className={`form-field ${widthClass} ${className}`}>
        {/* Label */}
        {label && (
          <label className="form-label" htmlFor={props.id}>
            {label}
          </label>
        )}

        {/* Input container */}
        <div className={`input-container ${error ? 'input-container--error' : ''}`}>
          {leftIcon && <span className="input-icon input-icon--left">{leftIcon}</span>}

          <input
            ref={ref}
            className={`form-input ${leftIcon ? 'has-left-icon' : ''} ${
              rightIcon ? 'has-right-icon' : ''
            }`}
            disabled={disabled}
            {...props}
          />

          {rightIcon && <span className="input-icon input-icon--right">{rightIcon}</span>}
        </div>

        {/* Error message or helper text */}
        {(error || helperText) && (
          <div className={`input-message ${error ? 'input-message--error' : ''}`}>
            {error || helperText}
          </div>
        )}

        <style jsx>{`
          .form-field {
            margin-bottom: 16px;
          }

          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
          }

          .input-container {
            position: relative;
            display: flex;
            align-items: center;
          }

          .form-input {
            width: 100%;
            padding: var(--of-input-padding, 12px 20px);
            background: var(--of-input-bg, #F3F4F6);
            border: 1px solid var(--of-border-color, #E5E7EB);
            border-radius: var(--of-radius-input, 16px);
            font-size: 14px;
            transition: all 0.2s ease;
          }

          .form-input:focus {
            outline: none;
            border-color: var(--of-input-focus-border, #2C6ECB);
            box-shadow: var(--of-input-focus-shadow, 0 0 0 1px rgba(44, 110, 203, 0.2));
            background: #FFFFFF;
          }

          .form-input:disabled {
            background: #F9FAFB;
            color: #9CA3AF;
            cursor: not-allowed;
          }

          .has-left-icon {
            padding-left: 44px;
          }

          .has-right-icon {
            padding-right: 44px;
          }

          .input-icon {
            position: absolute;
            color: #6B7280;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
          }

          .input-icon--left {
            left: 0;
          }

          .input-icon--right {
            right: 0;
          }

          .input-container--error .form-input {
            border-color: #EF4444;
            background: #FEF2F2;
          }

          .input-message {
            margin-top: 4px;
            font-size: 12px;
            color: #6B7280;
          }

          .input-message--error {
            color: #EF4444;
          }
        `}</style>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
