/**
 * Home Page - Real-time data
 * Requires dynamic rendering for user-specific stats
 * Requirements: 2.1, 2.2
 * Phase 2: Enhanced with modern design and comprehensive stats
 */
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { StatCard } from './StatCard';
import { StatsGridSkeleton } from './StatsGridSkeleton';
import { PlatformStatus } from './PlatformStatus';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { DollarSign, Users, MessageSquare, FileText, Sparkles } from 'lucide-react';
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
  revenue: {
    today: 0,
    week: 0,
    month: 0,
    trend: 0,
  },
  fans: {
    total: 0,
    active: 0,
    newToday: 0,
    trend: 0,
  },
  messages: {
    received: 0,
    sent: 0,
    responseRate: 0,
    avgResponseTime: 0,
  },
  content: {
    postsThisWeek: 0,
    totalViews: 0,
    engagementRate: 0,
  },
  ai: {
    messagesUsed: 0,
    quotaRemaining: 1000,
    quotaTotal: 1000,
  },
};

/**
 * Fetch home stats from API with retry logic
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
 */
async function getHomeStats(): Promise<HomeStats> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/home/stats`, {
        cache: 'no-store', // Disable caching for now - will add caching in task 22
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        // Check if error is retryable (5xx errors or 503)
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
      
      // Handle both old and new response formats
      if (data.success && data.data) {
        return data.data;
      }
      
      // Legacy format support
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

async function StatsGrid() {
  const stats = await getHomeStats();

  return (
    <div className="stats-grid">
      {/* Revenue Card */}
      <StatCard
        label="Monthly Revenue"
        value={stats.revenue.month}
        trend={stats.revenue.trend}
        description={`$${stats.revenue.today.toLocaleString()} today • $${stats.revenue.week.toLocaleString()} this week`}
        icon={DollarSign}
        color="green"
        type="currency"
      />
      
      {/* Fans Card */}
      <StatCard
        label="Total Fans"
        value={stats.fans.total}
        trend={stats.fans.trend}
        description={`${stats.fans.active} active • ${stats.fans.newToday} new today`}
        icon={Users}
        color="blue"
        type="number"
      />
      
      {/* Messages Card */}
      <StatCard
        label="Response Rate"
        value={stats.messages.responseRate}
        trend={stats.messages.responseRate > 90 ? 5 : -2}
        description={`${stats.messages.sent} sent • ${stats.messages.received} received`}
        icon={MessageSquare}
        color="purple"
        type="percentage"
      />
      
      {/* Content Card */}
      <StatCard
        label="Content Performance"
        value={stats.content.engagementRate}
        trend={stats.content.engagementRate > 80 ? 8 : -3}
        description={`${stats.content.postsThisWeek} posts • ${stats.content.totalViews.toLocaleString()} views`}
        icon={FileText}
        color="orange"
        type="percentage"
      />
      
      {/* AI Usage Card */}
      <StatCard
        label="AI Messages"
        value={`${stats.ai.messagesUsed}/${stats.ai.quotaTotal}`}
        description={`${stats.ai.quotaRemaining} remaining this month`}
        icon={Sparkles}
        color="purple"
        type="number"
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Home</h1>
        <p className="page-subtitle">Welcome back! Here's your performance overview.</p>
      </div>

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
