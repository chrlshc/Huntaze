export const revalidate = 60;

import { LineChart } from '@/components/charts/SimpleCharts';

async function getSeries() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/overview`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  const j = await res.json();
  return j.revenueSeries || { labels: [], values: [] };
}

export default async function AnalyticsRevenue() {
  const series = await getSeries();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Revenue</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <LineChart data={{ labels: series.labels, datasets: [{ label: 'Revenue', data: series.values, borderColor: 'rgb(37,99,235)', backgroundColor: 'rgba(37,99,235,0.25)'}] }} />
      </div>
    </div>
  );
}
