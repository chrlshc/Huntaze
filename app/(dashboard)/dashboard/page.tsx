import { DollarSign, MessageSquare, Megaphone, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';

// Mock data - will be replaced with real API calls
const metrics = [
  {
    title: 'Total Revenue',
    value: '$12,450',
    change: 12.5,
    changeType: 'increase' as const,
    icon: DollarSign,
    trend: [40, 45, 50, 48, 55, 60, 65],
  },
  {
    title: 'Messages Sent',
    value: '1,234',
    change: 8.2,
    changeType: 'increase' as const,
    icon: MessageSquare,
    trend: [30, 35, 32, 40, 45, 50, 48],
  },
  {
    title: 'Active Campaigns',
    value: '8',
    change: 2.1,
    changeType: 'decrease' as const,
    icon: Megaphone,
    trend: [10, 12, 11, 9, 8, 8, 8],
  },
  {
    title: 'Engagement Rate',
    value: '68%',
    change: 5.4,
    changeType: 'increase' as const,
    icon: TrendingUp,
    trend: [60, 62, 65, 63, 66, 67, 68],
  },
];

const revenueData = [
  { date: 'Mon', revenue: 1200, messages: 45 },
  { date: 'Tue', revenue: 1500, messages: 52 },
  { date: 'Wed', revenue: 1300, messages: 48 },
  { date: 'Thu', revenue: 1800, messages: 60 },
  { date: 'Fri', revenue: 2100, messages: 70 },
  { date: 'Sat', revenue: 2400, messages: 80 },
  { date: 'Sun', revenue: 2150, messages: 75 },
];

const recentActivities = [
  {
    id: '1',
    type: 'message' as const,
    title: 'Message sent successfully',
    description: 'Campaign "Summer Promo" message delivered to 150 subscribers',
    status: 'success' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    type: 'campaign' as const,
    title: 'Campaign scheduled',
    description: 'New campaign "Weekend Special" scheduled for tomorrow',
    status: 'pending' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '3',
    type: 'content' as const,
    title: 'Content uploaded',
    description: '5 new images added to content library',
    status: 'success' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={revenueData}
        dateRange="week"
        onDateRangeChange={(range) => console.log('Date range changed:', range)}
      />

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivities} />
        <QuickActions />
      </div>
    </div>
  );
}
