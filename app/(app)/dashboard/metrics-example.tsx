'use client';

import { MetricCard, MetricGroup, MiniMetric } from '@/components/ui/metric-card';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ArrowUpRight, DollarSign, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default function MetricsExample() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header with mini metrics */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="flex gap-6 mt-2">
              <MiniMetric label="Active" value="2,847" trend={12} />
              <MiniMetric label="New" value="+142" trend={8} />
              <MiniMetric label="Churn" value="3.2%" trend={-2} />
            </div>
          </div>
          <button className="h-10 px-4 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors">
            Export
          </button>
        </div>

        {/* Main metrics */}
        <MetricGroup>
          <MetricCard
            label="Revenue"
            value={47298}
            prefix="$"
            trend={{ value: 12, label: 'vs last month' }}
            variant="highlight"
          />
          <MetricCard
            label="Subscribers"
            value="4,832"
            trend={{ value: 8, label: 'this week' }}
          />
          <MetricCard
            label="Messages"
            value="12.4k"
            trend={{ value: -3, label: 'today' }}
          />
          <MetricCard
            label="Engagement"
            value="89"
            suffix="%"
            trend={{ value: 5 }}
          />
        </MetricGroup>

        {/* Comparison section */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Performance
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* This week vs last week */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase text-gray-500">Revenue</span>
                  <span className="font-semibold">$12,847</span>
                </div>
                <div className="metric-progress">
                  <div className="metric-progress-bar" style={{ width: '78%' }} />
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase text-gray-500">Target</span>
                  <span className="text-sm text-gray-600">78% of $16,500</span>
                </div>
              </div>
            </div>

            {/* Top performer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Top Platform</span>
                <div className="metric-trend-pill up">
                  <ArrowUpRight className="w-3 h-3" />
                  24%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">OnlyFans</p>
                  <p className="text-sm text-gray-500">2,847 active</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl">$8,492</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: 'Avg. Order', value: '$47' },
            { icon: Users, label: 'New Fans', value: '142' },
            { icon: MessageSquare, label: 'Response', value: '< 2m' },
            { icon: TrendingUp, label: 'Growth', value: '+12%' }
          ].map((stat, i) => (
            <div key={i} className="metric-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="metric-label">{stat.label}</p>
                  <p className="metric-value text-xl mt-1">{stat.value}</p>
                </div>
                <stat.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Activity feed style metrics */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[
              { label: 'New subscriber', value: '@sarah_j', time: '2m ago', trend: '+$49' },
              { label: 'Message sent', value: '142 fans', time: '1h ago', trend: '89% open' },
              { label: 'Content published', value: 'Premium set', time: '3h ago', trend: '$847' }
            ].map((activity, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.label}</p>
                  <p className="text-sm text-gray-500">{activity.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">{activity.trend}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}