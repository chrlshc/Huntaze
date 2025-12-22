/**
 * Shared Card Component
 * 
 * Based on OnlyFans SettingsCard design with Shopify-like polish.
 * Provides consistent card styling across the entire application.
 */

import React, { ReactNode } from 'react';

export interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Show accent border on left */
  accent?: boolean | string;
  /** Optional CSS class name */
  className?: string;
  /** Optional category pill text */
  category?: string;
  /** Optional card title */
  title?: string;
  /** Optional card subtitle/description */
  subtitle?: string;
  /** Optional action buttons in header */
  actions?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Optional card padding (defaults to 'default') */
  padding?: 'none' | 'small' | 'default' | 'large';
}

export function Card({
  children,
  accent = false,
  className = '',
  category,
  title,
  subtitle,
  actions,
  footer,
  padding = 'default',
}: CardProps) {
  // Determine accent color if provided as string
  let accentClass = accent ? 'card--accent' : '';
  let accentStyle = {};
  
  if (typeof accent === 'string' && accent !== 'true') {
    accentClass = 'card--accent';
    accentStyle = { borderLeftColor: accent };
  }

  // Determine padding class
  const paddingClass = {
    none: 'card--padding-none',
    small: 'card--padding-small',
    default: '',
    large: 'card--padding-large',
  }[padding];

  return (
    <div
      className={`card ${accentClass} ${paddingClass} ${className}`}
      style={accentStyle}
    >
      {/* Header with Category, Title, Subtitle and Actions */}
      {(category || title || subtitle || actions) && (
        <div className="card__header">
          <div className="card__header-content">
            {category && (
              <span className="card__category">{category}</span>
            )}
            {title && (
              <h3 className="card__title">{title}</h3>
            )}
            {subtitle && (
              <p className="card__subtitle">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="card__actions">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="card__content">
        {children}
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}

      <style jsx>{`
        .card {
          background: #FFFFFF;
          border-radius: var(--of-radius-card, 20px);
          box-shadow: var(--of-shadow-card-saas, 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04));
          padding: 24px;
          margin-bottom: 24px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .card:hover {
          box-shadow: var(--of-shadow-card-hover-saas, 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06));
          transform: translateY(-1px);
        }

        .card--accent {
          border-left: 3px solid var(--of-pill-text, #4F46E5);
          padding-left: 20px;
        }

        .card--padding-none {
          padding: 0;
        }

        .card--padding-small {
          padding: 16px;
        }

        .card--padding-large {
          padding: 32px;
        }

        .card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .card__header-content {
          flex: 1;
        }

        .card__category {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: rgba(15, 23, 42, 0.03);
          color: #475569;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .card__title {
          font-size: var(--of-text-section, 18px);
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 4px;
          margin-bottom: 0;
        }

        .card__subtitle {
          font-size: var(--of-text-body, 14px);
          color: #6B7280;
          margin-top: 4px;
          margin-bottom: 0;
        }

        .card__footer {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--of-border-color, #E5E7EB);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .card {
            border-radius: 16px;
            padding: 16px;
          }
          
          .card--accent {
            padding-left: 12px;
          }
          
          .card__title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
