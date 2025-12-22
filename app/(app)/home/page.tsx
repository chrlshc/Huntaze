'use client';

/**
 * Home Dashboard Page - Action-Oriented Design
 * Clean, minimal Huntaze style
 */

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import './home.css';
import { ButlerTip } from '@/components/ui/ButlerTip';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboard, type ActivityItem as DashboardActivity, type DashboardData } from '@/hooks/useDashboard';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { AutomationFlow } from '@/lib/automations/types';

// Force cache bust - v2 subtle professional style
import {
  MessageSquare,
  Users,
  Zap,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Gift,
  Calendar,
  Send,
  Plug,
  Play,
  Pause,
  RefreshCw,
  Heart,
  Instagram,
  Twitter,
  ChevronRight,
} from 'lucide-react';

// Action Card - Compact version with urgency levels
const ActionCard = ({ 
  icon: Icon, 
  title, 
  count, 
  href, 
  actionLabel = 'View',
  primary = false,
  urgency = 'neutral' // 'hot' | 'warm' | 'neutral'
}: { 
  icon: typeof MessageSquare;
  title: string;
  count?: number;
  href: string;
  actionLabel?: string;
  primary?: boolean;
  urgency?: 'hot' | 'warm' | 'neutral';
}) => (
  <Link href={href} className={`hz-action-card ${primary ? 'hz-action-card-primary' : ''} hz-urgency-${urgency}`}>
    <div className="hz-action-card-icon">
      <Icon size={20} />
    </div>
    <div className="hz-action-card-body">
      <div className="hz-action-card-header">
        <span className="hz-action-card-title">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="hz-action-card-badge">{count}</span>
        )}
      </div>
    </div>
    <div className="hz-action-card-action">
      {actionLabel} <ArrowRight size={14} />
    </div>
  </Link>
);

// Alert Banner
const AlertBanner = ({ message, action }: { message: string; action?: { label: string; href: string } }) => (
  <div className="hz-alert">
    <div className="hz-alert-content">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
    {action && (
      <Link href={action.href} className="hz-alert-action">
        {action.label} <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

// AI Suggestion - Premium Insight Card
const AISuggestion = ({ title, impact, href }: { 
  title: string; impact: string; href: string;
}) => (
  <div className="hz-insight-card">
    <div className="hz-insight-content">
      <div className="hz-insight-icon">
        <Sparkles size={16} />
      </div>
      <div className="hz-insight-body">
        <span className="hz-insight-title">{title}</span>
        <div className="hz-insight-meta">
          <span className="hz-insight-label">Est. impact</span>
          <span className="hz-insight-impact">{impact}</span>
        </div>
      </div>
    </div>
    <Link href={href} className="hz-insight-action">
      Apply <ArrowRight size={12} />
    </Link>
  </div>
);

// Quick Link - Launcher style
const QuickLink = ({ href, icon: Icon, label, primary = false }: { 
  href: string; icon: typeof Send; label: string; primary?: boolean;
}) => (
  <Link href={href} className={`hz-launcher ${primary ? 'hz-launcher-primary' : ''}`}>
    <div className="hz-launcher-icon">
      <Icon size={16} />
    </div>
    <span className="hz-launcher-label">{label}</span>
  </Link>
);

// Automation Card - Compact
const AutomationCard = ({ name, status, executions, href }: { 
  name: string; status: 'active' | 'paused'; executions: number; href: string;
}) => (
  <Link href={href} className="hz-automation">
    <div className={`hz-automation-status ${status}`}>
      {status === 'active' ? <Play size={10} /> : <Pause size={10} />}
    </div>
    <span className="hz-automation-name">{name}</span>
    <span className="hz-automation-meta">{executions}</span>
    <ChevronRight size={14} className="hz-automation-arrow" />
  </Link>
);

// Integration Card - Compact
const IntegrationCard = ({ name, icon: Icon, status, href }: { 
  name: string; icon: typeof Instagram; status: 'connected' | 'disconnected'; href: string;
}) => (
  <Link href={href} className={`hz-integration ${status}`}>
    <div className="hz-integration-icon">
      <Icon size={18} />
    </div>
    <span className="hz-integration-name">{name}</span>
    <div className={`hz-integration-dot ${status}`} />
  </Link>
);

// Activity Filter Tab
const ActivityFilter = ({ 
  label, 
  active, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button 
    className={`hz-activity-filter ${active ? 'hz-activity-filter-active' : ''}`}
    onClick={onClick}
  >
    {label}
  </button>
);

const formatTimeAgo = (isoDate: string) => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type HomeActivityType = 'ppv' | 'sub' | 'tip' | 'message';

// Activity Item - Fintech style
const ActivityItem = ({ 
  icon: Icon, 
  label, 
  name, 
  amount, 
  time, 
  isNew = false,
  type
}: { 
  icon: typeof Gift; 
  label: string; 
  name?: string;
  amount?: string; 
  time: string;
  isNew?: boolean;
  type: HomeActivityType;
}) => (
  <div className={`hz-activity ${isNew ? 'hz-activity-new' : ''}`} data-type={type}>
    {isNew && <div className="hz-activity-dot" />}
    <div className="hz-activity-icon"><Icon size={14} /></div>
    <div className="hz-activity-body">
      <span className="hz-activity-label">{label}</span>
      {name && <span className="hz-activity-name">{name}</span>}
    </div>
    <div className="hz-activity-right">
      {amount && <span className="hz-activity-amount">{amount}</span>}
      <span className="hz-activity-time">{time}</span>
    </div>
  </div>
);

export default function HomePage() {
  const [activityFilter, setActivityFilter] = useState<'all' | 'ppv' | 'sub' | 'tip' | 'message'>('all');

  const {
    data: dashboardResponse,
    error: dashboardError,
    isLoading: dashboardLoading,
    mutate: mutateDashboard,
  } = useDashboard({ include: ['content', 'marketing', 'onlyfans'] });
  const dashboardData: DashboardData | undefined = dashboardResponse?.data;

  const {
    data: automationsResponse,
    mutate: mutateAutomations,
  } = useSWR<{ success: boolean; data?: AutomationFlow[] }>(
    '/api/automations',
    (url) => internalApiFetch<{ success: boolean; data?: AutomationFlow[] }>(url),
  );

  const {
    data: warRoomState,
    mutate: mutateWarRoom,
  } = useSWR<{ queue?: Array<{ id: string; status: string }> }>(
    '/api/marketing-war-room/state',
    (url) => internalApiFetch<{ queue?: Array<{ id: string; status: string }> }>(url),
  );

  const scheduledPosts = warRoomState?.queue?.filter((item) => item.status === 'scheduled').length ?? 0;

  const priorities = {
    unreadMessages: dashboardData?.summary?.messages?.unread ?? 0,
    pendingPPV: 0,
    fansToReengage: 0,
    scheduledPosts,
  };

  const aiSuggestions = useMemo(() => {
    const suggestions: Array<{ title: string; impact: string; href: string }> = [];
    if (priorities.unreadMessages > 0) {
      suggestions.push({
        title: 'Reply to unread messages',
        impact: 'Higher engagement',
        href: '/onlyfans/messages',
      });
    }
    if (priorities.scheduledPosts === 0) {
      suggestions.push({
        title: 'Schedule your next post',
        impact: 'Stay consistent',
        href: '/marketing/calendar',
      });
    }
    if (dashboardData?.summary?.activeFans?.value) {
      suggestions.push({
        title: 'Share a new teaser',
        impact: 'Boost activity',
        href: '/content',
      });
    }
    return suggestions.slice(0, 2);
  }, [dashboardData?.summary?.activeFans?.value, priorities.scheduledPosts, priorities.unreadMessages]);

  const automations = useMemo(() => {
    const flows = automationsResponse?.data ?? [];
    return flows.slice(0, 3).map((flow) => ({
      name: flow.name,
      status: flow.status === 'active' ? 'active' : 'paused',
      executions: flow.steps?.length ?? 0,
      href: `/automations/${flow.id}`,
    }));
  }, [automationsResponse]);

  const integrations = useMemo(() => {
    const connected = dashboardData?.connectedIntegrations;
    return [
      { name: 'OnlyFans', icon: Heart, status: connected?.onlyfans ? 'connected' : 'disconnected', href: '/integrations' },
      { name: 'Instagram', icon: Instagram, status: connected?.instagram ? 'connected' : 'disconnected', href: '/integrations' },
      { name: 'Twitter/X', icon: Twitter, status: 'disconnected', href: '/integrations' },
    ];
  }, [dashboardData?.connectedIntegrations]);

  const recentActivity = useMemo(() => {
    const entries = dashboardData?.recentActivity ?? [];
    return entries.map((activity) => {
      const typeMap: Record<DashboardActivity['type'], HomeActivityType> = {
        message_received: 'message',
        fan_subscribed: 'sub',
        content_published: 'ppv',
        campaign_sent: 'tip',
      };
      const iconMap: Record<DashboardActivity['type'], typeof Gift> = {
        message_received: MessageSquare,
        fan_subscribed: Users,
        content_published: Gift,
        campaign_sent: TrendingUp,
      };
      return {
        icon: iconMap[activity.type] ?? Gift,
        label: activity.title,
        name: activity.meta?.platform || activity.meta?.recipients || undefined,
        amount: activity.meta?.amount ? `$${activity.meta.amount}` : undefined,
        time: formatTimeAgo(activity.createdAt),
        isNew: false,
        type: typeMap[activity.type] ?? 'message',
      };
    });
  }, [dashboardData?.recentActivity]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Huntaze Design System - Harmonized tokens
  // Radius: 14px (cards), 8px (icons), 6px (pills)
  // Spacing: 8 / 12 / 16 / 24
  const criticalStyles = `
    /* DESIGN TOKENS */
    .hz-home {
      --hz-radius-card: 14px;
      --hz-radius-icon: 8px;
      --hz-radius-pill: 6px;
      --hz-space-xs: 8px;
      --hz-space-sm: 12px;
      --hz-space-md: 16px;
      --hz-space-lg: 24px;
      --hz-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
      --hz-shadow-hover: 0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06);
    }
    
    /* Cards - unified radius 14px */
    .hz-action-card, .hz-suggestion, .hz-automation, .hz-integration, .hz-activity-list, .hz-stat, .hz-alert, .hz-insight-card, .hz-launcher {
      background: #fff !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 14px !important;
      box-shadow: var(--hz-shadow-card) !important;
      transition: box-shadow 140ms ease, border-color 140ms ease !important;
    }
    
    
    /* ACTION CARDS - uniform height */
    .hz-action-card {
      min-height: 72px !important;
      padding: 16px !important;
      gap: 12px !important;
    }
    
    /* PRIMARY ACTION CARD */
    .hz-action-card-primary {
      background: linear-gradient(180deg, #1f1f1f, #111) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    }
    .hz-action-card-primary .hz-action-card-icon {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #fff !important;
    }
    .hz-action-card-primary .hz-action-card-title { color: #fff !important; }
    .hz-action-card-primary .hz-action-card-badge {
      background: #fff !important;
      color: #111 !important;
    }
    .hz-action-card-primary .hz-action-card-action { color: rgba(255, 255, 255, 0.7) !important; }
    
    /* URGENCY LEVELS */
    .hz-action-card.hz-urgency-warm:not(.hz-action-card-primary) { border-left: 3px solid #374151 !important; }
    .hz-action-card.hz-urgency-neutral:not(.hz-action-card-primary) { border-left: 3px solid transparent !important; }
    
    /* Icons - radius 8px */
    .hz-action-card-icon {
      width: 40px !important;
      height: 40px !important;
      border-radius: 8px !important;
      background: #f3f4f6 !important;
      color: #6b7280 !important;
    }
    .hz-insight-icon, .hz-integration-icon {
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
      background: #f3f4f6 !important;
      color: #6b7280 !important;
    }
    .hz-launcher-icon, .hz-activity-icon {
      width: 28px !important;
      height: 28px !important;
      border-radius: 8px !important;
      background: #f3f4f6 !important;
      color: #6b7280 !important;
    }
    .hz-automation-status {
      width: 20px !important;
      height: 20px !important;
      border-radius: 6px !important;
    }
    .hz-automation-status.active { background: #f3f4f6 !important; color: #374151 !important; }
    
    /* Badges/Pills - radius 6px */
    .hz-action-card-badge {
      font-family: 'SF Mono', ui-monospace, monospace !important;
      background: #111 !important;
      color: #fff !important;
      font-weight: 600 !important;
      padding: 2px 8px !important;
      border-radius: 6px !important;
    }
    .hz-insight-impact {
      font-family: 'SF Mono', ui-monospace, monospace !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      color: #111 !important;
      background: #f0f0f0 !important;
      border: 1px solid #e0e0e0 !important;
      padding: 2px 8px !important;
      border-radius: 6px !important;
    }
    .hz-insight-action {
      padding: 8px 12px !important;
      border-radius: 6px !important;
      background: #f9fafb !important;
      border: 1px solid #e5e7eb !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      color: #6b7280 !important;
    }
    .hz-activity-filter {
      padding: 4px 12px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      color: #6b7280 !important;
      background: transparent !important;
      border: 1px solid transparent !important;
    }
    .hz-activity-filter-active {
      background: #111 !important;
      color: #fff !important;
      border-color: #111 !important;
    }
    
    /* Typography - Monospace numbers */
    .hz-stat-value {
      font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace !important;
      font-size: 22px !important;
      font-weight: 600 !important;
      color: #111 !important;
      font-variant-numeric: tabular-nums !important;
    }
    .hz-stat-label { color: #6b7280 !important; font-size: 10px !important; font-weight: 500 !important; }
    .hz-stat-context { font-size: 10px !important; color: #9ca3af !important; font-weight: 500 !important; }
    .hz-automation-meta { font-family: 'SF Mono', ui-monospace, monospace !important; color: #9ca3af !important; }
    .hz-activity-amount {
      font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #111 !important;
      font-variant-numeric: tabular-nums !important;
      min-width: 60px !important;
      text-align: right !important;
    }
    
    /* LAUNCHER */
    .hz-launcher { padding: 12px !important; gap: 12px !important; }
    .hz-launcher-label { font-size: 13px !important; font-weight: 500 !important; color: #303030 !important; }
    .hz-launcher-primary {
      background: linear-gradient(180deg, #1f1f1f, #111) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    }
    .hz-launcher-primary .hz-launcher-icon { background: rgba(255, 255, 255, 0.1) !important; color: #fff !important; }
    .hz-launcher-primary .hz-launcher-label { color: #fff !important; }
    
    /* ACTIVITY */
    .hz-activity { padding: 12px 16px !important; gap: 12px !important; }
    .hz-activity-new { background: #fafafa !important; }
    .hz-activity-dot {
      position: absolute !important;
      left: 8px !important;
      width: 6px !important;
      height: 6px !important;
      border-radius: 50% !important;
      background: #111 !important;
    }
    .hz-activity-body { gap: 8px !important; }
    .hz-activity-right { gap: 12px !important; }
    .hz-activity-time { font-size: 12px !important; color: #9ca3af !important; min-width: 50px !important; text-align: right !important; }
    
    /* Misc */
    .hz-section-title svg { color: #9ca3af !important; }
    .hz-integration-dot.connected { background: #374151 !important; }
    .hz-alert { background: #fafafa !important; border-color: #e5e7eb !important; color: #374151 !important; }
    .hz-alert-content svg { color: #9ca3af !important; }
    .hz-alert-action { color: #111 !important; font-weight: 500 !important; }
  `;

  const handleRetry = () => Promise.all([mutateDashboard(), mutateAutomations(), mutateWarRoom()]);
  const hasRealData = dashboardData?.metadata?.hasRealData ?? false;

  if (dashboardLoading && !dashboardData) {
    return (
      <div className="hz-home">
        <style>{criticalStyles}</style>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <DashboardLoadingState message="Loading dashboard..." />
        </div>
      </div>
    );
  }

  if (dashboardError && !dashboardData) {
    return (
      <div className="hz-home">
        <style>{criticalStyles}</style>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <DashboardErrorState
            message={dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard'}
            onRetry={() => void handleRetry()}
          />
        </div>
      </div>
    );
  }

  if (!dashboardLoading && !dashboardError && dashboardData && !hasRealData) {
    return (
      <div className="hz-home">
        <style>{criticalStyles}</style>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <EmptyState
            variant="no-data"
            title="Connect your platforms"
            description="Link your creator platforms to unlock analytics, messages, and revenue insights."
            action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
            secondaryAction={{ label: 'Retry', onClick: () => void handleRetry(), icon: RefreshCw }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hz-home">
      <style>{criticalStyles}</style>

      {/* Hero */}
      <header className="hz-hero">
        <div className="hz-hero-left">
          <h1 className="hz-greeting">{getGreeting()} 👋</h1>
          <p className="hz-summary">
            <strong>{priorities.unreadMessages}</strong> messages waiting · <strong>{formatCurrency(dashboardData?.summary?.totalRevenue?.value ?? 0)}</strong> earned
          </p>
        </div>
      </header>

      {/* Alert */}
      {priorities.fansToReengage > 0 && (
        <AlertBanner 
          message={`${priorities.fansToReengage} fans haven't engaged in 7+ days`} 
          action={{ label: 'Re-engage', href: '/onlyfans/fans?filter=inactive' }} 
        />
      )}

      {/* Priority Actions */}
      <section className="hz-section">
        <h2 className="hz-section-title">Priority Actions</h2>
        <div className="hz-action-grid">
          <ActionCard icon={MessageSquare} title="Unread Messages" count={priorities.unreadMessages} href="/onlyfans/messages" actionLabel="Reply" primary urgency="hot" />
          <ActionCard icon={Gift} title="PPV Ready" count={priorities.pendingPPV} href="/onlyfans/ppv" actionLabel="Send" urgency="warm" />
          <ActionCard icon={Users} title="Fans to Re-engage" count={priorities.fansToReengage} href="/onlyfans/fans?filter=inactive" actionLabel="View" urgency="neutral" />
          <ActionCard icon={Calendar} title="Scheduled Posts" count={priorities.scheduledPosts} href="/marketing/calendar" actionLabel="Manage" urgency="neutral" />
        </div>
      </section>

      {/* Two Column */}
      <div className="hz-two-col">
        {/* AI Suggestions */}
        <section className="hz-section">
          <div className="hz-section-header">
            <h2 className="hz-section-title"><Sparkles size={16} /> AI Suggestions</h2>
          </div>
          <div className="hz-suggestions">
            {aiSuggestions.map((s, i) => <AISuggestion key={i} {...s} />)}
          </div>
        </section>

        {/* Quick Access */}
        <section className="hz-section">
          <h2 className="hz-section-title">Quick Access</h2>
          <div className="hz-quick-links">
            <QuickLink href="/onlyfans/ppv/create" icon={Send} label="New PPV" primary />
            <QuickLink href="/content/editor" icon={Calendar} label="Create Post" />
            <QuickLink href="/automations" icon={Zap} label="Automations" />
            <QuickLink href="/analytics" icon={TrendingUp} label="Analytics" />
            <QuickLink href="/onlyfans/fans" icon={Users} label="All Fans" />
            <QuickLink href="/offers/new" icon={Gift} label="New Offer" />
          </div>
        </section>
      </div>

      {/* Automations & Integrations */}
      <div className="hz-two-col">
        <section className="hz-section">
          <div className="hz-section-header">
            <h2 className="hz-section-title"><Zap size={16} /> Automations</h2>
          </div>
          <div className="hz-automations">
            {automations.map((a, i) => <AutomationCard key={i} {...a} />)}
          </div>
        </section>

        <section className="hz-section">
          <div className="hz-section-header">
            <h2 className="hz-section-title"><Plug size={16} /> Integrations</h2>
          </div>
          <div className="hz-integrations">
            {integrations.map((i, idx) => <IntegrationCard key={idx} {...i} />)}
          </div>
        </section>
      </div>

      {/* Butler Tip */}
      <ButlerTip page="Home" className="mb-6" />

      {/* Recent Activity - Fintech style */}
      <section className="hz-section">
        <div className="hz-section-header">
          <h2 className="hz-section-title">Recent Activity</h2>
          <div className="hz-activity-filters">
            <ActivityFilter label="All" active={activityFilter === 'all'} onClick={() => setActivityFilter('all')} />
            <ActivityFilter label="PPV" active={activityFilter === 'ppv'} onClick={() => setActivityFilter('ppv')} />
            <ActivityFilter label="Subs" active={activityFilter === 'sub'} onClick={() => setActivityFilter('sub')} />
            <ActivityFilter label="Tips" active={activityFilter === 'tip'} onClick={() => setActivityFilter('tip')} />
            <ActivityFilter label="Messages" active={activityFilter === 'message'} onClick={() => setActivityFilter('message')} />
          </div>
        </div>
        <div className="hz-activity-list">
          {recentActivity
            .filter(a => activityFilter === 'all' || a.type === activityFilter)
            .map((a, i) => <ActivityItem key={i} {...a} />)}
        </div>
      </section>
    </div>
  );
}
