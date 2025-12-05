"use client";

/**
 * OnlyFans Fans Page
 * Requirements: 2.4 - Fan list with segmentation and AI insights
 * Feature: dashboard-design-refactor
 * 
 * Refactored to use design system components:
 * - IndexTable for data display (Requirements 6.1-6.5)
 * - Badge for status indicators (Requirements 6.3)
 * - Design tokens for consistent styling
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, Star, TrendingUp, AlertTriangle, Users, Sparkles, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { IndexTable, Column } from '@/components/ui/IndexTable';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';

// Badge status type (matches Badge component)
type BadgeStatus = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

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
  churnRisk: number;
  aiInsight?: string;
}

// Type for IndexTable row data
type FanRow = Fan & Record<string, unknown>;

export default function FansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<FanSegment>('all');
  const [isLoading] = useState(false);

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

  const filteredFans = useMemo(() => {
    return fans.filter(fan => {
      const matchesSearch = fan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fan.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSegment = selectedSegment === 'all' || fan.tier.toLowerCase().replace('-', '_') === selectedSegment;
      return matchesSearch && matchesSegment;
    });
  }, [fans, searchQuery, selectedSegment]);

  // Map tier to Badge status
  const getTierBadgeStatus = (tier: string): BadgeStatus => {
    switch (tier) {
      case 'VIP': return 'warning'; // Gold/yellow for VIP
      case 'Active': return 'success';
      case 'At-Risk': return 'critical';
      case 'Churned': return 'neutral';
      default: return 'neutral';
    }
  };

  // Map churn risk to Badge status
  const getChurnRiskStatus = (risk: number): BadgeStatus => {
    if (risk >= 70) return 'critical';
    if (risk >= 40) return 'warning';
    return 'success';
  };

  const getChurnRiskLabel = (risk: number): string => {
    if (risk >= 70) return 'High';
    if (risk >= 40) return 'Medium';
    return 'Low';
  };

  // Define columns for IndexTable
  const columns: Column<FanRow>[] = [
    {
      key: 'name',
      header: 'Fan',
      width: '200px',
      render: (_, row) => (
        <Link href={`/onlyfans/fans/${row.id}`} className="flex items-center gap-[var(--space-3)]">
          <img 
            src={row.avatar as string} 
            alt={row.name as string} 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.name as string}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{row.username as string}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      width: '100px',
      render: (value) => (
        <Badge status={getTierBadgeStatus(value as string)}>
          {value as string}
        </Badge>
      ),
    },
    {
      key: 'ltv',
      header: 'LTV',
      width: '100px',
      numeric: true,
      render: (value, row) => (
        <span 
          className="font-semibold text-[var(--color-status-success)]"
          data-testid={`fan-ltv-${row.id}`}
        >
          ${(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'churnRisk',
      header: 'Churn Risk',
      width: '120px',
      render: (value, row) => (
        <Badge 
          status={getChurnRiskStatus(value as number)}
          data-testid={`fan-churn-${row.id}`}
        >
          {getChurnRiskLabel(value as number)} ({value as number}%)
        </Badge>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      width: '120px',
      render: (value) => (
        <span className="text-[var(--color-text-secondary)]">
          {value as string}
        </span>
      ),
    },
    {
      key: 'aiInsight',
      header: 'AI Insight',
      width: '220px',
      truncate: true,
      render: (value, row) => value ? (
        <div 
          className="flex items-center gap-[var(--space-1)] text-[var(--color-text-secondary)]"
          data-testid={`fan-insight-${row.id}`}
        >
          <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
          <span className="truncate">{value as string}</span>
        </div>
      ) : null,
    },
    {
      key: 'id',
      header: 'Actions',
      width: '100px',
      render: () => (
        <Button variant="outline" size="sm">
          Message
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Fans"
      subtitle="Segment and manage your OnlyFans subscribers with AI insights."
      breadcrumbs={[
        { label: 'OnlyFans', href: '/onlyfans' },
        { label: 'Fans' }
      ]}
      actions={
        <div className="flex items-center gap-[var(--space-2)]">
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
      <Card className="p-[var(--space-4)]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[var(--space-3)]">
          {segments.map((segment) => {
            const Icon = segment.icon;
            const isActive = selectedSegment === segment.value;
            return (
              <button
                key={segment.value}
                onClick={() => setSelectedSegment(segment.value as FanSegment)}
                className={`p-[var(--space-3)] rounded-[var(--radius-base)] border text-left transition-colors ${
                  isActive
                    ? 'border-[var(--color-action-primary)] bg-[var(--color-surface-subdued)]'
                    : 'border-[var(--color-border-subdued)] hover:bg-[var(--color-surface-subdued)]'
                }`}
              >
                <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-1)]">
                  <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {segment.count}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">{segment.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search & Filters */}
      <Card className="p-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-center md:justify-between mb-[var(--space-4)]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fans by name or username..."
              className="w-full pl-9 pr-4 py-2 border border-[var(--color-border-default)] rounded-[var(--radius-base)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action-primary)] focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Fans Table using IndexTable */}
        <IndexTable<FanRow>
          data={filteredFans as FanRow[]}
          columns={columns}
          keyField="id"
          loading={isLoading}
          rowHeight="default"
          emptyState={
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No fans found"
              description={searchQuery 
                ? `No fans match "${searchQuery}". Try a different search term.`
                : "You don't have any fans in this segment yet."
              }
              action={{
                label: "Run AI Segmentation",
                onClick: () => console.log('AI Segmentation'),
                icon: Sparkles,
              }}
            />
          }
        />
      </Card>
    </PageLayout>
  );
}
