'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Crown } from 'lucide-react';
import { formatTrackingLink, calculateABTestWinner } from '@/src/utils/tracking-links';

interface ABTestResultsProps {
  testId: string;
  platform: string;
}

export function ABTestResults({ testId, platform }: ABTestResultsProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestResults();
    const interval = setInterval(fetchTestResults, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [testId]);

  const fetchTestResults = async () => {
    try {
      const response = await fetch(`/api/tracking/tests/${testId}`);
      if (response.ok) {
        const data = await response.json();
        setTest(data);
      }
    } catch (error) {
      console.error('Failed to fetch test results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  const winner = calculateABTestWinner(test);
  const hasSignificantData = test.metrics.totalClicks >= 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold">A/B Test Results</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            test.status === 'active' ? 'bg-green-100 text-green-700' : 
            test.status === 'completed' ? 'bg-gray-100 text-gray-700' : 
            'bg-yellow-100 text-yellow-700'
          }`}>
            {test.status}
          </span>
        </div>
        {winner && hasSignificantData && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Crown className="w-4 h-4" />
            <span>Winner: Variant {winner}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Clicks</span>
          </div>
          <p className="text-2xl font-bold">{test.metrics.totalClicks}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Conversions</span>
          </div>
          <p className="text-2xl font-bold">{test.metrics.totalConversions}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold">${(test.metrics.totalRevenue / 100).toFixed(2)}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Conv. Rate</span>
          </div>
          <p className="text-2xl font-bold">{test.metrics.conversionRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-4">
        {test.variants.map((variant: any) => {
          const isWinner = winner === variant.id && hasSignificantData;
          const ctr = variant.clicks > 0 ? (variant.conversions / variant.clicks * 100) : 0;
          const revenuePerClick = variant.clicks > 0 ? (variant.revenue / variant.clicks / 100) : 0;
          
          return (
            <div 
              key={variant.id}
              className={`border rounded-lg p-4 ${
                isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    isWinner ? 'bg-green-600 text-white' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {variant.id}
                  </span>
                  <div>
                    <h4 className="font-medium">{variant.name}</h4>
                    <p className="text-sm text-gray-600">{variant.caption}</p>
                  </div>
                </div>
                {isWinner && <Crown className="w-5 h-5 text-green-600" />}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Clicks</span>
                  <p className="font-semibold">{variant.clicks}</p>
                </div>
                <div>
                  <span className="text-gray-500">Conversions</span>
                  <p className="font-semibold">{variant.conversions}</p>
                </div>
                <div>
                  <span className="text-gray-500">CTR</span>
                  <p className="font-semibold">{ctr.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-gray-500">$/Click</span>
                  <p className="font-semibold">${revenuePerClick.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <code className="text-xs text-gray-500">
                  {formatTrackingLink(variant.trackingLink)}
                </code>
              </div>
            </div>
          );
        })}
      </div>

      {!hasSignificantData && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Need at least 100 clicks to determine a statistically significant winner.
            Current: {test.metrics.totalClicks}/100
          </p>
        </div>
      )}
    </div>
  );
}