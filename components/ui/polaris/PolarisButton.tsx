'use client';

import { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';

interface PolarisButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'plain' | 'destructive';
  size?: 'slim' | 'medium' | 'large';
  children: ReactNode;
  loading?: boolean;
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontWeight: 500,
  borderRadius: '6px',
  transition: 'all 150ms ease',
  outline: 'none',
  cursor: 'pointer',
  border: 'none',
};

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: 'rgba(0, 128, 96, 1)',
    color: 'white',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    color: 'rgba(48, 48, 48, 1)',
    border: '1px solid rgba(227, 227, 227, 1)',
  },
  plain: {
    backgroundColor: 'transparent',
    color: 'rgba(0, 91, 211, 1)',
  },
  destructive: {
    backgroundColor: 'rgba(215, 44, 13, 1)',
    color: 'white',
  },
};

const sizeStyles: Record<string, CSSProperties> = {
  slim: { height: '28px', padding: '0 8px', fontSize: '13px' },
  medium: { height: '36px', padding: '0 16px', fontSize: '14px' },
  large: { height: '44px', padding: '0 20px', fontSize: '16px' },
};

export function PolarisButton({
  variant = 'secondary',
  size = 'medium',
  children,
  loading = false,
  disabled,
  style,
  ...props
}: PolarisButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <button
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <svg
            style={{ animation: 'spin 1s linear infinite', marginLeft: '-4px', marginRight: '8px', width: '16px', height: '16px' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Saving...
        </>
      ) : (
        children
      )}
    </button>
  );
}
