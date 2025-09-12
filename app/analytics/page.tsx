'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOnboarding } from '@/hooks/useOnboarding';
import MobileAnalytics from './mobile-page';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Calendar, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  Heart,
  Share2,
  Clock,
  Target,
  Zap,
  Globe,
  CreditCard,
  Bot,
  Star,
  AlertCircle,
  Dumbbell,
  Camera,
  Gamepad2,
  Sparkles,
  Palette,
  BookOpen,
  Flame,
  Package,
  ShoppingBag,
  Music,
  Video
} from 'lucide-react';
import { GatedContent, GatedBanner } from '@/components/dashboard/GatedContent';
import dynamic from 'next/dynamic';
import ResumeBanner from '@/components/onboarding/ResumeBanner';
import { useAnalytics as useGa } from '@/hooks/useAnalytics';

// Dynamic imports for charts to reduce bundle size
const DynamicLine = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
  }
);

const DynamicBar = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
  }
);

const DynamicDoughnut = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Doughnut),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
  }
);

// Chart.js setup - only load when charts are used
if (typeof window !== 'undefined') {
  import('chart.js').then((chartModule) => {
    const {
      Chart,
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
      Filler
    } = chartModule;
    
    Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
      Filler
    );
  });
}
import type { OverviewMetrics } from '@/types/analytics';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const { currentStep, isStepCompleted } = useOnboarding();
  const onboarding = isStepCompleted('completed') ? 'completed' : 'in_progress';
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { trackEvent } = useGa();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (isMobile) {
    return <MobileAnalytics />;
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
    (async () => {
      try {
        const [p, a, o] = await Promise.all([
          fetch('/api/users/profile', { cache: 'no-store' }),
          fetch('/api/ai/config', { cache: 'no-store' }),
          fetch('/api/analytics/overview', { cache: 'no-store' }),
        ]);
        if (p.ok) setProfile(await p.json());
        if (a.ok) setAiConfig(await a.json());
        if (o.ok) setOverview(await o.json());
      } catch {}
    })();
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('visited_analytics', '1');
        trackEvent('analytics_visited');
      }
    } catch {}
  }, []);

  // Revenue Chart Data
  const revenueData = {
    labels: overview?.revenueSeries.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: overview?.revenueSeries.values || [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Fan Growth Data
  const fanGrowthData = {
    labels: overview?.fanGrowth.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'New Fans',
        data: overview?.fanGrowth.newFans || [120, 150, 180, 240],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Active Fans',
        data: overview?.fanGrowth.activeFans || [80, 120, 140, 190],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }
    ]
  };

  // Platform Distribution
  const platformData = {
    labels: (overview?.platformDistribution?.map(p => p.platform) || ['OnlyFans', 'Instagram', 'TikTok', 'Reddit']).map(p => p[0].toUpperCase() + p.slice(1)),
    datasets: [
      {
        data: overview?.platformDistribution?.map(p => Math.round(p.share*100)) || [45, 30, 20, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  // Personalized metrics based on user's niche and goals
  const getPersonalizedMetrics = () => {
    const baseMetrics = [
      {
        title: 'Total Revenue',
        value: '$124,580',
        change: '+32.4%',
        trend: 'up',
        icon: DollarSign,
        color: 'green',
        sparkline: [20, 30, 25, 40, 35, 50, 45, 60, 55, 70]
      },
      {
        title: 'Total Fans',
        value: '8,492',
        change: '+18.2%',
        trend: 'up',
        icon: Users,
        color: 'blue',
        sparkline: [30, 35, 32, 40, 45, 48, 52, 58, 60, 65]
      }
    ];

    // Add niche-specific metrics
    if (profile?.niche === 'fitness') {
      baseMetrics.push(
        {
          title: 'Workout Plans Sold',
          value: '456',
          change: '+28.5%',
          trend: 'up',
          icon: Dumbbell,
          color: 'green',
          sparkline: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
        },
        {
          title: 'Program Completion',
          value: '78%',
          change: '+5.2%',
          trend: 'up',
          icon: Target,
          color: 'purple',
          sparkline: [60, 62, 65, 68, 70, 72, 74, 76, 78, 78]
        }
      );
    } else if (profile?.niche === 'gaming') {
      baseMetrics.push(
        {
          title: 'Stream Views',
          value: '45.2K',
          change: '+67.3%',
          trend: 'up',
          icon: Gamepad2,
          color: 'purple',
          sparkline: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
        },
        {
          title: 'Gaming Sessions',
          value: '128',
          change: '+12.8%',
          trend: 'up',
          icon: Activity,
          color: 'orange',
          sparkline: [80, 85, 90, 95, 100, 105, 110, 115, 120, 128]
        }
      );
    } else if (profile?.niche === 'adult') {
      baseMetrics.push(
        {
          title: 'PPV Sales',
          value: '$45,230',
          change: '+42.7%',
          trend: 'up',
          icon: Package,
          color: 'pink',
          sparkline: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
        },
        {
          title: 'Tips Received',
          value: '$8,945',
          change: '+38.2%',
          trend: 'up',
          icon: Heart,
          color: 'red',
          sparkline: [30, 35, 40, 45, 50, 55, 60, 65, 70, 75]
        }
      );
    } else if (profile?.niche === 'fashion') {
      baseMetrics.push(
        {
          title: 'Outfit Posts',
          value: '234',
          change: '+15.8%',
          trend: 'up',
          icon: ShoppingBag,
          color: 'pink',
          sparkline: [180, 185, 190, 195, 200, 210, 220, 225, 230, 234]
        },
        {
          title: 'Brand Collabs',
          value: '12',
          change: '+20%',
          trend: 'up',
          icon: Sparkles,
          color: 'purple',
          sparkline: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12]
        }
      );
    } else {
      // Default metrics for other niches
      baseMetrics.push(
        {
          title: 'Content Views',
          value: '156K',
          change: '+23.4%',
          trend: 'up',
          icon: Eye,
          color: 'purple',
          sparkline: [100, 110, 120, 130, 140, 145, 150, 155, 156, 156]
        },
        {
          title: 'Engagement Rate',
          value: '4.8%',
          change: '+0.6%',
          trend: 'up',
          icon: Heart,
          color: 'pink',
          sparkline: [3.5, 3.8, 4.0, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.8]
        }
      );
    }

    // Add goal-specific metrics
    if (profile?.goals?.includes('time')) {
      const timeIndex = baseMetrics.findIndex(m => m.title === 'Avg. Response Time');
      if (timeIndex === -1) {
        baseMetrics.push({
          title: 'Time Saved',
          value: '24.5 hrs',
          change: '+18%',
          trend: 'up',
          icon: Clock,
          color: 'orange',
          sparkline: [15, 16, 18, 19, 20, 21, 22, 23, 24, 24.5]
        });
      }
    }

    return baseMetrics.slice(0, 4); // Return top 4 metrics
  };

  const metrics = getPersonalizedMetrics();

  // Personalized top performers based on niche
  const getTopPerformers = () => {
    if (profile?.niche === 'fitness') {
      return [
        {
          name: '30-Day Challenge',
          type: 'Program',
          revenue: '$18,450',
          conversions: 423,
          rate: '82%',
          trend: '+15%'
        },
        {
          name: 'Meal Plan Bundle',
          type: 'Content',
          revenue: '$12,320',
          conversions: 289,
          rate: '71%',
          trend: '+9%'
        },
        {
          name: 'Personal Training',
          type: 'Service',
          revenue: '$9,870',
          conversions: 67,
          rate: '89%',
          trend: '+22%'
        },
        {
          name: 'Workout Videos',
          type: 'Content',
          revenue: '$7,230',
          conversions: 156,
          rate: '64%',
          trend: '+7%'
        }
      ];
    } else if (profile?.niche === 'gaming') {
      return [
        {
          name: 'Exclusive Streams',
          type: 'Live Content',
          revenue: '$21,340',
          conversions: 567,
          rate: '73%',
          trend: '+18%'
        },
        {
          name: 'Game Tutorials',
          type: 'Content',
          revenue: '$8,920',
          conversions: 234,
          rate: '67%',
          trend: '+11%'
        },
        {
          name: 'Discord Access',
          type: 'Community',
          revenue: '$6,780',
          conversions: 189,
          rate: '91%',
          trend: '+25%'
        },
        {
          name: 'Gaming Setup Tour',
          type: 'Content',
          revenue: '$4,560',
          conversions: 98,
          rate: '58%',
          trend: '+6%'
        }
      ];
    } else if (profile?.niche === 'adult') {
      return [
        {
          name: 'VIP Subscription',
          type: 'Tier',
          revenue: '$32,450',
          conversions: 234,
          rate: '84%',
          trend: '+21%'
        },
        {
          name: 'Custom Content',
          type: 'PPV',
          revenue: '$28,670',
          conversions: 189,
          rate: '92%',
          trend: '+34%'
        },
        {
          name: 'Live Shows',
          type: 'Live',
          revenue: '$15,890',
          conversions: 78,
          rate: '88%',
          trend: '+19%'
        },
        {
          name: 'Photo Sets',
          type: 'Content',
          revenue: '$12,340',
          conversions: 456,
          rate: '76%',
          trend: '+11%'
        }
      ];
    }
    
    // Default performers
    return [
      {
        name: 'Welcome Campaign',
        type: 'Automation',
        revenue: '$15,420',
        conversions: 342,
        rate: '78%',
        trend: '+12%'
      },
      {
        name: 'Premium Content',
        type: 'Content',
        revenue: '$12,850',
        conversions: 257,
        rate: '65%',
        trend: '+8%'
      },
      {
        name: 'Re-engagement Flow',
        type: 'Automation',
        revenue: '$8,920',
        conversions: 178,
        rate: '45%',
        trend: '+15%'
      },
      {
        name: 'Exclusive Access',
        type: 'Subscription',
        revenue: '$6,540',
        conversions: 131,
        rate: '58%',
        trend: '+5%'
      }
    ];
  };

  const topPerformers = getTopPerformers();

  // Personalized fan insights based on niche and goals
  const getFanInsights = () => {
    const baseInsights = [];
    
    if (profile?.niche === 'fitness') {
      baseInsights.push(
        { metric: 'Workout Completion Rate', value: '78%', icon: Dumbbell },
        { metric: 'Most Popular Time', value: '6 AM - 8 AM', icon: Clock },
        { metric: 'Program Renewals', value: '64%', icon: Target },
        { metric: 'Avg. Member Duration', value: '4.2 months', icon: Calendar }
      );
    } else if (profile?.niche === 'gaming') {
      baseInsights.push(
        { metric: 'Peak Gaming Hours', value: '8 PM - 1 AM', icon: Gamepad2 },
        { metric: 'Most Popular Platform', value: 'PC Gaming (67%)', icon: Globe },
        { metric: 'Stream Engagement', value: '4.2K avg viewers', icon: Eye },
        { metric: 'Discord Activity', value: '89% active', icon: MessageSquare }
      );
    } else if (profile?.niche === 'adult') {
      baseInsights.push(
        { metric: 'Peak Activity Time', value: '10 PM - 2 AM', icon: Clock },
        { metric: 'Top Spending Region', value: 'North America (58%)', icon: Globe },
        { metric: 'Avg. Fan Spend', value: '$89.50/month', icon: CreditCard },
        { metric: 'VIP Conversion', value: '23%', icon: Star }
      );
    } else if (profile?.niche === 'fashion') {
      baseInsights.push(
        { metric: 'Most Active Day', value: 'Saturday', icon: Calendar },
        { metric: 'Top Interest', value: 'Streetwear (45%)', icon: ShoppingBag },
        { metric: 'Outfit Save Rate', value: '67%', icon: Heart },
        { metric: 'Brand Engagement', value: '12.3%', icon: Sparkles }
      );
    } else {
      // Default insights
      baseInsights.push(
        { metric: 'Most Active Time', value: '9 PM - 12 AM EST', icon: Clock },
        { metric: 'Top Location', value: 'United States (42%)', icon: Globe },
        { metric: 'Avg. Fan Value', value: '$47.20/month', icon: CreditCard },
        { metric: 'Retention Rate', value: '87%', icon: Target }
      );
    }

    // Goal-specific insights
    if (profile?.goals?.includes('revenue')) {
      const revenueIndex = baseInsights.findIndex(i => i.metric.includes('Value') || i.metric.includes('Spend'));
      if (revenueIndex === -1) {
        baseInsights[3] = { metric: 'Revenue per Fan', value: '$127.40', icon: DollarSign };
      }
    }
    
    if (profile?.goals?.includes('engagement')) {
      const engagementIndex = baseInsights.findIndex(i => i.metric.includes('Engagement'));
      if (engagementIndex === -1 && baseInsights.length > 2) {
        baseInsights[2] = { metric: 'Engagement Score', value: '8.7/10', icon: Heart };
      }
    }

    return baseInsights;
  };

  const fanInsights = getFanInsights();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const hasConnectedPlatform = Boolean(aiConfig?.platforms?.length);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  {aiConfig?.responseStyle && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      {aiConfig.responseStyle}
                    </span>
                  )}
                  {profile?.timezone && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {profile.timezone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Last 30 days</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Filter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8">
        <ResumeBanner />
        {!hasConnectedPlatform && (
          <div className="mb-6 p-4 rounded-xl border border-purple-200 bg-purple-50">
            <p className="text-purple-900 font-medium">No data yet</p>
            <p className="text-sm text-purple-800 mb-2">Connect platforms to start seeing analytics.</p>
            <Link href="/platforms/connect" className="text-sm font-medium text-purple-900 hover:text-purple-950">Connect platforms →</Link>
          </div>
        )}
        {onboarding !== 'completed' && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Finish onboarding to see complete analytics.</p>
              <Link href="/onboarding/setup" className="text-sm font-semibold underline">Complete setup</Link>
            </div>
          </div>
        )}
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          {['overview', 'revenue', 'fans', 'content', 'ai-performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          ))}
        </div>

        {/* Add gated banner if no platform connected */}
        {!aiConfig?.platforms?.length && (
          <GatedBanner type="no-platform" aiConfig={aiConfig} userProfile={profile} />
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="elevated-card rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-${metric.color}-50`}>
                    <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-semibold ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                    <span className="text-xs text-gray-500">vs last period</span>
                  </div>
                </div>

                {/* Mini Sparkline */}
                <div className="mt-4 flex items-end gap-0.5 h-8">
                  {metric.sparkline.map((value, i) => (
                    <div
                      key={i}
                      className={`flex-1 bg-${metric.color}-200 rounded-t`}
                      style={{ height: `${(value / Math.max(...metric.sparkline)) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <GatedContent type="no-platform" aiConfig={aiConfig} userProfile={profile}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 elevated-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-xl font-bold text-gray-900">$124,580</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">+32.4%</span>
              </div>
            </div>
            <div className="h-80">
              <DynamicLine 
                data={revenueData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `$${value.toLocaleString()}`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="elevated-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Platform</h3>
            <div className="h-64">
              <DynamicDoughnut 
                data={platformData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 15,
                        font: { size: 12 }
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {['OnlyFans', 'Instagram', 'TikTok', 'Reddit'].map((platform, i) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{platform}</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${[55896, 37374, 24858, 6452][i].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </GatedContent>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="elevated-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
                <Link href="/campaigns" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {topPerformers.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.revenue}</p>
                      <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {item.trend}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{item.conversions} conversions</span>
                    <span className="font-medium text-purple-600">{item.rate} conversion rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fan Insights */}
          <div className="elevated-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Fan Insights</h3>
            <div className="space-y-4">
              {fanInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{insight.metric}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{insight.value}</span>
                  </div>
                );
              })}
            </div>
            
            {/* AI Performance Card - Personalized */}
            <div className="mt-6 p-4 elevated-card rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900 dark:text-white">AI Performance</span>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                  {aiConfig?.responseStyle === 'flirty' ? 'Playful' : 
                   aiConfig?.responseStyle === 'professional' ? 'Professional' :
                   aiConfig?.responseStyle === 'motivational' ? 'Inspiring' : 'Excellent'}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                {profile?.niche === 'fitness' 
                  ? 'Your AI motivated 89% of fans to complete their workouts this week!'
                  : profile?.niche === 'gaming'
                  ? 'AI engaged with 94% of stream viewers in real-time chat'
                  : profile?.niche === 'adult'
                  ? 'Your AI maintained a 95% satisfaction rate with personalized responses'
                  : 'Your AI assistant maintained a 92% response rate with 1.2 min average response time'}
              </p>
              <Link href="/ai/analytics" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                View AI Analytics
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Personalized Alert Banner */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">
                {profile?.niche === 'fitness' 
                  ? 'Workout Trend Alert'
                  : profile?.niche === 'gaming'
                  ? 'Streaming Opportunity'
                  : profile?.niche === 'adult'
                  ? 'Revenue Optimization Tip'
                  : 'Growth Opportunity Detected'}
              </h4>
              <p className="text-amber-800">
                {profile?.niche === 'fitness' 
                  ? 'Morning workout content gets 3x more engagement. Consider launching a "5 AM Club" challenge to boost subscriptions.'
                  : profile?.niche === 'gaming'
                  ? 'Your Fortnite streams have 2.5x higher engagement. Schedule more competitive gaming content this week.'
                  : profile?.niche === 'adult'
                  ? 'Fans who receive personalized messages spend 45% more. Enable AI auto-responses for new subscribers.'
                  : profile?.niche === 'fashion'
                  ? 'Outfit breakdown videos drive 60% more saves. Create more styling tutorials to increase engagement.'
                  : 'Your engagement rate peaks between 9 PM - 12 AM EST. Consider scheduling more content during these hours to maximize revenue.'}
              </p>
              <button className="mt-3 text-sm font-medium text-amber-900 hover:text-amber-700">
                {profile?.goals?.includes('revenue') ? 'Boost Revenue →' :
                 profile?.goals?.includes('engagement') ? 'Increase Engagement →' :
                 'View Recommendations →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
