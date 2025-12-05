'use client';

/**
 * Marketing Campaigns Page
 * 
 * Displays campaign list with status, AI campaign generator integration,
 * and campaign analytics.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 5.1, 5.2
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Filter, 
  Sparkles, 
  Send, 
  Eye, 
  MousePointer,
  TrendingUp,
  Clock,
  CheckCircle,
  PauseCircle,
  AlertCircle,
  FileText,
  Megaphone,
  BarChart3,
  Zap
} from 'lucide-react';

// Campaign status type
type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

// Campaign interface
interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channel: string;
  goal: string;
  audience: {
    segment: string;
    size: number;
  };
  stats?: {
    sent: number;
    opened: number;
    openRate: number;
    clicked: number;
    clickRate: number;
    converted: number;
    conversionRate: number;
  };
  createdAt: string;
  scheduledAt?: string;
  aiGenerated?: boolean;
}

// Status config for styling
const STATUS_CONFIG: Record<CampaignStatus, { icon: typeof CheckCircle; color: string; bg: string }> = {
  draft: { icon: FileText, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  scheduled: { icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  active: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  paused: { icon: PauseCircle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  completed: { icon: CheckCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

export default function MarketingCampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        // Mock data for now - would be replaced with API call
        const mockCampaigns: Campaign[] = [
          {
            id: '1',
            name: 'Summer Sale PPV Promo',
            status: 'active',
            channel: 'dm',
            goal: 'sales',
            audience: { segment: 'High Spenders', size: 245 },
            stats: { sent: 245, opened: 198, openRate: 0.808, clicked: 87, clickRate: 0.355, converted: 34, conversionRate: 0.139 },
            createdAt: '2024-12-01',
            aiGenerated: true,
          },
          {
            id: '2',
            name: 'New Subscriber Welcome',
            status: 'active',
            channel: 'dm',
            goal: 'engagement',
            audience: { segment: 'New Fans', size: 89 },
            stats: { sent: 89, opened: 76, openRate: 0.854, clicked: 45, clickRate: 0.506, converted: 12, conversionRate: 0.135 },
            createdAt: '2024-11-28',
          },
          {
            id: '3',
            name: 'Re-engagement Campaign',
            status: 'scheduled',
            channel: 'email',
            goal: 'retention',
            audience: { segment: 'At-Risk Fans', size: 156 },
            createdAt: '2024-12-03',
            scheduledAt: '2024-12-10',
            aiGenerated: true,
          },
          {
            id: '4',
            name: 'Holiday Special Offer',
            status: 'draft',
            channel: 'dm',
            goal: 'sales',
            audience: { segment: 'All Fans', size: 508 },
            createdAt: '2024-12-04',
          },
        ];
        setCampaigns(mockCampaigns);
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;
    if (channelFilter !== 'all' && campaign.channel !== channelFilter) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
    avgOpenRate: campaigns.filter(c => c.stats).length > 0
      ? campaigns.reduce((sum, c) => sum + (c.stats?.openRate || 0), 0) / campaigns.filter(c => c.stats).length
      : 0,
    totalConversions: campaigns.reduce((sum, c) => sum + (c.stats?.converted || 0), 0),
  };


  // Actions for page header
  const PageActions = (
    <div className="flex items-center gap-2">
      <Link href="/marketing/campaigns/new">
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Campaign
        </Button>
      </Link>
      <Link href="/marketing/campaigns/new?ai=true">
        <Button variant="primary" size="sm" data-testid="ai-campaign-generator">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Generate
        </Button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <PageLayout
          title="Campaigns"
          subtitle="Loading your campaigns..."
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campaigns' }
          ]}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </Card>
            ))}
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Marketing Campaigns">
        <PageLayout
          title="Campaigns"
          subtitle="Create and manage your marketing campaigns with AI assistance"
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campaigns' }
          ]}
          actions={PageActions}
        >
          {/* AI Campaign Generator Banner */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20" data-testid="ai-campaign-banner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">AI Campaign Generator</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">
                    Describe your goals and let AI create a complete campaign with copy, timing, and targets
                  </p>
                </div>
              </div>
              <Link href="/marketing/campaigns/new?ai=true">
                <Button variant="primary" size="sm">
                  <Zap className="h-4 w-4 mr-1" />
                  Generate Campaign
                </Button>
              </Link>
            </div>
          </Card>

          {/* Stats Cards */}
          <section className="mb-8" data-testid="campaign-stats">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6" data-testid="stat-total">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Total Campaigns</span>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="stat-total-value">
                  {stats.total}
                </div>
                <div className="text-sm text-[var(--color-text-sub)] mt-1">
                  {stats.active} active
                </div>
              </Card>

              <Card className="p-6" data-testid="stat-sent">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Messages Sent</span>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="stat-sent-value">
                  {stats.totalSent.toLocaleString()}
                </div>
              </Card>

              <Card className="p-6" data-testid="stat-open-rate">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Avg Open Rate</span>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="stat-open-rate-value">
                  {(stats.avgOpenRate * 100).toFixed(1)}%
                </div>
              </Card>

              <Card className="p-6" data-testid="stat-conversions">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Conversions</span>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <MousePointer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="stat-conversions-value">
                  {stats.totalConversions}
                </div>
              </Card>
            </div>
          </section>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6" data-testid="campaign-filters">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--color-text-sub)]" />
              <span className="text-sm font-medium text-[var(--color-text-sub)]">Filters:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--color-text-main)] text-sm"
              data-testid="filter-status"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--color-text-main)] text-sm"
              data-testid="filter-channel"
            >
              <option value="all">All Channels</option>
              <option value="dm">DM</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
            </select>
          </div>

          {/* Campaigns List */}
          {filteredCampaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No campaigns found"
              description={campaigns.length === 0 
                ? "Create your first campaign to start engaging with your fans"
                : "No campaigns match your current filters"
              }
              actionLabel="Create Campaign"
              actionHref="/marketing/campaigns/new"
            />
          ) : (
            <div className="space-y-4" data-testid="campaigns-list">
              {filteredCampaigns.map((campaign) => {
                const StatusIcon = STATUS_CONFIG[campaign.status].icon;
                return (
                  <Link key={campaign.id} href={`/marketing/campaigns/${campaign.id}`}>
                    <Card 
                      className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`campaign-${campaign.id}`}
                      data-status={campaign.status}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                              {campaign.name}
                            </h3>
                            {campaign.aiGenerated && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium" data-testid="ai-badge">
                                <Sparkles className="h-3 w-3" />
                                AI Generated
                              </span>
                            )}
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[campaign.status].bg} ${STATUS_CONFIG[campaign.status].color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-[var(--color-text-sub)]">
                              {campaign.channel.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text-sub)]">
                            Audience: {campaign.audience.segment} ({campaign.audience.size.toLocaleString()} fans)
                          </p>
                          {campaign.scheduledAt && (
                            <p className="text-sm text-[var(--color-text-sub)] mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Scheduled for {new Date(campaign.scheduledAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        {campaign.stats && (
                          <div className="flex items-center gap-6 text-sm" data-testid="campaign-stats">
                            <div className="text-center">
                              <p className="text-[var(--color-text-sub)]">Sent</p>
                              <p className="font-semibold text-[var(--color-text-main)]">{campaign.stats.sent}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[var(--color-text-sub)]">Open Rate</p>
                              <p className="font-semibold text-[var(--color-text-main)]">{(campaign.stats.openRate * 100).toFixed(1)}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[var(--color-text-sub)]">Conversions</p>
                              <p className="font-semibold text-[var(--color-text-main)]">{campaign.stats.converted}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </PageLayout>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
