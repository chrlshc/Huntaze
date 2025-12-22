/**
 * TailAdmin Input Component
 * Wrapper component following TailAdmin design patterns
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TailAdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function TailAdminInput({ 
  label,
  error,
  icon,
  iconPosition = 'left',
  className,
  ...props 
}: TailAdminInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="mb-2 block text-sm font-medium"
          style={{ color: 'var(--tailadmin-text-primary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tailadmin-text-tertiary)' }}>
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-lg border px-4 py-2.5 text-base outline-none transition-all duration-200',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:bg-gray-2 disabled:cursor-not-allowed',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          style={{
            backgroundColor: 'var(--tailadmin-input-bg)',
            borderColor: error ? 'var(--tailadmin-danger)' : 'var(--tailadmin-border-color)',
            color: 'var(--tailadmin-text-primary)',
            boxShadow: 'var(--tailadmin-shadow-input)'
          }}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tailadmin-text-tertiary)' }}>
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--tailadmin-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface TailAdminSearchInputProps extends Omit<TailAdminInputProps, 'icon' | 'iconPosition'> {
  onSearch?: (value: string) => void;
}

export function TailAdminSearchInput({ onSearch, onChange, ...props }: TailAdminSearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onSearch?.(e.target.value);
  };

  return (
    <TailAdminInput
      type="search"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      iconPosition="left"
      onChange={handleChange}
      {...props}
    />
  );
}
