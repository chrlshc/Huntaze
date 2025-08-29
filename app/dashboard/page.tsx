'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

  const stats = [
    {
      label: 'Active Conversations',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      label: 'Total Subscribers',
      value: '1,248',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Revenue This Month',
      value: '$12,450',
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'AI Messages Sent',
      value: '3,421',
      change: '+18%',
      trend: 'up',
      icon: Bot,
      color: 'orange'
    }
  ];

  const recentActivities = [
    {
      type: 'new_subscriber',
      user: 'mike_jones',
      platform: 'OnlyFans',
      time: '5 min ago',
      revenue: '$9.99'
    },
    {
      type: 'message_sent',
      user: 'sarah_91',
      platform: 'Fansly',
      time: '12 min ago',
      automated: true
    },
    {
      type: 'tip_received',
      user: 'john_doe',
      platform: 'OnlyFans',
      time: '1 hour ago',
      revenue: '$50.00'
    }
  ];

  const automationStatus = [
    { name: 'Welcome Messages', status: 'active', sent: 145, conversion: '78%' },
    { name: 'Re-engagement Campaign', status: 'active', sent: 89, conversion: '45%' },
    { name: 'PPV Promotions', status: 'paused', sent: 0, conversion: '0%' }
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="font-semibold text-gray-900">Huntaze</span>
              </Link>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search fans, messages, campaigns..."
                    className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link href="/settings" className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <img
                  src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User")}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen pt-6">
          <nav className="px-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Overview</span>
            </Link>
            <Link href="/messages" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
              <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">24</span>
            </Link>
            <Link href="/fans" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <Users className="w-5 h-5" />
              <span>Fans CRM</span>
            </Link>
            <Link href="/automations" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <Zap className="w-5 h-5" />
              <span>Automations</span>
            </Link>
            <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5" />
              <span>Campaigns</span>
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
            
            <div className="pt-6">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platforms</p>
              <div className="mt-3 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Plus className="w-5 h-5" />
                  <span>Connect Platform</span>
                </button>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Area */}
        <main className="flex-1 p-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Calendar className="w-4 h-4" />
                <span>Last 30 days</span>
              </button>
              <Link href="/messages" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <MessageSquare className="w-4 h-4" />
                <span>View Messages</span>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <Link href="/activity" className="text-sm text-purple-600 hover:text-purple-700">View all</Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'new_subscriber' ? 'bg-green-100' :
                        activity.type === 'message_sent' ? 'bg-blue-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'new_subscriber' ? <UserPlus className="w-4 h-4 text-green-600" /> :
                         activity.type === 'message_sent' ? <MessageSquare className="w-4 h-4 text-blue-600" /> :
                         <DollarSign className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type === 'new_subscriber' ? 'New subscriber' :
                           activity.type === 'message_sent' ? 'Message sent' :
                           'Tip received'}
                        </p>
                        <p className="text-sm text-gray-600">
                          @{activity.user} • {activity.platform}
                          {activity.automated && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">AI</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      {activity.revenue && (
                        <span className="text-sm font-medium text-green-600">{activity.revenue}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Status */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Active Automations</h2>
                  <Link href="/automations" className="text-sm text-purple-600 hover:text-purple-700">Manage</Link>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {automationStatus.map((automation, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <p className="text-sm font-medium text-gray-900">{automation.name}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{automation.sent} sent</span>
                      <span>{automation.conversion} conversion</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${automation.status === 'active' ? 'bg-purple-600' : 'bg-gray-300'}`}
                        style={{ width: automation.conversion }}
                      />
                    </div>
                  </div>
                ))}
                
                <Link href="/automations/new" className="block w-full mt-4">
                  <button className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    Create New Automation
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Platform Connection Banner */}
          <div className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Platforms</h3>
                <p className="text-purple-100">Link your OnlyFans or Fansly account to start automating messages and managing your fans.</p>
              </div>
              <Link href="/platforms/connect" className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-50">
                Connect Now
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}