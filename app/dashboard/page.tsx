'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useNotifications } from '@/components/notifications';
import { 
  RevenueGoalWidget,
  ContentCalendarWidget,
  FanEngagementWidget,
  PerformanceInsightsWidget
} from '@/components/dashboard/widgets';
import { 
  MessageSquare, 
  Users, 
  DollarSign, 
  TrendingUp,
  Settings,
  Bell,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Bot,
  Zap,
  UserPlus,
  Mail,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Sparkles,
  Target,
  Activity,
  CreditCard,
  Star,
  Globe,
  ChevronDown,
  Camera,
  Video
} from 'lucide-react';
import type { OverviewMetrics } from '@/types/analytics';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { status: onboarding } = useOnboarding();
  const pathname = usePathname();
  const { showContextualNotification } = useNotifications();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        window.location.href = '/auth';
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const loadPersonalization = async () => {
      try {
        const [p, a, o] = await Promise.all([
          fetch('/api/users/profile', { cache: 'no-store' }),
          fetch('/api/ai/config', { cache: 'no-store' }),
          fetch('/api/analytics/overview', { cache: 'no-store' }),
        ]);
        if (p.ok) setProfile(await p.json());
        if (a.ok) setAiConfig(await a.json());
        if (o.ok) setOverview(await o.json());
      } catch (e) {
        console.warn('Personalization fetch failed');
      }
    };
    loadPersonalization();
  }, []);


  // Simulate real-time events for demo
  useEffect(() => {
    if (!user) return;

    // Simulate a new VIP fan after 10 seconds
    const vipTimer = setTimeout(() => {
      showContextualNotification('new_vip_fan', { fanName: 'Sarah M.' });
    }, 10000);

    // Simulate AI success after 15 seconds
    const aiTimer = setTimeout(() => {
      showContextualNotification('ai_success', { fanName: 'Mike J.' });
    }, 15000);

    return () => {
      clearTimeout(vipTimer);
      clearTimeout(aiTimer);
    };
  }, [user, showContextualNotification]);

  const hasConnectedPlatform = aiConfig?.platforms?.length > 0;
  
  const stats = [
    {
      title: 'Monthly Revenue',
      value: hasConnectedPlatform 
        ? (overview ? `$${overview.metrics.revenueMonthly.toLocaleString()}` : '$0')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? `${(overview.metrics.change.revenue*100).toFixed(1)}%` : '0%')
        : '--',
      trend: 'up',
      icon: DollarSign,
      sparkline: hasConnectedPlatform ? [4, 6, 7, 9, 12, 15, 18, 20, 24] : [0, 0, 0, 0, 0, 0, 0, 0, 0],
      gradient: 'from-emerald-500 to-teal-600',
      needsPlatform: true
    },
    {
      title: 'Active Subscribers',
      value: hasConnectedPlatform 
        ? (overview ? overview.metrics.activeSubscribers.toLocaleString() : '0')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? `${(overview.metrics.change.subscribers*100).toFixed(1)}%` : '0%')
        : '--',
      trend: 'up',
      icon: Users,
      sparkline: hasConnectedPlatform ? [20, 22, 24, 26, 28, 30, 28, 29, 31] : [0, 0, 0, 0, 0, 0, 0, 0, 0],
      gradient: 'from-blue-500 to-indigo-600',
      needsPlatform: true
    },
    {
      title: 'Avg. Response Time',
      value: hasConnectedPlatform 
        ? (overview ? `${(overview.metrics.avgResponseSeconds/60).toFixed(1)}min` : '--')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? `${(overview.metrics.change.response*100).toFixed(0)}%` : '0%')
        : '--',
      trend: 'up',
      icon: Clock,
      sparkline: hasConnectedPlatform ? [8, 7, 6, 5, 4, 3, 2, 1.5, 1.2] : [0, 0, 0, 0, 0, 0, 0, 0, 0],
      gradient: 'from-purple-500 to-pink-600',
      needsPlatform: true
    },
    {
      title: 'AI Automation Rate',
      value: hasConnectedPlatform 
        ? (overview ? `${Math.round(overview.metrics.aiAutomationRate*100)}%` : '0%')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? `${(overview.metrics.change.automation*100).toFixed(1)}%` : '0%')
        : '--',
      trend: 'up',
      icon: Bot,
      sparkline: hasConnectedPlatform ? [65, 68, 72, 75, 78, 82, 84, 86, 87] : [0, 0, 0, 0, 0, 0, 0, 0, 0],
      gradient: 'from-orange-500 to-red-600',
      needsPlatform: true
    }
  ];

  const topFans = overview ? overview.topFans.map(tf => ({
      name: tf.name,
      username: tf.username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(tf.name)}&background=gradient`,
      revenue: `$${tf.revenue.toLocaleString()}`,
      messages: tf.messages,
      lastActive: tf.lastActive,
      badge: tf.badge,
      trend: `+${Math.round(tf.trend*100)}%`
    })) : [
    {
      name: 'Alex Thompson',
      username: '@alex_t',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=gradient',
      revenue: '$2,456',
      messages: 145,
      lastActive: '2 min ago',
      badge: 'vip',
      trend: '+15%'
    },
    {
      name: 'Sarah Mitchell',
      username: '@sarahm',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=gradient',
      revenue: '$1,789',
      messages: 98,
      lastActive: '15 min ago',
      badge: 'loyal',
      trend: '+8%'
    },
    {
      name: 'Mike Johnson',
      username: '@mikej',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=gradient',
      revenue: '$1,234',
      messages: 76,
      lastActive: '1h ago',
      badge: 'new',
      trend: '+24%'
    },
    {
      name: 'Emma Wilson',
      username: '@emma_w',
      avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=gradient',
      revenue: '$987',
      messages: 54,
      lastActive: '3h ago',
      badge: 'regular',
      trend: '+12%'
    }
  ];

  const quickActions = [
    {
      title: 'Launch Campaign',
      description: 'Create targeted message campaigns',
      icon: Target,
      color: 'purple',
      link: '/campaigns/new'
    },
    {
      title: 'Bulk Messages',
      description: 'Send messages to multiple fans',
      icon: Mail,
      color: 'blue',
      link: '/messages/bulk'
    },
    {
      title: 'AI Training',
      description: 'Improve your AI responses',
      icon: Sparkles,
      color: 'orange',
      link: '/ai/training'
    },
    {
      title: 'View Analytics',
      description: 'Deep dive into your metrics',
      icon: BarChart3,
      color: 'green',
      link: '/analytics'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/25">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg">Huntaze</span>
                  <span className="ml-2 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full">PRO</span>
                </div>
              </Link>
              
              {/* Premium Search Bar */}
              <div className="hidden lg:flex items-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search fans, campaigns, analytics..."
                    className="pl-12 pr-4 py-2.5 w-[400px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">⌘K</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Premium Notification Badge */}
              <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></span>
              </button>
              
              {/* Premium Credits Display */}
              <Link href="/billing" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:border-purple-300 transition-colors">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">2,450 Credits</span>
              </Link>
              
              {/* Premium User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="relative">
                  <img
                    src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=gradient"}
                    alt={user?.name}
                    className="w-9 h-9 rounded-xl ring-2 ring-purple-100"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{(profile?.displayName && profile.displayName.trim()) || user?.name || user?.email}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Premium Member
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Premium Sidebar */}
        <aside className="hidden lg:block w-72 bg-white/50 backdrop-blur-sm border-r border-gray-200/50 min-h-screen">
          <div className="p-6">
            {/* Onboarding Banner */}
            {onboarding && !onboarding.completed && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 p-4">
                <p className="text-sm font-medium">Complete your setup to unlock analytics and automations.</p>
                <Link href="/onboarding/setup" className="mt-2 inline-flex text-xs font-semibold text-amber-900 underline">Resume onboarding →</Link>
              </div>
            )}
            {/* Premium Status Card */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-4 text-white mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold">Premium Plan</span>
                </div>
                <Shield className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm opacity-90 mb-3">Unlimited AI messages & advanced analytics</p>
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-75">Next billing: Jan 15</span>
                <Link href="/billing" className="underline hover:no-underline">Manage</Link>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-1">
              {pathname === '/dashboard' ? (
                <div aria-current="page" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700 rounded-xl cursor-default select-none">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Dashboard</span>
                </div>
              ) : (
                <Link href="/dashboard" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                  <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Dashboard</span>
                </Link>
              )}
              
              <Link href="/messages" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="font-medium">Messages</span>
                <span className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full">24</span>
              </Link>
              
              <Link href="/fans" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium">Fan Management</span>
              </Link>
              
              <Link href="/automations" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="font-medium">AI Automations</span>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
              </Link>
              
              <Link href="/campaigns" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-medium">Campaigns</span>
              </Link>
              
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics & Growth</p>
              </div>
              
              <Link href="/analytics" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-medium">Analytics</span>
              </Link>
              
              <Link href="/billing" className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="font-medium">Billing & Credits</span>
              </Link>
              
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Platforms</p>
              </div>
              
              <Link href="/platforms/connect" className="group flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Connect Platform</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Premium Main Area */}
        <main className="flex-1 p-8">
          {/* Premium Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Creator'}! 👋</h1>
                <p className="text-gray-600">
                  Here's your performance overview and key insights • 
                  <Link href="/why-huntaze" className="text-purple-600 hover:text-purple-700 font-medium">
                    See why Huntaze matters →
                  </Link>
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Last 30 days</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => showContextualNotification('new_vip_fan', { fanName: 'John Doe' })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Test Notification</span>
                </button>
                <Link href="/messages" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-600/25 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">View Messages</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 mb-4">{stat.title}</p>
                  
                  {/* Mini Sparkline */}
                  <div className="flex items-end gap-1 h-8">
                    {stat.sparkline.map((value, i) => (
                      <div
                        key={i}
                        className={`flex-1 bg-gradient-to-t ${stat.gradient} opacity-30 group-hover:opacity-50 rounded-t transition-all`}
                        style={{ height: `${(value / Math.max(...stat.sparkline)) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Premium Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Fans Section - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">Top Performing Fans</h2>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Live</span>
                  </div>
                  <Link href="/fans" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                    View all
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {topFans.map((fan, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={fan.avatar}
                            alt={fan.name}
                            className="w-12 h-12 rounded-xl"
                          />
                          {fan.badge === 'vip' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                              <Star className="w-3 h-3 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{fan.name}</p>
                            {fan.badge === 'new' && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">New</span>
                            )}
                            {fan.badge === 'loyal' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Loyal</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{fan.username} • {fan.lastActive}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{fan.revenue}</p>
                        <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {fan.trend}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50">
                <button className="w-full py-2 text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors">
                  View detailed fan analytics →
                </button>
              </div>
            </div>

            {/* Quick Actions - Single column */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.link} className="block">
                    <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                          <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Widgets Section */}
          <div className="mt-8 space-y-6">
            {/* Row 1: Revenue Goal and Content Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueGoalWidget 
                currentRevenue={parseFloat(stats[0].value.replace(/[$,]/g, ''))}
                monthlyGoal={30000}
                userProfile={profile}
              />
              <ContentCalendarWidget userProfile={profile} />
            </div>
            
            {/* Row 2: Fan Engagement and Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FanEngagementWidget 
                userProfile={profile}
                totalFans={parseInt(stats[1].value.replace(',', ''))}
              />
              <PerformanceInsightsWidget 
                userProfile={profile}
                analyticsData={{
                  messageResponseRate: 87,
                  avgResponseTime: 1.2
                }}
              />
            </div>
          </div>
          
          {/* Social Media Management Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Instagram */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-opacity-10">
                      <Camera className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Instagram</h3>
                      <p className="text-sm text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <Link href="/platforms/connect" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                    Connect
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Followers</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Engagement Rate</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Posts This Week</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                </div>
              </div>

              {/* Twitter/X */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-black bg-opacity-10">
                      <MessageSquare className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">X (Twitter)</h3>
                      <p className="text-sm text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <Link href="/platforms/connect" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                    Connect
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Followers</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Impressions</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tweets This Week</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-blue-500 bg-opacity-10">
                      <Video className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">TikTok</h3>
                      <p className="text-sm text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <Link href="/platforms/connect" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                    Connect
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Followers</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Video Views</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Videos This Week</span>
                    <span className="font-medium text-gray-900">--</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Platform Connection Card - Keep this separate */}
          <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Connect More Platforms</h3>
                  <p className="text-gray-300 text-sm">{aiConfig?.platforms?.length ? 'Connected: ' + aiConfig.platforms.join(', ') : 'No platform connected yet'}</p>
                </div>
                <Globe className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex gap-3 mb-4 flex-wrap">
                {(aiConfig?.platforms || ['OnlyFans','Fansly']).slice(0, 4).map((p: string, i: number) => (
                  <div key={p + i} className="px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-sm capitalize">{p}</div>
                ))}
                {aiConfig?.platforms?.length > 4 && (
                  <div className="px-3 py-1 bg-white/5 backdrop-blur rounded-lg text-sm text-gray-400">+{aiConfig.platforms.length - 4} more</div>
                )}
              </div>
              <Link href="/platforms/connect" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                <Plus className="w-4 h-4" />
                Add Platform
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
