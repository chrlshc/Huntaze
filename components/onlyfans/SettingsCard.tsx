/**
 * SettingsCard Component
 * Feature: onlyfans-settings-saas-transformation
 * Property 4: Card Surface Consistency
 * 
 * Elevated card component with SaaS-level polish replacing bordered rectangles.
 * 
 * @requirements
 * - White background (#FFFFFF)
 * - 1px border (#E5E7EB)
 * - 12px border radius
 * - Uses --of-shadow-card-saas
 * - 24px internal padding
 * - Optional accent border (left 4px colored)
 */

import React from 'react';
import './SettingsCard.css';

export interface SettingsCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Show accent border on left (default: false) */
  accent?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Optional category pill text */
  category?: string;
  /** Optional card title */
  title?: string;
  /** Optional card subtitle/description */
  subtitle?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  children,
  accent = false,
  className = '',
  category,
  title,
  subtitle,
}) => {
  return (
    <div
      className={`of-settings-card-v2 ${accent ? 'of-settings-card-v2--accent' : ''} ${className}`}
    >
      {/* Optional Header with Category + Title */}
      {(category || title) && (
        <div className="of-settings-card-v2__header">
          {category && (
            <span className="of-category-pill">{category}</span>
          )}
          {title && (
            <h3 className="of-settings-card-v2__title">{title}</h3>
          )}
          {subtitle && (
            <p className="of-settings-card-v2__subtitle">{subtitle}</p>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="of-settings-card-v2__content">
        {children}
      </div>
    </div>
  );
};
