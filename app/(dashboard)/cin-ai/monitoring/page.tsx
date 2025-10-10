'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const nodes = [
  { label: 'Smart reply pipeline', status: 'Healthy', latency: '240 ms' },
  { label: 'Campaign orchestrator', status: 'Healthy', latency: '320 ms' },
  { label: 'Compliance scanner', status: 'Degraded', latency: '540 ms' },
  { label: 'Human handoff queue', status: 'Healthy', latency: 'Instant' },
];

export default function CinAiMonitoringPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Monitoring</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Track model latency, queue depth, and guardrail events. Huntaze pushes anomalies to CloudWatch + EventBridge so
          your team can react immediately.
        </p>
      </header>

      <ModuleCard module="cin-ai" title="Pipeline status" status={createModuleStatus('active')}>
        <div className="mt-4 space-y-3">
          {nodes.map((node) => (
            <div key={node.label} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-gray-900">{node.label}</p>
                <p className="text-xs text-gray-500">Latency {node.latency}</p>
              </div>
              <span className={`text-xs font-semibold ${node.status === 'Healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {node.status}
              </span>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="cin-ai" title="Recent guardrail events" status={createModuleStatus('idle')}>
        <ul className="space-y-2 text-xs text-gray-600">
          <li>• 14:22 UTC – Media asset auto-locked (policy keyword match)</li>
          <li>• 12:08 UTC – AI self-escalated VIP message for human validation</li>
          <li>• 09:31 UTC – Rate limit triggered on mass DM queue (auto throttled)</li>
        </ul>
      </ModuleCard>
    </div>
  );
}
