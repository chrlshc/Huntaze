import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        destructive: 'border-transparent bg-error-600 text-white hover:bg-error-700',
        outline: 'text-neutral-950 border-neutral-200',
        success: 'border-transparent bg-success-100 text-success-800',
        warning: 'border-transparent bg-warning-100 text-warning-800',
        info: 'border-transparent bg-info-100 text-info-800',
        
        // Order status variants
        pending: 'border-transparent bg-yellow-100 text-yellow-800',
        confirmed: 'border-transparent bg-blue-100 text-blue-800',
        processing: 'border-transparent bg-purple-100 text-purple-800',
        shipped: 'border-transparent bg-cyan-100 text-cyan-800',
        delivered: 'border-transparent bg-green-100 text-green-800',
        cancelled: 'border-transparent bg-red-100 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };