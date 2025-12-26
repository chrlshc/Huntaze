'use client';

import { useCallback, useState, useEffect } from 'react';
import { threeJsMonitor } from '../../lib/monitoring/threeJsMonitor';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: any[];
  healthStatus: string;
}

interface HealthDashboardProps {
  refreshInterval?: number;
  showDetails?: boolean;
}

export default function ThreeJsHealthDashboard({ 
  refreshInterval = 5000,
  showDetails = true 
}: HealthDashboardProps) {
  const [stats, setStats] = useState<ErrorStats>({
    totalErrors: 0,
    errorsByType: {},
    recentErrors: [],
    healthStatus: 'healthy'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  /**
   * Fetch health statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      // Get local stats from monitor
      const healthStatus = threeJsMonitor.getHealthStatus();
      
      // Fetch server-side stats
      const response = await fetch('/api/monitoring/three-js-errors');
      const serverStats = await response.json();

      setStats({
        totalErrors: healthStatus.errorCount,
        errorsByType: healthStatus.stats,
        recentErrors: healthStatus.recentErrors,
        healthStatus: healthStatus.healthy ? 'healthy' : 'unhealthy'
      });
      
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch Three.js health stats:', error);
      setIsLoading(false);
    }
  }, []);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchStats();
    }, 0);

    const interval = window.setInterval(() => {
      void fetchStats();
    }, refreshInterval);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchStats, refreshInterval]);

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  /**
   * Get error type color
   */
  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'webgl': return 'bg-red-500';
      case 'rendering': return 'bg-orange-500';
      case 'performance': return 'bg-yellow-500';
      case 'memory': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Clear errors (for testing)
   */
  const clearErrors = () => {
    threeJsMonitor.clearErrors();
    fetchStats();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Three.js Health Monitor
          </h3>
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.healthStatus)}`}>
              {stats.healthStatus.toUpperCase()}
            </span>
            <Button variant="primary" onClick={fetchStats} className="text-xs">
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Errors */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalErrors}
            </div>
            <div className="text-sm text-gray-600">Total Errors</div>
          </div>

          {/* Error Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.recentErrors.length}
            </div>
            <div className="text-sm text-gray-600">Recent Errors (10min)</div>
          </div>

          {/* Health Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className={`text-2xl font-bold ${stats.healthStatus === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {stats.healthStatus === 'healthy' ? '100%' : '0%'}
            </div>
            <div className="text-sm text-gray-600">Health Score</div>
          </div>
        </div>

        {/* Error Types Breakdown */}
        {Object.keys(stats.errorsByType).length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Errors by Type</h4>
            <div className="space-y-2">
              {Object.entries(stats.errorsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getErrorTypeColor(type)} mr-2`}></div>
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {showDetails && stats.recentErrors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Recent Errors</h4>
              <Button variant="danger" onClick={clearErrors} className="text-xs text-red-600 hover:text-red-800">
                Clear All
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.recentErrors.map((error, index) => (
                <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getErrorTypeColor(error.type)}`}>
                      {error.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(error.timestamp)}
                    </span>
                  </div>
                  <div className="text-gray-900 font-medium mb-1">
                    {error.message}
                  </div>
                  {error.component && (
                    <div className="text-gray-600 text-xs">
                      Component: {error.component}
                    </div>
                  )}
                  {error.url && (
                    <div className="text-gray-600 text-xs">
                      URL: {error.url}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Errors State */}
        {stats.totalErrors === 0 && (
          <div className="text-center py-8">
            <div className="text-green-500 text-4xl mb-2">✓</div>
            <div className="text-lg font-medium text-gray-900 mb-1">All Systems Healthy</div>
            <div className="text-sm text-gray-600">No Three.js errors detected</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Monitoring: WebGL, Rendering, Performance, Memory
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="primary" 
              onClick={() => window.open('/docs/THREE_JS_TROUBLESHOOTING_GUIDE.md', '_blank')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Troubleshooting Guide
            </Button>
            <span className="text-gray-300">|</span>
            <Button 
              variant="primary" 
              onClick={() => window.open('/api/monitoring/three-js-errors', '_blank')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Raw Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
