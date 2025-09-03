'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp,
  Users,
  DollarSign,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  Clock,
  Bot,
  Filter,
  Download,
  ChevronRight,
  Activity,
  Target,
  Zap
} from 'lucide-react';

export default function MobileAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'fans', label: 'Fans' },
    { id: 'content', label: 'Content' },
    { id: 'ai', label: 'AI' }
  ];

  const metrics = [
    {
      title: 'Total Revenue',
      value: '$8,476',
      change: '+32.4%',
      trend: 'up',
      icon: DollarSign
    },
    {
      title: 'Total Fans',
      value: '1,247',
      change: '+18.2%',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Engagement Rate',
      value: '4.8%',
      change: '+0.6%',
      trend: 'up',
      icon: Heart
    },
    {
      title: 'Content Views',
      value: '45.2K',
      change: '+23.4%',
      trend: 'up',
      icon: Eye
    }
  ];

  const topContent = [
    {
      title: 'Welcome Video',
      views: '12.3K',
      revenue: '$1,234',
      engagement: '89%'
    },
    {
      title: 'Exclusive Photos',
      views: '8.7K',
      revenue: '$987',
      engagement: '76%'
    },
    {
      title: 'Live Stream #42',
      views: '6.2K',
      revenue: '$756',
      engagement: '92%'
    }
  ];

  const insights = [
    {
      icon: Clock,
      label: 'Best Time',
      value: '9 PM - 12 AM',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Users,
      label: 'Top Location',
      value: 'USA (42%)',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: DollarSign,
      label: 'Avg. Value',
      value: '$47.20/mo',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Target,
      label: 'Retention',
      value: '87%',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100">
                <Filter className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-2.5 bg-purple-600 hover:bg-purple-700 rounded-full shadow-sm">
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { value: '24h', label: '24H' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  dateRange === range.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-2 flex gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium whitespace-nowrap relative ${
                activeTab === tab.id
                  ? 'text-purple-600'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl`}>
                    <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  {metric.trend === 'up' ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span className="text-xs font-bold">{metric.change}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <ArrowDownRight className="w-4 h-4" />
                      <span className="text-xs font-bold">{metric.change}</span>
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="px-4 pb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
          <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-end">
            {[40, 65, 55, 80, 70, 90, 85, 100, 95, 110].map((height, i) => (
              <div
                key={i}
                className="flex-1 mx-0.5 bg-purple-600 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            <span>Aug 21</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="px-4 pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Insights</h3>
        <div className="grid grid-cols-2 gap-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className={`inline-flex p-2 ${insight.bgColor} rounded-xl mb-3`}>
                  <Icon className={`w-5 h-5 ${insight.color}`} />
                </div>
                <p className="text-sm text-gray-600">{insight.label}</p>
                <p className="font-bold text-gray-900 mt-1">{insight.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Content */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Content</h3>
          <Link href="/content" className="text-sm text-purple-600 font-semibold flex items-center gap-1">
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {topContent.map((content, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{content.title}</h4>
                <span className="text-sm font-bold text-green-600">{content.revenue}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {content.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {content.engagement}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Performance */}
      <div className="px-4 pb-6">
        <div className="elevated-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Performance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 days</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300">Excellent</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">92%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">1.2m</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Response</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">AI handled 847 messages this week</p>
            <Link href="/ai/analytics" className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
              View Details
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Growth Tips */}
      <div className="mx-4 mb-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-amber-900">Growth Opportunity</h3>
          </div>
          <p className="text-sm text-amber-800 mb-3">
            Your engagement peaks at 9 PM EST. Schedule more content during this time to maximize revenue.
          </p>
          <button className="text-sm font-semibold text-amber-900">
            Optimize Schedule →
          </button>
        </div>
      </div>
    </div>
  );
}
