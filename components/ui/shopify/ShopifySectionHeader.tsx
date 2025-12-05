'use client';

import React from 'react';

export interface ShopifySectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional action buttons aligned to the right */
  actions?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom margin-top (default: 24px) */
  marginTop?: number | string;
  /** Custom margin-bottom (default: 16px) */
  marginBottom?: number | string;
}

/**
 * ShopifySectionHeader - Section header component following Shopify design guidelines
 * 
 * Features:
 * - Title: 16-18px, semibold
 * - 24px margin-top, 16px margin-bottom
 * - Optional actions aligned right
 */
export function ShopifySectionHeader({
  title,
  actions,
  className = '',
  marginTop = 24,
  marginBottom = 16,
}: ShopifySectionHeaderProps) {
  const marginTopValue = typeof marginTop === 'number' ? `${marginTop}px` : marginTop;
  const marginBottomValue = typeof marginBottom === 'number' ? `${marginBottom}px` : marginBottom;

  return (
    <div
      className={`shopify-section-header ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: marginTopValue,
        marginBottom: marginBottomValue,
      }}
    >
      <h2
        className="shopify-section-header__title"
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--shopify-text-primary, #1a1a1a)',
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {title}
      </h2>
      {actions && (
        <div
          className="shopify-section-header__actions"
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

export default ShopifySectionHeader;
