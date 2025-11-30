/**
 * PageLayout Component
 * 
 * A consistent page layout component that provides a standardized structure
 * for dashboard pages with title, subtitle, actions, and content areas.
 * 
 * Part of the Design System Unification
 * Validates: Requirements 5.1, 1.4, 1.5
 */

import React from 'react';

export interface PageLayoutProps {
  /**
   * Page title - displayed prominently at the top
   */
  title?: string;
  
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  
  /**
   * Optional action buttons or controls (e.g., "Create New", filters)
   */
  actions?: React.ReactNode;
  
  /**
   * Main page content
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes to apply to the root element
   */
  className?: string;
  
  /**
   * Additional CSS classes to apply to the header section
   */
  headerClassName?: string;
  
  /**
   * Additional CSS classes to apply to the content section
   */
  contentClassName?: string;
}

/**
 * PageLayout provides a consistent structure for dashboard pages with
 * standardized spacing, typography hierarchy, and layout using design tokens.
 * 
 * @example
 * ```tsx
 * <PageLayout
 *   title="Dashboard"
 *   subtitle="Welcome back! Here's what's happening."
 *   actions={<Button>Create New</Button>}
 * >
 *   <div>Page content goes here</div>
 * </PageLayout>
 * ```
 * 
 * @example
 * ```tsx
 * <PageLayout title="Settings">
 *   <SettingsForm />
 * </PageLayout>
 * ```
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const hasHeader = title || subtitle || actions;
  
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        width: '100%',
      }}
      data-testid="page-layout"
    >
      {hasHeader && (
        <header
          className={headerClassName}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
          data-testid="page-layout-header"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                flex: '1 1 auto',
                minWidth: '0',
              }}
            >
              {title && (
                <h1
                  style={{
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    lineHeight: 'var(--leading-tight)',
                    margin: '0',
                  }}
                  data-testid="page-layout-title"
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-normal)',
                    margin: '0',
                  }}
                  data-testid="page-layout-subtitle"
                >
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  flexShrink: '0',
                }}
                data-testid="page-layout-actions"
              >
                {actions}
              </div>
            )}
          </div>
        </header>
      )}
      <main
        className={contentClassName}
        style={{
          flex: '1 1 auto',
          minHeight: '0',
        }}
        data-testid="page-layout-content"
      >
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
