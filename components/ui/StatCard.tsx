import React from 'react';
import { cn } from '@/lib/utils';
import '@/styles/dashboard-views.css';
import './StatCard.css';

export interface StatCardProps {
  /** Label displayed above the value */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Optional delta/trend indicator */
  delta?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  /** Visual variant for the card */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Additional class names */
  className?: string;
}

/**
 * StatCard Component
 * 
 * Displays a key metric with label, value, and optional delta/trend indicator.
 * Used across dashboard views for consistent metric display.
 * 
 * Design Specification:
 * - Background: #FFFFFF
 * - Border: 1px solid #E3E3E3
 * - Border radius: 12px
 * - Padding: 10-12px
 * - Label: 11px uppercase, #9CA3AF, 0.05em letter-spacing
 * - Value: 20px, 600 weight, #111111
 * - Delta: 12px, color-coded (#16A34A positive, #DC2626 negative)
 * - Hover: border #D0D0D0, shadow 0 2px 8px rgba(0, 0, 0, 0.06)
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const StatCard = React.memo(function StatCard({
  label,
  value,
  icon,
  delta,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('stat-card', `stat-card--${variant}`, className)}
      data-testid="stat-card"
      role="region"
      aria-label={`${label}: ${value}${delta ? `, ${delta.trend === 'up' ? 'increased' : delta.trend === 'down' ? 'decreased' : 'unchanged'} by ${delta.value}` : ''}`}
      tabIndex={0}
    >
      {icon && (
        <div className="stat-card__icon" data-testid="stat-card-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      
      <div className="stat-card__label" data-testid="stat-card-label">
        {label}
      </div>
      
      <div className="flex items-baseline">
        <div className="stat-card__value" data-testid="stat-card-value">
          {value}
        </div>
        
        {delta && (
          <div
            className={cn(
              'stat-card__delta',
              `stat-card__delta--${delta.trend}`
            )}
            data-testid="stat-card-delta"
            role="status"
            aria-label={`${delta.trend === 'up' ? 'Increased' : delta.trend === 'down' ? 'Decreased' : 'Unchanged'} by ${delta.value}`}
          >
            {delta.trend === 'up' && (
              <svg
                className="stat-card__delta-icon"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6 2L10 6L9.3 6.7L6.5 3.9V10H5.5V3.9L2.7 6.7L2 6L6 2Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {delta.trend === 'down' && (
              <svg
                className="stat-card__delta-icon"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6 10L2 6L2.7 5.3L5.5 8.1V2H6.5V8.1L9.3 5.3L10 6L6 10Z"
                  fill="currentColor"
                />
              </svg>
            )}
            <span>{delta.value}</span>
          </div>
        )}
      </div>
    </div>
  );
});
