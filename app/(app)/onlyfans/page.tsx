'use client';

/**
 * OnlyFans Main Dashboard Page - Polaris Monochrome Design
 * Main entry point for OnlyFans features
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ButlerTip } from '@/components/ui/ButlerTip';
import Link from 'next/link';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { DashboardErrorState } from '@/components/ui/DashboardLoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import {
  MessageSquare,
  Users,
  DollarSign,
  Zap,
  Send,
  Eye,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Plug,
  Video,
} from 'lucide-react';

interface OnlyFansStats {
  messages: { total: number; unread: number; responseRate: number; avgResponseTime: number };
  fans: { total: number; active: number; new: number };
  ppv: { totalRevenue: number; totalSales: number; conversionRate: number };
  connection: { isConnected: boolean; lastSync: string | null; status: 'connected' | 'disconnected' | 'error' };
}

interface OnlyFansStatsResponse {
  success: boolean;
  stats: OnlyFansStats | null;
  connection?: OnlyFansStats['connection'];
  error?: string;
}

// Polaris Card Component
const PCard = ({ children, title, noPadding }: { children: React.ReactNode; title?: string; noPadding?: boolean }) => (
  <div className="p-card">
    {title && (
      <div className="p-card-header">
        <h3 className="p-card-title">{title}</h3>
      </div>
    )}
    <div className={noPadding ? "p-card-body no-padding" : "p-card-body"}>
      {children}
    </div>
  </div>
);

// KPI Card Component
const KPICard = ({ label, value, change, trend }: { 
  label: string; value: string; change?: number; trend?: 'up' | 'down';
}) => (
  <div className="kpi-card">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
    {change !== undefined && trend && (
      <div className={`kpi-change ${trend === 'up' ? 'positive' : 'negative'}`}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(change)}%
      </div>
    )}
  </div>
);

export default function OnlyFansPage() {
  const [stats, setStats] = useState<OnlyFansStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await internalApiFetch<OnlyFansStatsResponse>('/api/onlyfans/stats');

      if (!data?.success) {
        setStats(null);
        setError(data?.error || 'Failed to load OnlyFans stats');
        return;
      }

      const connection = data?.stats?.connection ?? data?.connection ?? {
        isConnected: false,
        lastSync: null,
        status: 'disconnected' as const,
      };

      if (data?.stats) {
        setStats({ ...data.stats, connection });
      } else {
        setStats({
          messages: { total: 0, unread: 0, responseRate: 0, avgResponseTime: 0 },
          fans: { total: 0, active: 0, new: 0 },
          ppv: { totalRevenue: 0, totalSales: 0, conversionRate: 0 },
          connection,
        });
      }
    } catch (e) {
      setStats(null);
      setError(e instanceof Error ? e.message : 'Failed to load OnlyFans stats');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    void loadDashboardData();
  };

  // Loading state
  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
        <div className="polaris-analytics">
          <div className="page-header">
            <div style={{ height: 28, width: 200, background: '#E3E3E3', borderRadius: 8 }} />
          </div>
          <div className="content-wrapper">
            <div className="kpi-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="kpi-card" style={{ height: 88 }}>
                  <div style={{ height: 12, width: 80, background: '#E3E3E3', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 24, width: 100, background: '#E3E3E3', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (error) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
        <div className="polaris-analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DashboardErrorState message={error} onRetry={handleRefresh} />
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video size={24} />
              OnlyFans
            </h1>
            <p className="page-meta">
              {stats?.connection?.status === 'connected'
                ? `Last synced: ${stats.connection.lastSync ? new Date(stats.connection.lastSync).toLocaleTimeString() : 'Just now'}`
                : 'Not connected'}
            </p>
          </div>
          <div className="filter-pills">
            <button className="filter-pill" onClick={handleRefresh}>
              <RefreshCw size={14} />
              Refresh
            </button>
            <Link href="/onlyfans/settings">
              <button className="filter-pill">
                <Settings size={14} />
                Settings
              </button>
            </Link>
          </div>
        </div>

        <div className="content-wrapper">
          {/* Empty state (before upstream data is connected) */}
          {!stats || stats.connection.status !== 'connected' ? (
            <EmptyState
              variant="no-data"
              title="Connect OnlyFans to see your dashboard"
              description="Once connected, Huntaze will sync your messages, fans, and PPV performance."
              action={{
                label: 'Connect OnlyFans',
                onClick: () => (window.location.href = '/integrations'),
              }}
              secondaryAction={{ label: 'Retry', onClick: handleRefresh, icon: RefreshCw }}
            />
          ) : (
            <>
              {/* KPI Grid */}
              <div className="kpi-grid">
                <KPICard
                  label="Monthly Revenue"
                  value={`$${stats.ppv.totalRevenue.toLocaleString()}`}
                  change={15}
                  trend="up"
                />
                <KPICard
                  label="Total Fans"
                  value={stats.fans.total.toLocaleString()}
                  change={8}
                  trend="up"
                />
                <KPICard
                  label="Response Rate"
                  value={`${stats.messages.responseRate}%`}
                  change={2}
                  trend="up"
                />
                <KPICard label="Unread Messages" value={stats.messages.unread.toString()} />
              </div>

              {/* Quick Actions - Text Links */}
              <div className="p-card">
                <div className="p-card-header">
                  <h3 className="p-card-title">Quick Actions</h3>
                </div>
                <div className="p-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px' }}>
                  <Link href="/onlyfans/messages" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#303030', textDecoration: 'none' }}>
                    <Send size={16} style={{ color: '#616161' }} />
                    Messages
                  </Link>
                  <Link href="/automations" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#303030', textDecoration: 'none' }}>
                    <Zap size={16} style={{ color: '#616161' }} />
                    Automations
                  </Link>
                  <Link href="/onlyfans/fans" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#303030', textDecoration: 'none' }}>
                    <Eye size={16} style={{ color: '#616161' }} />
                    Fans
                  </Link>
                  <Link href="/integrations" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#303030', textDecoration: 'none' }}>
                    <Plug size={16} style={{ color: '#616161' }} />
                    Integrations
                  </Link>
                </div>
              </div>

              {/* Activity */}
              <div className="chart-section">
                {/* Recent Activity */}
                <PCard title="Recent Activity" noPadding>
              <div className="breakdown-list">
                {stats && stats.messages.unread > 0 && (
                  <div className="breakdown-item" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, background: '#F1F1F1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={16} style={{ color: '#616161' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>
                          {stats.messages.unread} new messages
                        </div>
                        <div style={{ fontSize: 12, color: '#616161' }}>
                          Response time: {stats.messages.avgResponseTime}min avg
                        </div>
                      </div>
                    </div>
                    <Link href="/onlyfans/messages">
                      <button className="filter-pill" style={{ background: '#303030', color: '#fff', border: 'none' }}>
                        Reply
                      </button>
                    </Link>
                  </div>
                )}
                {stats && stats.fans.new > 0 && (
                  <div className="breakdown-item" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, background: '#F1F1F1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={16} style={{ color: '#616161' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>
                          {stats.fans.new} new subscribers
                        </div>
                        <div style={{ fontSize: 12, color: '#616161' }}>
                          +{Math.round((stats.fans.new / stats.fans.total) * 100)}% growth
                        </div>
                      </div>
                    </div>
                    <Link href="/onlyfans/fans">
                      <button className="filter-pill">View</button>
                    </Link>
                  </div>
                )}
                {stats && stats.ppv.totalSales > 0 && (
                  <div className="breakdown-item" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, background: '#F1F1F1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={16} style={{ color: '#616161' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>
                          {stats.ppv.totalSales} PPV sales
                        </div>
                        <div style={{ fontSize: 12, color: '#616161' }}>
                          ${stats.ppv.totalRevenue.toLocaleString()} • {stats.ppv.conversionRate}% conv.
                        </div>
                      </div>
                    </div>
                    <Link href="/onlyfans/ppv">
                      <button className="filter-pill">Create</button>
                    </Link>
                  </div>
                )}
              </div>
                </PCard>
              </div>

          {/* Butler Tip */}
          <ButlerTip page="OnlyFans" className="mb-6" />
            </>
          )}
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
