/**
 * Validation Health Dashboard Component
 * 
 * Displays OAuth validation health status for all platforms
 * with real-time updates and error handling
 * 
 * @example
 * ```tsx
 * import { ValidationHealthDashboard } from '@/components/validation/ValidationHealthDashboard';
 * 
 * <ValidationHealthDashboard />
 * ```
 */

'use client';

import { useValidationHealth, usePlatformHealth } from '@/hooks/useValidationHealth';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

// Platform status badge
function PlatformStatusBadge({ status }: { status: 'healthy' | 'unhealthy' }) {
  if (status === 'healthy') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        <CheckCircle className="w-3 h-3" />
        Healthy
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
      <XCircle className="w-3 h-3" />
      Unhealthy
    </span>
  );
}

// Overall status badge
function OverallStatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' | 'error' }) {
  const config = {
    healthy: {
      icon: CheckCircle,
      text: 'All Systems Operational',
      className: 'text-green-700 bg-green-100',
    },
    degraded: {
      icon: AlertCircle,
      text: 'Partial Outage',
      className: 'text-yellow-700 bg-yellow-100',
    },
    unhealthy: {
      icon: XCircle,
      text: 'Major Outage',
      className: 'text-red-700 bg-red-100',
    },
    error: {
      icon: XCircle,
      text: 'System Error',
      className: 'text-red-700 bg-red-100',
    },
  };

  const { icon: Icon, text, className } = config[status];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${className}`}>
      <Icon className="w-5 h-5" />
      {text}
    </div>
  );
}

// Platform card
function PlatformCard({ platform }: { platform: any }) {
  return (
    <div className="p-4 bg-white border border-[var(--border-default)] rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold capitalize">{platform.platform}</h3>
        <PlatformStatusBadge status={platform.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Credentials Set</span>
          <span className={platform.credentialsSet ? 'text-green-600' : 'text-red-600'}>
            {platform.credentialsSet ? '✓' : '✗'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Format Valid</span>
          <span className={platform.formatValid ? 'text-green-600' : 'text-red-600'}>
            {platform.formatValid ? '✓' : '✗'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">API Connectivity</span>
          <span className={platform.apiConnectivity ? 'text-green-600' : 'text-red-600'}>
            {platform.apiConnectivity ? '✓' : '✗'}
          </span>
        </div>

        {platform.errors > 0 && (
          <div className="pt-2 mt-2 border-t border-[var(--border-default)]">
            <span className="text-red-600 font-medium">
              {platform.errors} error{platform.errors !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {platform.warnings > 0 && (
          <div className="pt-2 mt-2 border-t border-[var(--border-default)]">
            <span className="text-yellow-600 font-medium">
              {platform.warnings} warning{platform.warnings !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
        <p className="text-gray-600">Checking validation health...</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-6 bg-red-50 border border-[var(--accent-error-border)] rounded-lg">
      <div className="flex items-start gap-3">
        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Failed to Check Validation Health
          </h3>
          <p className="text-red-700 mb-4">{error.message}</p>
          <Button variant="danger" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main component
export function ValidationHealthDashboard() {
  const { health, isLoading, error, refresh } = useValidationHealth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  if (!health) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">OAuth Validation Health</h2>
          <p className="text-gray-600 mt-1">
            Real-time status of OAuth credential validation
          </p>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[var(--border-emphasis)] rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <div className="p-6 bg-white border border-[var(--border-default)] rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <OverallStatusBadge status={health.status} />
          
          {health.cached && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              Cached ({health.cacheAge}s ago)
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Total Platforms</p>
            <p className="text-2xl font-bold text-gray-900">{health.summary.total}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Healthy</p>
            <p className="text-2xl font-bold text-green-600">{health.summary.healthy}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Unhealthy</p>
            <p className="text-2xl font-bold text-red-600">{health.summary.unhealthy}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Health Score</p>
            <p className="text-2xl font-bold text-gray-900">{health.summary.healthPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health.platforms.map((platform) => (
          <PlatformCard key={platform.platform} platform={platform} />
        ))}
      </div>

      {/* Metadata */}
      <div className="p-4 bg-gray-50 border border-[var(--border-default)] rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Last Checked:</span>
            <span className="ml-2 text-gray-900">
              {new Date(health.timestamp).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 text-gray-900">{health.duration}ms</span>
          </div>

          <div className="col-span-2">
            <span className="text-gray-600">Correlation ID:</span>
            <span className="ml-2 text-gray-900 font-mono text-xs">
              {health.correlationId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual platform health indicator (compact)
export function PlatformHealthIndicator({ platform }: { platform: 'tiktok' | 'instagram' | 'reddit' }) {
  const { isHealthy, isConfigured, isLoading } = usePlatformHealth(platform);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Checking...
      </span>
    );
  }

  if (!isConfigured) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <AlertCircle className="w-3 h-3" />
        Not configured
      </span>
    );
  }

  if (isHealthy) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="w-3 h-3" />
        Healthy
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600">
      <XCircle className="w-3 h-3" />
      Unhealthy
    </span>
  );
}
