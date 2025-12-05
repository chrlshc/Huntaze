'use client';

/**
 * Automations Overview Page
 * Requirements: 9.1, 9.2 - Automations Overview with status indicators and execution stats
 * Feature: dashboard-ux-overhaul
 * 
 * Main entry point for Automations features with:
 * - Active automations with status indicators
 * - Execution stats (total, success rate, etc.)
 * - Quick action buttons
 * - Navigation to sub-pages
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardSkeleton, MetricSkeleton } from '@/components/layout/LoadingSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AutomationFlow, AutomationStatus, ExecutionMetrics } from '@/lib/automations/types';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react';

// Status filter type
type StatusFilter = 'all' | AutomationStatus;

// Status badge colors and icons
const statusConfig: Record<AutomationStatus, { color: string; icon: React.ReactNode; label: string }> = {
  active: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Active'
  },
  paused: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <Pause className="w-3 h-3" />,
    label: 'Paused'
  },
  draft: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400',
    icon: <FileText className="w-3 h-3" />,
    label: 'Draft'
  },
};

// Trigger type labels
const triggerLabels: Record<string, string> = {
  new_subscriber: 'New Subscriber',
  message_received: 'Message Received',
  purchase_completed: 'Purchase Completed',
  subscription_expiring: 'Subscription Expiring',
};

export default function AutomationsPage() {
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);


  // Fetch automations
  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/automations' 
        : `/api/automations?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAutomations(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load automations');
      }
    } catch (err) {
      console.error('Error fetching automations:', err);
      setError('Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch execution metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/automations/analytics');
      const data = await response.json();
      
      if (data.success && data.data?.metrics) {
        setMetrics(data.data.metrics);
      } else {
        // Set default metrics if API fails
        setMetrics({
          totalExecutions: 0,
          successCount: 0,
          failedCount: 0,
          partialCount: 0,
          successRate: 0,
          averageStepsExecuted: 0
        });
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setMetrics({
        totalExecutions: 0,
        successCount: 0,
        failedCount: 0,
        partialCount: 0,
        successRate: 0,
        averageStepsExecuted: 0
      });
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
    fetchMetrics();
  }, [fetchAutomations, fetchMetrics]);

  // Get trigger type from automation steps
  const getTriggerType = (automation: AutomationFlow): string => {
    const trigger = automation.steps.find(s => s.type === 'trigger');
    return trigger ? triggerLabels[trigger.name] || trigger.name : 'Unknown';
  };

  // Get action count
  const getActionCount = (automation: AutomationFlow): number => {
    return automation.steps.filter(s => s.type === 'action').length;
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Toggle automation status
  const toggleStatus = async (automation: AutomationFlow) => {
    const newStatus: AutomationStatus = automation.status === 'active' ? 'paused' : 'active';
    
    try {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchAutomations();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Delete automation
  const deleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchAutomations();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Error deleting automation:', err);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAutomations();
    fetchMetrics();
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = { all: automations.length, active: 0, paused: 0, draft: 0 };
    automations.forEach(a => {
      counts[a.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();


  // Loading state
  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="Automations">
        <PageLayout
          title="Automations"
          subtitle="Create automated workflows to engage with your fans"
          breadcrumbs={[{ label: 'Automations' }]}
        >
          <div className="space-y-6">
            <MetricSkeleton count={4} />
            <CardSkeleton count={3} />
          </div>
        </PageLayout>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Automations">
      <PageLayout
        title="Automations"
        subtitle="Create automated workflows to engage with your fans"
        breadcrumbs={[{ label: 'Automations' }]}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/automations/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Automation
              </Button>
            </Link>
          </div>
        }
      >
        {/* Execution Stats Grid */}
        {metrics && (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            data-testid="automation-metrics-grid"
          >
            {/* Total Executions */}
            <Card 
              className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]"
              data-testid="metric-card-executions"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">Total Executions</h3>
              </div>
              <div className="space-y-2">
                <span className="text-3xl font-bold text-[var(--color-text-main)]" data-testid="metric-total-executions">
                  {metrics.totalExecutions.toLocaleString()}
                </span>
                <p className="text-sm text-[var(--color-text-sub)]">
                  All time automation runs
                </p>
              </div>
            </Card>

            {/* Success Rate */}
            <Card 
              className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]"
              data-testid="metric-card-success-rate"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">Success Rate</h3>
              </div>
              <div className="space-y-2">
                <span 
                  className={`text-3xl font-bold ${
                    metrics.successRate >= 90 
                      ? 'text-green-600 dark:text-green-400' 
                      : metrics.successRate >= 70 
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                  data-testid="metric-success-rate"
                >
                  {metrics.successRate.toFixed(1)}%
                </span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metrics.successRate >= 90 
                        ? 'bg-green-600' 
                        : metrics.successRate >= 70 
                        ? 'bg-yellow-600' 
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(metrics.successRate, 100)}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Success/Failed Breakdown */}
            <Card 
              className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]"
              data-testid="metric-card-breakdown"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">Breakdown</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Success
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400" data-testid="metric-success-count">
                    {metrics.successCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)] flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" /> Failed
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400" data-testid="metric-failed-count">
                    {metrics.failedCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" /> Partial
                  </span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400" data-testid="metric-partial-count">
                    {metrics.partialCount}
                  </span>
                </div>
              </div>
            </Card>

            {/* Avg Steps Executed */}
            <Card 
              className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]"
              data-testid="metric-card-avg-steps"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">Avg Steps</h3>
              </div>
              <div className="space-y-2">
                <span className="text-3xl font-bold text-[var(--color-text-main)]" data-testid="metric-avg-steps">
                  {metrics.averageStepsExecuted.toFixed(1)}
                </span>
                <p className="text-sm text-[var(--color-text-sub)]">
                  Steps per execution
                </p>
              </div>
            </Card>
          </div>
        )}


        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'active', 'paused', 'draft'] as StatusFilter[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? `All (${statusCounts.all})` : `${status} (${statusCounts[status]})`}
            </Button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {automations.length === 0 && !error && (
          <EmptyState
            icon={<Zap className="w-12 h-12" />}
            title="No automations yet"
            description="Create your first automation to automatically engage with fans when they subscribe, send messages, or make purchases."
            action={{
              label: 'Create Your First Automation',
              onClick: () => window.location.href = '/automations/new',
              variant: 'primary',
              icon: Plus
            }}
          />
        )}

        {/* Automations List */}
        {automations.length > 0 && (
          <div className="space-y-4" data-testid="automations-list">
            {automations.map((automation) => (
              <Card 
                key={automation.id} 
                className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-4 shadow-[var(--shadow-soft)] hover:shadow-md transition-shadow"
                data-testid={`automation-card-${automation.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Status Indicator */}
                  <div 
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      automation.status === 'active' 
                        ? 'bg-green-500 animate-pulse' 
                        : automation.status === 'paused'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                    data-testid={`automation-status-indicator-${automation.id}`}
                    aria-label={`Status: ${automation.status}`}
                  />

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-[var(--color-text-main)] truncate">
                        {automation.name}
                      </h3>
                      <span 
                        className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${statusConfig[automation.status].color}`}
                        data-testid={`automation-status-badge-${automation.id}`}
                      >
                        {statusConfig[automation.status].icon}
                        {statusConfig[automation.status].label}
                      </span>
                    </div>
                    {automation.description && (
                      <p className="text-sm text-[var(--color-text-sub)] mb-2 line-clamp-1">
                        {automation.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-sub)]">
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {getTriggerType(automation)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings className="w-4 h-4" />
                        {getActionCount(automation)} action{getActionCount(automation) !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(automation.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(automation)}
                      title={automation.status === 'active' ? 'Pause automation' : 'Activate automation'}
                    >
                      {automation.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href={`/automations/${automation.id}`}>
                      <Button variant="outline" size="sm" title="Edit automation">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAutomation(automation.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete automation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-main)] mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/automations/new"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Create Flow</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Build a new automation</p>
                </div>
              </div>
            </Link>

            <Link
              href="/automations/templates"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Templates</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Pre-built automations</p>
                </div>
              </div>
            </Link>

            <Link
              href="/automations/analytics"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Analytics</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Performance metrics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </PageLayout>
    </ContentPageErrorBoundary>
  );
}
