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
  Sparkles,
  Shield,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Home,
  Settings,
  Bell,
  LogOut
} from 'lucide-react';
import { ofIntegrationApi } from '@/src/lib/api';
import type { OverviewMetrics } from '@/types/analytics';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import ResumeBanner from '@/components/onboarding/ResumeBanner';
import EffectiveTakeRateCard from '@/components/dashboard/EffectiveTakeRateCard';
import './dashboard-styles.css';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tiktokUser, setTiktokUser] = useState<any>(null);
  const [ofStatus, setOfStatus] = useState<any>(null);
  const [ofSyncing, setOfSyncing] = useState(false);
  const { showNotification } = useNotifications();
  const { currentStep, isStepCompleted } = useOnboarding();
  const onboarding = isStepCompleted('completed') ? { completed: true } : { completed: false };
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
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
    
    // Check connections
    const checkConnections = async () => {
      try {
        const [tiktokRes, ofStatus] = await Promise.all([
          fetch('/api/tiktok/user'),
          ofIntegrationApi.status()
        ]);
        if (tiktokRes.ok) {
          setTiktokUser(await tiktokRes.json());
        }
        setOfStatus(ofStatus);
      } catch (error) {
        console.log('Platform connections check failed');
      }
    };
    checkConnections();
  }, []);

  useEffect(() => {
    const loadData = async () => {
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
        console.warn('Data fetch failed');
      }
    };
    loadData();
  }, []);

  const hasConnectedPlatform = aiConfig?.platforms?.length > 0;
  
  const stats = [
    {
      title: 'Monthly Revenue',
      value: hasConnectedPlatform 
        ? (overview ? `$${overview.metrics.revenueMonthly.toLocaleString()}` : '$0')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? overview.metrics.change.revenue : 0)
        : 0,
      icon: DollarSign,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Active Subscribers',
      value: hasConnectedPlatform 
        ? (overview ? overview.metrics.activeSubscribers.toLocaleString() : '0')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? overview.metrics.change.subscribers : 0)
        : 0,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Avg. Response Time',
      value: hasConnectedPlatform 
        ? (overview ? `${(overview.metrics.avgResponseSeconds/60).toFixed(1)}min` : '--')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? -overview.metrics.change.response : 0)
        : 0,
      icon: Clock,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'AI Automation Rate',
      value: hasConnectedPlatform 
        ? (overview ? `${Math.round(overview.metrics.aiAutomationRate*100)}%` : '0%')
        : '--',
      change: hasConnectedPlatform 
        ? (overview ? overview.metrics.change.automation : 0)
        : 0,
      icon: Bot,
      color: 'orange',
      gradient: 'from-orange-500 to-red-600'
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
      trend: tf.trend
    })) : [];

  const quickActions = [
    {
      title: 'Launch Campaign',
      description: 'Create targeted message campaigns',
      icon: Target,
      color: 'purple',
      link: '/campaigns/new'
    },
    {
      title: 'Mass Messages',
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
      description: 'Detailed metrics analysis',
      icon: BarChart3,
      color: 'green',
      link: '/analytics'
    }
  ];

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', badge: null },
    { href: '/messages', icon: MessageSquare, label: 'Messages', badge: '24' },
    { href: '/fans', icon: Users, label: 'Fans', badge: null },
    { href: '/automations', icon: Zap, label: 'AI Automations', badge: 'Active' },
    { href: '/campaigns', icon: Target, label: 'Campaigns', badge: null },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', badge: null },
    { href: '/content/moderation', icon: Shield, label: 'Content Moderation', badge: 'New' },
    { href: '/billing', icon: CreditCard, label: 'Billing', badge: null },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-content-secondary">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface">
      {/* Sync Progress Bar */}
      {ofSyncing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-primary animate-pulse z-50" />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-surface-elevated-light dark:bg-surface-elevated border-b border-border-light dark:border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-content-primary" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-content-primary">Huntaze</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-content-primary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>
            <img
              src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User")}
              alt={user?.name}
              className="w-8 h-8 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-surface-elevated-light dark:bg-surface-elevated border-r border-border-light dark:border-border min-h-screen">
          {/* Logo */}
          <div className="p-6 border-b border-border-light dark:border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-xl font-bold text-content-primary">Huntaze</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`badge ${item.badge === 'Active' ? 'badge-success' : item.badge === 'New' ? 'badge-primary' : 'badge-default'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                  Analytics & Tools
                </p>
              </div>
              
              {navItems.slice(5).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`badge ${item.badge === 'New' ? 'badge-primary' : 'badge-default'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Add Platform Button */}
            <div className="mt-4">
              <Link href="/platforms/connect" className="btn-outline-dashed w-full">
                <Plus className="w-4 h-4" />
                <span>Add Platform</span>
              </Link>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border-light dark:border-border">
            <div className="flex items-center gap-3 p-3 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors cursor-pointer">
              <img
                src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User")}
                alt={user?.name}
                className="w-10 h-10 rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium text-content-primary text-sm">{user?.name}</p>
                <p className="text-xs text-content-tertiary">{user?.email}</p>
              </div>
              <Settings className="w-4 h-4 text-content-tertiary" />
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-surface-elevated-light dark:bg-surface-elevated z-50 shadow-xl">
              {/* Similar content as desktop sidebar */}
              <div className="p-6 border-b border-border-light dark:border-border flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">H</span>
                  </div>
                  <span className="text-xl font-bold text-content-primary">Huntaze</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg"
                >
                  <X className="w-5 h-5 text-content-primary" />
                </button>
              </div>
              {/* Rest of mobile sidebar content... */}
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Resume Banner */}
          <ResumeBanner />

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-content-primary mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Creator'}! 👋
            </h1>
            <p className="text-content-secondary">
              Here's your performance overview for today
            </p>
          </div>

          {/* Onboarding Checklist */}
          {!onboarding.completed && (
            <div className="mb-8">
              <OnboardingChecklist />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const changeValue = stat.change * 100;
              const isPositive = changeValue >= 0;
              const TrendIcon = isPositive ? TrendingUp : TrendingDown;
              
              return (
                <div key={index} className="stat-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`stat-icon bg-gradient-to-br ${stat.gradient}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {changeValue !== 0 && (
                      <span className={`stat-badge ${isPositive ? 'positive' : 'negative'}`}>
                        <TrendIcon className="w-3 h-3" />
                        {Math.abs(changeValue).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-label">{stat.title}</p>
                  
                  {/* Mini Sparkline */}
                  <div className="mt-3 flex items-end gap-1 h-8">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 bg-gradient-to-t ${stat.gradient} opacity-20 rounded-sm`}
                        style={{ height: `${20 + Math.random() * 80}%` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Top Fans & Social */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Fans */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Top Fans</h2>
                  <Link href="/fans" className="text-sm text-primary hover:text-primary-hover font-medium">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-border-light dark:divide-border">
                  {topFans.length > 0 ? (
                    topFans.slice(0, 3).map((fan, index) => (
                      <div key={index} className="p-4 hover:bg-surface-hover-light dark:hover:bg-surface-hover transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={fan.avatar}
                              alt={fan.name}
                              className="w-12 h-12 rounded-xl"
                            />
                            <div>
                              <p className="font-semibold text-content-primary">{fan.name}</p>
                              <p className="text-sm text-content-tertiary">{fan.lastActive}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-content-primary">{fan.revenue}</p>
                            <p className="text-sm text-success flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3" />
                              +{(fan.trend * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-content-tertiary">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No fan data yet</p>
                      <p className="text-sm mt-1">Connect a platform to see your top fans</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Platforms */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-content-primary">Connected Platforms</h2>
                  <Link href="/platforms/connect" className="text-sm text-primary hover:text-primary-hover font-medium">
                    Manage →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* OnlyFans */}
                  <div className="platform-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-content-primary">OnlyFans</h3>
                    </div>
                    {ofStatus?.connected ? (
                      <div>
                        <p className="text-sm text-content-tertiary mb-3">
                          @{ofStatus.username} • Last sync: {ofStatus.lastSync ? new Date(ofStatus.lastSync).toLocaleTimeString() : 'Never'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              setOfSyncing(true);
                              try {
                                await ofIntegrationApi.sync(['earnings','messages','subscribers']);
                                const st = await ofIntegrationApi.status();
                                setOfStatus(st);
                                showNotification({ 
                                  type: 'success', 
                                  title: 'Sync Complete', 
                                  message: 'OnlyFans data refreshed.' 
                                });
                              } catch (e: any) {
                                showNotification({ 
                                  type: 'error', 
                                  title: 'Sync Failed', 
                                  message: e?.message || 'An error occurred.' 
                                });
                              } finally {
                                setOfSyncing(false);
                              }
                            }}
                            className="btn-primary flex-1"
                            disabled={ofSyncing}
                          >
                            {ofSyncing ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Syncing...
                              </span>
                            ) : (
                              'Sync Now'
                            )}
                          </button>
                          <Link href="/messages/onlyfans" className="btn-secondary px-4">
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-content-tertiary mb-4">
                          Sync earnings, subscribers and messages.
                        </p>
                        <Link href="/platforms/connect/onlyfans" className="btn-outline w-full">
                          Connect OnlyFans
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* TikTok */}
                  <div className="platform-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-blue-100 dark:from-red-900/30 dark:to-blue-900/30">
                        <Video className="w-6 h-6 text-content-primary" />
                      </div>
                      <h3 className="font-bold text-content-primary">TikTok</h3>
                    </div>
                    {tiktokUser ? (
                      <div>
                        <p className="text-sm text-content-tertiary mb-3">
                          @{tiktokUser.display_name}
                        </p>
                        <div className="flex gap-2">
                          <Link href="/social/tiktok/upload" className="btn-primary flex-1">
                            Upload Video
                          </Link>
                          <button 
                            onClick={async () => {
                              await fetch('/api/tiktok/disconnect', { method: 'POST' });
                              setTiktokUser(null);
                            }}
                            className="btn-secondary px-4"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-content-tertiary mb-4">
                          Share videos and grow your audience
                        </p>
                        <button 
                          onClick={() => window.location.href = '/auth/tiktok'}
                          className="btn-outline w-full"
                        >
                          Connect TikTok
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="platform-card opacity-60">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <Camera className="w-6 h-6 text-pink-600" />
                      </div>
                      <h3 className="font-bold text-content-primary">Instagram</h3>
                    </div>
                    <p className="text-sm text-content-tertiary mb-4">Coming soon</p>
                    <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                      Not available
                    </button>
                  </div>

                  {/* Reddit */}
                  <div className="platform-card opacity-60">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                        <MessageSquare className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-bold text-content-primary">Reddit</h3>
                    </div>
                    <p className="text-sm text-content-tertiary mb-4">Coming soon</p>
                    <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                      Not available
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions & Take Rate */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Quick Actions</h2>
                </div>
                <div className="space-y-3">
                  {quickActions.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link key={index} href={action.link}>
                        <div className="quick-action-item group">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/30 group-hover:scale-110 transition-transform`}>
                              <ActionIcon className={`w-5 h-5 text-${action.color}-600`} />
                            </div>
                            <div>
                              <p className="font-medium text-content-primary">{action.title}</p>
                              <p className="text-xs text-content-tertiary">{action.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-content-tertiary ml-auto group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Effective Take Rate Card */}
              <EffectiveTakeRateCard accountId={user?.id || 'current'} />

              {/* Platform CTA */}
              {!hasConnectedPlatform && (
                <div className="card bg-gradient-to-br from-primary to-secondary text-white">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Connect Your Platforms</h3>
                    <p className="text-white/80 mb-4">
                      Start managing your content across all platforms
                    </p>
                    <Link href="/platforms/connect" className="btn-white">
                      <Plus className="w-4 h-4" />
                      Add Platform
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}