"use client";
import { useEffect, useState } from 'react';
import { LineChart, BarChart, DonutChart } from '@/src/components/charts/SimpleCharts';

type Overview = {
  metrics?: {
    revenueMonthly?: number;
    activeSubscribers?: number;
    avgResponseSeconds?: number;
    aiAutomationRate?: number;
  };
  revenueSeries?: { labels: string[]; values: number[] };
  fanGrowth?: { labels: string[]; newFans: number[]; activeFans: number[] };
  platformDistribution?: { platform: string; share: number; revenue?: number }[];
};

export default function AnalyticsModern() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/analytics/overview', { cache: 'no-store' });
        if (!r.ok) throw new Error(`Upstream ${r.status}`);
        const j = await r.json();
        setData(j);
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
      }
    })();
  }, []);

  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500">Loading analytics…</div>;

  const revenueLine = {
    labels: data.revenueSeries?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: data.revenueSeries?.values || [],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.25)'
      }
    ]
  } as any;

  const fansBar = {
    labels: data.fanGrowth?.labels || [],
    datasets: [
      {
        label: 'New Fans',
        data: data.fanGrowth?.newFans || [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      },
      {
        label: 'Active Fans',
        data: data.fanGrowth?.activeFans || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)'
      }
    ]
  } as any;

  const platforms = data.platformDistribution || [];
  const platformDonut = {
    labels: platforms.map(p => p.platform.toUpperCase()),
    datasets: [
      {
        data: platforms.map(p => Math.round((p.share || 0) * 100)),
        backgroundColor: ['#9333EA', '#2563EB', '#059669', '#F59E0B']
      }
    ]
  } as any;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Revenue</h2>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <LineChart data={revenueLine} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Fans</h2>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <BarChart data={fansBar} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Platforms</h2>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 max-w-md">
          <DonutChart data={platformDonut} />
        </div>
      </section>
    </div>
  );
}

