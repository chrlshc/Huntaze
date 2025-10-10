'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const metricRows = [
  { metric: 'Revenue per fan', value: '$87', trend: '+$11 vs ly' },
  { metric: 'VIP conversion rate', value: '42%', trend: '+6 pts' },
  { metric: 'Creator churn', value: '3%', trend: '-1.5 pts' },
  { metric: 'Average response time', value: '28 sec', trend: '-12 sec' },
  { metric: 'AI escalations', value: '184', trend: '+14 (expected)' },
];

export default function AnalyticsMetricsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Metric library</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Central repository of the KPIs powering Huntaze. Every metric is documented with source, calculation, and
          suggested actions.
        </p>
      </header>

      <ModuleCard module="analytics" title="Key metrics" status={createModuleStatus('active')}>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Metric</th>
                <th className="px-4 py-2 text-right">Current value</th>
                <th className="px-4 py-2 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metricRows.map((row) => (
                <tr key={row.metric}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.metric}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-800">{row.value}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-600">{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>
    </div>
  );
}
