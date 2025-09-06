'use client';

import { useState } from 'react';
import { 
  MessageSquare, DollarSign, TrendingUp, Users, 
  Zap, BarChart3, Settings, ArrowRight, Shield,
  Clock, Target, Award
} from 'lucide-react';
import Link from 'next/link';

export default function OfDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    revenue: {
      today: 2847,
      week: 18340,
      month: 73456,
      growth: 15.3
    },
    messages: {
      active: 47,
      automated: 312,
      responseRate: 98.5
    },
    fans: {
      total: 1250,
      newToday: 23,
      vip: 87
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-white">OF</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    OnlyFans AI Assistant
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Powered by Huntaze AI - Keep up to 98.5% of your revenue
                  </p>
                </div>
              </div>
              
              <Link href="/of-connect">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Connect Account
                </button>
              </Link>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto">
            {['overview', 'messages', 'analytics', 'campaigns', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Status Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Assistant Active</h2>
                    <p className="text-purple-100">
                      Responding to messages 24/7 with your personalized AI model
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.messages.responseRate}%</p>
                  <p className="text-purple-100">Response Rate</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    +{stats.revenue.growth}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.revenue.month.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Today</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${stats.revenue.today.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-blue-600">AI Active</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.messages.automated}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent Today</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active Chats</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats.messages.active}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fans Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-purple-600">+{stats.fans.newToday} today</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.fans.total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Fans</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">VIP Fans</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats.fans.vip}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/of-messages" className="block">
                <button className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left">
                  <MessageSquare className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="font-medium text-gray-900 dark:text-white">Messages</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View & send messages</p>
                </button>
              </Link>

              <Link href="/of-analytics" className="block">
                <button className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left">
                  <BarChart3 className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revenue & fan insights</p>
                </button>
              </Link>

              <button className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left">
                <Target className="w-5 h-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Campaigns</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">PPV & mass messages</p>
              </button>

              <button className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left">
                <Settings className="w-5 h-5 text-gray-600 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Settings</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI & automation config</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { type: 'sale', user: 'fan_alice', amount: 50, time: '2 min ago', item: 'PPV video' },
                  { type: 'tip', user: 'bigspender99', amount: 25, time: '5 min ago', item: 'Message tip' },
                  { type: 'sub', user: 'newfan123', amount: 15, time: '12 min ago', item: 'New subscription' },
                  { type: 'message', user: 'vipfan88', amount: 0, time: '15 min ago', item: 'AI responded' },
                ].map((activity, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'sale' ? 'bg-green-100 dark:bg-green-900/30' :
                        activity.type === 'tip' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        activity.type === 'sub' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {activity.type === 'sale' && <DollarSign className="w-5 h-5 text-green-600" />}
                        {activity.type === 'tip' && <Award className="w-5 h-5 text-purple-600" />}
                        {activity.type === 'sub' && <Users className="w-5 h-5 text-blue-600" />}
                        {activity.type === 'message' && <MessageSquare className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.user}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.item}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.amount > 0 && (
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${activity.amount}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/of-analytics" className="flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700">
                  View All Activity
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to messages...
            </p>
            <Link href="/of-messages" className="text-purple-600 hover:text-purple-700">
              Go to Messages →
            </Link>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to analytics...
            </p>
            <Link href="/of-analytics" className="text-purple-600 hover:text-purple-700">
              Go to Analytics →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}