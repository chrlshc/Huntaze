'use client';

import React from 'react';

export interface ShopifyPageLayoutProps {
  /** Page title displayed in the header */
  title: string | React.ReactNode;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional action buttons for the header */
  actions?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Max width of the content area (default: 1200px) */
  maxWidth?: number | string;
}

/**
 * ShopifyPageLayout - Page layout component following Shopify design guidelines
 * 
 * Features:
 * - Light gray background (#f6f6f7)
 * - Max-width 1200px centered content
 * - Page header with title, subtitle, and actions
 * - Proper spacing (24px between sections)
 */
export function ShopifyPageLayout({
  title,
  subtitle,
  actions,
  children,
  className = '',
  maxWidth = 'var(--of-layout-max-width, 1200px)',
}: ShopifyPageLayoutProps) {
  const maxWidthValue = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  return (
    <div
      className={`shopify-page-layout ${className}`}
      style={{
        backgroundColor: 'var(--bg-app, #f6f6f7)',
        padding: 0,
      }}
    >
      <div
        className="shopify-page-layout__container"
        style={{
          maxWidth: maxWidthValue,
          margin: '0 auto',
        }}
      >
        {/* Page Header */}
        <header
          className="shopify-page-layout__header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--of-space-6, 24px)',
          }}
        >
          <div className="shopify-page-layout__header-content">
            <h1
              className="shopify-page-layout__title"
              style={{
                fontSize: 'var(--of-text-h1, 26px)',
                fontWeight: 'var(--of-font-semibold, 600)',
                color: 'var(--shopify-text-primary, #1a1a1a)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {title}
            </h1>
          </div>
          {actions && (
            <div
              className="shopify-page-layout__actions"
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              {actions}
            </div>
          )}
        </header>

        {/* Page Content */}
        <main
          className="shopify-page-layout__content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--of-section-gap, 24px)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default ShopifyPageLayout;
