'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import {
  RevenueDataPoint,
  ForecastDataPoint,
  MonthForecast,
} from '@/lib/services/revenue/types';

interface RevenueForecastChartProps {
  historicalData: RevenueDataPoint[];
  forecastData: ForecastDataPoint[];
  currentMonth: MonthForecast;
  nextMonth: MonthForecast;
  onGoalSet: (goal: number) => void;
}

export function RevenueForecastChart({
  historicalData,
  forecastData,
  currentMonth,
  nextMonth,
  onGoalSet,
}: RevenueForecastChartProps) {
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalValue, setGoalValue] = useState('');

  // Combine historical and forecast data for the chart
  const chartData = [
    ...historicalData.map((point) => ({
      month: point.month,
      actual: point.revenue,
      growth: point.growth,
      type: 'historical' as const,
    })),
    ...forecastData.map((point) => ({
      month: point.month,
      predicted: point.predicted,
      confidenceMin: point.confidence.min,
      confidenceMax: point.confidence.max,
      type: 'forecast' as const,
    })),
  ];

  const handleSetGoal = () => {
    const goal = parseFloat(goalValue);
    if (!isNaN(goal) && goal > 0) {
      onGoalSet(goal);
      setShowGoalInput(false);
      setGoalValue('');
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const formatMonth = (month: string) => {
    return month.substring(0, 3);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Revenue Forecast</h2>
          <p className="text-sm text-gray-600">12-month trend with predictions</p>
        </div>
        <button
          onClick={() => setShowGoalInput(!showGoalInput)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Set Goal
        </button>
      </div>

      {/* Goal Input */}
      {showGoalInput && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Set Revenue Goal
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSetGoal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set
            </button>
            <button
              onClick={() => setShowGoalInput(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-6" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="confidenceMax"
              stroke="none"
              fill="#93c5fd"
              fillOpacity={0.2}
              name="Confidence Range"
            />
            <Area
              type="monotone"
              dataKey="confidenceMin"
              stroke="none"
              fill="#93c5fd"
              fillOpacity={0.2}
            />
            
            {/* Historical revenue line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
              name="Actual Revenue"
            />
            
            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#2563eb', r: 4 }}
              name="Predicted Revenue"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Current & Next Month Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Month */}
        <div className={`border rounded-lg p-4 ${
          currentMonth.onTrack
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Current Month</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              currentMonth.onTrack
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {currentMonth.onTrack ? 'On Track' : 'Behind'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600">Projected:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(currentMonth.projected)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600">Actual:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(currentMonth.actual)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Progress:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(currentMonth.completion)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    currentMonth.onTrack ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(currentMonth.completion, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Next Month */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Next Month</h3>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              Forecast
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600">Predicted:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(nextMonth.projected)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600">Confidence:</span>
              <span className="text-sm font-semibold text-blue-700">
                {Math.round(nextMonth.completion)}%
              </span>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <div className="text-xs text-gray-600">
                Based on current trends and historical data
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
