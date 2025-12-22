'use client';

/**
 * Marketing Campaigns Page - Polaris Design
 */
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { useMarketingCampaigns, type CampaignStatus } from '@/hooks/marketing/useMarketingCampaigns';
import { 
  Plus, 
  Sparkles, 
  Send, 
  Eye, 
  MousePointer,
  Clock,
  Target,
  MoreHorizontal,
  TrendingUp,
  Users,
  CheckCircle
} from 'lucide-react';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load campaigns';
}

// Polaris Card Component
const PCard = ({ children, title, noPadding, headerAction }: { 
  children: React.ReactNode; 
  title?: string; 
  noPadding?: boolean;
  headerAction?: React.ReactNode;
}) => (
  <div className="p-card">
    {title && (
      <div className="p-card-header" style={{ justifyContent: 'space-between' }}>
        <h3 className="p-card-title">{title}</h3>
        {headerAction}
      </div>
    )}
    <div className={noPadding ? "p-card-body no-padding" : "p-card-body"}>
      {children}
    </div>
  </div>
);

export default function MarketingCampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const { campaigns, error, isLoading, mutate } = useMarketingCampaigns({
    status: 'all',
    channel: 'all',
    limit: 50,
    offset: 0,
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
    avgOpenRate: campaigns.filter(c => c.stats).length > 0
      ? campaigns.reduce((sum, c) => sum + (c.stats?.openRate || 0), 0) / campaigns.filter(c => c.stats).length
      : 0,
    totalConversions: campaigns.reduce((sum, c) => sum + (c.stats?.converted || 0), 0),
  };

  const statusColors: Record<CampaignStatus, { bg: string; text: string }> = {
    draft: { bg: '#F3F4F6', text: '#616161' },
    scheduled: { bg: '#DBEAFE', text: '#1E40AF' },
    active: { bg: '#D1FAE5', text: '#008060' },
    paused: { bg: '#FEF3C7', text: '#92400E' },
    completed: { bg: '#F3F4F6', text: '#616161' },
  };

  if (isLoading && campaigns.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Campaigns">
        <div className="polaris-analytics">
          <div className="content-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <DashboardLoadingState message="Loading campaigns..." />
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Campaigns">
        <div className="polaris-analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DashboardErrorState message={getErrorMessage(error)} onRetry={() => void mutate()} />
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Campaigns">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={22} />
            Campaigns
          </h1>
          <Link href="/marketing/campaigns/new" style={{ textDecoration: 'none' }}>
            <button className="filter-pill cta-button">
              <Plus size={14} />
              New Campaign
            </button>
          </Link>
        </div>

        <div className="content-wrapper">
          {/* KPI Row */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <Target size={14} style={{ color: '#616161' }} />
                  Total
                </div>
                <div className="kpi-value">{stats.total}</div>
              </div>
              <span style={{ fontSize: 12, color: '#008060', fontWeight: 500 }}>{stats.active} active</span>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <Send size={14} style={{ color: '#616161' }} />
                  Messages Sent
                </div>
                <div className="kpi-value">{stats.totalSent.toLocaleString()}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <Eye size={14} style={{ color: '#616161' }} />
                  Avg Open Rate
                </div>
                <div className="kpi-value">{(stats.avgOpenRate * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <TrendingUp size={14} style={{ color: '#616161' }} />
                  Conversions
                </div>
                <div className="kpi-value">{stats.totalConversions}</div>
              </div>
            </div>
          </div>

          {/* Campaigns List */}
          <PCard title="All Campaigns" noPadding headerAction={
            <span style={{ fontSize: 12, color: '#616161' }}>{filteredCampaigns.length} campaigns</span>
          }>
            {/* Filter */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E3E3E3', background: '#FAFAFA' }}>
              <div className="filter-pills">
                {['all', 'active', 'scheduled', 'draft', 'paused', 'completed'].map(status => (
                  <button
                    key={status}
                    className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredCampaigns.length === 0 ? (
              <div className="empty-state">
                <Target size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#303030', margin: '0 0 6px 0' }}>No campaigns found</h3>
                <p className="empty-state-text" style={{ marginBottom: 16 }}>Create your first campaign</p>
                <Link href="/marketing/campaigns/new">
                  <button className="filter-pill cta-button">
                    <Plus size={14} /> Create Campaign
                  </button>
                </Link>
              </div>
            ) : (
              <div className="breakdown-list">
                {filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="breakdown-item"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, cursor: 'pointer' }}
                    onClick={() => window.location.href = `/marketing/campaigns/${campaign.id}`}
                  >
                    {/* Row 1: Title + Menu */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#303030', flex: 1, minWidth: 0 }}>{campaign.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="filter-pill"
                        style={{ padding: '6px 8px' }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    
                    {/* Row 2: Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500,
                        background: statusColors[campaign.status].bg, 
                        color: statusColors[campaign.status].text 
                      }}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      {campaign.aiGenerated && (
                        <span className="scope-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={10} /> AI
                        </span>
                      )}
                    </div>
                    
                    {/* Row 3: Audience */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#616161' }}>
                      <Users size={12} />
                      {campaign.audience.segment} ({campaign.audience.size} fans)
                    </div>
                    
                    {/* Row 4: Stats */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#616161', flexWrap: 'wrap' }}>
                      {campaign.stats ? (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Send size={12} /> {campaign.stats.sent} sent</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} /> {(campaign.stats.openRate * 100).toFixed(0)}% opened
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> {campaign.stats.converted} converted</span>
                        </>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> 
                          {campaign.scheduledAt ? `Scheduled for ${new Date(campaign.scheduledAt).toLocaleDateString()}` : 'Draft'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PCard>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
