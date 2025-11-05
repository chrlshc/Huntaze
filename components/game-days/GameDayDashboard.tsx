/**
 * Game Day Dashboard
 * Real-time monitoring and control for active game days
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GameDayExecution {
  executionId: string;
  scenarioId: string;
  status: string;
  startTime: number;
  participants: any[];
  metrics: any;
  timeline: any[];
  issues: any[];
}

interface LiveMetrics {
  activeGameDays: number;
  activeFailures: number;
  systemHealth: {
    status: string;
    services: number;
  };
  recentEvents: any[];
}

export default function GameDayDashboard() {
  const [activeExecutions, setActiveExecutions] = useState<GameDayExecution[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active executions
      const executionsRes = await fetch('/api/game-days/execution?active=true');
      const executionsData = await executionsRes.json();
      
      // Fetch live metrics
      const metricsRes = await fetch('/api/game-days/metrics?live=true');
      const metricsData = await metricsRes.json();

      if (executionsData.success) {
        setActiveExecutions(executionsData.data);
      }
      
      if (metricsData.success) {
        setLiveMetrics(metricsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const abortGameDay = async (executionId: string) => {
    try {
      const response = await fetch(`/api/game-days/execution/${executionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual abort from dashboard' })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to abort game day:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading Game Day Dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Game Day Dashboard</h1>
        <Badge variant={liveMetrics?.systemHealth.status === 'HEALTHY' ? 'default' : 'destructive'}>
          System: {liveMetrics?.systemHealth.status || 'Unknown'}
        </Badge>
      </div> 
     {/* Live Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Game Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveMetrics?.activeGameDays || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{liveMetrics?.activeFailures || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Services Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveMetrics?.systemHealth.services || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={liveMetrics?.systemHealth.status === 'HEALTHY' ? 'default' : 'destructive'}>
              {liveMetrics?.systemHealth.status || 'Unknown'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Active Game Days */}
      <Card>
        <CardHeader>
          <CardTitle>Active Game Days</CardTitle>
        </CardHeader>
        <CardContent>
          {activeExecutions.length === 0 ? (
            <p className="text-gray-500">No active game days</p>
          ) : (
            <div className="space-y-4">
              {activeExecutions.map((execution) => (
                <div key={execution.executionId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{execution.scenarioId}</h3>
                      <p className="text-sm text-gray-600">
                        Started: {new Date(execution.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {Math.floor((Date.now() - execution.startTime) / 1000 / 60)} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={execution.status === 'EXECUTING' ? 'default' : 'secondary'}>
                        {execution.status}
                      </Badge>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => abortGameDay(execution.executionId)}
                      >
                        Abort
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Participants</p>
                      <p className="font-medium">{execution.participants.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Issues</p>
                      <p className="font-medium text-red-600">{execution.issues.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">System Availability</p>
                      <p className="font-medium">{execution.metrics.systemAvailability}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Runbook Compliance</p>
                      <p className="font-medium">
                        {Math.round((execution.metrics.runbookStepsFollowed / execution.metrics.runbookStepsTotal) * 100)}%
                      </p>
                    </div>
                  </div>

                  {execution.issues.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Recent Issues</h4>
                      {execution.issues.slice(-3).map((issue, index) => (
                        <Alert key={index} className="mb-2">
                          <AlertDescription>
                            <span className="font-medium">{issue.severity}:</span> {issue.description}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {!liveMetrics?.recentEvents || liveMetrics.recentEvents.length === 0 ? (
            <p className="text-gray-500">No recent events</p>
          ) : (
            <div className="space-y-2">
              {liveMetrics.recentEvents.slice(0, 10).map((event, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{event.source}:</span> {event.message}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}