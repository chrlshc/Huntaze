'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  DollarSign,
  Clock,
  Heart,
  ShoppingCart,
  UserCheck
} from 'lucide-react';
import { FanSegment, FanSegmentData } from '@/lib/of/fan-segmentation';
import { RelanceStrategy, RelanceType } from '@/lib/of/smart-relance';

interface SegmentStats {
  segment: FanSegment;
  count: number;
  totalValue: number;
  avgValue: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export default function FanSegmentationDashboard({ accountId }: { accountId: string }) {
  const [segmentStats, setSegmentStats] = useState<SegmentStats[]>([]);
  const [relanceStrategies, setRelanceStrategies] = useState<RelanceStrategy[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<FanSegment | null>(null);
  const [loading, setLoading] = useState(true);

  // Segment configuration
  const segmentConfig: Record<FanSegment, {
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = {
    [FanSegment.VIP_WHALE]: {
      icon: <DollarSign className="w-5 h-5" />,
      color: 'purple',
      description: '$500+ lifetime spend'
    },
    [FanSegment.BIG_SPENDER]: {
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'blue',
      description: '$100-499 lifetime spend'
    },
    [FanSegment.REGULAR]: {
      icon: <UserCheck className="w-5 h-5" />,
      color: 'green',
      description: '$20-99 lifetime spend'
    },
    [FanSegment.WINDOW_SHOPPER]: {
      icon: <Users className="w-5 h-5" />,
      color: 'gray',
      description: 'No purchases yet'
    },
    [FanSegment.CHURNED]: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'red',
      description: 'Inactive 30+ days'
    },
    [FanSegment.AT_RISK]: {
      icon: <Clock className="w-5 h-5" />,
      color: 'orange',
      description: 'Inactive 7-29 days'
    },
    [FanSegment.NEW_FAN]: {
      icon: <Heart className="w-5 h-5" />,
      color: 'pink',
      description: 'Joined < 7 days ago'
    },
    [FanSegment.HIGH_ENGAGEMENT]: {
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'indigo',
      description: 'Very active & engaged'
    },
    [FanSegment.PPV_BUYER]: {
      icon: <DollarSign className="w-5 h-5" />,
      color: 'yellow',
      description: 'Buys PPV regularly'
    },
    [FanSegment.TIPPER]: {
      icon: <Heart className="w-5 h-5" />,
      color: 'teal',
      description: 'Tips frequently'
    }
  };

  useEffect(() => {
    loadSegmentationData();
    loadRelanceStrategies();
  }, [accountId]);

  const loadSegmentationData = async () => {
    try {
      const response = await fetch(`/api/of/segmentation/${accountId}`);
      const data = await response.json();
      
      const stats = Object.entries(data.segments).map(([segment, fans]: [string, any]) => ({
        segment: segment as FanSegment,
        count: fans.length,
        totalValue: fans.reduce((sum: number, f: any) => sum + f.lifetimeValue, 0),
        avgValue: fans.length > 0 ? fans.reduce((sum: number, f: any) => sum + f.lifetimeValue, 0) / fans.length : 0,
        ...segmentConfig[segment as FanSegment]
      }));

      setSegmentStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load segmentation data:', error);
      setLoading(false);
    }
  };

  const loadRelanceStrategies = async () => {
    try {
      const response = await fetch(`/api/of/relance/${accountId}`);
      const data = await response.json();
      setRelanceStrategies(data.strategies);
    } catch (error) {
      console.error('Failed to load relance strategies:', error);
    }
  };

  const getRelanceIcon = (type: RelanceType) => {
    switch (type) {
      case RelanceType.ABANDONED_PPV:
        return <ShoppingCart className="w-4 h-4" />;
      case RelanceType.INACTIVE_VIP:
        return <AlertCircle className="w-4 h-4" />;
      case RelanceType.WIN_BACK:
        return <Heart className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Segment Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {segmentStats.map((stat) => (
          <button
            key={stat.segment}
            onClick={() => setSelectedSegment(
              selectedSegment === stat.segment ? null : stat.segment
            )}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedSegment === stat.segment 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className={`inline-flex p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 mb-3`}>
              {stat.icon}
            </div>
            <h3 className="font-semibold text-lg">{stat.count}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {stat.segment.replace(/_/g, ' ').toLowerCase()}
            </p>
            <p className="text-xs text-gray-500">
              ${stat.avgValue.toFixed(0)} avg
            </p>
          </button>
        ))}
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">
            {selectedSegment.replace(/_/g, ' ')} Details
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {segmentConfig[selectedSegment].description}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Fans</p>
              <p className="text-2xl font-bold">
                {segmentStats.find(s => s.segment === selectedSegment)?.count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold">
                ${segmentStats.find(s => s.segment === selectedSegment)?.totalValue.toFixed(0) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Value</p>
              <p className="text-2xl font-bold">
                ${segmentStats.find(s => s.segment === selectedSegment)?.avgValue.toFixed(0) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">% of Total</p>
              <p className="text-2xl font-bold">
                {((segmentStats.find(s => s.segment === selectedSegment)?.count || 0) / 
                  segmentStats.reduce((sum, s) => sum + s.count, 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Relance Suggestions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Smart Relance Opportunities</h3>
          <span className="text-sm text-gray-500">
            ${relanceStrategies.reduce((sum, s) => sum + s.expectedValue, 0).toFixed(0)} potential
          </span>
        </div>

        <div className="space-y-3">
          {relanceStrategies.slice(0, 5).map((strategy, index) => (
            <div 
              key={`${strategy.fanId}-${index}`}
              className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 transition-colors"
            >
              <div className={`p-2 rounded-lg ${getPriorityColor(strategy.priority)}`}>
                {getRelanceIcon(strategy.strategyType)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="font-medium">
                    {strategy.strategyType.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-sm font-semibold text-green-600">
                    ${strategy.expectedValue}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {strategy.reason}
                </p>
                <p className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded italic">
                  "{strategy.suggestedMessage}"
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Send Now
                  </button>
                  <button className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {relanceStrategies.length > 5 && (
          <button className="w-full mt-4 py-2 text-purple-600 dark:text-purple-400 font-medium hover:underline">
            View all {relanceStrategies.length} opportunities
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button className="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
          <TrendingUp className="w-5 h-5 mb-2" />
          <h4 className="font-semibold mb-1">VIP Campaign</h4>
          <p className="text-sm opacity-90">Target your top spenders</p>
        </button>
        
        <button className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Heart className="w-5 h-5 mb-2" />
          <h4 className="font-semibold mb-1">Win-Back Campaign</h4>
          <p className="text-sm opacity-90">Re-engage inactive fans</p>
        </button>
        
        <button className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
          <Users className="w-5 h-5 mb-2" />
          <h4 className="font-semibold mb-1">New Fan Nurture</h4>
          <p className="text-sm opacity-90">Convert new subscribers</p>
        </button>
      </div>
    </div>
  );
}