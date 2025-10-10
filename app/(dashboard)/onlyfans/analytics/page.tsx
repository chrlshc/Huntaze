'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const kpis = [
  { label: 'Monthly GMV', value: '$128,450', delta: '+23% MoM' },
  { label: 'AI handled messages', value: '14,982', delta: '92% automation' },
  { label: 'PPV conversion', value: '38.6%', delta: '+5.4 pts' },
  { label: 'Average fan value', value: '$87', delta: '+$14 vs last month' },
];

const cohortData = [
  { cohort: 'Week of Jan 6', fans: 384, revenue: '$26,540', retention: '72%' },
  { cohort: 'Week of Jan 13', fans: 421, revenue: '$29,800', retention: '68%' },
  { cohort: 'Week of Jan 20', fans: 405, revenue: '$27,120', retention: '65%' },
  { cohort: 'Week of Jan 27', fans: 392, revenue: '$24,075', retention: '61%' },
];

export default function OnlyFansAnalyticsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Performance analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Drill into GMV drivers, cohort retention, and AI impact on your creator roster. All metrics stream from the
          Huntaze data warehouse with real-time EventBridge updates.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{kpi.value}</p>
            <p className="text-xs font-medium text-emerald-600">{kpi.delta}</p>
          </div>
        ))}
      </div>

      <ModuleCard module="onlyfans" title="Cohort retention" status={createModuleStatus('active')}>
        <p className="text-xs text-gray-600">
          Huntaze splits fan revenue into weekly cohorts and tracks spend velocity, churn, and AI touchpoints across the
          lifecycle.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Cohort</th>
                <th className="px-4 py-2 text-right">Fans</th>
                <th className="px-4 py-2 text-right">Revenue</th>
                <th className="px-4 py-2 text-right">Retention @ Day 28</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cohortData.map((row) => (
                <tr key={row.cohort}>
                  <td className="px-4 py-3">{row.cohort}</td>
                  <td className="px-4 py-3 text-right">{row.fans}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{row.revenue}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{row.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      <ModuleCard module="onlyfans" title="AI impact breakdown" status={createModuleStatus('active')}>
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsTile
            title="Revenue attributed to AI"
            value="$74,210"
            detail="+18% vs human-only baseline (A/B holdout)"
          />
          <AnalyticsTile
            title="Time saved per chatter"
            value="29h/week"
            detail="Automated message drafting, inbox triage, and compliance checks"
          />
          <AnalyticsTile
            title="Creator satisfaction"
            value="4.8 / 5"
            detail="Survey of 34 creators after migration from agency workflows"
          />
          <AnalyticsTile
            title="Compliance incidents prevented"
            value="27"
            detail="Auto-blocking flagged assets before OnlyFans review"
          />
        </div>
      </ModuleCard>
    </div>
  );
}

function AnalyticsTile({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-600">{detail}</p>
    </div>
  );
}
