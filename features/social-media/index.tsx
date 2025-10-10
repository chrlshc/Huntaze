'use client';

import { useEffect, useMemo } from 'react';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { useModuleIntegration } from '@/hooks/useModuleIntegration';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createModuleStatus } from '@/types/branded';

export default function SocialMediaModule() {
  const { events } = useModuleIntegration({ module: 'social' });

  useEffect(() => {
    PerformanceMonitor.recordMetric('module_mount_social', 1);
  }, []);

  const scheduled = useMemo(() => events.filter((event) => event.type === 'schedule'), [events]);

  return (
    <ModuleCard module="social" title="Social Media Scheduler" status={createModuleStatus('idle')}>
      <p className="text-xs text-gray-600">
        Preview upcoming Instagram, TikTok, Reddit, and Twitter tasks managed by the AI scheduler.
      </p>
      <ul className="mt-4 space-y-2 text-xs text-gray-600">
        {scheduled.slice(0, 5).map((event) => (
          <li key={event.id} className="rounded-md border border-gray-100 bg-white p-2">
            <span className="font-medium text-gray-900">{event.payload?.platform ?? 'Unknown platform'}</span>
            <span className="ml-2 text-gray-500">
              {event.payload?.time ?? new Date(event.createdAt).toLocaleTimeString()}
            </span>
          </li>
        ))}
        {!scheduled.length ? <li className="text-gray-400">No scheduled content. Plan your next campaign.</li> : null}
      </ul>
    </ModuleCard>
  );
}
