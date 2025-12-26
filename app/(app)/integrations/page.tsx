'use client';

/**
 * Integrations Page - Polaris Design
 * Connect your social media and platform accounts
 * 
 * Card Template:
 * - Connected: Account + Last sync + Syncs: X • Y • Z + [Sync now] [Manage]
 * - Needs attention: Impact + Last successful sync + [Reconnect] [Why?]
 * - Not connected: Value prop + Includes: X • Y • Z + [Connect Platform]
 */

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ButlerTip } from '@/components/ui/ButlerTip';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useIntegrations } from '@/hooks/useIntegrations';
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Settings,
  Zap,
  Plug,
  HelpCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';

type PlatformStatus = 'connected' | 'needs_attention' | 'disconnected';

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  syncs: string[];
  permissions: 'read-only' | 'read-write';
  valueProp: string;
  includes: string[];
}

interface PlatformView extends PlatformConfig {
  status: PlatformStatus;
  account?: string;
  lastSync?: string;
  nextSync?: string;
  errorReason?: string;
  pausedSyncs?: string[];
  lastSuccessfulSync?: string;
  accountId?: string;
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    icon: '🔥',
    syncs: ['Messages', 'Fans', 'Revenue', 'PPV'],
    permissions: 'read-write',
    valueProp: 'Sync your OnlyFans inbox, fans, and PPV data',
    includes: ['Messages', 'Fans', 'Revenue', 'PPV'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    syncs: ['Posts', 'Stories', 'Analytics'],
    permissions: 'read-only',
    valueProp: 'Import your Instagram content & analytics',
    includes: ['Posts', 'Stories', 'Analytics'],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    syncs: ['Posts', 'Comments', 'Karma'],
    permissions: 'read-write',
    valueProp: 'Manage your Reddit presence and community insights',
    includes: ['Posts', 'Comments', 'Karma'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    syncs: ['Videos', 'Analytics', 'Trends'],
    permissions: 'read-only',
    valueProp: 'Import your TikTok videos & analytics',
    includes: ['Videos', 'Analytics', 'Trends'],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    syncs: ['Tweets', 'DMs', 'Analytics'],
    permissions: 'read-write',
    valueProp: 'Share updates and engage with fans',
    includes: ['Tweets', 'DMs', 'Analytics'],
  },
  {
    id: 'fansly',
    name: 'Fansly',
    icon: '💙',
    syncs: ['Messages', 'Subscribers', 'Revenue'],
    permissions: 'read-write',
    valueProp: 'Manage Fansly alongside OnlyFans',
    includes: ['Messages', 'Subscribers', 'Revenue'],
  },
];

const providerLabels: Record<string, string> = {
  onlyfans: 'OnlyFans',
  instagram: 'Instagram',
  reddit: 'Reddit',
  tiktok: 'TikTok',
  twitter: 'X (Twitter)',
  fansly: 'Fansly',
};

const formatRelativeTime = (value?: Date): string => {
  if (!value) return '—';
  const diff = Date.now() - value.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getAccountLabel = (
  account?: { providerAccountId: string; metadata?: Record<string, any> },
  count = 0,
) => {
  if (!account) return undefined;
  const username =
    account.metadata?.username ||
    account.metadata?.handle ||
    account.providerAccountId;
  const suffix = count > 1 ? ` +${count - 1}` : '';
  return `${username}${suffix}`;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'connected':
      return { label: 'Connected', color: '#008060', bg: '#D1FAE5' };
    case 'needs_attention':
      return { label: 'Needs attention', color: '#92400E', bg: '#FEF3C7' };
    default:
      return { label: 'Not connected', color: '#6B7280', bg: '#F3F4F6' };
  }
};

// Polaris Card Component
const PCard = ({ children, title, subtitle, noPadding, headerAction }: { 
  children: React.ReactNode; 
  title?: string; 
  subtitle?: string;
  noPadding?: boolean;
  headerAction?: React.ReactNode;
}) => (
  <div className="p-card">
    {title && (
      <div className="p-card-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <h3 className="p-card-title">{title}</h3>
          {subtitle && <p className="p-card-subtitle">{subtitle}</p>}
        </div>
        {headerAction}
      </div>
    )}
    <div className={noPadding ? "p-card-body no-padding" : "p-card-body"}>
      {children}
    </div>
  </div>
);

export default function IntegrationsPage() {
  const { integrations, loading, error, connect, disconnect, reconnect, refresh } = useIntegrations();
  const [now] = useState(() => Date.now());

  const platforms = useMemo<PlatformView[]>(() => {
    return PLATFORM_CONFIGS.map((config) => {
      const providerAccounts = integrations.filter((integration) => integration.provider === config.id);
      const connectedAccounts = providerAccounts.filter((account) => account.isConnected);
      const primaryAccount = connectedAccounts[0] || providerAccounts[0];
      const hasAccounts = providerAccounts.length > 0;
      const status: PlatformStatus = connectedAccounts.length > 0
        ? 'connected'
        : hasAccounts
          ? 'needs_attention'
          : 'disconnected';

      const expiresAt = primaryAccount?.expiresAt;
      const isExpired = expiresAt ? expiresAt.getTime() < now : false;
      const lastSync = formatRelativeTime(primaryAccount?.updatedAt);

      return {
        ...config,
        status,
        account: getAccountLabel(primaryAccount, providerAccounts.length),
        lastSync: status === 'connected' ? lastSync : undefined,
        nextSync: status === 'connected' ? '—' : undefined,
        errorReason: status === 'needs_attention' ? (isExpired ? 'Token expired' : 'Sync paused') : undefined,
        pausedSyncs: status === 'needs_attention' ? config.syncs : undefined,
        lastSuccessfulSync: status === 'needs_attention' ? lastSync : undefined,
        accountId: primaryAccount?.providerAccountId,
      };
    });
  }, [integrations, now]);

  const connectedCount = platforms.filter((platform) => platform.status === 'connected').length;
  const needsAttention = platforms.filter((platform) => platform.status === 'needs_attention').length;
  const isRefreshing = loading && integrations.length > 0;

  const handleConnect = async (provider: string) => {
    await connect(provider);
  };

  const handleReconnect = async (provider: string, accountId?: string) => {
    await reconnect(provider, accountId || '');
  };

  const handleDisconnect = async (provider: string, accountId?: string) => {
    if (!accountId) return;
    if (!confirm('Disconnect this integration?')) return;
    await disconnect(provider, accountId);
  };

  if (loading && integrations.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Integrations">
        <div className="polaris-analytics">
          <div className="content-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <DashboardLoadingState message="Loading integrations..." />
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (error && integrations.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Integrations">
        <div className="polaris-analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DashboardErrorState message={error} onRetry={() => void refresh()} />
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Integrations">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plug size={22} />
            Integrations
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="filter-pill" onClick={() => void refresh()}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link href="#security" style={{ textDecoration: 'none' }}>
              <button className="filter-pill">
                <Shield size={14} />
                Security
              </button>
            </Link>
          </div>
        </div>

        <div className="content-wrapper">
          {/* Butler Tip */}
          <ButlerTip page="Integrations" className="mb-4" />
          {error && (
            <div style={{ marginBottom: 16 }}>
              <DashboardErrorState message={error} onRetry={() => void refresh()} />
            </div>
          )}

          {/* Status Overview */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <CheckCircle size={14} style={{ color: '#008060' }} />
                  Connected
                </div>
                <div className="kpi-value">{connectedCount}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <AlertTriangle size={14} style={{ color: needsAttention > 0 ? '#92400E' : '#6B7280' }} />
                  Needs attention
                </div>
                <div className="kpi-value" style={{ color: needsAttention > 0 ? '#92400E' : undefined }}>
                  {needsAttention}
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">Available</div>
                <div className="kpi-value">{platforms.length}</div>
              </div>
            </div>
          </div>

          {/* Platforms List */}
          <PCard title="Your Platforms" noPadding>
            <div className="breakdown-list">
              {platforms.map((platform) => {
                const statusConfig = getStatusConfig(platform.status);
                
                return (
                  <div key={platform.id} className="integration-card">
                    {/* Header: Icon + Name + Status */}
                    <div className="integration-card-header">
                      <div className="integration-card-icon">{platform.icon}</div>
                      <div className="integration-card-title">
                        <span className="integration-card-name">{platform.name}</span>
                        <span 
                          className="integration-card-status"
                          style={{ color: statusConfig.color, background: statusConfig.bg }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Content based on status */}
                    <div className="integration-card-content">
                      {platform.status === 'connected' && (
                        <>
                          <div className="integration-card-account">
                            Account: {platform.account || '—'}
                          </div>
                          <div className="integration-card-sync-info">
                            <span><Clock size={12} /> Last sync: {platform.lastSync}</span>
                            <span>Next: {platform.nextSync}</span>
                          </div>
                          <div className="integration-card-scope">
                            <span className="scope-label">Syncs:</span>
                            {platform.syncs?.map((s) => (
                              <span key={s} className="scope-tag">{s}</span>
                            ))}
                            {platform.permissions === 'read-only' && (
                              <span className="scope-tag scope-tag--muted">Read-only</span>
                            )}
                          </div>
                        </>
                      )}

                      {platform.status === 'needs_attention' && (
                        <>
                          <div className="integration-card-warning">
                            <AlertTriangle size={14} />
                            <span>{platform.errorReason} — sync paused</span>
                          </div>
                          <div className="integration-card-scope">
                            <span className="scope-label">Paused:</span>
                            {platform.pausedSyncs?.map((s) => (
                              <span key={s} className="scope-tag scope-tag--warning">{s}</span>
                            ))}
                          </div>
                          <div className="integration-card-meta">
                            Last successful sync: {platform.lastSuccessfulSync}
                          </div>
                        </>
                      )}

                      {platform.status === 'disconnected' && (
                        <>
                          <div className="integration-card-value-prop">
                            {platform.valueProp}
                          </div>
                          <div className="integration-card-scope">
                            <span className="scope-label">Includes:</span>
                            {platform.includes?.map((s) => (
                              <span key={s} className="scope-tag">{s}</span>
                            ))}
                            {platform.permissions === 'read-only' && (
                              <span className="scope-tag scope-tag--muted">Read-only</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="integration-card-actions">
                      {platform.status === 'connected' && (
                        <>
                          <Link
                            href={platform.id === 'onlyfans' ? '/onlyfans/settings' : '/integrations'}
                            style={{ textDecoration: 'none' }}
                          >
                            <button className="filter-pill">
                              <Settings size={14} /> Manage
                            </button>
                          </Link>
                          <button
                            className="filter-pill"
                            onClick={() => void handleDisconnect(platform.id, platform.accountId)}
                          >
                            Disconnect
                          </button>
                        </>
                      )}
                      {platform.status === 'needs_attention' && (
                        <>
                          <button
                            className="filter-pill cta-button"
                            onClick={() => void handleReconnect(platform.id, platform.accountId)}
                          >
                            Reconnect {platform.name}
                          </button>
                          <button className="filter-pill">
                            <HelpCircle size={14} /> Why?
                          </button>
                        </>
                      )}
                      {platform.status === 'disconnected' && (
                        <>
                          <button
                            className="filter-pill cta-button"
                            onClick={() => void handleConnect(platform.id)}
                          >
                            Connect {platform.name}
                          </button>
                          <button className="filter-pill">
                            <ExternalLink size={12} /> Permissions
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </PCard>

          {/* Recent Activity */}
          <PCard 
            title="Recent Activity" 
            noPadding
            headerAction={
              <button className="filter-pill" style={{ fontSize: 12 }}>View logs</button>
            }
          >
            <div className="breakdown-list">
              {integrations.length === 0 ? (
                <div style={{ padding: 16 }}>
                  <EmptyState
                    size="sm"
                    title="No recent activity"
                    description="Connect a platform to see sync events."
                  />
                </div>
              ) : (
                [...integrations]
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .slice(0, 3)
                  .map((integration) => {
                    const providerLabel = providerLabels[integration.provider] || integration.provider;
                    const isConnected = integration.isConnected;
                    const activity = {
                      icon: isConnected ? CheckCircle : AlertTriangle,
                      color: isConnected ? '#008060' : '#92400E',
                      text: isConnected
                        ? `${providerLabel} connected`
                        : `${providerLabel} needs attention`,
                      detail: isConnected ? integration.metadata?.username : 'Token expired',
                      time: formatRelativeTime(integration.updatedAt),
                      action: !isConnected ? 'Reconnect' : undefined,
                    };
                    return (
                      <div key={`${integration.provider}-${integration.providerAccountId}`} className="activity-item">
                        <div className="activity-item-icon" style={{ background: `${activity.color}15` }}>
                          <activity.icon size={16} style={{ color: activity.color }} />
                        </div>
                        <div className="activity-item-content">
                          <div className="activity-item-text">
                            {activity.text}
                            {activity.detail && (
                              <span className="activity-item-detail"> — {activity.detail}</span>
                            )}
                          </div>
                          <div className="activity-item-time">{activity.time}</div>
                        </div>
                        {activity.action && (
                          <button
                            className="filter-pill"
                            onClick={() => void handleReconnect(integration.provider, integration.providerAccountId)}
                          >
                            {activity.action}
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </PCard>

          {/* Security Section */}
          <div id="security">
            <PCard title="Security & Privacy" subtitle="How we protect your data">
              <div className="security-grid">
                <div className="security-item">
                  <div className="security-item-title">OAuth 2.0</div>
                  <p className="security-item-desc">
                    Secure sign-in. We never see your password. You can revoke access anytime from the platform.
                  </p>
                </div>
                <div className="security-item">
                  <div className="security-item-title">Auto-Refresh</div>
                  <p className="security-item-desc">
                    When supported, tokens refresh automatically before they expire.
                  </p>
                </div>
                <div className="security-item">
                  <div className="security-item-title">Disconnect Anytime</div>
                  <p className="security-item-desc">
                    Disconnect instantly. We delete stored access tokens and stop syncing.
                  </p>
                </div>
              </div>
            </PCard>
          </div>

          {/* Automation CTA */}
          <div className="p-card">
            <div className="p-card-body cta-card-body">
              <div className="cta-card-content">
                <div className="cta-card-icon">
                  <Zap size={24} style={{ color: '#616161' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#303030', marginBottom: 4 }}>
                    Automate your integrations
                  </div>
                  <p style={{ fontSize: 13, color: '#616161', margin: 0 }}>
                    Create workflows that trigger when platforms sync or tokens expire.
                  </p>
                </div>
              </div>
              <Link href="/automations">
                <button className="filter-pill cta-button">
                  Set up automations
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
