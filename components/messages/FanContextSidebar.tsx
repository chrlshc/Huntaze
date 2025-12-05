'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';

/**
 * Fan context data model
 */
export interface FanContext {
  id: string;
  name: string;
  ltv: number;
  status: 'vip' | 'active' | 'at-risk' | 'churned';
  notes: string[];
  purchaseHistory: {
    date: Date;
    amount: number;
    item: string;
  }[];
}

/**
 * FanContextSidebar component props
 */
export interface FanContextSidebarProps {
  fan: FanContext | null;
  loading?: boolean;
}

/**
 * Status to badge status mapping
 */
const STATUS_BADGE_MAP: Record<FanContext['status'], 'success' | 'warning' | 'critical' | 'info' | 'neutral'> = {
  vip: 'success',
  active: 'info',
  'at-risk': 'warning',
  churned: 'critical',
};

/**
 * Status display labels
 */
const STATUS_LABELS: Record<FanContext['status'], string> = {
  vip: 'VIP',
  active: 'Active',
  'at-risk': 'At Risk',
  churned: 'Churned',
};

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}


/**
 * Skeleton loader for the sidebar
 */
function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-6 animate-pulse" data-testid="fan-context-loading">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      
      {/* LTV skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
      
      {/* Notes skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-16 bg-gray-200 rounded" />
      </div>
      
      {/* Purchase history skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state when no fan is selected
 */
function EmptyState() {
  return (
    <div 
      className="flex flex-col items-center justify-center h-full p-6 text-center"
      data-testid="fan-context-empty"
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
        <svg 
          className="w-6 h-6 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500">Select a conversation to view fan details</p>
    </div>
  );
}

/**
 * Section component for consistent styling
 */
function Section({ 
  title, 
  children,
  testId,
}: { 
  title: string; 
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="space-y-2" data-testid={testId}>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * FanContextSidebar Component
 * 
 * Displays contextual fan information including LTV, notes, and purchase history.
 * Used alongside the chat interface to provide context for personalized responses.
 * 
 * @example
 * ```tsx
 * <FanContextSidebar
 *   fan={selectedFan}
 *   loading={isLoading}
 * />
 * ```
 */
export function FanContextSidebar({
  fan,
  loading = false,
}: FanContextSidebarProps) {
  if (loading) {
    return <SidebarSkeleton />;
  }

  if (!fan) {
    return <EmptyState />;
  }

  return (
    <div 
      className="p-4 space-y-6 overflow-y-auto"
      data-testid="fan-context-sidebar"
    >
      {/* Fan Header */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900">{fan.name}</h3>
        <Badge status={STATUS_BADGE_MAP[fan.status]}>
          {STATUS_LABELS[fan.status]}
        </Badge>
      </div>

      {/* LTV Section - Requirements 8.1 */}
      <Section title="Lifetime Value" testId="fan-ltv-section">
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(fan.ltv)}
        </div>
      </Section>

      {/* Notes Section - Requirements 8.1 */}
      <Section title="Notes" testId="fan-notes-section">
        {fan.notes.length > 0 ? (
          <ul className="space-y-2">
            {fan.notes.map((note, index) => (
              <li 
                key={index}
                className="text-sm text-gray-600 bg-gray-50 rounded-md p-2"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 italic">No notes yet</p>
        )}
        <button
          type="button"
          className="text-sm text-violet-600 hover:text-violet-700 font-medium"
        >
          + Add note
        </button>
      </Section>

      {/* Purchase History Section - Requirements 8.1 */}
      <Section title="Purchase History" testId="fan-purchase-history-section">
        {fan.purchaseHistory.length > 0 ? (
          <ul className="space-y-2">
            {fan.purchaseHistory.slice(0, 5).map((purchase, index) => (
              <li 
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {purchase.item}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(purchase.date)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  {formatCurrency(purchase.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 italic">No purchases yet</p>
        )}
        {fan.purchaseHistory.length > 5 && (
          <button
            type="button"
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            View all ({fan.purchaseHistory.length})
          </button>
        )}
      </Section>
    </div>
  );
}

export default FanContextSidebar;
