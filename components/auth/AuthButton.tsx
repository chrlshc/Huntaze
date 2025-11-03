'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function AuthButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`auth-button ${variant} ${fullWidth ? 'w-full' : ''} flex items-center justify-center gap-2`}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
