/**
 * Recovery System Status API
 * Provides comprehensive recovery system monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const includeMetrics = searchParams.get('metrics') === 'true';

    // Import recovery modules
    const [
      { circuitBreakerManager },
      { retryManager },
      { healthChecker },
      { degradationManager },
      { autoHealingManager }
    ] = await Promise.all([
      import('@/lib/recovery/circuitBreaker'),
      import('@/lib/recovery/retryManager'),
      import('@/lib/recovery/healthChecker'),
      import('@/lib/recovery/gracefulDegradation'),
      import('@/lib/recovery/autoHealing')
    ]);

    // Gather recovery system status
    const [
      circuitBreakerMetrics,
      retryMetrics,
      systemHealth,
      degradationStatus,
      healingMetrics
    ] = await Promise.all([
      circuitBreakerManager.getAllMetrics(),
      retryManager.getMetrics(),
      healthChecker.runAllChecks(),
      degradationManager.evaluateRules(),
      autoHealingManager.getMetrics()
    ]);

    const response: any = {
      timestamp: Date.now(),
      status: 'operational',
      recovery: {
        circuitBreakers: {
          status: 'active',
          breakers: circuitBreakerMetrics,
          summary: {
            total: Object.keys(circuitBreakerMetrics).length,
            open: Object.values(circuitBreakerMetrics).filter(m => m.state === 'OPEN').length,
            halfOpen: Object.values(circuitBreakerMetrics).filter(m => m.state === 'HALF_OPEN').length,
            closed: Object.values(circuitBreakerMetrics).filter(m => m.state === 'CLOSED').length
          }
        },
        retrySystem: {
          status: 'active',
          operations: retryMetrics,
          summary: {
            totalOperations: Object.keys(retryMetrics).length,
            totalRetries: Object.values(retryMetrics).reduce((sum: number, m: any) => sum + m.totalAttempts, 0),
            successfulRetries: Object.values(retryMetrics).reduce((sum: number, m: any) => sum + m.successfulRetries, 0)
          }
        },
        healthChecks: {
          status: systemHealth.status,
          overall: systemHealth.status,
          checks: systemHealth.checks,
          uptime: systemHealth.uptime,
          summary: {
            total: Object.keys(systemHealth.checks).length,
            healthy: Object.values(systemHealth.checks).filter(c => c.status === 'HEALTHY').length,
            degraded: Object.values(systemHealth.checks).filter(c => c.status === 'DEGRADED').length,
            unhealthy: Object.values(systemHealth.checks).filter(c => c.status === 'UNHEALTHY').length
          }
        },
        gracefulDegradation: {
          status: degradationStatus.level === 0 ? 'normal' : 'degraded',
          level: degradationStatus.level,
          activeRules: degradationStatus.activeRules,
          disabledFeatures: degradationStatus.disabledFeatures,
          timestamp: degradationStatus.timestamp
        },
        autoHealing: {
          status: 'active',
          actions: healingMetrics,
          summary: {
            totalActions: Object.keys(healingMetrics).length,
            totalAttempts: Object.values(healingMetrics).reduce((sum: number, m: any) => sum + m.totalAttempts, 0),
            successfulHealing: Object.values(healingMetrics).reduce((sum: number, m: any) => sum + m.successfulHealing, 0)
          }
        }
      }
    };

    // Add history if requested
    if (includeHistory) {
      response.recovery.autoHealing.history = autoHealingManager.getHistory(20);
    }

    // Add detailed metrics if requested
    if (includeMetrics) {
      response.metrics = {
        circuitBreakers: {
          totalRequests: Object.values(circuitBreakerMetrics).reduce((sum: number, m: any) => sum + m.totalRequests, 0),
          totalFailures: Object.values(circuitBreakerMetrics).reduce((sum: number, m: any) => sum + m.failures, 0),
          averageFailureRate: Object.values(circuitBreakerMetrics).reduce((sum: number, m: any) => sum + m.failureRate, 0) / Object.keys(circuitBreakerMetrics).length || 0
        },
        retrySystem: {
          totalOperations: Object.keys(retryMetrics).length,
          averageAttempts: Object.values(retryMetrics).reduce((sum: number, m: any) => sum + m.averageAttempts, 0) / Object.keys(retryMetrics).length || 0,
          successRate: Object.values(retryMetrics).reduce((sum: number, m: any) => sum + m.successfulRetries, 0) / Math.max(1, Object.values(retryMetrics).reduce((sum: number, m: any) => sum + m.totalAttempts, 0)) * 100
        },
        autoHealing: {
          totalActions: Object.keys(healingMetrics).length,
          successRate: Object.values(healingMetrics).reduce((sum: number, m: any) => sum + m.successfulHealing, 0) / Math.max(1, Object.values(healingMetrics).reduce((sum: number, m: any) => sum + m.totalAttempts, 0)) * 100,
          averageHealingTime: Object.values(healingMetrics).reduce((sum: number, m: any) => sum + m.averageHealingTime, 0) / Object.keys(healingMetrics).length || 0
        }
      };
    }

    // Determine overall system status
    if (systemHealth.status === 'UNHEALTHY' || degradationStatus.level >= 3) {
      response.status = 'critical';
    } else if (systemHealth.status === 'DEGRADED' || degradationStatus.level >= 1) {
      response.status = 'degraded';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Recovery status API error:', error);
    
    return NextResponse.json(
      {
        timestamp: Date.now(),
        status: 'error',
        error: 'Failed to retrieve recovery system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, target } = body;

    switch (action) {
      case 'trigger_healing':
        const { autoHealingManager } = await import('@/lib/recovery/autoHealing');
        const result = target 
          ? await autoHealingManager.executeHealing(target)
          : await autoHealingManager.executeAllApplicableActions();
        
        return NextResponse.json({
          success: true,
          action: 'trigger_healing',
          target,
          result
        });

      case 'reset_circuit_breaker':
        const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
        if (target) {
          const breaker = circuitBreakerManager.getOrCreate(target);
          breaker.reset();
        } else {
          circuitBreakerManager.resetAll();
        }
        
        return NextResponse.json({
          success: true,
          action: 'reset_circuit_breaker',
          target: target || 'all'
        });

      case 'reset_retry_metrics':
        const { retryManager } = await import('@/lib/recovery/retryManager');
        retryManager.resetMetrics(target);
        
        return NextResponse.json({
          success: true,
          action: 'reset_retry_metrics',
          target: target || 'all'
        });

      case 'force_degradation_check':
        const { degradationManager } = await import('@/lib/recovery/gracefulDegradation');
        const status = await degradationManager.evaluateRules();
        
        return NextResponse.json({
          success: true,
          action: 'force_degradation_check',
          status
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Recovery action API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute recovery action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}