/**
 * SettingsSection Component
 * Feature: onlyfans-settings-saas-transformation
 * Property 9: Content Section Organization
 * 
 * Reusable section wrapper for settings page with consistent structure and spacing.
 * 
 * @requirements
 * - Accepts title, description, children props
 * - Optional divider prop
 * - Consistent spacing (32px margin bottom)
 * - Title uses section typography (18px semibold)
 */

import React from 'react';

export interface SettingsSectionProps {
  /** Section title (18px semibold) */
  title: string;
  /** Optional description text below title */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Show divider below section (default: true) */
  showDivider?: boolean;
  /** Optional CSS class name */
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  showDivider = true,
  className = '',
}) => {
  return (
    <section
      className={`of-settings-section ${className}`}
      style={{
        marginBottom: 'var(--of-section-gap)', // 32px
      }}
    >
      {/* Section Header */}
      <div
        style={{
          marginBottom: 'var(--of-space-4)', // 16px
        }}
      >
        <h2
          style={{
            fontSize: 'var(--of-text-section)', // 18px
            fontWeight: 'var(--of-font-semibold)', // 600
            color: '#1a1a1a',
            marginBottom: description ? 'var(--of-space-1)' : '0', // 4px if description
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 'var(--of-text-body)', // 14px
              color: '#6B7280',
              marginTop: 'var(--of-space-1)', // 4px
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Section Content */}
      <div>{children}</div>

      {/* Optional Divider */}
      {showDivider && (
        <div
          style={{
            marginTop: 'var(--of-section-gap)', // 32px
            borderBottom: '1px solid var(--of-border-color)',
          }}
        />
      )}
    </section>
  );
};
