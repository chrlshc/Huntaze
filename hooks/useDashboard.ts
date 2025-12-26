'use client';

import useSWR from 'swr';
import { getConfigForEndpoint } from '@/lib/swr/config';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { dashboardResponseSchema } from '@/lib/schemas/api-responses';

export interface DashboardSummary {
  totalRevenue: {
    value: number;
    currency: string;
    change: number;
  };
  activeFans: {
    value: number;
    change: number;
  };
  messages: {
    total: number;
    unread: number;
  };
  engagement: {
    value: number;
    change: number;
  };
}

export interface TrendData {
  date: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  type: 'content_published' | 'campaign_sent' | 'fan_subscribed' | 'message_received';
  title: string;
  createdAt: string;
  source: 'content' | 'marketing' | 'onlyfans' | 'messages';
  meta?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  trends: {
    revenue: TrendData[];
    fans: TrendData[];
  };
  recentActivity: ActivityItem[];
  quickActions: QuickAction[];
  connectedIntegrations: {
    onlyfans: boolean;
    instagram: boolean;
    tiktok: boolean;
    reddit: boolean;
  };
  metadata: {
    sources: {
      onlyfans: boolean;
      instagram: boolean;
      tiktok: boolean;
      reddit: boolean;
    };
    hasRealData: boolean;
    generatedAt: string;
  };
}

export interface DashboardOptions {
  range?: '7d' | '30d' | '90d' | 'custom';
  from?: string;
  to?: string;
  include?: string[];
  refetchInterval?: number;
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

/**
 * Hook to fetch dashboard data
 */
export function useDashboard(options: DashboardOptions = {}) {
  const {
    range = '30d',
    from,
    to,
    include = ['analytics', 'content', 'onlyfans', 'marketing'],
    refetchInterval = 60000, // 1 minute
  } = options;

  const params = new URLSearchParams();
  params.append('range', range);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (include.length > 0) params.append('include', include.join(','));

  const url = `/api/dashboard?${params.toString()}`;

  // Use optimized SWR config, but allow custom refresh interval
  const swrConfig = {
    ...getConfigForEndpoint('/api/dashboard'),
    refreshInterval: refetchInterval, // Allow user override
  };

  const fetcher = (endpoint: string) =>
    internalApiFetch<DashboardResponse>(endpoint, { schema: dashboardResponseSchema });

  return useSWR<DashboardResponse>(url, fetcher, swrConfig);
}

/**
 * Helper to format currency
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Helper to format percentage
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

/**
 * Helper to format number
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Helper to get activity icon
 */
export function getActivityIcon(type: ActivityItem['type']): string {
  const icons = {
    content_published: '📝',
    campaign_sent: '📧',
    fan_subscribed: '⭐',
    message_received: '💬',
  };
  
  return icons[type] || '📌';
}

/**
 * Helper to get activity color
 */
export function getActivityColor(type: ActivityItem['type']): string {
  const colors = {
    content_published: 'blue',
    campaign_sent: 'green',
    fan_subscribed: 'purple',
    message_received: 'yellow',
  };
  
  return colors[type] || 'gray';
}
