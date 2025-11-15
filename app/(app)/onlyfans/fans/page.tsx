'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Star, TrendingUp, AlertTriangle, Users } from 'lucide-react';

type FanSegment = 'all' | 'vip' | 'active' | 'at_risk' | 'churned';

export default function FansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<FanSegment>('all');

  // Mock fans data
  const fans = [
    { id: '1', name: 'Sarah M.', username: '@sarah_m', tier: 'VIP', ltv: 2450, arpu: 49, lastActive: '2 hours ago', messages: 156, avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Mike R.', username: '@mike_r', tier: 'Active', ltv: 890, arpu: 29, lastActive: '1 day ago', messages: 45, avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Emma L.', username: '@emma_l', tier: 'VIP', ltv: 3200, arpu: 64, lastActive: '5 hours ago', messages: 234, avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'John D.', username: '@john_d', tier: 'At-Risk', ltv: 450, arpu: 15, lastActive: '7 days ago', messages: 12, avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', name: 'Lisa K.', username: '@lisa_k', tier: 'Active', ltv: 1200, arpu: 40, lastActive: '3 hours ago', messages: 78, avatar: 'https://i.pravatar.cc/150?img=5' },
  ];

  const segments = [
    { value: 'all', label: 'All Fans', count: fans.length, icon: Users },
    { value: 'vip', label: 'VIP', count: fans.filter(f => f.tier === 'VIP').length, icon: Star },
    { value: 'active', label: 'Active', count: fans.filter(f => f.tier === 'Active').length, icon: TrendingUp },
    { value: 'at_risk', label: 'At-Risk', count: fans.filter(f => f.tier === 'At-Risk').length, icon: AlertTriangle },
    { value: 'churned', label: 'Churned', count: 0, icon: AlertTriangle },
  ];

  const filteredFans = fans.filter(fan => {
    const matchesSearch = fan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fan.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'all' || fan.tier.toLowerCase().replace('-', '_') === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'At-Risk': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fans Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and engage with your OnlyFans subscribers</p>
      </div>

      {/* Segments */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {segments.map(segment => {
          const Icon = segment.icon;
          return (
            <button
              key={segment.value}
              onClick={() => setSelectedSegment(segment.value as FanSegment)}
              className={`p-4 rounded-lg border transition-colors ${
                selectedSegment === segment.value
                  ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">{segment.count}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{segment.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fans by name or username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Fans List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fan</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tier</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">LTV</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ARPU</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Last Active</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Messages</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFans.map(fan => (
                <tr key={fan.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4">
                    <Link href={`/onlyfans/fans/${fan.id}`} className="flex items-center gap-3">
                      <img src={fan.avatar} alt={fan.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{fan.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{fan.username}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(fan.tier)}`}>
                      {fan.tier}
                    </span>
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white font-medium">${fan.ltv}</td>
                  <td className="p-4 text-gray-900 dark:text-white">${fan.arpu}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{fan.lastActive}</td>
                  <td className="p-4 text-gray-900 dark:text-white">{fan.messages}</td>
                  <td className="p-4">
                    <button className="px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900">
                      Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
