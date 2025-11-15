'use client';

import { TrendDirection } from '@/lib/services/revenue/types';

interface MetricCardProps {
  title: string;
  value: number;
  trend: TrendDirection;
  changePercent: number;
  sparklineData?: number[];
  format?: 'currency' | 'number' | 'percentage';
  onClick?: () => void;
  isHighlighted?: boolean;
}

export function MetricCard({
  title,
  value,
  trend,
  changePercent,
  sparklineData = [],
  format = 'number',
  onClick,
  isHighlighted = false,
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
    }
  };

  const getCardBorder = () => {
    if (isHighlighted) {
      return 'border-2 border-blue-500 shadow-lg';
    }
    return 'border border-gray-200 hover:border-gray-300';
  };

  // Simple sparkline rendering
  const renderSparkline = () => {
    if (sparklineData.length === 0) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-12 mt-2" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={getTrendColor()}
          opacity="0.5"
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-5 transition-all ${getCardBorder()} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {isHighlighted && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Notable Change
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
        </div>
      </div>

      {/* Change Percentage */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${getTrendColor()}`}>
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500">vs last period</span>
      </div>

      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {renderSparkline()}
        </div>
      )}
    </div>
  );
}
