'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  stepId?: string;
  userId?: string;
  acknowledged: boolean;
  autoResolve: boolean;
  resolvedAt?: string;
  actions?: AlertAction[];
}

interface AlertAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
}

interface SystemAlertsProps {
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAlertAction?: (alertId: string, action: string) => void;
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({
  maxAlerts = 50,
  autoRefresh = true,
  refreshInterval = 15000,
  onAlertAction
}) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity'>('timestamp');

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(`/api/smart-onboarding/analytics/alerts?limit=${maxAlerts}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [maxAlerts]);

  const applyFilters = useCallback(() => {
    let filtered = [...alerts];

    // Apply filter
    switch (filter) {
      case 'unacknowledged':
        filtered = filtered.filter(alert => !alert.acknowledged);
        break;
      case 'critical':
        filtered = filtered.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
        break;
      // 'all' shows everything
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      } else {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

    setFilteredAlerts(filtered);
  }, [alerts, filter, sortBy]);

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAlerts, refreshInterval]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/smart-onboarding/analytics/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/smart-onboarding/analytics/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleAction = (alertId: string, action: string) => {
    if (onAlertAction) {
      onAlertAction(alertId, action);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[severity as keyof typeof colors]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BellIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
            {filteredAlerts.length > 0 && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                {filteredAlerts.length}
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Alerts</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="critical">Critical Only</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="timestamp">Sort by Time</option>
              <option value="severity">Sort by Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No alerts to display</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-4 ${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Alert Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>

                    {/* Alert Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {alert.title}
                            </h3>
                            {getSeverityBadge(alert.severity)}
                            {alert.acknowledged && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                Acknowledged
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {alert.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            <span>Source: {alert.source}</span>
                            {alert.stepId && <span>Step: {alert.stepId}</span>}
                            {alert.userId && <span>User: {alert.userId}</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!alert.acknowledged && (
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Acknowledge
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Alert Actions */}
                      {alert.actions && alert.actions.length > 0 && (
                        <div className="mt-3 flex space-x-2">
                          {alert.actions.map((action) => (
                            <button
                              key={action.action}
                              onClick={() => handleAction(alert.id, action.action)}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                action.type === 'primary' 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : action.type === 'danger'
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SystemAlerts;
