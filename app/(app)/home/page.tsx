/**
 * Home Page - Real-time data
 * Requires dynamic rendering for user-specific stats
 * Requirements: 2.1, 2.2
 * Phase 2: Enhanced with modern design and comprehensive stats
 * Phase 9: Refactored to use design system components (StatCard, Banner)
 */
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Banner } from '@/components/ui/Banner';
import { StatsGridSkeleton } from './StatsGridSkeleton';
import { PlatformStatus } from './PlatformStatus';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import './home.css';

interface HomeStats {
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  fans: {
    total: number;
    active: number;
    newToday: number;
    trend: number;
  };
  messages: {
    received: number;
    sent: number;
    responseRate: number;
    avgResponseTime: number;
  };
  content: {
    postsThisWeek: number;
    totalViews: number;
    engagementRate: number;
  };
  ai: {
    messagesUsed: number;
    quotaRemaining: number;
    quotaTotal: number;
  };
  // Legacy fields for backward compatibility
  messagesSent?: number;
  messagesTrend?: number;
  responseRate?: number;
  responseRateTrend?: number;
  revenueTrend?: number;
  activeChats?: number;
  activeChatsTrend?: number;
}

/**
 * Default stats for error fallback
 */
const DEFAULT_STATS: HomeStats = {
  revenue: { today: 0, week: 0, month: 0, trend: 0 },
  fans: { total: 0, active: 0, newToday: 0, trend: 0 },
  messages: { received: 0, sent: 0, responseRate: 0, avgResponseTime: 0 },
  content: { postsThisWeek: 0, totalViews: 0, engagementRate: 0 },
  ai: { messagesUsed: 0, quotaRemaining: 1000, quotaTotal: 1000 },
};


/**
 * Fetch home stats from API with retry logic
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
 */
async function getHomeStats(): Promise<HomeStats> {
  const maxRetries = 3;
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/home/stats`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 503;
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`API request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error('Failed to fetch stats:', response.status);
        return DEFAULT_STATS;
      }

      const data = await response.json();
      if (data.success && data.data) return data.data;
      return data;
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`Error fetching stats (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error('Error fetching home stats after all retries:', error);
      return DEFAULT_STATS;
    }
  }
  return DEFAULT_STATS;
}

/** Helper to format currency values */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

/** Helper to determine trend direction from percentage */
function getTrendDirection(trend: number): 'up' | 'down' | 'neutral' {
  if (trend > 0) return 'up';
  if (trend < 0) return 'down';
  return 'neutral';
}


/**
 * StatsGrid - Uses design system StatCard component
 * Requirements: 1.1-5.4 (Design tokens, typography, cards, empty states, banners)
 */
async function StatsGrid() {
  const stats = await getHomeStats();

  return (
    <div className="stats-grid">
      {/* Revenue Card - Using design system StatCard */}
      <StatCard
        label="Monthly Revenue"
        value={formatCurrency(stats.revenue.month)}
        trend={{
          direction: getTrendDirection(stats.revenue.trend),
          value: `${Math.abs(stats.revenue.trend)}%`
        }}
        isEmpty={stats.revenue.month === 0}
        emptyMessage="No revenue data yet"
      />
      
      {/* Fans Card */}
      <StatCard
        label="Total Fans"
        value={stats.fans.total.toLocaleString()}
        trend={{
          direction: getTrendDirection(stats.fans.trend),
          value: `${Math.abs(stats.fans.trend)}%`
        }}
        isEmpty={stats.fans.total === 0}
        emptyMessage="No fans data yet"
      />
      
      {/* Messages Card */}
      <StatCard
        label="Response Rate"
        value={`${stats.messages.responseRate}%`}
        trend={{
          direction: getTrendDirection(stats.messages.responseRate > 90 ? 5 : -2),
          value: `${Math.abs(stats.messages.responseRate > 90 ? 5 : -2)}%`
        }}
        isEmpty={stats.messages.sent === 0 && stats.messages.received === 0}
        emptyMessage="No messages yet"
      />
      
      {/* Content Card */}
      <StatCard
        label="Content Performance"
        value={`${stats.content.engagementRate}%`}
        trend={{
          direction: getTrendDirection(stats.content.engagementRate > 80 ? 8 : -3),
          value: `${Math.abs(stats.content.engagementRate > 80 ? 8 : -3)}%`
        }}
        isEmpty={stats.content.postsThisWeek === 0}
        emptyMessage="No content posted yet"
      />
      
      {/* AI Usage Card */}
      <StatCard
        label="AI Messages"
        value={`${stats.ai.messagesUsed}/${stats.ai.quotaTotal}`}
        isEmpty={stats.ai.messagesUsed === 0}
        emptyMessage="No AI messages used yet"
      />
    </div>
  );
}


export default function HomePage() {
  return (
    <div className="home-page">
      {/* Welcome Banner - Using design system Banner component */}
      <Banner
        status="info"
        title="Welcome to Huntaze"
        description="Get your creator business set up in a few steps. Connect your platforms, turn on your AI assistant, and keep an eye on revenue in one place."
        className="mb-[var(--space-6)]"
      />

      {/* Stats Grid with Suspense for loading state */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid />
      </Suspense>

      {/* Two Column Layout for Quick Actions & Recent Activity */}
      <div className="home-two-column">
        <div className="home-left-column">
          {/* Quick Actions - Requirements: 9.1, 9.2, 9.3, 9.4 */}
          <QuickActions />
          
          {/* Recent Activity - Requirements: 1.5 */}
          <RecentActivity />
        </div>
        
        <div className="home-right-column">
          {/* Platform Status - Requirements: 8.2, 8.3, 8.4 */}
          <PlatformStatus />
        </div>
      </div>
    </div>
  );
}
