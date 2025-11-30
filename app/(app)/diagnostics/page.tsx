'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


/**
 * Performance Diagnostics Dashboard
 * UI for running diagnostics and viewing results
 */

import { useState } from 'react';
import { DiagnosticReport, Bottleneck, Recommendation } from '@/lib/diagnostics';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function DiagnosticsPage() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const startDiagnostic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await response.json();
      if (data.status === 'started') {
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Failed to start diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopDiagnostic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      const data = await response.json();
      if (data.report) {
        setReport(data.report);
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to stop diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetDiagnostic = async () => {
    setLoading(true);
    try {
      await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      setReport(null);
    } catch (error) {
      console.error('Failed to reset diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Performance Diagnostics</h1>

      {/* Controls */}
      <Card className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4">
          <Button variant="primary" onClick={startDiagnostic} disabled={isRunning || loading}>
            {loading ? 'Loading...' : 'Start Diagnostic'}
          </Button>
          <Button variant="secondary" onClick={stopDiagnostic} disabled={!isRunning || loading}>
            Stop & Generate Report
          </Button>
          <Button variant="secondary" onClick={resetDiagnostic} disabled={loading}>
            Reset
          </Button>
        </div>
        {isRunning && (
          <div className="mt-4 text-sm text-blue-600">
            ⚡ Diagnostic session is running... Navigate through the app to collect data.
          </div>
        )}
      </Card>

      {/* Report */}
      {report && (
        <>
          {/* Summary */}
          <Card className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">Total Bottleneck Time</div>
                <div className="text-2xl font-bold text-blue-600">
                  {report.estimatedImpact.totalBottleneckTime.toFixed(0)}ms
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-gray-600">Estimated Improvement</div>
                <div className="text-2xl font-bold text-green-600">
                  {report.estimatedImpact.estimatedImprovement}%
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-gray-600">Quick Wins</div>
                <div className="text-2xl font-bold text-purple-600">
                  {report.estimatedImpact.quickWins.length}
                </div>
              </div>
            </div>
          </Card>

          {/* Bottlenecks */}
          <Card className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Bottlenecks</h2>
            {report.bottlenecks.length === 0 ? (
              <p className="text-gray-600">No bottlenecks detected! 🎉</p>
            ) : (
              <div className="space-y-4">
                {report.bottlenecks.map((bottleneck: Bottleneck, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getImpactColor(
                            bottleneck.impact
                          )}`}
                        >
                          {bottleneck.impact}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">
                          {bottleneck.type}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-gray-600">
                        {bottleneck.currentTime.toFixed(2)}ms
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">
                      {bottleneck.description}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Location: {bottleneck.location}
                    </p>
                    <p className="text-sm text-blue-600">
                      💡 {bottleneck.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recommendations */}
          <Card className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
            {report.recommendations.length === 0 ? (
              <p className="text-gray-600">No recommendations at this time.</p>
            ) : (
              <div className="space-y-4">
                {report.recommendations.map((rec: Recommendation, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{rec.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Priority: {rec.priority}/10
                        </span>
                        <span
                          className={`text-xs font-semibold ${getEffortColor(
                            rec.effort
                          )}`}
                        >
                          {rec.effort} effort
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {rec.description}
                    </p>
                    <p className="text-sm text-green-600">
                      📈 {rec.estimatedImprovement}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Raw Metrics */}
          <Card className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Raw Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Database</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    Total Queries: {report.rawMetrics.database.totalQueries}
                  </li>
                  <li>
                    Avg Duration:{' '}
                    {report.rawMetrics.database.avgDuration.toFixed(2)}ms
                  </li>
                  <li>
                    Slow Queries: {report.rawMetrics.database.slowQueries.length}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rendering</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    Total Renders: {report.rawMetrics.rendering.totalRenders}
                  </li>
                  <li>
                    Avg Render Time:{' '}
                    {report.rawMetrics.rendering.avgRenderTime.toFixed(2)}ms
                  </li>
                  <li>
                    Slow Renders:{' '}
                    {report.rawMetrics.rendering.slowRenders.length}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Requests</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    Total Requests: {report.rawMetrics.requests.totalRequests}
                  </li>
                  <li>
                    Unique Endpoints:{' '}
                    {report.rawMetrics.requests.uniqueEndpoints}
                  </li>
                  <li>
                    Duplicates:{' '}
                    {report.rawMetrics.requests.duplicateRequests.length}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Monitoring</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    Avg Overhead:{' '}
                    {report.rawMetrics.monitoring.avgOverheadPerRequest.toFixed(
                      2
                    )}
                    ms
                  </li>
                  <li>
                    Total Overhead:{' '}
                    {report.rawMetrics.monitoring.totalOverhead.toFixed(2)}ms
                  </li>
                  <li>
                    Memory Usage:{' '}
                    {(
                      report.rawMetrics.monitoring.memoryUsage /
                      1024 /
                      1024
                    ).toFixed(2)}
                    MB
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
