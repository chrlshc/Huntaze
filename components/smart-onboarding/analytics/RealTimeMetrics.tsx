'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  MinusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface MetricData {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  threshold: {
    good: number;
    warning: number;
  };
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface RealTimeMetricsProps {
  refreshInterval?: number;
  onMetricAlert?: (metric: MetricData) => void;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  refreshInterval = 10000,
  onMetricAlert
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/smart-onboarding/analytics/real-time-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setLastUpdated(new Date());
        
        // Check for alerts
        if (onMetricAlert) {
          data.metrics.forEach((metric: MetricData) => {
            if (metric.value < metric.threshold.warning) {
              onMetricAlert(metric);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricStatus = (metric: MetricData) => {
    if (metric.value >= metric.threshold.good) return 'good';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string, changePercent: number) => {
    const iconClass = "w-4 h-4";
    
    if (Math.abs(changePercent) < 1) {
      return <MinusIcon className={`${iconClass} text-gray-500`} />;
    }
    
    if (trend === 'up') {
      return <ArrowTrendingUpIcon className={`${iconClass} text-green-500`} />;
    } else {
      return <ArrowTrendingDownIcon className={`${iconClass} text-red-500`} />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    } else if (unit === 's') {
      return `${Math.round(value)}s`;
    } else if (unit === 'users') {
      return value.toString();
    }
    return `${value.toFixed(2)}${unit}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Real-Time Metrics</h2>
        {lastUpdated && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              Live • Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {metrics.map((metric, index) => {
            const status = getMetricStatus(metric);
            const statusColor = getStatusColor(status);
            
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow border-l-4 p-6 ${statusColor}`}
              >
                {/* Metric Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
                  {status === 'critical' && (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Metric Value */}
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.unit)}
                  </span>
                </div>

                {/* Trend and Change */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend, metric.changePercent)}
                    <span className={`text-sm font-medium ${
                      metric.changePercent > 0 ? 'text-green-600' : 
                      metric.changePercent < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {Math.abs(metric.changePercent).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    vs {formatValue(metric.previousValue, metric.unit)}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${
                      status === 'good' ? 'text-green-600' :
                      status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-1 bg-gray-200 rounded-full h-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min(100, (metric.value / metric.threshold.good) * 100)}%` 
                      }}
                      transition={{ duration: 0.5 }}
                      className={`h-1 rounded-full ${
                        status === 'good' ? 'bg-green-500' :
                        status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Critical Alerts */}
      {metrics.some(m => getMetricStatus(m) === 'critical') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-red-800">Critical Metrics Alert</h3>
          </div>
          <div className="text-sm text-red-700">
            {metrics.filter(m => getMetricStatus(m) === 'critical').length} metric(s) 
            are below critical thresholds and require immediate attention.
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeMetrics;