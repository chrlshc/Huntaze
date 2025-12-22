'use client';

import { formatCurrency, formatPercentage } from '@/lib/dashboard/formatters';

interface Kpi {
  value: number;
  deltaPct: number;
  label: string;
  tooltip?: string;
}

interface AIMetrics {
  rpm: Kpi;
  avgResponseTime: Kpi;
}

interface AIMetricsCardProps {
  metrics: AIMetrics;
  isLoading?: boolean;
}

export function AIMetricsCard({ metrics, isLoading }: AIMetricsCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No AI metrics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h3 className="text-lg font-semibold text-gray-900">AI Performance</h3>
      </div>

      <div className="space-y-3">
        {/* RPM - Revenue Per Message */}
        <MetricCard
          icon="💰"
          label={metrics.rpm.label}
          value={formatCurrency(metrics.rpm.value)}
          delta={metrics.rpm.deltaPct}
          tooltip={metrics.rpm.tooltip}
          valueColor="text-gray-900"
        />

        {/* Average Response Time */}
        <MetricCard
          icon="⚡"
          label={metrics.avgResponseTime.label}
          value={formatResponseTime(metrics.avgResponseTime.value)}
          delta={metrics.avgResponseTime.deltaPct}
          tooltip={metrics.avgResponseTime.tooltip}
          valueColor="text-gray-900"
          invertDelta // Lower is better for response time
        />
      </div>

      {/* AI Status - neutre avec dot vert discret */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-900">AI Assistant Active</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Responding to messages automatically
        </p>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  delta: number;
  tooltip?: string;
  valueColor?: string;
  invertDelta?: boolean;
}

function MetricCard({ icon, label, value, delta, tooltip, valueColor = 'text-gray-900', invertDelta }: MetricCardProps) {
  // For inverted metrics (like response time), negative delta is good
  const isPositive = invertDelta ? delta < 0 : delta > 0;
  const deltaColor = isPositive ? 'text-emerald-700' : delta === 0 ? 'text-gray-500' : 'text-rose-600';
  const deltaIcon = isPositive ? '↑' : delta === 0 ? '→' : '↓';
  
  // For inverted metrics, show the absolute value but flip the icon
  const displayDelta = invertDelta ? -delta : delta;
  const displayIcon = invertDelta ? (delta < 0 ? '↓' : delta > 0 ? '↑' : '→') : deltaIcon;

  return (
    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        {tooltip && (
          <div className="relative">
            <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
            <div className="absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        <span className={`text-sm font-medium ${deltaColor} flex items-center gap-0.5`}>
          {displayIcon} {formatPercentage(Math.abs(delta))}
        </span>
      </div>
    </div>
  );
}

function formatResponseTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}
