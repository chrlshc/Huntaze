'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AsyncButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

/**
 * Button component with built-in loading state
 * Automatically shows spinner and disables when loading
 * 
 * Requirements: 15.1, 15.5
 */
export function AsyncButton({
  isLoading = false,
  loadingText,
  children,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: AsyncButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[var(--color-indigo)] text-white hover:opacity-90',
    secondary: 'border-2 border-[var(--color-indigo)] text-[var(--color-indigo)] hover:bg-[var(--color-indigo)] hover:text-white',
    ghost: 'text-[var(--color-text-main)] hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}

/**
 * Icon button with loading state
 */
export function AsyncIconButton({
  isLoading = false,
  icon,
  loadingIcon,
  ...props
}: Omit<AsyncButtonProps, 'children'> & {
  icon: ReactNode;
  loadingIcon?: ReactNode;
}) {
  return (
    <AsyncButton {...props} isLoading={isLoading}>
      {isLoading ? (loadingIcon || <Loader2 className="w-4 h-4 animate-spin" />) : icon}
    </AsyncButton>
  );
}
