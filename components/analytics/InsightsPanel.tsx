'use client';

/**
 * Insights Panel Component
 * 
 * Displays generated insights and recommendations
 */

import React from 'react';
import { Card } from '@/components/ui/card';

interface TrendInsights {
  summary: string;
  significantChanges: Array<{
    metric: string;
    change: number;
    description: string;
  }>;
  recommendations: string[];
}

interface InsightsPanelProps {
  insights: TrendInsights;
  loading?: boolean;
}

export function InsightsPanel({ insights, loading = false }: InsightsPanelProps) {
  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Insights & Recommendations</h3>
      
      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-900">{insights.summary}</p>
      </div>

      {/* Significant Changes */}
      {insights.significantChanges.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Significant Changes</h4>
          <div className="space-y-2">
            {insights.significantChanges.map((change, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  change.change > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{change.metric}</div>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{change.description}</div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    change.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change.change > 0 ? '+' : ''}
                  {change.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Recommendations</h4>
          <ul className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.significantChanges.length === 0 && insights.recommendations.length === 0 && (
        <p className="text-center py-4" style={{ color: 'var(--text-primary)' }}>
          Keep up the good work! Your metrics are stable.
        </p>
      )}
    </Card>
  );
}
