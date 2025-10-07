"use client";
import { LineChart, BarChart, DonutChart } from '@/components/charts/SimpleCharts';

export default function Client({ data }: { data: any }) {
  const revenueLine = {
    labels: data?.revenueSeries?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenueSeries?.values || [],
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.25)'
      }
    ]
  } as any;

  const fansBar = {
    labels: data?.fanGrowth?.labels || [],
    datasets: [
      {
        label: 'New Fans',
        data: data?.fanGrowth?.newFans || [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      },
      {
        label: 'Active Fans',
        data: data?.fanGrowth?.activeFans || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)'
      }
    ]
  } as any;

  const platforms = data?.platformDistribution || [];
  const platformDonut = {
    labels: platforms.map((p: any) => p.platform.toUpperCase()),
    datasets: [
      {
        data: platforms.map((p: any) => Math.round((p.share || 0) * 100)),
        backgroundColor: ['#2563EB', '#059669', '#F59E0B', '#6366F1']
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

