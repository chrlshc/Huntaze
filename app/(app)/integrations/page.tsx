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
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ButlerTip } from '@/components/ui/ButlerTip';
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

// Platform configurations with improved data structure
const platforms = [
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    icon: '🔥',
    status: 'connected' as const,
    account: '@creator_name',
    lastSync: '2 min ago',
    nextSync: 'in 28 min',
    syncs: ['Messages', 'Fans', 'Revenue', 'PPV'],
    permissions: 'read-write',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    status: 'connected' as const,
    account: '@your_instagram',
    lastSync: '15 min ago',
    nextSync: 'in 45 min',
    syncs: ['Posts', 'Stories', 'Analytics'],
    permissions: 'read-only',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    status: 'needs_attention' as const,
    account: 'u/your_reddit',
    lastSuccessfulSync: '3 days ago',
    pausedSyncs: ['Posts', 'Comments', 'Karma'],
    errorReason: 'Token expired',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    status: 'disconnected' as const,
    valueProp: 'Import your TikTok videos & analytics',
    includes: ['Videos', 'Analytics', 'Trends'],
    permissions: 'read-only',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    status: 'disconnected' as const,
    valueProp: 'Share updates and engage with fans',
    includes: ['Tweets', 'DMs', 'Analytics'],
    permissions: 'read-write',
  },
  {
    id: 'fansly',
    name: 'Fansly',
    icon: '💙',
    status: 'disconnected' as const,
    valueProp: 'Manage Fansly alongside OnlyFans',
    includes: ['Messages', 'Subscribers', 'Revenue'],
    permissions: 'read-write',
  },
];

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
  const connectedCount = platforms.filter(p => p.status === 'connected').length;
  const needsAttention = platforms.filter(p => p.status === 'needs_attention').length;

  return (
    <ContentPageErrorBoundary pageName="Integrations">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plug size={22} />
            Integrations
          </h1>
          <Link href="#security" style={{ textDecoration: 'none' }}>
            <button className="filter-pill">
              <Shield size={14} />
              Security
            </button>
          </Link>
        </div>

        <div className="content-wrapper">
          {/* Butler Tip */}
          <ButlerTip page="Integrations" className="mb-4" />

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
                            Account: {platform.account}
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
                        <button className="filter-pill">
                          <Settings size={14} /> Manage
                        </button>
                      )}
                      {platform.status === 'needs_attention' && (
                        <>
                          <button className="filter-pill cta-button">
                            Reconnect {platform.name}
                          </button>
                          <button className="filter-pill">
                            <HelpCircle size={14} /> Why?
                          </button>
                        </>
                      )}
                      {platform.status === 'disconnected' && (
                        <>
                          <button className="filter-pill cta-button">
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
              {[
                { 
                  icon: CheckCircle, 
                  color: '#008060', 
                  text: 'Instagram synced successfully', 
                  detail: 'Posts + Stories',
                  time: '15 min ago' 
                },
                { 
                  icon: RefreshCw, 
                  color: '#6B7280', 
                  text: 'OnlyFans token refreshed automatically', 
                  time: '2 hours ago' 
                },
                { 
                  icon: AlertTriangle, 
                  color: '#92400E', 
                  text: 'Reddit token expired', 
                  detail: 'Sync paused',
                  time: '3 days ago', 
                  action: 'Reconnect' 
                },
              ].map((activity, i) => (
                <div key={i} className="activity-item">
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
                    <button className="filter-pill">{activity.action}</button>
                  )}
                </div>
              ))}
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
