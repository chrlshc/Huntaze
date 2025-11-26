'use client';

import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      children,
      fullWidth = false,
      isLoading = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      isLoading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className={styles.loadingSpinner} aria-hidden="true" />
        ) : null}
        <span className={isLoading ? styles.loadingText : undefined}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
