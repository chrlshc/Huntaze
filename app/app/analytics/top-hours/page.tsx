export const dynamic = 'force-dynamic';

import { BarChart } from '@/components/charts/SimpleCharts';

async function getTopHours() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/top-hours`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  const j = await res.json();
  return {
    labels: (j.hours || []).map((h:number)=>`${h}:00`),
    values: (j.counts || []) as number[],
  };
}

export default async function AnalyticsTopHours() {
  const data = await getTopHours();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Top Hours</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <BarChart data={{ labels: data.labels, datasets: [{ label: 'Activity', data: data.values, backgroundColor: 'rgba(37,99,235,0.6)' }] }} />
      </div>
    </div>
  );
}
