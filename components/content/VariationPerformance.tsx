'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface VariationStats {
  id: string;
  name: string;
  distributionPercentage: number;
  views: number;
  engagements: number;
  engagementRate: number;
  viewShare: number;
  isActive: boolean;
  isWinner: boolean;
  events: Record<string, number>;
}

interface Winner {
  winnerId: string | null;
  winnerName: string | null;
  confidence: number;
  isSignificant: boolean;
  recommendation: string;
}

interface VariationPerformanceProps {
  contentId: string;
}

export default function VariationPerformance({ contentId }: VariationPerformanceProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variations, setVariations] = useState<VariationStats[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, [contentId]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/variations/${contentId}/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setVariations(data.variations);
      setWinner(data.winner);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading performance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Winner Announcement */}
      {winner && winner.isSignificant && (
        <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                Winner: {winner.winnerName}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {winner.recommendation}
              </p>
              <div className="mt-2 text-xs text-green-600">
                Confidence: {winner.confidence}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Variations</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalVariations}</div>
          </Card>
          <Card className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Views</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalViews.toLocaleString()}</div>
          </Card>
          <Card className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Engagements</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalEngagements.toLocaleString()}</div>
          </Card>
          <Card className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Overall Rate</div>
            <div className="text-2xl font-bold text-gray-900">{summary.overallEngagementRate}%</div>
          </Card>
        </div>
      )}

      {/* Variation Comparison */}
      <Card className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Variation Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variations.map((variation) => (
                <tr key={variation.id} className={variation.isWinner ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {variation.name}
                      </div>
                      {variation.isWinner && (
                        <svg className="ml-2 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{variation.distributionPercentage}%</div>
                    <div className="text-xs text-gray-500">
                      Actual: {variation.viewShare}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{variation.views.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{variation.engagements.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {variation.engagementRate}%
                      </div>
                      {variation.engagementRate > (summary?.overallEngagementRate || 0) && (
                        <svg className="ml-1 w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      variation.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {variation.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Event Breakdown */}
      <Card className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Breakdown</h3>
        <div className="space-y-4">
          {variations.map((variation) => (
            <div key={variation.id} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="font-medium text-gray-900 mb-2">{variation.name}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(variation.events).map(([eventType, count]) => (
                  <div key={eventType} className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 capitalize">{eventType}</div>
                    <div className="text-lg font-semibold text-gray-900">{count}</div>
                  </div>
                ))}
                {Object.keys(variation.events).length === 0 && (
                  <div className="text-sm text-gray-500 col-span-4">No events tracked yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Statistics
        </button>
      </div>
    </div>
  );
}
