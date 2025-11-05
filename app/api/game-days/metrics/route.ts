/**
 * Game Day Metrics API
 * Real-time metrics and RTO/RPO measurement
 */

import { NextRequest, NextResponse } from 'next/server';
import { scenarioRunner } from '@/lib/game-days/scenarioRunner';
import { chaosInjector } from '@/lib/game-days/chaosInjector';

// GET /api/game-days/metrics - Get real-time metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    const live = searchParams.get('live') === 'true';

    if (executionId) {
      // Get metrics for specific execution
      const execution = scenarioRunner.getExecution(executionId);
      if (!execution) {
        return NextResponse.json(
          { success: false, error: 'Execution not found' },
          { status: 404 }
        );
      }

      const metrics = {
        execution: {
          id: execution.executionId,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          duration: execution.endTime ? 
            (execution.endTime - execution.startTime) / 1000 : 
            (Date.now() - execution.startTime) / 1000
        },
        performance: execution.metrics,
        timeline: execution.timeline.slice(-10), // Last 10 events
        issues: execution.issues,
        activeFailures: chaosInjector.getActiveFailures().filter(f => 
          f.parameters.executionId === executionId
        )
      };

      return NextResponse.json({
        success: true,
        data: metrics
      });
    }

    if (live) {
      // Get live system metrics
      const activeExecutions = scenarioRunner.getActiveExecutions();
      const activeFailures = chaosInjector.getActiveFailures();
      
      const liveMetrics = {
        activeGameDays: activeExecutions.length,
        activeFailures: activeFailures.length,
        systemHealth: await getSystemHealth(),
        recentEvents: activeExecutions.flatMap(e => 
          e.timeline.slice(-5)
        ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
      };

      return NextResponse.json({
        success: true,
        data: liveMetrics
      });
    }

    // Get historical metrics
    const allExecutions = scenarioRunner.getAllExecutions();
    const completedExecutions = allExecutions.filter(e => e.status === 'COMPLETED');
    
    const historicalMetrics = {
      totalExecutions: allExecutions.length,
      completedExecutions: completedExecutions.length,
      successRate: completedExecutions.length / allExecutions.length * 100,
      averageMetrics: calculateAverageMetrics(completedExecutions),
      trendsLast30Days: calculateTrends(completedExecutions, 30),
      topIssues: getTopIssues(completedExecutions)
    };

    return NextResponse.json({
      success: true,
      data: historicalMetrics
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

async function getSystemHealth() {
  // Integrate with existing health checks
  try {
    const { healthChecker } = await import('@/lib/recovery/healthChecker');
    const health = await healthChecker.runAllChecks();
    
    return {
      status: health.status,
      services: health.services?.length || 0,
      lastCheck: Date.now()
    };
  } catch (error) {
    return {
      status: 'UNKNOWN',
      services: 0,
      lastCheck: Date.now(),
      error: 'Health check unavailable'
    };
  }
}

function calculateAverageMetrics(executions: any[]) {
  if (executions.length === 0) return null;

  const totals = executions.reduce((acc, exec) => {
    const metrics = exec.metrics;
    return {
      detectionTime: acc.detectionTime + (metrics.detectionTime || 0),
      responseTime: acc.responseTime + (metrics.responseTime || 0),
      recoveryTime: acc.recoveryTime + (metrics.recoveryTime || 0),
      systemAvailability: acc.systemAvailability + (metrics.systemAvailability || 0),
      runbookCompliance: acc.runbookCompliance + 
        ((metrics.runbookStepsFollowed / metrics.runbookStepsTotal) * 100 || 0)
    };
  }, {
    detectionTime: 0,
    responseTime: 0,
    recoveryTime: 0,
    systemAvailability: 0,
    runbookCompliance: 0
  });

  const count = executions.length;
  return {
    detectionTime: totals.detectionTime / count,
    responseTime: totals.responseTime / count,
    recoveryTime: totals.recoveryTime / count,
    systemAvailability: totals.systemAvailability / count,
    runbookCompliance: totals.runbookCompliance / count
  };
}

function calculateTrends(executions: any[], days: number) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const recentExecutions = executions.filter(e => e.startTime > cutoff);
  
  // Group by week
  const weeklyData = recentExecutions.reduce((acc, exec) => {
    const week = Math.floor((exec.startTime - cutoff) / (7 * 24 * 60 * 60 * 1000));
    if (!acc[week]) acc[week] = [];
    acc[week].push(exec);
    return acc;
  }, {} as Record<number, any[]>);

  return Object.entries(weeklyData).map(([week, execs]) => ({
    week: parseInt(week),
    executions: execs.length,
    averageDetectionTime: execs.reduce((sum, e) => sum + (e.metrics.detectionTime || 0), 0) / execs.length,
    averageRecoveryTime: execs.reduce((sum, e) => sum + (e.metrics.recoveryTime || 0), 0) / execs.length,
    successRate: execs.filter(e => e.status === 'COMPLETED').length / execs.length * 100
  }));
}

function getTopIssues(executions: any[]) {
  const allIssues = executions.flatMap(e => e.issues || []);
  
  // Count issues by category and severity
  const issueCounts = allIssues.reduce((acc, issue) => {
    const key = `${issue.category}-${issue.severity}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(issueCounts)
    .map(([key, count]) => {
      const [category, severity] = key.split('-');
      return { category, severity, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}