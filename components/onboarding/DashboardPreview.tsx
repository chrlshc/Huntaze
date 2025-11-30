'use client';

/**
 * Interactive Dashboard Preview Component
 * Shows sample data visualization during onboarding
 * 
 * Requirements:
 * - 6.2: Dashboard preview in onboarding
 * - 7.1: Interactive demo with sample data
 * - 7.2: Real (anonymized) or realistic sample data
 * - 7.4: Tooltips explaining key features
 */

import { useState } from 'react';
import { TrendingUp, Users, DollarSign, MessageSquare, Eye, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  tooltip: string;
}

function MetricCard({ icon, label, value, trend, trendUp, tooltip }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 w-64">
          <Card className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
            {tooltip}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </Card>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            {icon}
            <span>{label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className={`text-sm mt-1 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
            <span>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement'>('overview');

  const metrics = {
    overview: [
      {
        icon: <Users className="w-4 h-4" />,
        label: 'Total Fans',
        value: '2,847',
        trend: '+12.5% this month',
        trendUp: true,
        tooltip: 'Your total number of active subscribers across all platforms',
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: 'Monthly Revenue',
        value: '$8,420',
        trend: '+18.2% this month',
        trendUp: true,
        tooltip: 'Total revenue generated from subscriptions and tips this month',
      },
      {
        icon: <MessageSquare className="w-4 h-4" />,
        label: 'Messages Sent',
        value: '1,234',
        trend: '+8.3% this week',
        trendUp: true,
        tooltip: 'Number of messages sent to fans this week',
      },
      {
        icon: <Eye className="w-4 h-4" />,
        label: 'Content Views',
        value: '45.2K',
        trend: '+22.1% this week',
        trendUp: true,
        tooltip: 'Total views across all your content this week',
      },
    ],
    engagement: [
      {
        icon: <Heart className="w-4 h-4" />,
        label: 'Engagement Rate',
        value: '68%',
        trend: '+5.2% this week',
        trendUp: true,
        tooltip: 'Percentage of fans actively engaging with your content',
      },
      {
        icon: <MessageSquare className="w-4 h-4" />,
        label: 'Response Rate',
        value: '92%',
        trend: '+3.1% this week',
        trendUp: true,
        tooltip: 'How quickly you respond to fan messages',
      },
      {
        icon: <Users className="w-4 h-4" />,
        label: 'Active Chats',
        value: '156',
        trend: '+12 today',
        trendUp: true,
        tooltip: 'Number of ongoing conversations with fans',
      },
      {
        icon: <TrendingUp className="w-4 h-4" />,
        label: 'Conversion Rate',
        value: '24%',
        trend: '+2.8% this month',
        trendUp: true,
        tooltip: 'Percentage of visitors who become paying subscribers',
      },
    ],
  };

  const currentMetrics = metrics[activeTab];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Dashboard Preview
        </h2>
        <p className="text-gray-600">
          This is what your analytics will look like. Hover over cards to learn more!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
        <Button 
          variant="primary" 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </Button>
        <Button 
          variant="primary" 
          onClick={() => setActiveTab('engagement')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            activeTab === 'engagement'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Engagement
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {currentMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Sample Chart Placeholder */}
      <Card className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trend (Last 30 Days)
        </h3>
        <div className="h-48 bg-gradient-to-t from-purple-50 to-transparent rounded-lg flex items-end justify-around p-4">
          {[65, 72, 68, 80, 85, 78, 92, 88, 95, 100].map((height, i) => (
            <div
              key={i}
              className="bg-purple-500 rounded-t-lg w-8 hover:bg-purple-600 transition-colors cursor-pointer"
              style={{ height: `${height}%` }}
              title={`Day ${i + 1}: $${(height * 100).toFixed(0)}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </Card>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">💡</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              This is sample data
            </h4>
            <p className="text-sm text-blue-800">
              Once you connect your platforms, you'll see your real analytics here. 
              All data is updated in real-time and securely stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
