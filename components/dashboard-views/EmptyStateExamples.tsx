import React from 'react';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';

/**
 * Empty State Examples for Dashboard Views
 * 
 * This file provides example implementations of empty states for:
 * - Smart Messages view (no rules)
 * - Fans view (no fans)
 * - PPV Content view (no content)
 * 
 * These examples demonstrate how to use the DashboardEmptyState component
 * with appropriate icons, messages, and CTAs for each view.
 */

/**
 * Smart Messages Empty State
 * 
 * Displayed when no smart rules exist.
 * Encourages users to create their first automation rule.
 */
export function SmartMessagesEmptyState({
  onCreateRule,
}: {
  onCreateRule: () => void;
}) {
  return (
    <DashboardEmptyState
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-12 h-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      }
      title="No smart rules yet"
      description="Create automated workflows to save time and engage fans more effectively"
      benefits={[
        'Auto-respond to new subscribers',
        'Re-engage inactive fans',
        'Prioritize VIP conversations',
      ]}
      cta={{
        label: 'New Smart Rule',
        onClick: onCreateRule,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        ),
      }}
    />
  );
}

/**
 * Fans Empty State
 * 
 * Displayed when no fans exist in the system.
 * Encourages users to connect their OnlyFans account or import fans.
 */
export function FansEmptyState({
  onConnectAccount,
}: {
  onConnectAccount: () => void;
}) {
  return (
    <DashboardEmptyState
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-12 h-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      title="No fans yet"
      description="Connect your OnlyFans account to start managing your fan relationships"
      benefits={[
        'Track fan engagement and lifetime value',
        'Identify VIP fans and at-risk subscribers',
        'Segment fans for targeted messaging',
      ]}
      cta={{
        label: 'Connect OnlyFans',
        onClick: onConnectAccount,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        ),
      }}
    />
  );
}

/**
 * PPV Content Empty State
 * 
 * Displayed when no PPV content exists.
 * Encourages users to create their first PPV content.
 */
export function PPVContentEmptyState({
  onCreateContent,
}: {
  onCreateContent: () => void;
}) {
  return (
    <DashboardEmptyState
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-12 h-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      }
      title="No PPV content yet"
      description="Create pay-per-view content to monetize your exclusive media"
      benefits={[
        'Set custom prices for premium content',
        'Track opens and purchase rates',
        'Send targeted PPV messages to fans',
      ]}
      cta={{
        label: 'Create PPV Content',
        onClick: onCreateContent,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        ),
      }}
    />
  );
}

/**
 * Generic Data Empty State
 * 
 * Generic empty state for when data is empty but not due to missing setup.
 * Can be used for filtered results, search results, etc.
 */
export function GenericDataEmptyState({
  title = 'No data found',
  description = 'Try adjusting your filters or search criteria',
  onClearFilters,
}: {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
}) {
  return (
    <DashboardEmptyState
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-12 h-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      }
      title={title}
      description={description}
      cta={{
        label: onClearFilters ? 'Clear Filters' : 'Refresh',
        onClick: onClearFilters || (() => window.location.reload()),
      }}
    />
  );
}

/**
 * Usage Example in a Dashboard View
 * 
 * ```tsx
 * function SmartMessagesView() {
 *   const { data, isLoading, error } = useSmartRules();
 *   const navigate = useNavigate();
 * 
 *   if (isLoading) {
 *     return <DashboardViewSkeleton metrics={2} showTable={false} />;
 *   }
 * 
 *   if (error) {
 *     return <DashboardErrorState message={error.message} onRetry={refetch} />;
 *   }
 * 
 *   if (!data || data.length === 0) {
 *     return (
 *       <SmartMessagesEmptyState
 *         onCreateRule={() => navigate('/smart-messages/new')}
 *       />
 *     );
 *   }
 * 
 *   return <SmartRulesList rules={data} />;
 * }
 * ```
 */
