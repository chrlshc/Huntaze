'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const toggles = [
  { id: 'ai_personality', label: 'AI tone training', description: 'Continuously learn from sent messages to refine persona.', defaultChecked: true },
  { id: 'human_handoff', label: 'Enable human handoff on high spenders', description: 'Escalate VIP conversations to your chatter team when AI confidence < 70%.', defaultChecked: true },
  { id: 'compliance_lock', label: 'Auto-lock risky assets', description: 'Block campaigns that fail Huntaze policy checks until reviewed.', defaultChecked: true },
  { id: 'night_mode', label: 'Pause automations overnight', description: 'Respect fan timezone quiet hours to keep satisfaction high.', defaultChecked: false },
];

export default function OnlyFansSettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Assistant configuration</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Fine-tune Huntaze for your creators: adjust AI personality, compliance guardrails, and escalation workflows
          without touching code.
        </p>
      </header>

      <ModuleCard module="onlyfans" title="AI behaviour" status={createModuleStatus('active')}>
        <form className="mt-4 space-y-4">
          {toggles.map((toggle) => (
            <label key={toggle.id} className="flex items-start gap-3">
              <input defaultChecked={toggle.defaultChecked} type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-900">{toggle.label}</p>
                <p className="text-xs text-gray-600">{toggle.description}</p>
              </div>
            </label>
          ))}
        </form>
      </ModuleCard>

      <ModuleCard module="onlyfans" title="Messaging thresholds" status={createModuleStatus('idle')}>
        <div className="space-y-3">
          <SettingSlider label="AI confidence required before auto-send" value="78%" />
          <SettingSlider label="Max DM burst per minute" value="12 messages" />
          <SettingSlider label="Campaign daily cap per fan" value="2 touchpoints" />
        </div>
      </ModuleCard>

      <ModuleCard module="onlyfans" title="Webhook destinations" status={createModuleStatus('active')}>
        <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Destination</th>
              <th className="px-4 py-2 text-left">Events</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Last Delivery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <WebhookRow
              name="Internal CRM"
              events="campaign.updated, fan.segmented"
              status="Healthy"
              lastDelivery="2 minutes ago"
            />
            <WebhookRow
              name="Slack #vip-alerts"
              events="conversation.escalated"
              status="Healthy"
              lastDelivery="Just now"
            />
            <WebhookRow
              name="Data warehouse"
              events="message.sent, revenue.recorded"
              status="Retrying"
              lastDelivery="7 minutes ago"
            />
          </tbody>
        </table>
      </ModuleCard>
    </div>
  );
}

function SettingSlider({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-sm text-gray-900">
        <span>{label}</span>
        <span className="font-semibold text-gray-700">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100">
        <div className="h-full w-3/5 rounded-full bg-gray-900" />
      </div>
    </div>
  );
}

function WebhookRow({ name, events, status, lastDelivery }: { name: string; events: string; status: string; lastDelivery: string }) {
  const statusColor = status === 'Healthy' ? 'text-emerald-600' : status === 'Retrying' ? 'text-amber-600' : 'text-gray-500';
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{events}</td>
      <td className={`px-4 py-3 text-xs font-semibold ${statusColor}`}>{status}</td>
      <td className="px-4 py-3 text-right text-xs text-gray-500">{lastDelivery}</td>
    </tr>
  );
}
