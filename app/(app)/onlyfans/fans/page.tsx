"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Star, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

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

  const getTierClasses = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'At-Risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="flex flex-col gap-6 pb-8">
      <AppPageHeader
        title="OnlyFans fans"
        description="Segment and manage your OnlyFans subscribers."
        actions={
          <>
            <Link href="/fans/import">
              <Button variant="outline" size="sm">
                Import fans
              </Button>
            </Link>
            <Link href="/fans/import">
              <Button variant="primary" size="sm">
                Add fan
              </Button>
            </Link>
          </>
        }
      />

      {/* Segments */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {segments.map((segment) => {
            const Icon = segment.icon;
            const isActive = selectedSegment === segment.value;
            return (
              <button
                key={segment.value}
                onClick={() => setSelectedSegment(segment.value as FanSegment)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isActive
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-app)]'
                    : 'border-[var(--border-subtle)] hover:bg-[var(--bg-app)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[var(--color-text-sub)]" />
                  <span className="font-semibold text-[var(--color-text-heading)]">
                    {segment.count}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-sub)]">{segment.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-sub)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fans by name or username..."
              className="w-full pl-9 pr-4 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-surface)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Fans List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border-subtle)]">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  Fan
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  Tier
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  LTV
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  ARPU
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  Last Active
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  Messages
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFans.map(fan => (
                <tr
                  key={fan.id}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-app)]"
                >
                  <td className="p-3">
                    <Link href={`/onlyfans/fans/${fan.id}`} className="flex items-center gap-3">
                      <img src={fan.avatar} alt={fan.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-medium text-[var(--color-text-main)]">{fan.name}</p>
                        <p className="text-xs text-[var(--color-text-sub)]">{fan.username}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTierClasses(
                        fan.tier,
                      )}`}
                    >
                      {fan.tier}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-text-main)] font-medium">${fan.ltv}</td>
                  <td className="p-3 text-[var(--color-text-main)]">${fan.arpu}</td>
                  <td className="p-3 text-xs text-[var(--color-text-sub)]">{fan.lastActive}</td>
                  <td className="p-3 text-[var(--color-text-main)]">{fan.messages}</td>
                  <td className="p-3">
                    <Button variant="outline" size="sm">
                      Message
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
