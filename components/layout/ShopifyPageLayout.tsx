'use client';

import React from 'react';

export interface ShopifyPageLayoutProps {
  /** Page title displayed in the header */
  title: string;
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
  maxWidth = 1200,
}: ShopifyPageLayoutProps) {
  const maxWidthValue = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  return (
    <div
      className={`shopify-page-layout ${className}`}
      style={{
        backgroundColor: 'var(--shopify-bg-surface-secondary, #f6f6f7)',
        minHeight: '100vh',
        padding: '24px',
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
            marginBottom: '24px',
          }}
        >
          <div className="shopify-page-layout__header-content">
            <h1
              className="shopify-page-layout__title"
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--shopify-text-primary, #1a1a1a)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="shopify-page-layout__subtitle"
                style={{
                  fontSize: '14px',
                  color: 'var(--shopify-text-secondary, #6b7177)',
                  margin: '4px 0 0 0',
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            )}
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
            gap: '24px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default ShopifyPageLayout;
