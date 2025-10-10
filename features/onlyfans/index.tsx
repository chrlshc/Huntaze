'use client';

import { useEffect, useMemo } from 'react';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { useOnlyFansDashboard } from '@/hooks/useOnlyFansDashboard';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createModuleStatus } from '@/types/branded';

export default function OnlyFansModule() {
  const { signalFeed, loading, error, refresh } = useOnlyFansDashboard();

  useEffect(() => {
    PerformanceMonitor.recordMetric('module_mount_onlyfans', 1);
  }, []);

  const rows = useMemo(() => {
    if (!signalFeed.length) {
      return [
        {
          headline: 'No recent events',
          detail: 'Connect your OnlyFans account to start recording campaign signals.',
        },
      ];
    }

    return signalFeed.map((event, index) => ({
      headline: event.headline,
      detail: JSON.stringify(event.payload ?? {}),
      createdAt: event.createdAt,
      type: event.type,
      index,
    }));
  }, [signalFeed]);

  return (
    <ModuleCard
      module="onlyfans"
      title="OnlyFans Signal Feed"
      status={createModuleStatus(signalFeed.length ? 'active' : 'idle')}
      onAction={(action) => {
        if (action === 'refresh') {
          void refresh();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-gray-600">
          Smart replies, campaign updates, and compliance alerts stream here in real-time.
        </p>
        {error ? <span className="text-[10px] uppercase tracking-wide text-red-500">Sync issue</span> : null}
      </div>
      <div className="mt-4">
        {loading && !signalFeed.length ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse space-y-2 rounded-lg bg-white/60 p-3">
                <div className="h-3 w-40 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <VirtualizedList
            items={rows}
            height={220}
            itemHeight={56}
            module="onlyfans"
            renderItem={(item) => (
              <div>
                <p className="font-medium text-gray-900">{item.headline}</p>
                <p className="truncate text-xs text-gray-500">{item.detail}</p>
              </div>
            )}
          />
        )}
      </div>
    </ModuleCard>
  );
}
