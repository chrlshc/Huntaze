'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Security center</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Enforce MFA, manage API keys, and review audit trails. Huntaze tracks every sensitive action for compliance.
        </p>
      </header>

      <ModuleCard module="settings" title="Multi-factor authentication" status={createModuleStatus('active')}>
        <p className="text-xs text-gray-600">Required for all teammates and creator logins.</p>
        <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
          Manage MFA providers
        </button>
      </ModuleCard>

      <ModuleCard module="settings" title="API keys" status={createModuleStatus('idle')}>
        <p className="text-xs text-gray-600">Rotate keys every 90 days and scope access to analytics or messaging only.</p>
        <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
          Generate new key
        </button>
      </ModuleCard>

      <ModuleCard module="settings" title="Audit log" status={createModuleStatus('active')}>
        <ul className="text-xs text-gray-600">
          <li>• 10:12 UTC – finance@huntaze.com exported GMV report</li>
          <li>• 09:55 UTC – ops@huntaze.com updated OnlyFans session proxy</li>
          <li>• 09:30 UTC – security@huntaze.com rotated analytics API key</li>
        </ul>
      </ModuleCard>
    </div>
  );
}
