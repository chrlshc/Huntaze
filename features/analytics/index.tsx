'use client';

import { useEffect, useMemo } from 'react';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { useModuleIntegration } from '@/hooks/useModuleIntegration';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createModuleStatus } from '@/types/branded';

export default function AnalyticsModule() {
  const { events } = useModuleIntegration({ module: 'analytics' });

  useEffect(() => {
    PerformanceMonitor.recordMetric('module_mount_analytics', 1);
  }, []);

  const metrics = useMemo(() => {
    return events.map((event) => ({
      metric: event.type,
      value: Number((event.payload as any)?.value ?? 0),
    }));
  }, [events]);

  const aggregated = useMemo(() => {
    if (!metrics.length) return {} as Record<string, number>;
    return metrics.reduce<Record<string, number>>((acc, item) => {
      acc[item.metric] = (acc[item.metric] || 0) + item.value;
      return acc;
    }, {});
  }, [metrics]);

  return (
    <ModuleCard
      module="analytics"
      title="Performance Analytics"
      status={createModuleStatus(metrics.length ? 'active' : 'idle')}
      data={{ metrics: aggregated }}
    >
      <p className="text-xs text-gray-600">Conversion funnels, revenue trends, and cohort stats appear here.</p>
      <div className="mt-4">
        <VirtualizedList
          items={metrics}
          height={200}
          itemHeight={48}
          module="analytics"
          renderItem={(item) => (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{item.metric}</span>
              <span className="text-xs text-gray-500">{item.value.toLocaleString()}</span>
            </div>
          )}
        />
      </div>
    </ModuleCard>
  );
}
