'use client';

/**
 * Automations Page - Polaris Design
 */

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import useSWR from 'swr';
import type { z } from 'zod';
import { ButlerTip } from '@/components/ui/ButlerTip';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import {
  automationsCompareResponseSchema,
  automationsListResponseSchema,
  automationFlowSchema,
  automationStepSchema,
} from '@/lib/schemas/api-responses';
import {
  Zap,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

type AutomationsApiResponse = z.infer<typeof automationsListResponseSchema>;
type AutomationFlowDto = z.infer<typeof automationFlowSchema>;
type AutomationStatus = AutomationFlowDto['status'];
type AutomationStep = z.infer<typeof automationStepSchema>;

type AutomationsCompareResponse = z.infer<typeof automationsCompareResponseSchema>;
type AutomationComparison = AutomationsCompareResponse['comparisons'][number];

type UiAutomation = {
  id: string;
  name: string;
  trigger: string;
  status: AutomationStatus;
  executions: number;
  successRate: number;
  lastRun: string;
};

function titleCase(value: string): string {
  return value
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function humanizeTriggerName(raw: string): string {
  const map: Record<string, string> = {
    new_subscriber: 'New Subscriber',
    message_received: 'Message Received',
    purchase_completed: 'Purchase Completed',
    subscription_expiring: 'Subscription Expiring',
  };
  return map[raw] || titleCase(raw);
}

function extractTrigger(steps?: AutomationStep[]): string {
  const trigger = steps?.find((s) => s.type === 'trigger');
  return trigger?.name ? humanizeTriggerName(trigger.name) : '—';
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

export default function AutomationsPage() {
  const { data: flowsResponse, error: flowsError, isLoading: flowsLoading, mutate } = useSWR<AutomationsApiResponse>(
    '/api/automations',
    (url: string) =>
      internalApiFetch<AutomationsApiResponse>(url, {
        schema: automationsListResponseSchema,
      })
  );

  const { data: compareResponse } = useSWR<AutomationsCompareResponse>(
    '/api/automations/analytics?type=compare',
    (url: string) =>
      internalApiFetch<AutomationsCompareResponse>(url, {
        schema: automationsCompareResponseSchema,
      })
  );

  const flows = flowsResponse?.data ?? [];
  const comparisons = compareResponse?.comparisons ?? [];
  const metricsById = new Map(comparisons.map((c) => [c.automationId, c.metrics]));

  const automations: UiAutomation[] = flows.map((flow) => {
    const metrics = metricsById.get(flow.id);
    const executions = metrics?.totalExecutions ?? 0;
    const successRate = metrics?.successRate ?? 0;

    return {
      id: flow.id,
      name: flow.name,
      trigger: extractTrigger(flow.steps),
      status: flow.status,
      executions,
      successRate,
      lastRun: executions > 0 ? '—' : 'Never',
    };
  });

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === 'active').length,
    totalRuns: automations.reduce((sum, a) => sum + a.executions, 0),
    avgSuccess: automations.filter(a => a.successRate > 0).length > 0
      ? automations.reduce((sum, a) => sum + a.successRate, 0) / automations.filter(a => a.successRate > 0).length
      : 0,
  };

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: '#D1FAE5', text: '#008060', dot: '#22C55E' },
    paused: { bg: '#F3F4F6', text: '#616161', dot: '#9CA3AF' },
    draft: { bg: '#F3F4F6', text: '#616161', dot: '#9CA3AF' },
  };

  if (flowsLoading && automations.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Automations">
        <div className="polaris-analytics">
          <div className="content-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <DashboardLoadingState message="Loading automations..." />
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (flowsError && automations.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Automations">
        <div className="polaris-analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DashboardErrorState
            message={flowsError instanceof Error ? flowsError.message : 'Failed to load automations'}
            onRetry={() => void mutate()}
          />
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (!flowsLoading && !flowsError && automations.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Automations">
        <div className="polaris-analytics">
          <div className="content-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <EmptyState
              variant="no-data"
              title="No automations yet"
              description="Create your first automation to start saving time."
              action={{ label: 'Create automation', onClick: () => (window.location.href = '/automations/new') }}
            />
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Automations">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={22} />
            Automations
          </h1>
          <Link href="/automations/new" style={{ textDecoration: 'none' }}>
            <button className="filter-pill cta-button">
              <Plus size={14} />
              Create automation
            </button>
          </Link>
        </div>

        <div className="content-wrapper">
          {/* Butler Tip */}
          <ButlerTip page="Automations" className="mb-4" />

          {/* KPI Row */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <Zap size={14} style={{ color: '#616161' }} />
                  Total
                </div>
                <div className="kpi-value">{stats.total}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <CheckCircle size={14} style={{ color: '#008060' }} />
                  Active
                </div>
                <div className="kpi-value" style={{ color: '#008060' }}>{stats.active}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <Clock size={14} style={{ color: '#616161' }} />
                  Executions
                </div>
                <div className="kpi-value">{stats.totalRuns.toLocaleString()}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-label">
                  <TrendingUp size={14} style={{ color: '#616161' }} />
                  Success Rate
                </div>
                <div className="kpi-value">{stats.avgSuccess.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Automations List */}
          <PCard title="Your Automations" noPadding>
            {automations.length === 0 ? (
              <div className="empty-state">
                <Zap size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#303030', margin: '0 0 6px 0' }}>No automations yet</h3>
                <p className="empty-state-text" style={{ marginBottom: 16 }}>Create your first workflow</p>
                <Link href="/automations/new">
                  <button className="filter-pill cta-button">
                    <Plus size={14} /> Create Automation
                  </button>
                </Link>
              </div>
            ) : (
              <div className="breakdown-list">
                {automations.map((automation) => {
                  const colors = statusConfig[automation.status];
                  return (
                    <div
                      key={automation.id}
                      className="automation-item"
                      onClick={() => window.location.href = `/automations/${automation.id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="automation-item-header">
                        <div className="automation-item-info">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
                          <span className="automation-item-name">{automation.name}</span>
                          <span 
                            className="automation-item-status"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {automation.status}
                          </span>
                        </div>
                        <div className="automation-item-actions">
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="filter-pill"
                            title={automation.status === 'active' ? 'Pause' : 'Activate'}
                          >
                            {automation.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="filter-pill"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="automation-item-desc">Trigger: {automation.trigger}</p>
                      <div className="automation-item-stats">
                        <span>{automation.executions.toLocaleString()} runs</span>
                        <span>{automation.successRate > 0 ? `${automation.successRate}% success` : '—'}</span>
                        <span>Last: {automation.lastRun}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PCard>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
