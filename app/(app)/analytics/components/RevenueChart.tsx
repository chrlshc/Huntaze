'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/dashboard/formatters';

interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface RevenueChartProps {
  data: TimeSeriesPoint[];
  comparisonData?: TimeSeriesPoint[];
  mode: 'daily' | 'cumulative';
  onModeChange: (mode: 'daily' | 'cumulative') => void;
}

export function RevenueChart({ data, comparisonData, mode, onModeChange }: RevenueChartProps) {
  // Transform data based on mode
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const processData = (points: TimeSeriesPoint[], isCumulative: boolean) => {
      if (!isCumulative) return points;
      let cumulative = 0;
      return points.map(p => {
        cumulative += p.value;
        return { ...p, value: cumulative };
      });
    };

    const currentData = processData(data, mode === 'cumulative');
    const prevData = comparisonData ? processData(comparisonData, mode === 'cumulative') : [];

    return currentData.map((point, index) => ({
      date: formatDate(point.date),
      current: point.value,
      previous: prevData[index]?.value ?? null,
    }));
  }, [data, comparisonData, mode]);

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => onModeChange('daily')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'daily'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onModeChange('cumulative')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'cumulative'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* Chart - prend tout l'espace restant */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-gray-600">
                  {value === 'current' ? 'Current Period' : 'Previous Period'}
                </span>
              )}
            />
            {comparisonData && (
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorPrevious)"
                name="previous"
              />
            )}
            <Area
              type="monotone"
              dataKey="current"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#colorCurrent)"
              name="current"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">
            {entry.name === 'current' ? 'Current:' : 'Previous:'}
          </span>
          <span className="font-medium text-gray-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
