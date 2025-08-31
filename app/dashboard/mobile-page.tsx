'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Users, 
  DollarSign, 
  Bot,
  ArrowUpRight,
  Bell,
  CreditCard,
  Camera,
  Video,
  Plus,
  TrendingUp
} from 'lucide-react';

interface MobileDashboardProps {
  user: any;
  stats: any[];
  topFans: any[];
  tiktokUser: any;
  hasConnectedPlatform: boolean;
}

export default function MobileDashboard({ 
  user, 
  stats, 
  topFans, 
  tiktokUser,
  hasConnectedPlatform 
}: MobileDashboardProps) {
  return (
    <div className="pb-20">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Hi {user?.name?.split(' ')[0] || 'Creator'} 👋
              </h1>
              <p className="text-xs text-gray-600">Your earnings today</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link href="/billing" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">2,450</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats Carousel */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 p-4" style={{ width: 'max-content' }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100" style={{ minWidth: '140px' }}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Connection Card */}
      {!hasConnectedPlatform && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white">
          <h3 className="font-bold mb-1">Connect Your Platforms</h3>
          <p className="text-sm text-white/80 mb-3">Start earning more today</p>
          <Link href="/platforms/connect" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />
            Add Platform
          </Link>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/messages/compose" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-xl">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">24</span>
            </div>
            <p className="text-sm font-medium text-gray-900">New Messages</p>
            <p className="text-xs text-gray-600">Reply now</p>
          </Link>

          <Link href="/campaigns/new" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">89%</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Launch Campaign</p>
            <p className="text-xs text-gray-600">Boost sales</p>
          </Link>
        </div>
      </div>

      {/* Top Fans List */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Top Fans</h2>
          <Link href="/fans" className="text-sm text-purple-600 font-medium">See all</Link>
        </div>
        <div className="space-y-3">
          {topFans.slice(0, 3).map((fan, index) => (
            <Link key={index} href={`/fans/${fan.username}`} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={fan.avatar}
                  alt={fan.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{fan.name}</p>
                  <p className="text-xs text-gray-600">{fan.lastActive}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{fan.revenue}</p>
                <p className="text-xs text-green-600">{fan.trend}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Social Media Section */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Social Media</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/platforms/connect" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl mb-2 mx-auto w-fit">
              <Camera className="w-6 h-6 text-pink-600" />
            </div>
            <p className="text-xs font-medium text-gray-900">Instagram</p>
            <p className="text-xs text-gray-600">Connect</p>
          </Link>

          {tiktokUser ? (
            <Link href="/social/tiktok/upload" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="p-3 bg-gradient-to-br from-red-50 to-blue-50 rounded-xl mb-2 mx-auto w-fit">
                <Video className="w-6 h-6 text-gray-900" />
              </div>
              <p className="text-xs font-medium text-gray-900">TikTok</p>
              <p className="text-xs text-green-600">Connected</p>
            </Link>
          ) : (
            <button 
              onClick={() => window.location.href = '/auth/tiktok'}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center"
            >
              <div className="p-3 bg-gradient-to-br from-red-50 to-blue-50 rounded-xl mb-2 mx-auto w-fit">
                <Video className="w-6 h-6 text-gray-900" />
              </div>
              <p className="text-xs font-medium text-gray-900">TikTok</p>
              <p className="text-xs text-gray-600">Connect</p>
            </button>
          )}

          <Link href="/platforms/connect" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="p-3 bg-orange-50 rounded-xl mb-2 mx-auto w-fit">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-xs font-medium text-gray-900">Reddit</p>
            <p className="text-xs text-gray-600">Connect</p>
          </Link>
        </div>
      </div>

      {/* AI Assistant Card */}
      <div className="mx-4 mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-xl">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">AI Assistant Active</p>
            <p className="text-xs text-gray-600">Handling 87% of messages</p>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">ON</span>
        </div>
      </div>
    </div>
  );
}