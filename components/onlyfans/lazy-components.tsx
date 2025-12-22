/**
 * Lazy-loaded OnlyFans Components
 * 
 * Code-split components to reduce initial bundle size
 * and improve Core Web Vitals (LCP, FID)
 * 
 * Requirements: 9.5
 * Property 20: Core Web Vitals Performance
 */

'use client';

import { lazyLoadComponent } from '@/lib/performance/onlyfans-optimization';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading fallback for metric cards
 */
const MetricCardSkeleton = () => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
    <Skeleton className="h-4 w-24 mb-2" />
    <Skeleton className="h-8 w-32 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

/**
 * Loading fallback for tables
 */
const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="p-4 border-b border-gray-200">
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Loading fallback for cards
 */
const CardSkeleton = () => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
    <Skeleton className="h-6 w-48 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

/**
 * Lazy-loaded Shopify components
 */
export const LazyShopifyMetricCard = lazyLoadComponent(
  () => import('@/components/ui/shopify/ShopifyMetricCard'),
  { loading: MetricCardSkeleton }
);

export const LazyShopifyIndexTable = lazyLoadComponent(
  () => import('@/components/ui/shopify/ShopifyIndexTable'),
  { loading: TableSkeleton }
);

export const LazyShopifyCard = lazyLoadComponent(
  () => import('@/components/ui/shopify/ShopifyCard'),
  { loading: CardSkeleton }
);

export const LazyShopifyBanner = lazyLoadComponent(
  () => import('@/components/ui/shopify/ShopifyBanner'),
  { loading: () => <Skeleton className="h-16 w-full rounded-lg" /> }
);

export const LazyShopifyEmptyState = lazyLoadComponent(
  () => import('@/components/ui/shopify/ShopifyEmptyState'),
  { loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);

/**
 * Lazy-loaded messaging components
 */
export const LazyMessagingInterface = lazyLoadComponent(
  () => import('@/components/messages/MessagingInterface'),
  {
    loading: () => (
      <div className="flex h-screen">
        <div className="w-80 border-r border-gray-200 p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    ),
  }
);

/**
 * Lazy-loaded chart components
 */
export const LazyRevenueChart = lazyLoadComponent(
  () => import('@/components/analytics/RevenueChart').then(mod => ({ default: mod.RevenueChart })),
  { loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);

export const LazyEngagementChart = lazyLoadComponent(
  () => import('@/components/analytics/EngagementChart').then(mod => ({ default: mod.EngagementChart })),
  { loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);

/**
 * Lazy-loaded form components
 */
export const LazyPPVForm = lazyLoadComponent(
  () => import('@/components/ppv/PPVForm').then(mod => ({ default: mod.PPVForm })),
  { loading: CardSkeleton }
);

export const LazyMessageTemplateForm = lazyLoadComponent(
  () => import('@/components/messages/MessageTemplateForm').then(mod => ({ default: mod.MessageTemplateForm })),
  { loading: CardSkeleton }
);

/**
 * Lazy-loaded AI components
 */
export const LazyAIAssistantPanel = lazyLoadComponent(
  () => import('@/components/ai/AIAssistantPanel'),
  {
    loading: () => (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
  }
);

export const LazyAIInsightsDashboard = lazyLoadComponent(
  () => import('@/components/ai/AIInsightsDashboard'),
  { loading: () => <Skeleton className="h-96 w-full rounded-lg" /> }
);

/**
 * Lazy-loaded settings components
 */
export const LazyConnectionSettings = lazyLoadComponent(
  () => import('@/components/settings/ConnectionSettings').then(mod => ({ default: mod.ConnectionSettings })),
  { loading: CardSkeleton }
);

export const LazyNotificationSettings = lazyLoadComponent(
  () => import('@/components/settings/NotificationSettings').then(mod => ({ default: mod.NotificationSettings })),
  { loading: CardSkeleton }
);

/**
 * Lazy-loaded fan components
 */
export const LazyFanSegmentCard = lazyLoadComponent(
  () => import('@/components/fans/SegmentCard'),
  { loading: CardSkeleton }
);

export const LazyFanProfilePanel = lazyLoadComponent(
  () => import('@/components/fans/FanProfilePanel').then(mod => ({ default: mod.FanProfilePanel })),
  { loading: () => <Skeleton className="h-screen w-full" /> }
);
