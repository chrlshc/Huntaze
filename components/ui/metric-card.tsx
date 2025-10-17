'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
  };
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight' | 'minimal';
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  prefix,
  suffix,
  size = 'md',
  variant = 'default',
  className
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 dark:text-green-400';
    if (trend.value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const sizeClasses = {
    sm: {
      container: 'p-3',
      label: 'text-xs',
      value: 'text-xl',
      trend: 'text-xs'
    },
    md: {
      container: 'p-4',
      label: 'text-xs',
      value: 'text-2xl',
      trend: 'text-sm'
    },
    lg: {
      container: 'p-6',
      label: 'text-sm',
      value: 'text-4xl',
      trend: 'text-sm'
    }
  };

  const variantClasses = {
    default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
    highlight: 'bg-black dark:bg-white text-white dark:text-black',
    minimal: 'bg-transparent'
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'relative rounded-lg transition-all duration-200 group',
        variantClasses[variant],
        sizes.container,
        className
      )}
    >
      {/* Background accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent dark:from-gray-800 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
      
      <div className="relative">
        {/* Label */}
        <p className={cn(
          'font-medium uppercase tracking-wider opacity-60',
          sizes.label,
          variant === 'highlight' && 'opacity-80'
        )}>
          {label}
        </p>

        {/* Value */}
        <p className={cn(
          'font-bold mt-1 tabular-nums',
          sizes.value
        )}>
          {prefix && <span className="text-lg opacity-60">{prefix}</span>}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-lg opacity-60 ml-0.5">{suffix}</span>}
        </p>

        {/* Trend */}
        {trend && (
          <div className={cn(
            'flex items-center gap-1 mt-2',
            sizes.trend,
            getTrendColor()
          )}>
            {getTrendIcon()}
            <span className="font-medium">
              {trend.value > 0 && '+'}{trend.value}%
            </span>
            {trend.label && (
              <span className="opacity-60">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {/* Subtle corner accent */}
      {variant === 'highlight' && (
        <div className="absolute top-0 right-0 w-8 h-8 opacity-10">
          <div className="absolute inset-0 bg-white dark:bg-black rounded-bl-full" />
        </div>
      )}
    </div>
  );
}

// Compound component for metric groups
interface MetricGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricGroup({ children, className }: MetricGroupProps) {
  return (
    <div className={cn(
      'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  );
}

// Mini metric for inline use
interface MiniMetricProps {
  label: string;
  value: string | number;
  trend?: number;
  className?: string;
}

export function MiniMetric({ label, value, trend, className }: MiniMetricProps) {
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="font-semibold tabular-nums">
        {value}
      </span>
      {trend !== undefined && (
        <span className={cn(
          'text-xs font-medium',
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
        )}>
          {trend > 0 && '+'}{trend}%
        </span>
      )}
    </div>
  );
}