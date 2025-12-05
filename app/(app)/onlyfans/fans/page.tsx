"use client";

/**
 * OnlyFans Fans Page
 * Requirements: 2.4 - Fan list with segmentation and AI insights
 * Feature: dashboard-ux-overhaul
 * 
 * Features:
 * - Fan list with AI-powered segmentation
 * - LTV and churn risk indicators per fan
 * - Filters and search functionality
 */

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Star, TrendingUp, AlertTriangle, Users, Sparkles, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';

type FanSegment = 'all' | 'vip' | 'active' | 'at_risk' | 'churned';

// Fan interface with AI insights
interface Fan {
  id: string;
  name: string;
  username: string;
  tier: string;
  ltv: number;
  arpu: number;
  lastActive: string;
  messages: number;
  avatar: string;
  churnRisk: number; // 0-100 percentage
  aiInsight?: string;
}

export default function FansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<FanSegment>('all');

  // Mock fans data with AI insights
  const fans: Fan[] = [
    { id: '1', name: 'Sarah M.', username: '@sarah_m', tier: 'VIP', ltv: 2450, arpu: 49, lastActive: '2 hours ago', messages: 156, avatar: 'https://i.pravatar.cc/150?img=1', churnRisk: 5, aiInsight: 'High engagement, consider exclusive content' },
    { id: '2', name: 'Mike R.', username: '@mike_r', tier: 'Active', ltv: 890, arpu: 29, lastActive: '1 day ago', messages: 45, avatar: 'https://i.pravatar.cc/150?img=2', churnRisk: 25, aiInsight: 'Moderate activity, send personalized message' },
    { id: '3', name: 'Emma L.', username: '@emma_l', tier: 'VIP', ltv: 3200, arpu: 64, lastActive: '5 hours ago', messages: 234, avatar: 'https://i.pravatar.cc/150?img=3', churnRisk: 3, aiInsight: 'Top spender, offer VIP perks' },
    { id: '4', name: 'John D.', username: '@john_d', tier: 'At-Risk', ltv: 450, arpu: 15, lastActive: '7 days ago', messages: 12, avatar: 'https://i.pravatar.cc/150?img=4', churnRisk: 78, aiInsight: 'High churn risk, send re-engagement offer' },
    { id: '5', name: 'Lisa K.', username: '@lisa_k', tier: 'Active', ltv: 1200, arpu: 40, lastActive: '3 hours ago', messages: 78, avatar: 'https://i.pravatar.cc/150?img=5', churnRisk: 15, aiInsight: 'Growing engagement, upsell opportunity' },
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

  // Get churn risk color
  const getChurnRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (risk >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  const getChurnRiskLabel = (risk: number) => {
    if (risk >= 70) return 'High';
    if (risk >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <PageLayout
      title="Fans"
      subtitle="Segment and manage your OnlyFans subscribers with AI insights."
      breadcrumbs={[
        { label: 'OnlyFans', href: '/onlyfans' },
        { label: 'Fans' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/fans/import">
            <Button variant="outline" size="sm">
              Import fans
            </Button>
          </Link>
          <Button variant="primary" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Segment
          </Button>
        </div>
      }
    >

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
        <div className="overflow-x-auto" data-testid="fans-list">
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
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    LTV
                  </div>
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Churn Risk
                  </div>
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  Last Active
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase">
                  AI Insight
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
                  data-testid={`fan-row-${fan.id}`}
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
                  <td className="p-3">
                    <span className="font-semibold text-green-600 dark:text-green-400" data-testid={`fan-ltv-${fan.id}`}>
                      ${fan.ltv.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getChurnRiskColor(fan.churnRisk)}`}
                      data-testid={`fan-churn-${fan.id}`}
                    >
                      {getChurnRiskLabel(fan.churnRisk)} ({fan.churnRisk}%)
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text-sub)]">{fan.lastActive}</td>
                  <td className="p-3">
                    {fan.aiInsight && (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-sub)]" data-testid={`fan-insight-${fan.id}`}>
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="max-w-[200px] truncate">{fan.aiInsight}</span>
                      </div>
                    )}
                  </td>
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
    </PageLayout>
  );
}
