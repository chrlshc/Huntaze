'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import PerformanceCharts from '@/components/dashboard/PerformanceCharts';

/**
 * Dashboard Page
 * 
 * Main overview page displayed after user login.
 * Shows statistics, activity feed, quick actions, and performance charts.
 * 
 * Requirements: 1.1, 1.2
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-theme-bg p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme-text mb-2">
            Dashboard
          </h1>
          <p className="text-theme-muted">
            Welcome back! Here's what's happening with your account.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <Suspense fallback={<StatsOverviewSkeleton />}>
              <StatsOverview />
            </Suspense>

            {/* Performance Charts */}
            <Suspense fallback={<ChartSkeleton />}>
              <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
                <h2 className="text-lg font-semibold text-theme-text mb-4">
                  Performance (Last 7 Days)
                </h2>
                <PerformanceCharts />
              </div>
            </Suspense>
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Suspense fallback={<QuickActionsSkeleton />}>
              <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
                <h2 className="text-lg font-semibold text-theme-text mb-4">
                  Quick Actions
                </h2>
                <QuickActions />
              </div>
            </Suspense>

            {/* Activity Feed */}
            <Suspense fallback={<ActivityFeedSkeleton />}>
              <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
                <h2 className="text-lg font-semibold text-theme-text mb-4">
                  Recent Activity
                </h2>
                <ActivityFeed />
              </div>
            </Suspense>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Loading Skeletons
function StatsOverviewSkeleton() {
  return (
    <div className="bg-theme-surface rounded-xl p-6 border border-theme-border animate-pulse">
      <div className="h-6 bg-theme-border rounded w-32 mb-4"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-theme-border rounded w-20"></div>
            <div className="h-8 bg-theme-border rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-theme-surface rounded-xl p-6 border border-theme-border animate-pulse">
      <div className="h-6 bg-theme-border rounded w-32 mb-4"></div>
      <div className="h-64 bg-theme-border rounded"></div>
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="bg-theme-surface rounded-xl p-6 border border-theme-border animate-pulse">
      <div className="h-6 bg-theme-border rounded w-32 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-theme-border rounded"></div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeedSkeleton() {
  return (
    <div className="bg-theme-surface rounded-xl p-6 border border-theme-border animate-pulse">
      <div className="h-6 bg-theme-border rounded w-32 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-theme-border rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-theme-border rounded w-3/4"></div>
              <div className="h-3 bg-theme-border rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
