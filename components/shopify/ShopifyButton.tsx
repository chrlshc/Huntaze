'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const shopifyButtonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: [
          "bg-gray-900 text-white",
          "hover:bg-gray-800",
          "focus:ring-gray-900",
          "active:bg-gray-700"
        ],
        secondary: [
          "bg-white text-gray-700 border border-gray-300",
          "hover:bg-gray-50 hover:border-gray-400",
          "focus:ring-gray-500"
        ],
        success: [
          "bg-green-600 text-white",
          "hover:bg-green-700",
          "focus:ring-green-600",
          "active:bg-green-800"
        ],
        danger: [
          "bg-red-600 text-white",
          "hover:bg-red-700",
          "focus:ring-red-600"
        ],
        ghost: [
          "text-gray-700",
          "hover:text-gray-900 hover:bg-gray-100",
          "focus:ring-gray-500"
        ]
      },
      size: {
        xs: "h-7 px-2.5 text-xs gap-1",
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-base gap-2",
        xl: "h-14 px-8 text-base gap-3"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ShopifyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof shopifyButtonVariants> {
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const ShopifyButton = React.forwardRef<HTMLButtonElement, ShopifyButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    disabled,
    children,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(shopifyButtonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          </>
        )}
      </button>
    );
  }
);

ShopifyButton.displayName = 'ShopifyButton';