'use client';

import { useEffect } from 'react';
import { ChurnRiskFan, EngagementDataPoint } from '@/lib/services/revenue/types';

interface ChurnRiskDetailProps {
  fan: ChurnRiskFan;
  engagementHistory: EngagementDataPoint[];
  predictedChurnDate: Date;
  recommendedActions: string[];
  onClose: () => void;
}

export function ChurnRiskDetail({
  fan,
  engagementHistory,
  predictedChurnDate,
  recommendedActions,
  onClose
}: ChurnRiskDetailProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const daysUntilChurn = Math.ceil(
    (new Date(predictedChurnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {fan.avatar ? (
              <img
                src={fan.avatar}
                alt={fan.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-lg">
                {fan.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {fan.name}
              </h2>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRiskColor(fan.riskLevel)}`}>
                {fan.riskLevel.toUpperCase()} RISK - {Math.round(fan.churnProbability * 100)}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Lifetime Value</div>
              <div className="text-2xl font-bold text-gray-900">
                ${fan.lifetimeValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Days Inactive</div>
              <div className="text-2xl font-bold text-gray-900">
                {fan.daysSinceLastActivity}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Predicted Churn</div>
              <div className="text-2xl font-bold text-gray-900">
                {daysUntilChurn > 0 ? `${daysUntilChurn}d` : 'Overdue'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(predictedChurnDate)}
              </div>
            </div>
          </div>

          {/* Engagement History Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Engagement History</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {engagementHistory.length > 0 ? (
                <div className="space-y-3">
                  {/* Simple bar chart visualization */}
                  <div className="grid grid-cols-7 gap-2">
                    {engagementHistory.slice(-7).map((point, idx) => {
                      const maxScore = Math.max(...engagementHistory.map(p => p.engagementScore));
                      const height = (point.engagementScore / maxScore) * 100;
                      
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className="w-full h-24 flex items-end">
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                              style={{ height: `${height}%` }}
                              title={`Score: ${point.engagementScore}`}
                            />
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDate(point.date).split(',')[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-600">Avg Messages</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {(engagementHistory.reduce((sum, p) => sum + p.messageCount, 0) / engagementHistory.length).toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Avg Purchases</div>
                      <div className="text-sm font-semibold text-gray-900">
                        ${(engagementHistory.reduce((sum, p) => sum + p.purchaseAmount, 0) / engagementHistory.length).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Avg Engagement</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {(engagementHistory.reduce((sum, p) => sum + p.engagementScore, 0) / engagementHistory.length).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No engagement history available
                </div>
              )}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h3>
            <div className="space-y-2">
              {recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {fan.lastMessage && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Last Message</div>
              <p className="text-sm text-gray-900 italic">"{fan.lastMessage}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send Re-engagement Message
          </button>
        </div>
      </div>
    </div>
  );
}
