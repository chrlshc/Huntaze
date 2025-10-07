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
  TrendingUp,
  Sparkles,
  Heart,
  Star
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
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 animate-fadeIn">
      {/* Mobile Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="animate-slideIn">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hi {user?.name?.split(' ')[0] || 'Creator'} ✨
              </h1>
              <p className="text-sm text-gray-600 font-medium">Let's make today amazing!</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2.5 bg-white rounded-full shadow-sm border border-gray-100 bounce-on-hover">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white notification-pulse"></span>
              </button>
              <Link href="/billing" className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">2,450</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Today's Earnings Hero */}
      <div className="px-4 py-6">
        <div className="rounded-3xl p-6 text-white shadow-xl animate-slideUp bg-gray-900 dark:bg-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-300 text-sm font-medium">Today's Earnings</p>
              <p className="text-4xl font-bold mt-1 counter-animate">$847.50</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <img key={i} src={`https://ui-avatars.com/api/?name=Fan${i}&background=ffffff&color=9333ea`} 
                  className="w-6 h-6 rounded-full border-2 border-white" />
              ))}
            </div>
            <p className="text-sm text-gray-300">+12 new fans today</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 stagger-animate">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+15%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm text-gray-600">New Messages</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-center justify-between mb-2">
              <Bot className="w-5 h-5 text-pink-600" />
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">89%</p>
            <p className="text-sm text-gray-600">AI Automation</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 animate-slideIn">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 stagger-animate">
          <Link href="/messages/compose" className="group">
            <div className="bg-purple-600 rounded-2xl p-4 text-white relative overflow-hidden h-32 card-hover press-feedback">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <MessageSquare className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur rounded-xl w-fit mb-2">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="font-bold">Send Message</p>
                <p className="text-xs text-white/80 mt-1">Reply to fans</p>
              </div>
            </div>
          </Link>

          <Link href="/campaigns/new" className="group">
            <div className="bg-gray-800 rounded-2xl p-4 text-white relative overflow-hidden h-32">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur rounded-xl w-fit mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="font-bold">New Campaign</p>
                <p className="text-xs text-white/80 mt-1">Boost sales</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Top Fans */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 animate-slideIn">Top Fans</h2>
          <Link href="/fans" className="text-sm text-purple-600 font-semibold">View all</Link>
        </div>
        <div className="space-y-3 stagger-animate">
          {topFans.slice(0, 3).map((fan, index) => (
            <Link key={index} href={`/fans/${fan.username}`} 
              className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all card-hover press-feedback">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={fan.avatar}
                    alt={fan.name}
                    className="w-12 h-12 rounded-full"
                  />
                  {index === 0 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{fan.name}</p>
                  <p className="text-sm text-gray-600">{fan.lastActive}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{fan.revenue}</p>
                <p className="text-xs text-green-600 font-semibold">{fan.trend}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Social Media */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Connect & Grow</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/platforms/connect" 
            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
            <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-900">Instagram</p>
            <p className="text-xs text-gray-600 mt-1">Connect</p>
          </Link>

          {tiktokUser ? (
            <Link href="/social/tiktok/upload" 
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
              <div className="mx-auto w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-2">
                <Video className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-900">TikTok</p>
              <p className="text-xs text-green-600 font-semibold mt-1">Connected</p>
            </Link>
          ) : (
            <button 
              onClick={() => window.location.href = '/auth/tiktok'}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
              <div className="mx-auto w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-2">
                <Video className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-900">TikTok</p>
              <p className="text-xs text-gray-600 mt-1">Connect</p>
            </button>
          )}

          <Link href="/platforms/connect" 
            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
            <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-900">Reddit</p>
            <p className="text-xs text-gray-600 mt-1">Connect</p>
          </Link>
        </div>
      </div>

      {/* AI Assistant Status */}
      <div className="mx-4 mb-6">
        <div className="rounded-2xl p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">AI Assistant Active</p>
              <p className="text-sm text-gray-600">Handling messages 24/7</p>
            </div>
            <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Platform Connection CTA */}
      {!hasConnectedPlatform && (
        <div className="mx-4 mb-6">
          <div className="rounded-3xl p-6 text-gray-900 dark:text-white relative overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="absolute -right-8 -top-8 opacity-20">
              <Plus className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Ready to 3x Your Income?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Connect your platforms and let AI do the work</p>
              <Link href="/platforms/connect" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold shadow-sm">
                <Plus className="w-5 h-5" />
                Connect Platform
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
