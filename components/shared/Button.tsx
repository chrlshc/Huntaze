'use client';

/**
 * Button Component
 * 
 * Standardized button component based on OnlyFans design system
 * with Shopify-like polish and consistent styling.
 */

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Optional left icon */
  leftIcon?: React.ReactNode;
  /** Optional right icon */
  rightIcon?: React.ReactNode;
  /** Shows loading spinner */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      leftIcon,
      rightIcon,
      disabled,
      loading,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          button
          button--${variant}
          button--${size}
          ${fullWidth ? 'button--full-width' : ''}
          ${loading ? 'button--loading' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="button__spinner">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
        
        {leftIcon && <span className="button__icon button__icon--left">{leftIcon}</span>}
        <span className="button__text">{children}</span>
        {rightIcon && <span className="button__icon button__icon--right">{rightIcon}</span>}
        
        <style jsx>{`
          .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            border-radius: var(--button-radius, 12px);
            transition: all 0.2s ease;
            position: relative;
            white-space: nowrap;
            font-family: inherit;
            cursor: pointer;
            outline: none;
            border: 1px solid transparent;
          }
          
          .button:focus-visible {
            box-shadow: var(--brand-glow, 0 0 0 3px rgba(44, 110, 203, 0.18));
          }
          
          .button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            pointer-events: none;
          }
          
          /* Button sizes */
          .button--sm {
            font-size: 12px;
            padding: 6px 12px;
            height: 32px;
          }
          
          .button--md {
            font-size: 14px;
            padding: 8px 16px;
            height: 40px;
          }
          
          .button--lg {
            font-size: 15px;
            padding: 10px 20px;
            height: 48px;
          }
          
          /* Button variants */
          .button--primary {
            background: var(--shopify-button-primary-bg, #2C6ECB);
            color: white;
            border-color: var(--shopify-button-primary-bg, #2C6ECB);
          }
          
          .button--primary:hover:not(:disabled) {
            background: var(--shopify-button-primary-hover, #1f5ebd);
            border-color: var(--shopify-button-primary-hover, #1f5ebd);
          }
          
          .button--primary:active:not(:disabled) {
            background: var(--shopify-button-primary-active, #194f9e);
            border-color: var(--shopify-button-primary-active, #194f9e);
          }
          
          .button--secondary {
            background: #F3F4F6;
            color: #1F2937;
            border-color: #E5E7EB;
          }
          
          .button--secondary:hover:not(:disabled) {
            background: #E5E7EB;
            border-color: #D1D5DB;
          }
          
          .button--secondary:active:not(:disabled) {
            background: #D1D5DB;
            border-color: #9CA3AF;
          }
          
          .button--outline {
            background: transparent;
            color: #2C6ECB;
            border-color: currentColor;
          }
          
          .button--outline:hover:not(:disabled) {
            background: rgba(44, 110, 203, 0.05);
          }
          
          .button--outline:active:not(:disabled) {
            background: rgba(44, 110, 203, 0.1);
          }
          
          .button--ghost {
            background: transparent;
            color: #4B5563;
            border-color: transparent;
          }
          
          .button--ghost:hover:not(:disabled) {
            background: rgba(75, 85, 99, 0.05);
          }
          
          .button--ghost:active:not(:disabled) {
            background: rgba(75, 85, 99, 0.1);
          }
          
          .button--danger {
            background: #EF4444;
            color: white;
            border-color: #EF4444;
          }
          
          .button--danger:hover:not(:disabled) {
            background: #DC2626;
            border-color: #DC2626;
          }
          
          .button--danger:active:not(:disabled) {
            background: #B91C1C;
            border-color: #B91C1C;
          }
          
          .button--success {
            background: #10B981;
            color: white;
            border-color: #10B981;
          }
          
          .button--success:hover:not(:disabled) {
            background: #059669;
            border-color: #059669;
          }
          
          .button--success:active:not(:disabled) {
            background: #047857;
            border-color: #047857;
          }
          
          /* Full width */
          .button--full-width {
            width: 100%;
          }
          
          /* Button icons */
          .button__icon {
            display: flex;
            align-items: center;
          }
          
          .button__icon--left {
            margin-right: 8px;
          }
          
          .button__icon--right {
            margin-left: 8px;
          }
          
          /* Button loading state */
          .button--loading .button__text {
            visibility: hidden;
          }
          
          .button__spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </button>
    );
  }
);

Button.displayName = 'Button';
