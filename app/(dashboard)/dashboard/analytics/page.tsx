'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const summaryCards = [
  { title: 'Monthly GMV', value: '$412,980', delta: '+28% vs last month' },
  { title: 'Active creators', value: '67', delta: '+12 onboarded' },
  { title: 'AI coverage', value: '91%', delta: '+6 pts week over week' },
  { title: 'Churn risk', value: '8%', delta: '-3 pts vs goal' },
];

export default function AnalyticsHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics & intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Visualise creator revenue, AI performance, and fan behaviour in real time. Every metric is sourced from the
          Huntaze warehouse with drill-down into OnlyFans segments.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.title}</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{card.value}</p>
            <p className="text-xs font-medium text-emerald-600">{card.delta}</p>
          </div>
        ))}
      </div>

      <ModuleCard module="analytics" title="Revenue funnel" status={createModuleStatus('active')}>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <FunnelStep label="Impressions" value="1.2M" delta="+18%" />
          <FunnelStep label="Fan interactions" value="162k" delta="+22%" />
          <FunnelStep label="Purchases" value="48.9k" delta="+26%" />
        </div>
      </ModuleCard>

      <ModuleCard module="analytics" title="Insights" status={createModuleStatus('active')}>
        <ul className="space-y-3 text-xs text-gray-600">
          <li>• VIP fans exposed to AI smart replies spend +48% more than human-only cohorts.</li>
          <li>• Peak conversion window remains 7pm-11pm user local time (auto-scheduling enforced).</li>
          <li>• Compliance lock prevented 27 risky drops with potential OF strikes.</li>
          <li>• Creator onboarding journeys reduce ramp time from 10 days to 4.5 days.</li>
        </ul>
      </ModuleCard>
    </div>
  );
}

function FunnelStep({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-emerald-600">{delta}</p>
    </div>
  );
}
