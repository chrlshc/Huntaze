'use client';

/**
 * Analytics Card - Standard Anatomy Template
 * 
 * Stripe/Shopify-style card with consistent structure:
 * - Header: Title + Tooltip + Actions
 * - Body: Content (chart/table/visual)
 * - Footer: "Updated X min ago" + "More details" link
 * 
 * This creates the "produit mature" feel with drill-down everywhere.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';

interface AnalyticsCardProps {
  // Header
  title: string;
  subtitle?: string;
  tooltip?: string;
  actions?: ReactNode;
  
  // Body
  children: ReactNode;
  
  // Footer
  lastUpdated?: string;
  footer?: ReactNode;
  drillDownUrl?: string;
  drillDownLabel?: string;
  
  // Style
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function AnalyticsCard({
  title,
  subtitle,
  tooltip,
  actions,
  children,
  lastUpdated,
  footer,
  drillDownUrl,
  drillDownLabel = 'More details',
  className,
  padding = 'lg',
}: AnalyticsCardProps) {
  const showFooter = lastUpdated || footer || drillDownUrl;

  return (
    <ShopifyCard padding={padding} className={className}>
      {/* HEADER */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {tooltip && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={tooltip}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="w-full">
        {children}
      </div>

      {/* FOOTER */}
      {showFooter && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated}
              </span>
            )}
            {footer}
          </div>
          
          {drillDownUrl && (
            <Link
              href={drillDownUrl}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {drillDownLabel}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </ShopifyCard>
  );
}

/**
 * Helper: Format relative time for "Updated X min ago"
 */
export function formatUpdateTime(timestamp: string | Date): string {
  const now = new Date();
  const updateTime = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - updateTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  return 'over 24 hours ago';
}
