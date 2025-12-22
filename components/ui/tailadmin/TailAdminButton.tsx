/**
 * TailAdmin Button Component
 * Wrapper component following TailAdmin design patterns
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TailAdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  fullWidth?: boolean;
}

export function TailAdminButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  active = false,
  fullWidth = false,
  className,
  ...props 
}: TailAdminButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-white hover:opacity-90 focus:ring-secondary',
    success: 'bg-success text-white hover:opacity-90 focus:ring-success',
    danger: 'bg-danger text-white hover:opacity-90 focus:ring-danger',
    warning: 'bg-warning text-white hover:opacity-90 focus:ring-warning',
    ghost: 'bg-transparent text-body hover:bg-gray-2 focus:ring-gray'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const activeClasses = active ? 'ring-2 ring-primary' : '';

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        activeClasses,
        fullWidth && 'w-full',
        className
      )}
      style={{
        backgroundColor: variant === 'primary' ? 'var(--tailadmin-primary)' : undefined,
        color: variant === 'ghost' ? 'var(--tailadmin-text-secondary)' : undefined,
        transition: 'var(--tailadmin-transition-base)'
      }}
      {...props}
    >
      {children}
    </button>
  );
}

interface TailAdminButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function TailAdminButtonGroup({ children, className }: TailAdminButtonGroupProps) {
  return (
    <div className={cn('inline-flex rounded-lg border', className)} style={{ borderColor: 'var(--tailadmin-border-color)' }}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            className: cn(
              child.props.className,
              'rounded-none border-0',
              index === 0 && 'rounded-l-lg',
              index === React.Children.count(children) - 1 && 'rounded-r-lg',
              index > 0 && 'border-l',
            ),
            style: {
              ...child.props.style,
              borderLeftColor: index > 0 ? 'var(--tailadmin-border-color)' : undefined
            }
          });
        }
        return child;
      })}
    </div>
  );
}
