"use client";
import { useEffect, useState } from 'react';
import { BarChart } from '@/components/charts/SimpleCharts';

export default function AnalyticsTopHours() {
  const [data, setData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/analytics/top-hours', { cache: 'no-store' });
        if (!r.ok) throw new Error(`Upstream ${r.status}`);
        const j = await r.json();
        const labels = (j.hours || []).map((h:number)=>`${h}:00`);
        const values = (j.counts || []) as number[];
        setData({ labels, values });
      } catch (e: any) { setErr(e?.message || 'Failed'); }
    })();
  }, []);
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!data) return <div className="text-sm text-slate-500">Loading…</div>;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Top Hours</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <BarChart data={{ labels: data.labels, datasets: [{ label: 'Activity', data: data.values, backgroundColor: 'rgba(37,99,235,0.6)' }] }} />
      </div>
    </div>
  );
}

