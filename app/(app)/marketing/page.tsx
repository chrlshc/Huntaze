'use client';

/**
 * Marketing Overview Page - Polaris Design
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import '@/styles/polaris-analytics.css';
import '@/styles/marketing-mobile.css';
import { ButlerTip } from '@/components/ui/ButlerTip';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { 
  Megaphone, 
  RefreshCw, 
  Send, 
  Clock, 
  AlertCircle,
  RotateCcw,
  Calendar,
  Target,
  Share2,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Plus
} from 'lucide-react';

function formatDateTime(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatPlatformName(name: string): string {
  const lower = name.toLowerCase();
  if (lower === 'tiktok') return 'TikTok';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

interface QueueItem {
  id: string;
  title: string;
  scheduledAt?: string;
  platforms: string[];
  status: 'scheduled' | 'uploading' | 'processing' | 'posted' | 'failed';
}

interface Automation {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

interface WarRoomAutomation {
  enabled: boolean;
  label: string;
  description: string;
  compliance?: string;
}

interface WarRoomHealthCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface WarRoomHealth {
  status: 'secure' | 'warning' | 'risk' | 'unknown';
  label: string;
  details: string;
  checks: WarRoomHealthCheck[];
}

interface WarRoomState {
  queue: QueueItem[];
  automations: Record<string, WarRoomAutomation>;
  health: WarRoomHealth;
}

interface AccountHealth {
  platform: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  icon: string;
}

type Platform = 'all' | 'tt' | 'ig' | 'rd';

const automationIconMap: Record<string, React.ReactNode> = {
  auto_retry: <RotateCcw size={16} />,
  smart_schedule: <Clock size={16} />,
  cross_post: <Share2 size={16} />,
  instagram_welcome_dm: <Send size={16} />,
  tiktok_warmup: <TrendingUp size={16} />,
  auto_reposter: <Share2 size={16} />,
};

const healthIconMap: Record<string, string> = {
  tokens: '🔑',
  rate: '⚡',
  errors: '🚨',
  cadence: '⏱️',
};

const mapAutomations = (input?: Record<string, WarRoomAutomation>) => {
  if (!input) return [];
  return Object.entries(input).map(([id, automation]) => ({
    id,
    label: automation.label,
    description: automation.description,
    enabled: automation.enabled,
    icon: automationIconMap[id] ?? <Zap size={16} />,
  }));
};

const mapHealthChecks = (input?: WarRoomHealth) => {
  if (!input?.checks?.length) return [];
  return input.checks.map((check) => ({
    platform: check.label,
    status: check.ok ? 'ok' : input.status === 'risk' ? 'error' : 'warning',
    message: check.detail,
    icon: healthIconMap[check.key] ?? '🔌',
  }));
};

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

export default function MarketingPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [platform, setPlatform] = useState<Platform>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [automationBusyId, setAutomationBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [health, setHealth] = useState<AccountHealth[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredQueue = useMemo(() => {
    if (platform === 'all') return queue;
    const platformMap: Record<string, string> = { tt: 'tiktok', ig: 'instagram', rd: 'reddit' };
    return queue.filter((item) => 
      item.platforms.some(p => p.toLowerCase().includes(platformMap[platform] || platform))
    );
  }, [queue, platform]);

  const selectedCount = selectedIds.size;

  const stats = useMemo(() => {
    const c = { failed: 0, processing: 0, scheduled: 0, posted: 0 };
    for (const q of queue) {
      const s = (q.status || '').toLowerCase() as keyof typeof c;
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [queue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await internalApiFetch<WarRoomState>('/api/marketing-war-room/state');
      setQueue(data.queue ?? []);
      setAutomations(mapAutomations(data.automations));
      setHealth(mapHealthChecks(data.health));
    } catch {
      setError('Could not load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAction = useCallback(
    async (action: 'post_now' | 'schedule' | 'cancel' | 'retry_failed') => {
      if (selectedIds.size === 0) return;
      setBusy(true);
      try {
        const res = await fetch('/api/warroom/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ids: Array.from(selectedIds), platform }),
        });
        if (!res.ok) throw new Error('Action failed');
        await fetchData();
        setSelectedIds(new Set());
      } catch {
        setError('Action failed');
      } finally {
        setBusy(false);
      }
    },
    [selectedIds, platform, fetchData],
  );

  const toggleAutomation = useCallback(async (id: string) => {
    const current = automations.find((item) => item.id === id);
    if (!current) return;

    const nextEnabled = !current.enabled;
    setAutomationBusyId(id);
    setError(null);

    try {
      const response = await internalApiFetch<{ automations?: Record<string, WarRoomAutomation> }>(
        `/api/marketing-war-room/automations/${id}`,
        {
          method: 'POST',
          body: { enabled: nextEnabled },
        }
      );

      if (response?.automations) {
        setAutomations(mapAutomations(response.automations));
      } else {
        setAutomations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item))
        );
      }
    } catch {
      setError('Failed to update automation');
    } finally {
      setAutomationBusyId(null);
    }
  }, [automations]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    posted: { bg: '#DCFCE7', text: '#166534' },
    processing: { bg: '#DBEAFE', text: '#1E40AF' },
    uploading: { bg: '#DBEAFE', text: '#1E40AF' },
    scheduled: { bg: '#DBEAFE', text: '#1E40AF' },
    failed: { bg: '#FEE2E2', text: '#991B1B' },
  };

  const healthColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    ok: { bg: '#DCFCE7', text: '#166534', icon: <CheckCircle2 size={14} /> },
    warning: { bg: '#FEF3C7', text: '#92400E', icon: <AlertTriangle size={14} /> },
    error: { bg: '#FEE2E2', text: '#991B1B', icon: <AlertCircle size={14} /> },
  };

  const quickNav = [
    { href: '/marketing/calendar', icon: <Calendar size={20} />, label: 'Calendar', desc: 'Plan content', color: '#6366F1' },
    { href: '/marketing/campaigns', icon: <Target size={20} />, label: 'Campaigns', desc: 'Manage campaigns', color: '#EC4899' },
    { href: '/automations', icon: <Zap size={20} />, label: 'Automations', desc: 'Manage flows', color: '#F59E0B' },
  ];

  return (
    <ContentPageErrorBoundary pageName="Marketing">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={22} />
            Marketing
          </h1>
          <Link href="/content" style={{ textDecoration: 'none' }}>
            <button className="filter-pill cta-button">
              <Plus size={14} />
              Content Factory
            </button>
          </Link>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ 
              padding: '12px 16px', background: '#FEE2E2', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} color="#991B1B" />
                <span style={{ color: '#991B1B', fontSize: 13, fontWeight: 500 }}>{error}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: '#991B1B', fontSize: 12, fontWeight: 600, textDecoration: 'underline' }}
                >
                  Retry
                </button>
                <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}>✕</button>
              </div>
            </div>
          </div>
        )}

        <div className="content-wrapper">
          {/* Quick Navigation */}
          <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {quickNav.map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div className="p-card" style={{ padding: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                      background: `${item.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: item.color
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#303030' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#616161' }}>{item.desc}</div>
                    </div>
                    <ArrowRight size={16} color="#9CA3AF" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* This Week Stats */}
          <div className="p-card" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            border: 'none', color: '#fff'
          }}>
            <div className="p-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TrendingUp size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>This Week</span>
              </div>
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.scheduled}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Posts scheduled</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.posted}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Posts published</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>—</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Total reach</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>—</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Engagement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Queue */}
          <PCard title="Content Queue" noPadding headerAction={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              {stats.failed > 0 && (
                <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B', fontWeight: 500 }}>
                  {stats.failed} failed
                </span>
              )}
              <button onClick={fetchData} disabled={loading || busy} className="filter-pill" style={{ marginLeft: 'auto' }}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          }>
            {/* Platform Filter */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E3E3E3', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div className="filter-pills">
                  {(['all', 'tt', 'ig', 'rd'] as Platform[]).map(p => (
                    <button
                      key={p}
                      className={`filter-pill ${platform === p ? 'active' : ''}`}
                      onClick={() => setPlatform(p)}
                    >
                      {p === 'all' ? 'All' : p === 'tt' ? 'TikTok' : p === 'ig' ? 'Instagram' : 'Reddit'}
                    </button>
                  ))}
                </div>
                {selectedCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#616161' }}>{selectedCount} selected</span>
                    <button onClick={() => runAction('post_now')} disabled={busy} className="filter-pill cta-button">
                      <Send size={12} /> Post now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <RefreshCw size={24} className="animate-spin" color="#9CA3AF" style={{ marginBottom: 12 }} />
                <p className="empty-state-text">Loading queue…</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="empty-state">
                <Megaphone size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#303030', margin: '0 0 6px 0' }}>No content in queue</h3>
                <p className="empty-state-text" style={{ marginBottom: 16 }}>Create content to start scheduling</p>
                <Link href="/content">
                  <button className="filter-pill cta-button">
                    <Plus size={14} /> Create Content
                  </button>
                </Link>
              </div>
            ) : (
              <div className="breakdown-list">
                {filteredQueue.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className="breakdown-item"
                    style={{ 
                      background: selectedIds.has(item.id) ? '#F0F9FF' : item.status === 'failed' ? '#FEF2F2' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 16, height: 16, accentColor: '#303030', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#303030', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.id}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {item.platforms.map(p => (
                          <span key={p} className="scope-tag">
                            {formatPlatformName(p)}
                          </span>
                        ))}
                      </div>
                      <span style={{ 
                        fontSize: 11, padding: '4px 8px', borderRadius: 6, fontWeight: 500,
                        background: statusColors[item.status]?.bg || '#F3F4F6',
                        color: statusColors[item.status]?.text || '#374151'
                      }}>
                        {item.status}
                      </span>
                      <span style={{ fontSize: 12, color: '#616161', minWidth: 80 }}>
                        {formatDateTime(item.scheduledAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PCard>

          {/* Butler Tip */}
          <ButlerTip page="Marketing" className="mb-6" />

          {/* Account Health */}
          <PCard title="Account Health" noPadding headerAction={
            <Link href="/integrations" style={{ textDecoration: 'none' }}>
              <button className="filter-pill">
                Manage <ArrowRight size={12} />
              </button>
            </Link>
          }>
            {health.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#303030', margin: '0 0 6px 0' }}>No health data available</h3>
                <p className="empty-state-text" style={{ marginBottom: 16 }}>Connect your platforms to see account status.</p>
                <Link href="/integrations">
                  <button className="filter-pill cta-button">
                    Manage integrations <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            ) : (
              <div className="breakdown-list">
                {health.map((h) => (
                  <div key={h.platform} className="breakdown-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{h.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>{h.platform}</div>
                        <div style={{ fontSize: 11, color: '#616161' }}>{h.message}</div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 8px', borderRadius: 6,
                      background: healthColors[h.status].bg,
                      color: healthColors[h.status].text
                    }}>
                      {healthColors[h.status].icon}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PCard>

          {/* Automations */}
          <PCard title="Automations" noPadding>
            <div className="breakdown-list">
              {automations.map((auto) => (
                <div key={auto.id} className="breakdown-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                      background: auto.enabled ? '#DCFCE7' : '#F3F4F6',
                      color: auto.enabled ? '#166534' : '#6B7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {auto.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>{auto.label}</div>
                      <div style={{ fontSize: 11, color: '#616161' }}>{auto.description}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={auto.enabled}
                    onClick={() => toggleAutomation(auto.id)}
                    disabled={automationBusyId === auto.id}
                    style={{ 
                      position: 'relative',
                      width: 40, height: 22, minHeight: 22,
                      padding: 0, borderRadius: 11, border: 'none',
                      background: auto.enabled ? '#303030' : '#E5E7EB',
                      cursor: automationBusyId === auto.id ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2,
                      left: auto.enabled ? 20 : 2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s ease'
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </PCard>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
