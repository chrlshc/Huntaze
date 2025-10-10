'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const integrations = [
  { name: 'OnlyFans API', status: 'Connected', detail: 'Session refreshed 12 minutes ago' },
  { name: 'Instagram Graph API', status: 'Connected', detail: 'Token expires in 56 days' },
  { name: 'TikTok Business', status: 'Connected', detail: 'Active user: marketing@huntaze.com' },
  { name: 'Slack', status: 'Connected', detail: '#vip-alerts channel' },
];

export default function SettingsIntegrationsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Manage platform connections and webhook destinations. Huntaze rotates tokens automatically and escalates
          reconnects to your team.
        </p>
      </header>

      <ModuleCard module="settings" title="Connected platforms" status={createModuleStatus('active')}>
        <div className="mt-4 space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                <p className="text-xs text-gray-500">{integration.detail}</p>
              </div>
              <button type="button" className="text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
                Manage
              </button>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="settings" title="Webhook destinations" status={createModuleStatus('idle')}>
        <p className="text-xs text-gray-600">EventBridge forwards Huntaze events to your infrastructure.</p>
        <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
          Add webhook
        </button>
      </ModuleCard>
    </div>
  );
}
