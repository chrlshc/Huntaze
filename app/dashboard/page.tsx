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
  Mail
} from 'lucide-react';
import type { OverviewMetrics } from '@/types/analytics';

export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-bold text-xl">Huntaze</Link>
            <div className="flex items-center gap-4">
              <Link href="/billing" className="text-sm text-gray-600">Credits: 2,450</Link>
              <img
                src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User")}
                alt={user?.name}
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Simple Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r min-h-screen">
          <div className="p-4">
            {/* Onboarding Alert */}
            {onboarding && !onboarding.completed && (
              <Link href="/onboarding/setup" className="block mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                Complete setup →
              </Link>
            )}
            
            {/* Navigation */}
            <nav className="space-y-1">
              <Link href="/dashboard" className={`block px-3 py-2 rounded-lg ${pathname === '/dashboard' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
                Dashboard
              </Link>
              <Link href="/messages" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span>Messages</span>
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">24</span>
              </Link>
              <Link href="/fans" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Fans</Link>
              <Link href="/automations" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span>AI Automations</span>
                <span className="text-xs text-green-600">Active</span>
              </Link>
              <Link href="/campaigns" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Campaigns</Link>
              
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-medium text-gray-500 uppercase">Analytics</p>
              </div>
              
              <Link href="/analytics" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Analytics</Link>
              <Link href="/billing" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Billing</Link>
              
              <div className="pt-4">
                <Link href="/platforms/connect" className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                  <Plus className="w-4 h-4" />
                  <span>Add Platform</span>
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name?.split(' ')[0] || 'Creator'}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Fans */}
            <div className="lg:col-span-2 bg-white rounded-lg border">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Top Fans</h2>
                  <Link href="/fans" className="text-sm text-purple-600">
                    View all →
                  </Link>
                </div>
              </div>
              <div className="divide-y">
                {topFans.slice(0, 3).map((fan, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={fan.avatar}
                          alt={fan.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{fan.name}</p>
                          <p className="text-sm text-gray-500">{fan.lastActive}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{fan.revenue}</p>
                        <p className="text-sm text-green-600">{fan.trend}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold mb-3">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.link} className="block p-3 hover:bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{action.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          
          {/* Social Media */}
          <div className="mt-6">
            <h2 className="font-semibold mb-4">Social Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instagram */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium">Instagram</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Not connected</p>
                <Link href="/platforms/connect" className="block w-full py-2 text-sm text-center border rounded-lg hover:bg-gray-50">
                  Connect
                </Link>
              </div>


              {/* TikTok */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium">TikTok</h3>
                </div>
                {tiktokUser ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">@{tiktokUser.display_name}</p>
                    <div className="space-y-2">
                      <Link href="/social/tiktok/upload" className="block w-full py-2 text-sm text-center bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Upload Video
                      </Link>
                      <button 
                        onClick={async () => {
                          await fetch('/api/tiktok/disconnect', { method: 'POST' });
                          setTiktokUser(null);
                        }}
                        className="w-full py-2 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">Not connected</p>
                    <button 
                      onClick={() => window.location.href = '/auth/tiktok'}
                      className="w-full py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>

              {/* Reddit */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium">Reddit</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Not connected</p>
                <Link href="/platforms/connect" className="block w-full py-2 text-sm text-center border rounded-lg hover:bg-gray-50">
                  Connect
                </Link>
              </div>
            </div>
          </div>
          
          {/* Platform Connection */}
          {!hasConnectedPlatform && (
            <div className="mt-6 bg-gray-900 text-white rounded-lg p-6">
              <h3 className="font-semibold mb-2">Connect Your Platforms</h3>
              <p className="text-sm text-gray-300 mb-4">Start managing your content across all platforms</p>
              <Link href="/platforms/connect" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100">
                <Plus className="w-4 h-4" />
                Add Platform
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
