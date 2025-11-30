/**
 * Lazy-loaded components for better performance
 * 
 * These components are loaded on-demand to reduce initial bundle size
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
);

// Charts
// Note: TrendChart component doesn't exist - commented out to fix TS2307
// export const TrendChart = dynamic(
//   () => import('@/components/charts/TrendChart'),
//   {
//     loading: () => <LoadingSpinner />,
//     ssr: false,
//   }
// );

export const RevenueForecastChart = dynamic(
  () => import('@/components/revenue/forecast/RevenueForecastChart').then(mod => mod.RevenueForecastChart),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Note: AnalyticsChart component doesn't exist - commented out to fix TS2307
// export const AnalyticsChart = dynamic(
//   () => import('@/components/charts/AnalyticsChart'),
//   {
//     loading: () => <LoadingSpinner />,
//     ssr: false,
//   }
// );

// Calendar
// Note: ContentCalendar component doesn't exist - commented out to fix TS2307
// export const ContentCalendar = dynamic(
//   () => import('@/components/calendar/ContentCalendar'),
//   {
//     loading: () => <LoadingSpinner />,
//     ssr: false,
//   }
// );

// Modals
export const ContentModal = dynamic(
  () => import('@/components/content/ContentModal'),
  {
    loading: () => <LoadingSpinner />,
  }
);

// Note: CampaignModal component doesn't exist - commented out to fix TS2307
// export const CampaignModal = dynamic(
//   () => import('@/components/marketing/CampaignModal'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

// Note: PPVModal component doesn't exist - commented out to fix TS2307
// export const PPVModal = dynamic(
//   () => import('@/components/onlyfans/PPVModal'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

// Heavy components
// Note: RichTextEditor component doesn't exist - commented out to fix TS2307
// export const RichTextEditor = dynamic(
//   () => import('@/components/editor/RichTextEditor'),
//   {
//     loading: () => <LoadingSpinner />,
//     ssr: false,
//   }
// );

// Note: MediaUploader component doesn't exist - commented out to fix TS2307
// export const MediaUploader = dynamic(
//   () => import('@/components/media/MediaUploader'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

// Note: VideoPlayer component doesn't exist - commented out to fix TS2307
// export const VideoPlayer = dynamic(
//   () => import('@/components/media/VideoPlayer'),
//   {
//     loading: () => <LoadingSpinner />,
//     ssr: false,
//   }
// );

// Analytics components
export const ChurnRiskList = dynamic(
  () => import('@/components/revenue/churn/ChurnRiskList'),
  {
    loading: () => <LoadingSpinner />,
  }
);

export const UpsellOpportunity = dynamic(
  () => import('@/components/revenue/upsell/UpsellOpportunity'),
  {
    loading: () => <LoadingSpinner />,
  }
);

export const PayoutTimeline = dynamic(
  () => import('@/components/revenue/payout/PayoutTimeline'),
  {
    loading: () => <LoadingSpinner />,
  }
);

// Social media components
// Note: InstagramFeed component doesn't exist - commented out to fix TS2307
// export const InstagramFeed = dynamic(
//   () => import('@/components/social/InstagramFeed'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

// Note: TikTokFeed component doesn't exist - commented out to fix TS2307
// export const TikTokFeed = dynamic(
//   () => import('@/components/social/TikTokFeed'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

// Message components
// Note: ConversationView component doesn't exist - commented out to fix TS2307
// export const ConversationView = dynamic(
//   () => import('@/components/messages/ConversationView'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

// Note: MessageComposer component doesn't exist - commented out to fix TS2307
// export const MessageComposer = dynamic(
//   () => import('@/components/messages/MessageComposer'),
//   {
//     loading: () => <LoadingSpinner />,
//   }
// );

/**
 * Utility function to create lazy-loaded component with custom loading
 */
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading as any || (() => <LoadingSpinner />),
    ssr: options?.ssr ?? true,
  });
}

/**
 * Preload a lazy component
 */
export function preloadComponent(component: any) {
  if (component.preload) {
    component.preload();
  }
}
