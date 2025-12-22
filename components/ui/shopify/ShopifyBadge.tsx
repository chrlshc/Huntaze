'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ShopifyBadgeTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';
export type ShopifyBadgeSize = 'sm' | 'md';

export interface ShopifyBadgeProps {
  children: React.ReactNode;
  tone?: ShopifyBadgeTone;
  size?: ShopifyBadgeSize;
  dot?: boolean;
  className?: string;
}

const toneStyles: Record<ShopifyBadgeTone, { container: string; dot: string }> = {
  neutral: {
    container: 'bg-slate-50 text-slate-700 ring-slate-200',
    dot: 'bg-slate-500',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-600',
  },
  warning: {
    container: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-600',
  },
  critical: {
    container: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-600',
  },
  info: {
    container: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-600',
  },
};

const sizeStyles: Record<ShopifyBadgeSize, string> = {
  sm: 'h-7 px-3 text-xs leading-none',
  md: 'h-8 px-3.5 text-[13px] leading-none',
};

export function ShopifyBadge({
  children,
  tone = 'neutral',
  size = 'sm',
  dot = false,
  className,
}: ShopifyBadgeProps) {
  const styles = toneStyles[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset',
        sizeStyles[size],
        styles.container,
        className
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default ShopifyBadge;
