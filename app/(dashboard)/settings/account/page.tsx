'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

export default function SettingsAccountPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Account settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Update company information, contacts, and billing preferences. Changes apply to every module across Huntaze.
        </p>
      </header>

      <ModuleCard module="settings" title="Workspace profile" status={createModuleStatus('active')}>
        <form className="mt-4 grid gap-3 md:grid-cols-2">
          <FormField label="Workspace name" value="Huntaze Agency" />
          <FormField label="Billing email" value="finance@huntaze.com" />
          <FormField label="Support email" value="support@huntaze.com" />
          <FormField label="Timezone" value="UTC +2 (Europe/Paris)" />
        </form>
      </ModuleCard>

      <ModuleCard module="settings" title="Subscription" status={createModuleStatus('idle')}>
        <p className="text-xs text-gray-600">Plan: Scale · $799/mo + 3% success fee (cap $25k).</p>
        <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
          Update payment method
        </button>
      </ModuleCard>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-xs text-gray-600">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        defaultValue={value}
        type="text"
      />
    </label>
  );
}
