'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useNotifications } from '@/components/notifications';
import { 
  MessageSquare, 
  Users, 
  DollarSign, 
  Clock,
  Bot,
  Zap,
  BarChart3,
  ArrowUpRight,
  Target,
  Activity,
  CreditCard,
  Plus,
  ChevronRight,
  Camera,
  Video,
  Mail,
  Sparkles
} from 'lucide-react';
import type { OverviewMetrics } from '@/types/analytics';
import MobileDashboard from './mobile-page';

export default function DashboardPage() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://huntaze.com';
  const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL || `${SITE_URL}/support`;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [tiktokUser, setTiktokUser] = useState<any>(null);
  const { status: onboarding } = useOnboarding();
  const pathname = usePathname();
  const { showContextualNotification } = useNotifications();

  useEffect(() => {
    // Check URL params for OAuth callback messages
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'tiktok_connected') {
      showContextualNotification('tiktok_connected', {});
      window.history.replaceState({}, '', '/dashboard');
    } else if (error === 'tiktok_auth_failed') {
      showContextualNotification('connection_failed', { 
        message: urlParams.get('message') || 'Failed to connect TikTok account.' 
      });
      window.history.replaceState({}, '', '/dashboard');
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Invalid or expired session: clear cookies then go to auth to avoid redirect loops
          try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
        window.location.href = '/auth';
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    
    // Check TikTok connection
    const checkTikTok = async () => {
      try {
        const response = await fetch('/api/tiktok/user');
        if (response.ok) {
          const tiktokData = await response.json();
          setTiktokUser(tiktokData);
        }
      } catch (error) {
        console.log('TikTok not connected');
      }
    };
    checkTikTok();
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

  // Mobile view
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <MobileDashboard 
        user={user}
        stats={stats}
        topFans={topFans}
        tiktokUser={tiktokUser}
        hasConnectedPlatform={hasConnectedPlatform}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/25">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Huntaze</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/billing" className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                <CreditCard className="w-4 h-4" />
                <span>2,450 Credits</span>
              </Link>
              <Link href={SITE_URL} target="_blank" className="text-sm font-medium text-purple-600 hover:text-purple-700">Site</Link>
              <Link href={SUPPORT_URL} target="_blank" className="text-sm font-medium text-gray-600 hover:text-gray-900">Support</Link>
              <img
                src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User")}
                alt={user?.name}
                className="w-9 h-9 rounded-xl ring-2 ring-purple-100"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            {/* Onboarding Alert */}
            {onboarding && !onboarding.completed && (
              <Link href="/onboarding/setup" className="block mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                Complete setup →
              </Link>
            )}
            
            {/* Navigation */}
            <nav className="space-y-1">
              <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/dashboard' ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700' : 'hover:bg-gray-50'}`}>
                <Activity className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link href="/messages" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
                <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium flex-1">Messages</span>
                <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full">24</span>
              </Link>
              <Link href="/fans" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
                <Users className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium">Fans</span>
              </Link>
              <Link href="/automations" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
                <Zap className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium flex-1">AI Automations</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
              </Link>
              <Link href="/campaigns" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
                <Target className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium">Campaigns</span>
              </Link>
              
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics</p>
              </div>
              
              <Link href="/analytics" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
                <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium">Analytics</span>
              </Link>
              <Link href="/billing" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
                <CreditCard className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium">Billing</span>
              </Link>
              
              <div className="pt-4">
                <Link href="/platforms/connect" className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Platform</span>
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Creator'}! 👋</h1>
            <p className="text-gray-600">Here's your performance overview for today</p>
          </div>

          {/* Stats - Mobile carousel + Desktop grid */}
          {/* Mobile carousel */}
          <div className="md:hidden -mx-4 px-4 mb-6">
            <div className="hide-scrollbar flex gap-4 overflow-x-auto snap-x">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="min-w-[240px] elevated-card rounded-2xl p-4 snap-start">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                        <Icon className="w-5 h-5 text-gray-700" />
                      </div>
                      <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{stat.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="elevated-card rounded-2xl p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <span className={`text-sm font-semibold flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      <ArrowUpRight className="w-4 h-4" />
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                </div>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Top Fans + Social Media */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Fans */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Top Fans</h2>
                    <Link href="/fans" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      View all →
                    </Link>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {topFans.slice(0, 3).map((fan, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={fan.avatar}
                            alt={fan.name}
                            className="w-12 h-12 rounded-xl"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{fan.name}</p>
                            <p className="text-sm text-gray-600">{fan.lastActive}</p>
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
              </div>

              {/* Social Media */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Social Media</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Instagram */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-opacity-10">
                        <Camera className="w-6 h-6 text-pink-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">Instagram</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Not connected</p>
                    <Link href="/platforms/connect" className="block w-full py-2.5 text-sm text-center border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium">
                      Connect
                    </Link>
                  </div>

                  {/* TikTok */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-blue-500 bg-opacity-10">
                        <Video className="w-6 h-6 text-gray-900" />
                      </div>
                      <h3 className="font-bold text-gray-900">TikTok</h3>
                    </div>
                    {tiktokUser ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-4">@{tiktokUser.display_name}</p>
                        <div className="space-y-2">
                          <Link href="/social/tiktok/upload" className="block w-full py-2.5 text-sm text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium">
                            Upload Video
                          </Link>
                          <button 
                            onClick={async () => {
                              await fetch('/api/tiktok/disconnect', { method: 'POST' });
                              setTiktokUser(null);
                            }}
                            className="w-full py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 mb-4">Not connected</p>
                        <button 
                          onClick={() => window.location.href = '/auth/tiktok'}
                          className="w-full py-2.5 text-sm border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium"
                        >
                          Connect
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reddit */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-orange-100">
                        <MessageSquare className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">Reddit</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Not connected</p>
                    <Link href="/platforms/connect" className="block w-full py-2.5 text-sm text-center border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium">
                      Connect
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {quickActions.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link key={index} href={action.link} className="block">
                        <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <ActionIcon className="w-5 h-5 text-purple-600" />
                            <p className="font-medium text-gray-900">{action.title}</p>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Platform Connection */}
          {!hasConnectedPlatform && (
            <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"></div>
              <div className="relative">
                <h3 className="text-xl font-bold mb-2">Connect Your Platforms</h3>
                <p className="text-gray-300 mb-4">Start managing your content across all platforms</p>
                <Link href="/platforms/connect" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Platform
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
