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
import useSWR from 'swr';
import { Users, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { IndexTable, Column } from '@/components/ui/IndexTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedChips } from '@/components/ui/SegmentedChips';
import { SearchInput } from '@/components/ui/SearchInput';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

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

interface FansApiItem {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  subscriptionTier?: string;
  subscriptionAmount: number;
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscribedAt: string;
  expiresAt?: string;
  totalSpent: number;
  messageCount: number;
  lastMessageAt?: string;
}

interface FansApiResponse {
  success: boolean;
  data?: {
    items: FansApiItem[];
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// Type for IndexTable row data
type FanRow = Fan & Record<string, unknown>;

function formatRelativeTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function computeChurnRisk(status: FansApiItem['subscriptionStatus'], lastMessageAt?: string): number {
  if (status !== 'active') return 80;
  if (!lastMessageAt) return 40;
  const diff = Date.now() - new Date(lastMessageAt).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 21) return 70;
  if (days >= 10) return 50;
  return 20;
}

function resolveTier(item: FansApiItem): string {
  if (item.subscriptionTier) return item.subscriptionTier;
  if (item.subscriptionAmount >= 50) return 'VIP';
  return 'Active';
}

export default function FansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<FanSegment>('all');

  const {
    data: fansResponse,
    error: fansError,
    isLoading,
    mutate,
  } = useSWR<FansApiResponse>(
    '/api/onlyfans/fans?limit=100&offset=0',
    (url) => internalApiFetch<FansApiResponse>(url),
  );

  const fans: Fan[] = useMemo(() => {
    const items = fansResponse?.data?.items ?? [];
    return items.map((item) => ({
      id: item.id,
      name: item.name || 'Subscriber',
      username: item.username || '@unknown',
      tier: resolveTier(item),
      ltv: item.totalSpent ?? 0,
      arpu: item.subscriptionAmount ?? 0,
      lastActive: formatRelativeTime(item.lastMessageAt || item.subscribedAt),
      messages: item.messageCount ?? 0,
      avatar: item.avatar || '',
      churnRisk: computeChurnRisk(item.subscriptionStatus, item.lastMessageAt),
    }));
  }, [fansResponse]);

  if (isLoading) {
    return (
      <PageLayout
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={24} />Fans</div>}
        subtitle="Segment and manage your OnlyFans subscribers with AI insights."
        showHomeInBreadcrumbs={false}
      >
        <EmptyState
          variant="custom"
          title="Loading fans..."
          description="Fetching your latest subscriber list."
        />
      </PageLayout>
    );
  }

  if (fansError) {
    return (
      <PageLayout
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={24} />Fans</div>}
        subtitle="Segment and manage your OnlyFans subscribers with AI insights."
        showHomeInBreadcrumbs={false}
      >
        <EmptyState
          variant="error"
          title="Failed to load fans"
          description="Please try again."
          secondaryAction={{ label: 'Retry', onClick: () => void mutate(), icon: RefreshCw }}
        />
      </PageLayout>
    );
  }

  if (!isLoading && fans.length === 0) {
    return (
      <PageLayout
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={24} />Fans</div>}
        subtitle="Segment and manage your OnlyFans subscribers with AI insights."
        showHomeInBreadcrumbs={false}
      >
        <EmptyState
          variant="no-data"
          title="Connect OnlyFans to view your fans"
          description="Once connected, Huntaze will sync your fan list and help you segment VIPs, at-risk fans, and more."
          action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
        />
      </PageLayout>
    );
  }

  const segmentItems = [
    { value: 'all', label: 'All Fans', count: fans.length },
    { value: 'vip', label: 'VIP', count: fans.filter((f) => f.tier === 'VIP').length },
    { value: 'active', label: 'Active', count: fans.filter((f) => f.tier === 'Active').length },
    { value: 'at_risk', label: 'At-Risk', count: fans.filter((f) => f.tier === 'At-Risk').length },
    { value: 'churned', label: 'Churned', count: 0 },
  ] as const;

  const filteredFans = useMemo(() => {
    return fans.filter(fan => {
      const matchesSearch = fan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fan.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSegment = selectedSegment === 'all' || fan.tier.toLowerCase().replace('-', '_') === selectedSegment;
      return matchesSearch && matchesSegment;
    });
  }, [fans, searchQuery, selectedSegment]);

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
        <Link href={`/onlyfans/fans/${row.id}`} className="flex min-w-0 items-center gap-3">
          <img 
            src={
              (row.avatar as string) ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(row.id))}`
            }
            alt={row.name as string} 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{row.name as string}</p>
            <p className="truncate text-xs text-slate-500">{row.username as string}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      width: '100px',
      truncate: false,
      render: (value) => {
        const tier = String(value ?? '');
        return (
          <span className="text-slate-900 font-medium">
            {tier}
          </span>
        );
      },
    },
    {
      key: 'ltv',
      header: 'LTV',
      width: '100px',
      numeric: true,
      truncate: false,
      render: (value, row) => (
        <span 
          className="font-semibold tabular-nums text-slate-900"
          data-testid={`fan-ltv-${row.id}`}
        >
          ${(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'churnRisk',
      header: 'Churn Risk',
      width: '140px',
      truncate: false,
      render: (value, row) => {
        const risk = value as number;
        const label = getChurnRiskLabel(risk);
        return (
          <span
            className="text-slate-900 tabular-nums"
            data-testid={`fan-churn-${row.id}`}
          >
            {label} ({risk}%)
          </span>
        );
      },
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      width: '120px',
      truncate: false,
      render: (value) => (
        <span className="text-slate-600">
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
          className="flex items-center gap-1 text-slate-600"
          data-testid={`fan-insight-${row.id}`}
        >
          <Sparkles className="w-3 h-3 text-violet-500 flex-shrink-0" />
          <span className="truncate">{value as string}</span>
        </div>
      ) : null,
    },
    {
      key: 'id',
      header: 'Message',
      width: 'clamp(56px, 10vw, 110px)',
      align: 'right',
      truncate: false,
      render: (_, row) => (
        <Link
          href={`/onlyfans/messages?conversation=${encodeURIComponent(String(row.id))}`}
          aria-label={`Message ${(row.name as string) ?? 'fan'}`}
          title="Message"
          className={[
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors",
            "h-9 w-9 lg:w-auto lg:px-3",
            "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2c6ecb]/30",
          ].join(" ")}
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden lg:inline">Message</span>
        </Link>
      ),
    },
  ];

  return (
    <PageLayout
      title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={24} />Fans</div>}
      subtitle="Segment and manage your OnlyFans subscribers with AI insights."
      showHomeInBreadcrumbs={false}
    >
      {/* Segments */}
      <div className="mb-4">
        <SegmentedChips
          variant="tabs"
          size="sm"
          items={segmentItems}
          value={selectedSegment}
          onChange={setSelectedSegment}
          className="px-4"
        />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search fans by name or username…"
            ariaLabel="Search fans by name or username"
            className="max-w-md"
          />
        </div>

        {/* Fans Table using IndexTable */}
        <div className="border-t border-slate-200/60">
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
                  label: "Go to integrations",
                  onClick: () => (window.location.href = '/integrations'),
                  icon: Sparkles,
                }}
              />
            }
          />
        </div>
      </div>
    </PageLayout>
  );
}
