'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

export default function SettingsHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Manage your Huntaze workspace. Update billing, team access, and platform credentials from a single panel.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <ModuleCard module="settings" title="Account" status={createModuleStatus('active')}>
          <p className="text-xs text-gray-600">Company profile, billing contacts, and domain configuration.</p>
          <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
            Manage account
          </button>
        </ModuleCard>
        <ModuleCard module="settings" title="Integrations" status={createModuleStatus('active')}>
          <p className="text-xs text-gray-600">Connect OnlyFans, social platforms, and data warehouses.</p>
          <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
            View connections
          </button>
        </ModuleCard>
        <ModuleCard module="settings" title="Security" status={createModuleStatus('active')}>
          <p className="text-xs text-gray-600">Configure MFA, API keys, and audit logging policies.</p>
          <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
            Review security
          </button>
        </ModuleCard>
      </div>
    </div>
  );
}
