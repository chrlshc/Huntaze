/**
 * PageLayout Component - Dashboard Global Polish
 * 
 * Unified page layout component with consistent header structure,
 * filters section, and content area. Uses dashboard polish tokens
 * for typography and spacing.
 * 
 * Feature: dashboard-global-polish
 * Validates: Requirements 1.1, 1.2, 1.4, 2.4, 12.5
 */

import React from 'react';
import './PageLayout.css';

export interface PageLayoutProps {
  /** Page title displayed in H1 style (24px semi-bold) */
  title: string;
  /** Optional subtitle displayed in label style (11px uppercase) */
  subtitle?: string;
  /** Action buttons or controls to display in header */
  actions?: React.ReactNode;
  /** Filters section content */
  filters?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * PageLayout component that provides consistent structure for all dashboard pages.
 * 
 * Design Specifications:
 * - Header margin: 32px (--polish-header-margin)
 * - Section gap: 24px (--polish-section-gap)
 * - Title: H1 styling (24px semi-bold)
 * - Subtitle: Label styling (11px uppercase with letter-spacing)
 * 
 * @example
 * ```tsx
 * <PageLayout
 *   title="Smart Messages"
 *   subtitle="AUTOMATIONS"
 *   actions={<Button>New Rule</Button>}
 *   filters={<FilterPill label="Active" onRemove={() => {}} />}
 * >
 *   <ContentArea />
 * </PageLayout>
 * ```
 */
export function PageLayout({
  title,
  subtitle,
  actions,
  filters,
  children,
  className = '',
}: PageLayoutProps) {
  return (
    <div 
      className={`page-layout ${className}`}
      data-testid="page-layout"
    >
      {/* Page Header */}
      <header 
        className="page-layout-header"
        data-testid="page-layout-header"
      >
        <div className="page-layout-header-content">
          <h1 
            className="page-layout-title"
            data-testid="page-layout-title"
          >
            {title}
          </h1>
        </div>
        {actions && (
          <div 
            className="page-layout-actions"
            data-testid="page-layout-actions"
          >
            {actions}
          </div>
        )}
      </header>

      {/* Filters Section */}
      {filters && (
        <div 
          className="page-layout-filters"
          data-testid="page-layout-filters"
        >
          {filters}
        </div>
      )}

      {/* Page Content */}
      <main 
        className="page-layout-content"
        data-testid="page-layout-content"
      >
        {children}
      </main>
    </div>
  );
}

export default PageLayout;
