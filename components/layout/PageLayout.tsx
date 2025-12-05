/**
 * PageLayout Component
 * 
 * Standardized page layout for dashboard pages with consistent header structure,
 * breadcrumbs, actions, and responsive spacing.
 * 
 * Feature: dashboard-ux-overhaul
 * Validates: Requirements 7.1, 7.2, 7.3
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageLayoutProps {
  /** Page title displayed in the header */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Action buttons or controls to display in header */
  actions?: React.ReactNode;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Page content */
  children: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show the home icon in breadcrumbs */
  showHomeInBreadcrumbs?: boolean;
}

/**
 * Breadcrumbs navigation component
 */
const Breadcrumbs: React.FC<{
  items: BreadcrumbItem[];
  showHome?: boolean;
}> = ({ items, showHome = true }) => {
  if (items.length === 0 && !showHome) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="page-breadcrumbs"
      data-testid="page-breadcrumbs"
    >
      <ol className="flex items-center gap-1 text-sm text-[var(--color-text-sub)]">
        {showHome && (
          <li className="flex items-center">
            <Link 
              href="/dashboard" 
              className="hover:text-[var(--color-text-main)] transition-colors p-1 rounded hover:bg-[var(--bg-surface-hover)]"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
        )}
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-[var(--color-text-muted)]" />
            {item.href ? (
              <Link 
                href={item.href}
                className="hover:text-[var(--color-text-main)] transition-colors px-1 py-0.5 rounded hover:bg-[var(--bg-surface-hover)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--color-text-main)] font-medium px-1">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};


/**
 * PageLayout component that provides consistent structure for all dashboard pages.
 * 
 * @example
 * ```tsx
 * <PageLayout
 *   title="Analytics Overview"
 *   subtitle="Track your performance metrics"
 *   breadcrumbs={[
 *     { label: 'Analytics', href: '/analytics' },
 *     { label: 'Overview' }
 *   ]}
 *   actions={<Button>Export</Button>}
 * >
 *   <AnalyticsContent />
 * </PageLayout>
 * ```
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs = [],
  children,
  className = '',
  showHomeInBreadcrumbs = true,
}) => {
  return (
    <div 
      className={`page-layout ${className}`}
      data-testid="page-layout"
    >
      {/* Breadcrumbs */}
      {(breadcrumbs.length > 0 || showHomeInBreadcrumbs) && (
        <Breadcrumbs items={breadcrumbs} showHome={showHomeInBreadcrumbs} />
      )}

      {/* Page Header */}
      <header 
        className="page-header"
        data-testid="page-header"
      >
        <div className="page-header-content">
          <h1 
            className="page-title"
            data-testid="page-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="page-subtitle"
              data-testid="page-subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div 
            className="page-actions"
            data-testid="page-actions"
          >
            {actions}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main 
        className="page-content"
        data-testid="page-content"
      >
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
