'use client';

import { useState } from 'react';
import { GoalRecommendation } from '@/lib/services/revenue/types';

interface GoalAchievementProps {
  currentRevenue: number;
  goalRevenue: number;
  recommendations: GoalRecommendation[];
}

export function GoalAchievement({
  currentRevenue,
  goalRevenue,
  recommendations,
}: GoalAchievementProps) {
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  const remaining = goalRevenue - currentRevenue;
  const progress = (currentRevenue / goalRevenue) * 100;
  const isAchieved = currentRevenue >= goalRevenue;

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const getEffortColor = (effort: 'low' | 'medium' | 'high') => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getEffortIcon = (effort: 'low' | 'medium' | 'high') => {
    switch (effort) {
      case 'low':
        return '⚡';
      case 'medium':
        return '⚙️';
      case 'high':
        return '🔥';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Goal Achievement</h2>
        <p className="text-sm text-gray-600">Track progress and get actionable recommendations</p>
      </div>

      {/* Goal Progress */}
      <div className={`rounded-lg p-5 mb-6 ${
        isAchieved ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Revenue Goal</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(goalRevenue)}
            </div>
          </div>
          {isAchieved && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-green-700">Goal Achieved!</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current: {formatCurrency(currentRevenue)}</span>
            <span className={`font-semibold ${isAchieved ? 'text-green-700' : 'text-blue-700'}`}>
              {isAchieved ? 'Exceeded by' : 'Remaining'}: {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                isAchieved ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-right text-sm font-semibold text-gray-900">
            {Math.round(progress)}% Complete
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!isAchieved && recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recommended Actions
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Take these actions to reach your revenue goal
          </p>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedRec(expandedRec === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-2xl">{getEffortIcon(rec.effort)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{rec.action}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getEffortColor(rec.effort)}`}>
                          {rec.effort.toUpperCase()} EFFORT
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          +{formatCurrency(rec.impact)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedRec === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedRec === index && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-700">{rec.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {isAchieved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Congratulations! You've reached your goal!
              </h4>
              <p className="text-sm text-green-700">
                Keep up the great work. Consider setting a new, higher goal to continue growing your revenue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
