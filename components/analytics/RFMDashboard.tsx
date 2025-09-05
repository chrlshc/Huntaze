'use client';

import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, AlertCircle, Crown, Star, 
  UserPlus, RefreshCw, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSegmentRecommendations } from '@/src/utils/rfm-segmentation';

interface RFMDashboardProps {
  onImportData?: any;
}

export function RFMDashboard({ onImportData }: RFMDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<any>({});
  const [distribution, setDistribution] = useState<any>({});
  const [summary, setSummary] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (onImportData) {
      calculateRFM(onImportData);
    } else {
      fetchRFMData();
    }
  }, [onImportData]);

  const fetchRFMData = async () => {
    try {
      const response = await fetch('/api/ofm/rfm/segments');
      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || {});
        setDistribution(data.distribution || {});
        setSummary(data.summary || {});
        setLastUpdated(new Date(data.lastUpdated || Date.now()));
      }
    } catch (error) {
      console.error('Failed to fetch RFM data:', error);
    }
  };

  const calculateRFM = async (importData?: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ofm/rfm/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importData })
      });

      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || {});
        setDistribution(data.distribution || {});
        setSummary(data.summary || {});
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to calculate RFM:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleRecompute = async () => {
    try {
      const response = await fetch('/api/ofm/rfm/recompute', {
        method: 'POST'
      });
      if (response.ok) {
        alert('RFM recomputation scheduled');
      }
    } catch (error) {
      console.error('Failed to schedule recompute:', error);
    }
  };

  const segmentConfig = {
    WHALE: { icon: Crown, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
    VIP: { icon: Star, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    CASUAL: { icon: Users, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    CHURN_RISK: { icon: AlertCircle, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    NEW: { icon: UserPlus, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    UNKNOWN: { icon: Users, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' }
  };

  const totalFans = Object.values(summary).reduce((sum: number, count: any) => sum + (count || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">RFM Segmentation</h2>
          <p className="text-sm text-gray-600">
            Fan value analysis based on Recency, Frequency & Monetary metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => calculateRFM()}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={scheduleRecompute}
            size="sm"
            variant="outline"
          >
            Schedule Recompute
          </Button>
        </div>
      </div>

      {/* Segment Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(segmentConfig).map(([segment, config]) => {
          const count = summary[segment.toLowerCase()] || 0;
          const percentage = totalFans > 0 ? (count / totalFans * 100).toFixed(1) : '0';
          const Icon = config.icon;
          
          return (
            <div key={segment} className="text-center">
              <div className={`${config.bgColor} rounded-lg p-4 mb-2`}>
                <Icon className={`w-8 h-8 ${config.textColor} mx-auto mb-2`} />
                <p className="text-2xl font-bold">{count}</p>
              </div>
              <p className="text-sm font-medium">{segment}</p>
              <p className="text-xs text-gray-500">{percentage}%</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Segment Analysis */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Segment Recommendations</h3>
        
        {Object.entries(segmentConfig).map(([segment, config]) => {
          const count = summary[segment.toLowerCase()] || 0;
          if (count === 0) return null;
          
          const recommendations = getSegmentRecommendations(segment as any);
          const Icon = config.icon;
          
          return (
            <div key={segment} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${config.bgColor} rounded-lg p-2`}>
                    <Icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{segment} ({count} fans)</h4>
                    <p className="text-sm text-gray-600">
                      Priority: <span className={`font-medium ${
                        recommendations.priority === 'high' ? 'text-red-600' :
                        recommendations.priority === 'medium' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>{recommendations.priority}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Message Strategy:</span>
                  <p className="text-gray-600">{recommendations.messageStrategy}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">PPV Strategy:</span>
                  <p className="text-gray-600">{recommendations.ppvStrategy}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Recommended Actions:</span>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    {recommendations.actions.slice(0, 3).map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Fans Preview */}
      {Object.keys(segments).length > 0 && (
        <div className="mt-8">
          <h3 className="font-medium text-gray-900 mb-4">Top Value Fans</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Fan</th>
                  <th className="px-4 py-2 text-left">Segment</th>
                  <th className="px-4 py-2 text-right">Total Spent</th>
                  <th className="px-4 py-2 text-right">Last Active</th>
                  <th className="px-4 py-2 text-center">RFM Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(segments)
                  .filter(([_, data]: [string, any]) => data.segment === 'WHALE' || data.segment === 'VIP')
                  .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.score - a.score)
                  .slice(0, 10)
                  .map(([userId, data]: [string, any]) => {
                    const config = segmentConfig[data.segment];
                    return (
                      <tr key={userId} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="font-medium">{data.username || userId.slice(-8)}</p>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.textColor}`}>
                            {data.segment}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          ${(data.totalSpent || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {data.metrics?.daysSince || 0}d ago
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="text-xs">
                            R{data.recency} F{data.frequency} M{data.monetary}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs text-gray-500 mt-6 text-center">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}
    </div>
  );
}