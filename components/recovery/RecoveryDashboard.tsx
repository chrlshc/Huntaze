'use client';

/**
 * Recovery System Dashboard
 * Real-time monitoring of recovery mechanisms
 */

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface RecoveryStatus {
  timestamp: number;
  status: 'operational' | 'degraded' | 'critical';
  recovery: {
    circuitBreakers: {
      status: string;
      breakers: Record<string, any>;
      summary: {
        total: number;
        open: number;
        halfOpen: number;
        closed: number;
      };
    };
    retrySystem: {
      status: string;
      operations: Record<string, any>;
      summary: {
        totalOperations: number;
        totalRetries: number;
        successfulRetries: number;
      };
    };
    healthChecks: {
      status: string;
      overall: string;
      checks: Record<string, any>;
      uptime: number;
      summary: {
        total: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
      };
    };
    gracefulDegradation: {
      status: string;
      level: number;
      activeRules: string[];
      disabledFeatures: string[];
      timestamp: number;
    };
    autoHealing: {
      status: string;
      actions: Record<string, any>;
      summary: {
        totalActions: number;
        totalAttempts: number;
        successfulHealing: number;
      };
      history?: any[];
    };
  };
}

export default function RecoveryDashboard() {
  const [status, setStatus] = useState<RecoveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/recovery/status?history=true&metrics=true');
      if (!response.ok) throw new Error('Failed to fetch recovery status');
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const triggerAction = async (action: string, target?: string) => {
    try {
      const response = await fetch('/api/recovery/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target })
      });
      
      if (!response.ok) throw new Error('Action failed');
      
      // Refresh status after action
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchStatus, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
      case 'operational':
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'DEGRADED':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'UNHEALTHY':
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
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

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Recovery Status</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="danger" onClick={fetchStatus}>
          Retry
        </Button>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recovery System Dashboard</h2>
          <p className="text-gray-600">Real-time monitoring of system recovery mechanisms</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto-refresh
          </label>
          <Button variant="primary" onClick={fetchStatus}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">System Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
            {status.status.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-lg font-semibold">{formatUptime(status.recovery.healthChecks.uptime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Health Checks</p>
            <p className="text-lg font-semibold">
              {status.recovery.healthChecks.summary.healthy}/{status.recovery.healthChecks.summary.total}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Circuit Breakers</p>
            <p className="text-lg font-semibold">
              {status.recovery.circuitBreakers.summary.closed}/{status.recovery.circuitBreakers.summary.total} Closed
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Degradation Level</p>
            <p className="text-lg font-semibold">Level {status.recovery.gracefulDegradation.level}</p>
          </div>
        </div>
      </div>

      {/* Circuit Breakers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Circuit Breakers</h3>
          <Button
            variant="secondary"
            onClick={() => triggerAction('reset_circuit_breaker')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Reset All
          </Button>
        </div>
        <div className="grid gap-4">
          {Object.entries(status.recovery.circuitBreakers.breakers).map(([name, breaker]: [string, any]) => (
            <div key={name} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-gray-600">
                  {breaker.totalRequests} requests, {breaker.failures} failures ({breaker.failureRate.toFixed(1)}%)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(breaker.state)}`}>
                  {breaker.state}
                </span>
                {breaker.state !== 'CLOSED' && (
                  <Button
                    variant="primary"
                    onClick={() => triggerAction('reset_circuit_breaker', name)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Checks */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Health Checks</h3>
        <div className="grid gap-4">
          {Object.entries(status.recovery.healthChecks.checks).map(([name, check]: [string, any]) => (
            <div key={name} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-gray-600">{check.message}</p>
                <p className="text-xs text-gray-500">
                  Last check: {new Date(check.timestamp).toLocaleTimeString()} ({check.duration}ms)
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(check.status)}`}>
                {check.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Healing */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Auto-Healing Actions</h3>
          <Button
            variant="primary"
            onClick={() => triggerAction('trigger_healing')}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Trigger Healing
          </Button>
        </div>
        <div className="grid gap-4">
          {Object.entries(status.recovery.autoHealing.actions).map(([name, action]: [string, any]) => (
            <div key={name} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-gray-600">
                  {action.totalAttempts} attempts, {action.successfulHealing} successful
                  {action.averageHealingTime > 0 && ` (avg: ${action.averageHealingTime.toFixed(0)}ms)`}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => triggerAction('trigger_healing', name)}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Execute
              </Button>
            </div>
          ))}
        </div>

        {/* Healing History */}
        {status.recovery.autoHealing.history && status.recovery.autoHealing.history.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Recent Healing Actions</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.recovery.autoHealing.history.slice(0, 10).map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <span className="font-medium">{event.action}</span>
                    <span className="text-gray-600 ml-2">{event.message}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${event.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {event.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Graceful Degradation */}
      {status.recovery.gracefulDegradation.level > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Graceful Degradation Active</h3>
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-yellow-700">Degradation Level: {status.recovery.gracefulDegradation.level}</p>
              <p className="text-sm text-yellow-700">Status: {status.recovery.gracefulDegradation.status}</p>
            </div>
            {status.recovery.gracefulDegradation.activeRules.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-800">Active Rules:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {status.recovery.gracefulDegradation.activeRules.map((rule: string) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
            {status.recovery.gracefulDegradation.disabledFeatures.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-800">Disabled Features:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {status.recovery.gracefulDegradation.disabledFeatures.map((feature: string) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(status.timestamp).toLocaleString()}
      </div>
    </div>
  );
}