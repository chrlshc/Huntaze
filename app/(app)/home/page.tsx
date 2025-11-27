/**
 * Home Page - Real-time data
 * Requires dynamic rendering for user-specific stats
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { StatCard } from './StatCard';
import { StatsGridSkeleton } from './StatsGridSkeleton';
import { PlatformStatus } from './PlatformStatus';
import { QuickActions } from './QuickActions';
import './home.css';

interface HomeStats {
  messagesSent: number;
  messagesTrend: number;
  responseRate: number;
  responseRateTrend: number;
  revenue: number;
  revenueTrend: number;
  activeChats: number;
  activeChatsTrend: number;
}

/**
 * Default stats for error fallback
 */
const DEFAULT_STATS: HomeStats = {
  messagesSent: 0,
  messagesTrend: 0,
  responseRate: 0,
  responseRateTrend: 0,
  revenue: 0,
  revenueTrend: 0,
  activeChats: 0,
  activeChatsTrend: 0
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
      <StatCard
        label="Messages Sent"
        value={stats.messagesSent.toLocaleString()}
        trend={stats.messagesTrend}
        description="Last 7 days"
      />
      <StatCard
        label="Response Rate"
        value={`${stats.responseRate}%`}
        trend={stats.responseRateTrend}
        description="AI-powered replies"
      />
      <StatCard
        label="Revenue"
        value={`$${stats.revenue.toLocaleString()}`}
        trend={stats.revenueTrend}
        description="This month"
      />
      <StatCard
        label="Active Chats"
        value={stats.activeChats.toLocaleString()}
        trend={stats.activeChatsTrend}
        description="Ongoing conversations"
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

      {/* Platform Status - Requirements: 8.2, 8.3, 8.4 */}
      <PlatformStatus />

      {/* Quick Actions - Requirements: 9.1, 9.2, 9.3, 9.4 */}
      <QuickActions />
    </div>
  );
}
