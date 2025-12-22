'use client';

/**
 * ShopifyStyleLayout
 * 
 * A layout component that applies the OnlyFans design system with
 * Shopify-like polish. Provides consistent spacing, card styling,
 * and responsive behavior.
 */

import React, { ReactNode } from 'react';
import { Card } from '../shared/Card';
import { CategoryPill } from '../shared/CategoryPill';

interface ShopifyStyleLayoutProps {
  /** Page title */
  title: string;
  /** Optional page subtitle */
  subtitle?: string;
  /** Optional category badge */
  category?: string;
  /** Main content */
  children: ReactNode;
  /** Optional sidebar content (right side) */
  sidebar?: ReactNode;
  /** Optional actions to display in header */
  actions?: ReactNode;
  /** Optional breadcrumbs */
  breadcrumbs?: ReactNode;
}

export function ShopifyStyleLayout({
  title,
  subtitle,
  category,
  children,
  sidebar,
  actions,
  breadcrumbs,
}: ShopifyStyleLayoutProps) {
  return (
    <div className="shopify-style-layout">
      {breadcrumbs && (
        <div className="shopify-style-layout__breadcrumbs">
          {breadcrumbs}
        </div>
      )}

      <div className="shopify-style-layout__header">
        <div className="shopify-style-layout__header-content">
          {category && (
            <CategoryPill>{category}</CategoryPill>
          )}
          <h1 className="shopify-style-layout__title">{title}</h1>
          {subtitle && (
            <p className="shopify-style-layout__subtitle">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="shopify-style-layout__actions">
            {actions}
          </div>
        )}
      </div>

      <div className="shopify-style-layout__body">
        <div className={`shopify-style-layout__main ${sidebar ? 'shopify-style-layout__main--with-sidebar' : ''}`}>
          {children}
        </div>

        {sidebar && (
          <div className="shopify-style-layout__sidebar">
            {sidebar}
          </div>
        )}
      </div>

      <style jsx>{`
        .shopify-style-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: var(--of-layout-max-width, 1100px);
          margin: 0 auto;
          padding: 0 var(--of-layout-padding, 32px);
        }

        .shopify-style-layout__breadcrumbs {
          margin-bottom: 16px;
        }

        .shopify-style-layout__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          width: 100%;
        }

        .shopify-style-layout__header-content {
          flex: 1;
        }

        .shopify-style-layout__title {
          font-size: var(--of-text-h1, 26px);
          font-weight: var(--of-font-semibold, 600);
          color: var(--color-text-main, #1a1a1a);
          margin: 6px 0 0 0;
          line-height: 1.2;
        }

        .shopify-style-layout__subtitle {
          font-size: 15px;
          color: var(--color-text-sub, #6b7177);
          margin: 8px 0 0 0;
          max-width: 700px;
        }

        .shopify-style-layout__body {
          display: flex;
          gap: var(--of-section-gap, 32px);
          width: 100%;
        }

        .shopify-style-layout__main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--of-card-gap, 24px);
        }

        .shopify-style-layout__main--with-sidebar {
          width: calc(100% - 300px - var(--of-section-gap, 32px));
        }

        .shopify-style-layout__sidebar {
          width: 300px;
          flex-shrink: 0;
        }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .shopify-style-layout__body {
            flex-direction: column;
          }

          .shopify-style-layout__main--with-sidebar {
            width: 100%;
            margin-bottom: var(--of-card-gap, 24px);
          }

          .shopify-style-layout__sidebar {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .shopify-style-layout {
            padding: 0 16px;
          }

          .shopify-style-layout__header {
            flex-direction: column;
          }

          .shopify-style-layout__actions {
            margin-top: 16px;
            width: 100%;
            display: flex;
            justify-content: flex-start;
          }

          .shopify-style-layout__title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
