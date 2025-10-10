'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const integrations = [
  { name: 'Snowflake warehouse', status: 'Connected', detail: 'Nightly sync · 02:00 UTC' },
  { name: 'Looker dashboard', status: 'Connected', detail: 'Real-time via EventBridge' },
  { name: 'Google Sheets (Finance)', status: 'Manual export', detail: 'Last pushed 3 days ago' },
];

export default function AnalyticsExportsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Exports & API access</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Deliver Huntaze metrics to your own tools. Configure warehouse sync, stream data via EventBridge, or trigger
          manual exports for stakeholders.
        </p>
      </header>

      <ModuleCard module="analytics" title="Integrations" status={createModuleStatus('active')}>
        <div className="mt-4 space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                  <p className="text-xs text-gray-500">{integration.detail}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{integration.status}</span>
              </div>
              <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
                Manage connection
              </button>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="analytics" title="API credentials" status={createModuleStatus('idle')}>
        <p className="text-xs text-gray-600">Generate scoped tokens for engineering teams.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ApiKeyCard name="Read-only metrics" scope="analytics.read" created="Jan 4" />
          <ApiKeyCard name="Full warehouse" scope="analytics.read analytics.export" created="Dec 12" />
        </div>
      </ModuleCard>
    </div>
  );
}

function ApiKeyCard({ name, scope, created }: { name: string; scope: string; created: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{name}</p>
      <p className="mt-1 text-xs text-gray-500">Scope: {scope}</p>
      <p className="mt-1 text-[11px] text-gray-400">Created {created}</p>
      <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
        Reveal token
      </button>
    </div>
  );
}
