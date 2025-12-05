"use client";

/**
 * OnlyFans PPV Page
 * Requirements: 2.5 - PPV creation with AI pricing suggestions
 * Feature: dashboard-ux-overhaul, dashboard-design-refactor
 * 
 * Refactored to use design system components:
 * - ContentGrid for PPV campaign display (Requirements 9.1-9.4)
 * - StatCard for metrics display
 * - Badge for status indicators
 * - Banner for AI pricing suggestions
 * - EmptyState for no campaigns scenario
 */

import { useState } from 'react';
import { Plus, Send, DollarSign, TrendingUp, Users, Calendar, Image, Video, FileText, Search, Sparkles, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/export-all";
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentGrid, ContentItem } from '@/components/ppv/ContentGrid';

export default function OnlyFansPPVPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'drafts' | 'sent'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [isLoading, setIsLoading] = useState(false);

  // Mock PPV data
  const ppvCampaigns = [
    {
      id: '1',
      title: 'Exclusive Holiday Content 🎄',
      price: 25,
      mediaType: 'video',
      mediaCount: 3,
      thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400',
      description: 'Special holiday-themed content just for you!',
      createdAt: '2025-11-10',
      sentTo: 156,
      opened: 89,
      purchased: 23,
      revenue: 575,
      status: 'active' as const,
    },
    {
      id: '2',
      title: 'Behind the Scenes Photos 📸',
      price: 15,
      mediaType: 'image',
      mediaCount: 12,
      thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
      description: 'Exclusive behind-the-scenes photos from my latest shoot',
      createdAt: '2025-11-08',
      sentTo: 203,
      opened: 134,
      purchased: 45,
      revenue: 675,
      status: 'active' as const,
    },
    {
      id: '3',
      title: 'Weekend Special Content',
      price: 20,
      mediaType: 'video',
      mediaCount: 2,
      thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
      description: 'Special weekend content for my VIP fans',
      createdAt: '2025-11-12',
      sentTo: 0,
      opened: 0,
      purchased: 0,
      status: 'draft' as const,
    },
    {
      id: '4',
      title: 'Halloween Special 🎃',
      price: 30,
      mediaType: 'video',
      mediaCount: 5,
      thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400',
      description: 'Spooky Halloween content collection',
      createdAt: '2025-10-28',
      sentTo: 189,
      opened: 156,
      purchased: 67,
      revenue: 2010,
      status: 'sent' as const,
    },
    {
      id: '5',
      title: 'Summer Vibes Collection ☀️',
      price: 18,
      mediaType: 'image',
      mediaCount: 8,
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
      description: 'Hot summer content collection',
      createdAt: '2025-10-15',
      sentTo: 178,
      opened: 145,
      purchased: 52,
      revenue: 936,
      status: 'sent' as const,
    },
  ];

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'sent': return 'info';
      default: return 'neutral';
    }
  };

  const filteredCampaigns = ppvCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesTab = activeTab === 'all' || campaign.status === activeTab;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return (b.revenue || 0) - (a.revenue || 0);
      case 'date': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'purchased': return (b.purchased || 0) - (a.purchased || 0);
      default: return 0;
    }
  });

  // Transform campaigns to ContentGrid format
  const contentGridItems: ContentItem[] = sortedCampaigns.map(campaign => ({
    id: campaign.id,
    thumbnail: campaign.thumbnail,
    title: campaign.title,
    price: campaign.price,
    stats: {
      sent: campaign.sentTo || 0,
      opened: campaign.opened || 0,
      purchased: campaign.purchased || 0,
    },
  }));

  const totalRevenue = ppvCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalSent = ppvCampaigns.reduce((sum, c) => sum + (c.sentTo || 0), 0);
  const totalPurchased = ppvCampaigns.reduce((sum, c) => sum + (c.purchased || 0), 0);
  const conversionRate = totalSent > 0 ? (totalPurchased / totalSent) * 100 : 0;

  // AI pricing suggestion state
  const [showAIPricing, setShowAIPricing] = useState(false);
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState<number | null>(null);

  // Simulate AI pricing suggestion
  const getAIPriceSuggestion = () => {
    const basePrice = 20;
    const audienceMultiplier = 1.2;
    const suggested = Math.round(basePrice * audienceMultiplier);
    setAiSuggestedPrice(suggested);
    setShowAIPricing(true);
  };

  const handleSend = (id: string) => {
    console.log('Send PPV:', id);
  };

  const handleEdit = (id: string) => {
    console.log('Edit PPV:', id);
  };

  return (
    <PageLayout
      title="PPV Content"
      subtitle="Create and manage pay-per-view campaigns with AI pricing optimization."
      breadcrumbs={[
        { label: 'OnlyFans', href: '/onlyfans' },
        { label: 'PPV' }
      ]}
      actions={
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={getAIPriceSuggestion}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Pricing
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create PPV
          </Button>
        </div>
      }
    >
      {/* AI Pricing Suggestion Banner - Using Banner component */}
      {showAIPricing && aiSuggestedPrice && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Banner
            status="info"
            title="AI Pricing Suggestion"
            description={`Based on your audience and content type, we recommend $${aiSuggestedPrice} for optimal conversion.`}
            icon={<Zap className="w-5 h-5" />}
            action={{
              label: 'Dismiss',
              onClick: () => setShowAIPricing(false),
            }}
          />
        </div>
      )}

      {/* Stats Cards - Using StatCard component */}
      <div 
        className="grid grid-cols-1 md:grid-cols-4"
        style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}
      >
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          trend={{ value: '+12%', direction: 'up' }}
        />
        <StatCard
          label="Total Sent"
          value={totalSent.toString()}
        />
        <StatCard
          label="Purchases"
          value={totalPurchased.toString()}
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          trend={{ value: '+2.3%', direction: 'up' }}
        />
      </div>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex flex-col md:flex-row" style={{ gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search PPV campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2"
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-base)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--color-text-main)',
                }}
              />
            </div>
          </div>
          
          <div className="flex" style={{ gap: 'var(--space-2)' }}>
            <Select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-base)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--color-text-main)',
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Drafts</option>
              <option value="sent">Sent</option>
            </Select>

            <Select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-base)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--color-text-main)',
              }}
            >
              <option value="date">Sort by Date</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="purchased">Sort by Purchases</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <nav className="flex" style={{ gap: 'var(--space-8)', padding: '0 var(--space-6)' }}>
            {(['all', 'active', 'drafts', 'sent'] as const).map((tab) => {
              const count = tab === 'all' ? ppvCampaigns.length : ppvCampaigns.filter(c => c.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="font-medium text-sm transition-colors"
                  style={{
                    padding: 'var(--space-4) var(--space-1)',
                    borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === tab ? 'var(--color-text-heading)' : 'var(--color-text-sub)',
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <Badge variant="neutral" style={{ marginLeft: 'var(--space-2)' }}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ padding: 'var(--space-6)' }}>
          {contentGridItems.length > 0 ? (
            <ContentGrid
              items={contentGridItems}
              aspectRatio="16:9"
              gap="base"
              loading={isLoading}
              onSend={handleSend}
              onEdit={handleEdit}
              columns={3}
            />
          ) : (
            <EmptyState
              variant="no-data"
              title="No PPV campaigns found"
              description="Create your first PPV campaign to start earning"
              action={{
                label: 'Create PPV Campaign',
                onClick: () => setShowCreateModal(true),
                icon: Plus,
              }}
            />
          )}
        </div>
      </Card>

      {/* Create PPV Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ 
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-modal-backdrop, rgba(0,0,0,0.5))',
          }}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <h3 
              className="text-xl font-semibold"
              style={{ 
                color: 'var(--color-text-heading)',
                marginBottom: 'var(--space-6)',
              }}
            >
              Create PPV campaign
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ 
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Campaign Title
                </label>
                <input
                  type="text"
                  className="w-full"
                  placeholder="Enter campaign title..."
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2" style={{ gap: 'var(--space-4)' }}>
                <div>
                  <label 
                    className="block text-sm font-medium"
                    style={{ 
                      color: 'var(--color-text-main)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Price ($)
                  </label>
                  <input
                    type="number"
                    className="w-full"
                    placeholder="25"
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-base)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-medium"
                    style={{ 
                      color: 'var(--color-text-main)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Media Type
                  </label>
                  <Select 
                    className="w-full"
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-base)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="mixed">Mixed</option>
                  </Select>
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ 
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Description
                </label>
                <textarea
                  className="w-full"
                  rows={3}
                  placeholder="Describe your content..."
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ 
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Upload Media
                </label>
                <div 
                  className="text-center cursor-pointer transition-colors"
                  style={{
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Image className="w-12 h-12 text-gray-400" style={{ marginBottom: 'var(--space-2)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-sub)', marginBottom: 'var(--space-1)' }}>
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-sub)' }}>
                      Images, videos up to 500MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ 
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Send To
                </label>
                <Select 
                  className="w-full"
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--color-text-main)',
                  }}
                >
                  <option value="all">All Fans</option>
                  <option value="vip">VIP Fans Only</option>
                  <option value="active">Active Fans</option>
                  <option value="custom">Custom Segment</option>
                </Select>
              </div>
            </div>
            
            <div 
              className="flex justify-end"
              style={{ 
                gap: 'var(--space-3)',
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-6)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button variant="outline" size="sm">
                Save as Draft
              </Button>
              <Button variant="primary" size="sm">
                Create & Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
