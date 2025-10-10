'use client';

import { useEffect, useMemo } from 'react';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { useModuleIntegration } from '@/hooks/useModuleIntegration';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createModuleStatus } from '@/types/branded';

export default function CINAIModule() {
  const { events } = useModuleIntegration({ module: 'cin-ai' });

  useEffect(() => {
    PerformanceMonitor.recordMetric('module_mount_cin_ai', 1);
  }, []);

  const conversations = useMemo(() => {
    return events.filter((event) => event.type === 'conversation');
  }, [events]);

  return (
    <ModuleCard module="cin-ai" title="CIN AI Assistant" status={createModuleStatus('active')}>
      <p className="text-xs text-gray-600">Intent detection, response templates, and training telemetry for the CIN network.</p>
      <ul className="mt-3 space-y-2 text-xs text-gray-600">
        {conversations.slice(0, 4).map((event) => (
          <li key={event.id} className="rounded-md border border-gray-100 bg-white p-2">
            <div className="font-medium text-gray-900">{event.payload?.intent ?? 'General conversation'}</div>
            <div className="text-[11px] text-gray-500">{event.payload?.summary ?? 'Awaiting details'}</div>
          </li>
        ))}
        {!conversations.length ? (
          <li className="text-gray-400">No AI conversations yet. Activate CIN flows to populate this feed.</li>
        ) : null}
      </ul>
    </ModuleCard>
  );
}
