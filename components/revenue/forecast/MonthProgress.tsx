'use client';

import { MonthForecast } from '@/lib/services/revenue/types';

interface MonthProgressProps {
  forecast: MonthForecast;
  title: string;
  subtitle?: string;
}

export function MonthProgress({ forecast, title, subtitle }: MonthProgressProps) {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const getStatusColor = () => {
    if (forecast.onTrack) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-700',
        progress: 'bg-green-500',
        text: 'text-green-700',
      };
    }
    
    if (forecast.completion >= 75) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-700',
        progress: 'bg-yellow-500',
        text: 'text-yellow-700',
      };
    }
    
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      progress: 'bg-red-500',
      text: 'text-red-700',
    };
  };

  const colors = getStatusColor();
  const difference = forecast.actual - forecast.projected;
  const differencePercent = ((difference / forecast.projected) * 100).toFixed(1);

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded ${colors.badge}`}>
          {forecast.onTrack ? 'On Track' : 'Behind'}
        </span>
      </div>

      {/* Revenue Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">Projected</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(forecast.projected)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Actual</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(forecast.actual)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(forecast.completion)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${colors.progress}`}
            style={{ width: `${Math.min(forecast.completion, 100)}%` }}
          />
        </div>
      </div>

      {/* Difference Indicator */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Difference</span>
        <div className="flex items-center gap-2">
          {difference >= 0 ? (
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          )}
          <span className={`text-sm font-semibold ${difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {difference >= 0 ? '+' : ''}{formatCurrency(Math.abs(difference))}
          </span>
          <span className={`text-xs ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({differencePercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
