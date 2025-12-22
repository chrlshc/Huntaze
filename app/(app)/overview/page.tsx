'use client';

/**
 * Overview Dashboard - Unified Marketing & Content
 * Styled following OnlyFans design aesthetic
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import {
  ShopifyMetricCard,
  ShopifyMetricGrid,
  ShopifyBanner,
  ShopifyQuickAction,
  ShopifyCard,
  ShopifySectionHeader,
  ShopifyButton
} from '@/components/ui/shopify';
import { 
  CalendarDays,
  BarChart3,
  MessageCircleMore,
  Megaphone,
  FilePlus,
  PenSquare,
  RefreshCw,
  Settings,
  TrendingUp,
  MousePointer,
  Eye
} from 'lucide-react';

import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { useContent } from '@/hooks/useContent';
import { useMarketingCampaigns } from '@/hooks/marketing/useMarketingCampaigns';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load data';
}

export default function OverviewPage() {
  const [activeTab, setActiveTab] = useState<'marketing' | 'content'>('marketing');
  
  // Marketing data
  const {
    campaigns,
    error: campaignsError,
    isLoading: isLoadingCampaigns,
    mutate: mutateCampaigns,
  } = useMarketingCampaigns({
    status: 'all',
    channel: 'all',
    limit: 50,
    offset: 0,
  });

  // Content data
  const {
    data: contentData,
    error: contentError,
    mutate: mutateContent,
  } = useContent({
    status: 'all',
    limit: 50
  });
  const isLoadingContent = !contentError && !contentData;

  const contentItems = contentData?.data?.items || [];
  const isPageLoading = isLoadingCampaigns || isLoadingContent;

  // Calculate stats
  const marketingStats = {
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
    avgOpenRate: campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.stats?.openRate || 0), 0) / campaigns.length
      : 0,
    conversions: campaigns.reduce((sum, c) => sum + (c.stats?.converted || 0), 0),
  };

  const contentStats = {
    total: contentItems.length,
    published: contentItems.filter(item => item.status === 'published').length,
    scheduled: contentItems.filter(item => item.status === 'scheduled').length,
    draft: contentItems.filter(item => item.status === 'draft').length,
  };

  // Handle refresh
  const handleRefresh = () => {
    void Promise.all([mutateCampaigns(), mutateContent()]);
  };

  // Loading state
  if (isPageLoading) {
    return (
      <ContentPageErrorBoundary pageName="Overview Dashboard">
        <ShopifyPageLayout
          title="Overview Dashboard"
          subtitle="Manage your marketing, content, and performance in one place."
        >
          <ShopifyMetricGrid columns={4}>
            {[1, 2, 3, 4].map((i) => (
              <ShopifyCard key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </ShopifyCard>
            ))}
          </ShopifyMetricGrid>
        </ShopifyPageLayout>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Overview Dashboard">
      <ShopifyPageLayout
        title="Overview Dashboard"
        subtitle="Manage your marketing, content, and performance in one place."
        actions={
          <div className="flex items-center gap-2">
            <ShopifyButton variant="secondary" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </ShopifyButton>
            <ShopifyButton variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </ShopifyButton>
          </div>
        }
      >
        {(campaignsError || contentError) && (
          <ShopifyBanner
            status="critical"
            title="Unable to load data"
            description={getErrorMessage(activeTab === 'marketing' ? campaignsError : contentError)}
            action={{
              label: 'Retry',
              onClick: () => {
                if (activeTab === 'marketing') {
                  void mutateCampaigns();
                } else {
                  void mutateContent();
                }
              },
            }}
            className="mb-6"
          />
        )}
          {/* Tabs for switching between Marketing and Content */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('marketing')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'marketing'
                  ? 'border-[var(--color-indigo)] text-[var(--color-indigo)]'
                  : 'border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Marketing
              </div>
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-[var(--color-indigo)] text-[var(--color-indigo)]'
                  : 'border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FilePlus className="w-4 h-4" />
                Content
              </div>
            </button>
          </div>

          {/* Display Marketing Content */}
          {activeTab === 'marketing' && (
            <>
              {/* Marketing Metrics */}
              <ShopifyMetricGrid columns={4} data-testid="marketing-metrics-grid">
                <ShopifyMetricCard
                  label="Active Campaigns"
                  value={marketingStats.activeCampaigns.toString()}
                  icon={TrendingUp}
                  iconColor="#5c5f62"
                />
                <ShopifyMetricCard
                  label="Total Sent"
                  value={marketingStats.totalSent.toLocaleString()}
                  icon={MessageCircleMore}
                  iconColor="#5c5f62"
                />
                <ShopifyMetricCard
                  label="Avg Open Rate"
                  value={`${(marketingStats.avgOpenRate * 100).toFixed(1)}%`}
                  icon={Eye}
                  iconColor="#5c5f62"
                />
                <ShopifyMetricCard
                  label="Conversions"
                  value={marketingStats.conversions.toLocaleString()}
                  icon={MousePointer}
                  iconColor="#5c5f62"
                />
              </ShopifyMetricGrid>
              
              {/* Quick Actions */}
              <section className="mt-6">
                <ShopifySectionHeader title="Marketing Actions" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ShopifyQuickAction
                    icon={<Megaphone />}
                    iconColor="#5c5f62"
                    title="Create Campaign"
                    description="Start a new marketing campaign"
                    href="/marketing/campaigns/new"
                    className="shadow-none hover:shadow-none"
                  />
                  <ShopifyQuickAction
                    icon={<MessageCircleMore />}
                    iconColor="#5c5f62"
                    title="Send Message"
                    description="Mass messaging to fans"
                    href="/onlyfans/messages/mass"
                    className="shadow-none hover:shadow-none"
                  />
                  <ShopifyQuickAction
                    icon={<CalendarDays />}
                    iconColor="#5c5f62"
                    title="Calendar"
                    description="Schedule marketing activities"
                    href="/marketing/calendar"
                    className="shadow-none hover:shadow-none"
                  />
                  <ShopifyQuickAction
                    icon={<BarChart3 />}
                    iconColor="#5c5f62"
                    title="Analytics"
                    description="Campaign performance"
                    href="/analytics"
                    className="shadow-none hover:shadow-none"
                  />
                </div>
              </section>
              
              {/* Recent Campaigns */}
              <section className="mt-6">
                <ShopifySectionHeader title="Recent Campaigns" />
                <ShopifyCard>
                  <div className="divide-y divide-[var(--border-default)]">
                    {campaigns.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-[var(--color-text-sub)]">No campaigns yet</p>
                        <p className="text-xs text-[#8c9196] mt-1">Start by creating your first campaign</p>
                        <Link href="/marketing/campaigns/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-indigo)] text-white rounded-md text-sm">
                          <Megaphone className="w-4 h-4" />
                          Create Campaign
                        </Link>
                      </div>
                    ) : (
                      campaigns.slice(0, 3).map((campaign) => (
                        <div key={campaign.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors">
                          <Link href={`/marketing/campaigns/${campaign.id}`} className="block">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-base font-semibold text-[var(--color-text-main)]">{campaign.name}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                    campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                    campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {campaign.status}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {campaign.channel}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--color-text-sub)] mt-1">
                                  Audience: {campaign.audience.segment} ({campaign.audience.size} people)
                                </p>
                              </div>
                              
                              {campaign.stats && (
                                <div className="flex gap-4 text-sm">
                                  <div>
                                    <p className="text-[var(--color-text-sub)]">Sent</p>
                                    <p className="font-semibold">{campaign.stats.sent}</p>
                                  </div>
                                  <div>
                                    <p className="text-[var(--color-text-sub)]">Open Rate</p>
                                    <p className="font-semibold">{campaign.stats.openRate.toFixed(1)}%</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))
                    )}
                    {campaigns.length > 0 && (
                      <div className="p-3 text-center">
                        <Link href="/marketing/campaigns" className="text-sm font-medium text-[var(--color-indigo)] hover:text-[var(--color-indigo-dark)]">
                          View all campaigns
                        </Link>
                      </div>
                    )}
                  </div>
                </ShopifyCard>
              </section>
            </>
          )}

          {/* Display Content Tab */}
          {activeTab === 'content' && (
            <>
              {/* Content Metrics */}
              <ShopifyMetricGrid columns={4} data-testid="content-metrics-grid">
                <ShopifyMetricCard
                  label="Total Content"
                  value={contentStats.total.toString()}
                  icon={FilePlus}
                  iconColor="#5c5f62"
                />
                <ShopifyMetricCard
                  label="Published"
                  value={contentStats.published.toString()}
                  icon={Eye}
                  iconColor="#5c5f62"
                />
                <ShopifyMetricCard
                  label="Scheduled"
                  value={contentStats.scheduled.toString()}
                  icon={CalendarDays}
                  iconColor="#5c5f62"
                />
                <ShopifyMetricCard
                  label="Drafts"
                  value={contentStats.draft.toString()}
                  icon={PenSquare}
                  iconColor="#5c5f62"
                />
              </ShopifyMetricGrid>
              
              {/* Content Actions */}
              <section className="mt-6">
                <ShopifySectionHeader title="Content Actions" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ShopifyQuickAction
                    icon={<FilePlus />}
                    iconColor="#5c5f62"
                    title="Create Content"
                    description="Add new content item"
                    href="/content/editor"
                    className="shadow-none hover:shadow-none"
                  />
                  <ShopifyQuickAction
                    icon={<CalendarDays />}
                    iconColor="#5c5f62"
                    title="Schedule"
                    description="Plan your content calendar"
                    href="/content/schedule"
                    className="shadow-none hover:shadow-none"
                  />
                  <ShopifyQuickAction
                    icon={<PenSquare />}
                    iconColor="#5c5f62"
                    title="Templates"
                    description="Create & manage templates"
                    href="/content/templates"
                    className="shadow-none hover:shadow-none"
                  />
                  <ShopifyQuickAction
                    icon={<BarChart3 />}
                    iconColor="#5c5f62"
                    title="Analytics"
                    description="Content performance"
                    href="/analytics/content"
                    className="shadow-none hover:shadow-none"
                  />
                </div>
              </section>
              
              {/* Recent Content */}
              <section className="mt-6">
                <ShopifySectionHeader title="Recent Content" />
                <ShopifyCard>
                  <div className="divide-y divide-[var(--border-default)]">
                    {contentItems.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-[var(--color-text-sub)]">No content items yet</p>
                        <p className="text-xs text-[#8c9196] mt-1">Start by creating your first content</p>
                        <Link href="/content/editor" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-indigo)] text-white rounded-md text-sm">
                          <FilePlus className="w-4 h-4" />
                          Create Content
                        </Link>
                      </div>
                    ) : (
                      contentItems.slice(0, 3).map((item) => {
                        const getTypeIcon = (type: string) => {
                          switch (type) {
                            case 'image':
                              return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>;
                            case 'video':
                              return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>;
                            case 'text':
                              return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>;
                            default:
                              return <FilePlus className="w-5 h-5" />;
                          }
                        };

                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'published': return 'bg-green-100 text-green-700';
                            case 'scheduled': return 'bg-blue-100 text-blue-700';
                            case 'draft': return 'bg-gray-100 text-gray-700';
                            default: return 'bg-gray-100 text-gray-700';
                          }
                        };

                        return (
                          <div key={item.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors">
                            <Link href={`/content/editor?id=${item.id}`} className="block">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-gray-100 rounded-lg">
                                    {getTypeIcon(item.type)}
                                  </div>
                                  <div>
                                    <h3 className="text-base font-semibold text-[var(--color-text-main)]">
                                      {item.title}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
                                        {item.platform}
                                      </span>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                        {item.status}
                                      </span>
                                      <span className="text-sm text-[var(--color-text-sub)]">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })
                    )}
                    {contentItems.length > 0 && (
                      <div className="p-3 text-center">
                        <Link href="/content" className="text-sm font-medium text-[var(--color-indigo)] hover:text-[var(--color-indigo-dark)]">
                          View all content
                        </Link>
                      </div>
                    )}
                  </div>
                </ShopifyCard>
              </section>
            </>
          )}

        </ShopifyPageLayout>
    </ContentPageErrorBoundary>
  );
}
