'use client';

import Link from 'next/link';
import { Instagram, Music, MessageCircle, Share2, CheckCircle, XCircle } from 'lucide-react';

export default function SocialMediaPage() {
  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      connected: true,
      stats: { followers: 12500, posts: 234, engagement: 4.2 },
      color: 'pink',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Music,
      connected: true,
      stats: { followers: 45000, posts: 156, engagement: 8.5 },
      color: 'purple',
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: MessageCircle,
      connected: false,
      stats: null,
      color: 'orange',
    },
    {
      id: 'threads',
      name: 'Threads',
      icon: Share2,
      connected: false,
      stats: null,
      color: 'gray',
    },
  ];

  const getColorClasses = (color: string, connected: boolean) => {
    if (!connected) return 'bg-gray-100 dark:bg-gray-700';
    
    switch (color) {
      case 'pink': return 'bg-pink-100 dark:bg-pink-900/30';
      case 'purple': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'orange': return 'bg-orange-100 dark:bg-orange-900/30';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getIconColor = (color: string, connected: boolean) => {
    if (!connected) return 'text-gray-400';
    
    switch (color) {
      case 'pink': return 'text-pink-600 dark:text-pink-400';
      case 'purple': return 'text-purple-600 dark:text-purple-400';
      case 'orange': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Link href="/marketing" className="hover:text-gray-900 dark:hover:text-white">Marketing</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Social Media</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Media Hub</h1>
        <p className="text-gray-600 dark:text-gray-400">Connect and manage your social media accounts</p>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <div
              key={platform.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${getColorClasses(platform.color, platform.connected)}`}>
                    <Icon className={`w-6 h-6 ${getIconColor(platform.color, platform.connected)}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{platform.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {platform.connected ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Not connected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {platform.connected ? (
                  <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Disconnect
                  </button>
                ) : (
                  <button className="px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900">
                    Connect
                  </button>
                )}
              </div>

              {platform.stats ? (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {platform.stats.followers.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {platform.stats.posts}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Engagement</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {platform.stats.engagement}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Connect your {platform.name} account to see analytics
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Schedule Post</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plan content across platforms</p>
          </button>
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">View Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track performance metrics</p>
          </button>
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Content Calendar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage posting schedule</p>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">🚀 Coming Soon</h3>
        <p className="text-blue-600 dark:text-blue-300 text-sm">
          Full social media management features including post scheduling, analytics dashboards, and cross-platform publishing are coming soon!
        </p>
      </div>
    </div>
  );
}
