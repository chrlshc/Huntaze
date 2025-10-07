"use client";
import { useEffect, useState } from 'react';
import { LineChart } from '@/components/charts/SimpleCharts';

export default function AnalyticsRevenue() {
  const [series, setSeries] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/analytics/overview', { cache: 'no-store' });
        if (!r.ok) throw new Error(`Upstream ${r.status}`);
        const j = await r.json();
        setSeries(j.revenueSeries || { labels: [], values: [] });
      } catch (e: any) { setErr(e?.message || 'Failed'); }
    })();
  }, []);
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!series) return <div className="text-sm text-slate-500">Loading…</div>;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Revenue</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <LineChart data={{ labels: series.labels, datasets: [{ label: 'Revenue', data: series.values, borderColor: 'rgb(37,99,235)', backgroundColor: 'rgba(37,99,235,0.25)'}] }} />
      </div>
    </div>
  );
}

