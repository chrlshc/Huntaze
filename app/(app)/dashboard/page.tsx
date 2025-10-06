'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MessageSquare,
  MoreVertical,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Eye,
  Activity,
  Package,
  ShoppingBag
} from 'lucide-react';
import './dashboard-styles.css';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 75612.90,
    revenueChange: 12.5,
    subscribers: 2847,
    subscribersChange: 8.3,
    messages: 12453,
    messagesChange: -3.2,
    engagement: 78.5,
    engagementChange: 15.7
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Chart data simulation
  const chartData = [
    { date: 'Oct 6', value: 4200 },
    { date: 'Oct 7', value: 5100 },
    { date: 'Oct 8', value: 4800 },
    { date: 'Oct 9', value: 6200 },
    { date: 'Oct 10', value: 5900 },
    { date: 'Oct 11', value: 7100 },
    { date: 'Oct 12', value: 6800 },
    { date: 'Oct 13', value: 8200 },
    { date: 'Oct 14', value: 7900 },
    { date: 'Oct 15', value: 9100 },
    { date: 'Oct 16', value: 8800 },
    { date: 'Oct 17', value: 10200 },
    { date: 'Oct 18', value: 9800 },
    { date: 'Oct 19', value: 11500 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  const topContent = [
    { title: 'Exclusive photo set', type: 'Photo Set', revenue: '$2,450', change: '+45%' },
    { title: 'Personal video message', type: 'Video', revenue: '$1,890', change: '+32%' },
    { title: 'Live stream session', type: 'Live', revenue: '$1,650', change: '+28%' },
    { title: 'Premium bundle', type: 'Bundle', revenue: '$1,420', change: '+15%' },
    { title: 'Custom content request', type: 'Custom', revenue: '$980', change: '+8%' }
  ];

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface">
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-content-primary">Overview dashboard</h1>
            <div className="flex items-center gap-4">
              {/* Date Picker */}
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-elevated-light dark:bg-surface-elevated border border-border-light dark:border-border rounded-lg hover:border-primary/30 transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Last 30 days</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compare Period */}
          <div className="flex items-center gap-4 text-sm text-content-secondary">
            <button className="hover:text-primary transition-colors">
              Compare: Previous year
              <ChevronDown className="inline-block w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm text-content-secondary mb-1">Net sales over time</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-content-primary">${stats.revenue.toLocaleString()}</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${stats.revenueChange > 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.revenueChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(stats.revenueChange)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-64">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(107, 70, 193)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(107, 70, 193)" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line 
                  key={y} 
                  x1="0" 
                  y1={100 - y} 
                  x2="100" 
                  y2={100 - y} 
                  stroke="currentColor" 
                  strokeOpacity="0.1" 
                  className="text-content-tertiary"
                />
              ))}

              {/* Area */}
              <path
                d={`M 0,${100 - (chartData[0].value / maxValue) * 90} ${chartData.map((point, i) => 
                  `L ${(i / (chartData.length - 1)) * 100},${100 - (point.value / maxValue) * 90}`
                ).join(' ')} L 100,100 L 0,100 Z`}
                fill="url(#gradient)"
              />

              {/* Line */}
              <path
                d={`M 0,${100 - (chartData[0].value / maxValue) * 90} ${chartData.map((point, i) => 
                  `L ${(i / (chartData.length - 1)) * 100},${100 - (point.value / maxValue) * 90}`
                ).join(' ')}`}
                fill="none"
                stroke="rgb(107, 70, 193)"
                strokeWidth="2"
              />
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-content-tertiary">
              <span>{chartData[0].date}</span>
              <span>{chartData[Math.floor(chartData.length / 2)].date}</span>
              <span>{chartData[chartData.length - 1].date}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light dark:border-border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-sm text-content-secondary">Net sales</span>
              </div>
              <button className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                View comparison
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <Link href="/analytics" className="text-sm text-content-secondary hover:text-content-primary transition-colors">
              View report →
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Active Subscribers</span>
              <Users className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">{stats.subscribers.toLocaleString()}</span>
              <span className={`text-sm ${stats.subscribersChange > 0 ? 'text-success' : 'text-danger'}`}>
                {stats.subscribersChange > 0 ? '+' : ''}{stats.subscribersChange}%
              </span>
            </div>
          </div>

          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Messages Sent</span>
              <MessageSquare className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">{stats.messages.toLocaleString()}</span>
              <span className={`text-sm ${stats.messagesChange > 0 ? 'text-success' : 'text-danger'}`}>
                {stats.messagesChange > 0 ? '+' : ''}{stats.messagesChange}%
              </span>
            </div>
          </div>

          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Engagement Rate</span>
              <Activity className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">{stats.engagement}%</span>
              <span className={`text-sm ${stats.engagementChange > 0 ? 'text-success' : 'text-danger'}`}>
                {stats.engagementChange > 0 ? '+' : ''}{stats.engagementChange}%
              </span>
            </div>
          </div>

          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Content Created</span>
              <Package className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">346</span>
              <span className="text-sm text-success">+24%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Content */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border">
            <div className="p-6 border-b border-border-light dark:border-border">
              <h3 className="text-lg font-semibold text-content-primary">Top performing content</h3>
            </div>
            <div className="divide-y divide-border-light dark:divide-border">
              {topContent.map((item, index) => (
                <div key={index} className="p-4 hover:bg-surface-hover-light dark:hover:bg-surface-hover transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-content-primary">{item.title}</h4>
                      <p className="text-sm text-content-tertiary mt-0.5">{item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-content-primary">{item.revenue}</p>
                      <p className="text-sm text-success">{item.change}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border-light dark:border-border">
              <Link href="/analytics/content" className="text-sm text-primary hover:text-primary-hover transition-colors">
                View all content →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Quick actions</h3>
            <div className="space-y-3">
              <Link href="/campaigns/new" className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">Create campaign</p>
                    <p className="text-sm text-content-tertiary">Launch a new marketing campaign</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-content-tertiary group-hover:text-primary transition-colors" />
              </Link>

              <Link href="/ai/content" className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">Generate content</p>
                    <p className="text-sm text-content-tertiary">Use AI to create new posts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-content-tertiary group-hover:text-primary transition-colors" />
              </Link>

              <Link href="/messages" className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">View messages</p>
                    <p className="text-sm text-content-tertiary">12 new messages waiting</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-content-tertiary group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}