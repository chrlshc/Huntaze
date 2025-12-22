import React from 'react';
import { cn } from '@/lib/utils';
import './DashboardEmptyState.css';

export interface DashboardEmptyStateProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Optional list of benefits/features */
  benefits?: string[];
  /** Call-to-action button configuration */
  cta: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Optional secondary link (e.g., "View examples") */
  secondaryLink?: {
    label: string;
    onClick: () => void;
  };
  /** Additional class names */
  className?: string;
}

/**
 * DashboardEmptyState Component
 * 
 * Displays when no data is available in dashboard views, with clear guidance
 * and call-to-action. Used in Smart Messages, Fans, and PPV Content views.
 * 
 * Design Specification:
 * - Max-width: 600px, centered
 * - Background: #FFFFFF
 * - Border: 1px solid #E3E3E3
 * - Border radius: 16px
 * - Padding: 32px 24px
 * - Icon: 48px, #9CA3AF color, 16px bottom margin
 * - Title: 18px, 600 weight, #111111, 8px bottom margin
 * - Description: 14px, #6B7280, 1.5 line-height, 16px bottom margin
 * - Benefits: 13px, #6B7280, bullet points with #5B6BFF color, 8px gap
 * - CTA: background #5B6BFF, color #FFFFFF, 8px border radius, 10px vertical padding, 20px horizontal padding
 * - CTA hover: background #4F46E5, translateY(-1px), shadow 0 4px 12px rgba(91, 107, 255, 0.3)
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const DashboardEmptyState = React.memo(function DashboardEmptyState({
  icon,
  title,
  description,
  benefits,
  cta,
  secondaryLink,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn('dashboard-empty-state', className)}
      data-testid="dashboard-empty-state"
      role="region"
      aria-labelledby="empty-state-title"
      aria-describedby="empty-state-description"
    >
      <div className="dashboard-empty-state__icon" data-testid="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      
      <h3 className="dashboard-empty-state__title" data-testid="empty-state-title" id="empty-state-title">
        {title}
      </h3>
      
      <p className="dashboard-empty-state__description" data-testid="empty-state-description" id="empty-state-description">
        {description}
      </p>
      
      {benefits && benefits.length > 0 && (
        <ul className="dashboard-empty-state__benefits" data-testid="empty-state-benefits">
          {benefits.map((benefit, index) => (
            <li key={index} className="dashboard-empty-state__benefit">
              {benefit}
            </li>
          ))}
        </ul>
      )}
      
      <div className="dashboard-empty-state__actions">
        <button
          className="dashboard-empty-state__cta"
          onClick={cta.onClick}
          type="button"
          data-testid="empty-state-cta"
          aria-label={cta.label}
        >
          {cta.icon && (
            <span className="dashboard-empty-state__cta-icon" aria-hidden="true">
              {cta.icon}
            </span>
          )}
          {cta.label}
        </button>
        
        {secondaryLink && (
          <button
            className="dashboard-empty-state__secondary-link"
            onClick={secondaryLink.onClick}
            type="button"
            data-testid="empty-state-secondary-link"
            aria-label={secondaryLink.label}
          >
            {secondaryLink.label}
          </button>
        )}
      </div>
    </div>
  );
});
