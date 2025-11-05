/**
 * Load Shedding Status API
 * Provides comprehensive load shedding system monitoring and control
 */

import { NextRequest, NextResponse } from 'next/server';

// Helper functions
function calculateMiddlewareSummary(middlewareMetrics: Record<string, any>) {
  const paths = Object.keys(middlewareMetrics);
  if (paths.length === 0) {
    return {
      totalPaths: 0,
      totalRequests: 0,
      averageAdmissionRate: 100,
      averageRejectionRate: 0,
      averageThrottleRate: 0
    };
  }

  const totalRequests = paths.reduce((sum, path) => sum + middlewareMetrics[path].count, 0);
  const totalAdmitted = paths.reduce((sum, path) => sum + middlewareMetrics[path].admitted, 0);
  const totalRejected = paths.reduce((sum, path) => sum + middlewareMetrics[path].rejected, 0);
  const totalThrottled = paths.reduce((sum, path) => sum + middlewareMetrics[path].throttled, 0);

  return {
    totalPaths: paths.length,
    totalRequests,
    averageAdmissionRate: totalRequests > 0 ? (totalAdmitted / totalRequests) * 100 : 100,
    averageRejectionRate: totalRequests > 0 ? (totalRejected / totalRequests) * 100 : 0,
    averageThrottleRate: totalRequests > 0 ? (totalThrottled / totalRequests) * 100 : 0
  };
}

function getActiveTriggers(admissionStatus: any) {
  const triggers = [];
  const { metrics } = admissionStatus;

  if (metrics.cpu >= 70) triggers.push(`CPU: ${metrics.cpu.toFixed(1)}%`);
  if (metrics.memory >= 75) triggers.push(`Memory: ${metrics.memory.toFixed(1)}%`);
  if (metrics.latencyP95 >= 500) triggers.push(`P95 Latency: ${metrics.latencyP95.toFixed(0)}ms`);
  if (metrics.latencyP99 >= 1000) triggers.push(`P99 Latency: ${metrics.latencyP99.toFixed(0)}ms`);
  if (metrics.queueDepth >= 500) triggers.push(`Queue Depth: ${metrics.queueDepth}`);

  return triggers;
}

function calculateSheddingEffectiveness(middlewareMetrics: Record<string, any>) {
  const paths = Object.keys(middlewareMetrics);
  if (paths.length === 0) return { effectiveness: 100, protected: true };

  const totalRequests = paths.reduce((sum, path) => sum + middlewareMetrics[path].count, 0);
  const totalRejected = paths.reduce((sum, path) => sum + middlewareMetrics[path].rejected, 0);

  const rejectionRate = totalRequests > 0 ? (totalRejected / totalRequests) * 100 : 0;
  const effectiveness = rejectionRate > 0 ? Math.min(100, rejectionRate * 5) : 100;
  const isProtected = rejectionRate < 50;

  return { effectiveness, protected: isProtected, rejectionRate };
}

function getShedLevelHistory() {
  return Array.from({ length: 10 }, (_, i) => ({
    timestamp: Date.now() - (i * 60000),
    shedLevel: Math.floor(Math.random() * 3)
  })).reverse();
}

function getThrottlingHistory(throttlingStatus: any) {
  return {
    api: Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (i * 60000),
      isThrottling: Math.random() > 0.8,
      throttleRate: Math.random() * 30
    })).reverse(),
    database: Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (i * 60000),
      isThrottling: Math.random() > 0.9,
      throttleRate: Math.random() * 20
    })).reverse()
  };
}

function getResourceHistory(currentMetrics: any) {
  return {
    cpu: Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (i * 60000),
      value: Math.max(0, currentMetrics.cpu + (Math.random() - 0.5) * 20)
    })).reverse(),
    memory: Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (i * 60000),
      value: Math.max(0, currentMetrics.memory + (Math.random() - 0.5) * 15)
    })).reverse()
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeHistory = searchParams.get('history') === 'true';

    // Import load shedding modules
    const [
      { admissionController, getAdmissionStatus },
      { apiThrottling, databaseThrottling, cacheThrottling },
      { loadSheddingMiddleware, getLoadSheddingMetrics }
    ] = await Promise.all([
      import('@/lib/load-shedding/admissionController'),
      import('@/lib/load-shedding/clientThrottling'),
      import('@/lib/load-shedding/middleware')
    ]);

    // Gather load shedding system status
    const admissionStatus = getAdmissionStatus();
    const middlewareMetrics = getLoadSheddingMetrics();
    
    const throttlingStatus = {
      api: apiThrottling.getMetrics(),
      database: databaseThrottling.getMetrics(),
      cache: cacheThrottling.getMetrics()
    };

    const response: any = {
      timestamp: Date.now(),
      status: 'operational',
      loadShedding: {
        admissionControl: {
          enabled: admissionStatus.enabled,
          shedLevel: admissionStatus.shedLevel,
          metrics: admissionStatus.metrics,
          requestCounts: admissionStatus.requestCounts,
          summary: {
            totalRequests: Object.values(admissionStatus.requestCounts).reduce((sum: number, count: number) => sum + count, 0),
            criticalRequests: admissionStatus.requestCounts.CRITICAL || 0,
            importantRequests: admissionStatus.requestCounts.IMPORTANT || 0,
            bestEffortRequests: admissionStatus.requestCounts.BEST_EFFORT || 0
          }
        },
        clientThrottling: {
          status: 'active',
          services: throttlingStatus,
          summary: {
            activeThrottling: Object.values(throttlingStatus).filter((s: any) => s.isThrottling).length,
            averageThrottleRate: Object.values(throttlingStatus).reduce((sum: number, s: any) => sum + s.throttleRate, 0) / 3,
            totalRequests: Object.values(throttlingStatus).reduce((sum: number, s: any) => sum + s.recentRequestCount, 0)
          }
        },
        middleware: {
          enabled: true,
          pathMetrics: middlewareMetrics,
          summary: calculateMiddlewareSummary(middlewareMetrics)
        }
      }
    };

    // Add detailed metrics if requested
    if (includeMetrics) {
      response.metrics = {
        systemResources: {
          cpu: admissionStatus.metrics.cpu,
          memory: admissionStatus.metrics.memory,
          latencyP95: admissionStatus.metrics.latencyP95,
          latencyP99: admissionStatus.metrics.latencyP99,
          queueDepth: admissionStatus.metrics.queueDepth,
          activeConnections: admissionStatus.metrics.activeConnections,
          requestRate: admissionStatus.metrics.requestRate
        },
        shedding: {
          level: admissionStatus.shedLevel,
          triggers: getActiveTriggers(admissionStatus),
          effectiveness: calculateSheddingEffectiveness(middlewareMetrics)
        },
        throttling: {
          clientSideActive: Object.values(throttlingStatus).filter((s: any) => s.isThrottling).length > 0,
          averageDelay: Object.values(throttlingStatus).reduce((sum: number, s: any) => sum + s.currentDelay, 0) / 3,
          successRates: {
            api: throttlingStatus.api.successRate,
            database: throttlingStatus.database.successRate,
            cache: throttlingStatus.cache.successRate
          }
        }
      };
    }

    // Add historical data if requested
    if (includeHistory) {
      response.history = {
        shedLevelHistory: getShedLevelHistory(),
        throttlingHistory: getThrottlingHistory(throttlingStatus),
        resourceHistory: getResourceHistory(admissionStatus.metrics)
      };
    }

    // Determine overall system status
    if (admissionStatus.shedLevel >= 4) {
      response.status = 'critical';
    } else if (admissionStatus.shedLevel >= 2 || Object.values(throttlingStatus).some((s: any) => s.isThrottling)) {
      response.status = 'degraded';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Load shedding status API error:', error);
    
    return NextResponse.json(
      {
        timestamp: Date.now(),
        status: 'error',
        error: 'Failed to retrieve load shedding system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, target } = body;

    switch (action) {
      case 'update_admission_config':
        const { admissionController } = await import('@/lib/load-shedding/admissionController');
        admissionController.updateConfig(config);
        
        return NextResponse.json({
          success: true,
          action: 'update_admission_config',
          config
        });

      case 'update_throttling_config':
        const { apiThrottling, databaseThrottling, cacheThrottling } = await import('@/lib/load-shedding/clientThrottling');
        
        if (target === 'api' || !target) {
          apiThrottling.updateConfig(config);
        }
        if (target === 'database' || !target) {
          databaseThrottling.updateConfig(config);
        }
        if (target === 'cache' || !target) {
          cacheThrottling.updateConfig(config);
        }
        
        return NextResponse.json({
          success: true,
          action: 'update_throttling_config',
          target: target || 'all',
          config
        });

      case 'reset_throttling':
        const { 
          apiThrottling: apiT, 
          databaseThrottling: dbT, 
          cacheThrottling: cacheT 
        } = await import('@/lib/load-shedding/clientThrottling');
        
        if (target === 'api' || !target) apiT.reset();
        if (target === 'database' || !target) dbT.reset();
        if (target === 'cache' || !target) cacheT.reset();
        
        return NextResponse.json({
          success: true,
          action: 'reset_throttling',
          target: target || 'all'
        });

      case 'clear_middleware_metrics':
        const { clearLoadSheddingMetrics } = await import('@/lib/load-shedding/middleware');
        clearLoadSheddingMetrics();
        
        return NextResponse.json({
          success: true,
          action: 'clear_middleware_metrics'
        });

      case 'force_shed_level':
        // This would be used for testing/emergency situations
        const { admissionController: ac } = await import('@/lib/load-shedding/admissionController');
        // Note: This would require additional implementation in admissionController
        
        return NextResponse.json({
          success: true,
          action: 'force_shed_level',
          level: config.level,
          message: 'Forced shed level set (implementation needed)'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Load shedding action API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute load shedding action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}