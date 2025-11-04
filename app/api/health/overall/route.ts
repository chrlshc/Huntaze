import { NextResponse } from 'next/server';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  details: Record<string, any>;
  error?: string;
}

async function checkService(endpoint: string): Promise<HealthCheckResult> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      service: endpoint,
      status: 'unhealthy',
      timestamp: new Date(),
      error: error instanceof Error ? error.message : `Failed to check ${endpoint}`,
      details: {
        errorType: error instanceof Error ? error.name : 'UnknownError'
      }
    };
  }
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Check all health endpoints in parallel
    const [databaseHealth, authHealth, configHealth] = await Promise.allSettled([
      checkService('database'),
      checkService('auth'),
      checkService('config')
    ]);

    const results: HealthCheckResult[] = [];
    
    // Process database health
    if (databaseHealth.status === 'fulfilled') {
      results.push(databaseHealth.value);
    } else {
      results.push({
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed',
        details: { reason: databaseHealth.reason }
      });
    }

    // Process auth health
    if (authHealth.status === 'fulfilled') {
      results.push(authHealth.value);
    } else {
      results.push({
        service: 'authentication',
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed',
        details: { reason: authHealth.reason }
      });
    }

    // Process config health
    if (configHealth.status === 'fulfilled') {
      results.push(configHealth.value);
    } else {
      results.push({
        service: 'configuration',
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed',
        details: { reason: configHealth.reason }
      });
    }

    const responseTime = Date.now() - startTime;

    // Determine overall system status
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Identify critical issues for login functionality
    const criticalIssues: string[] = [];
    const databaseResult = results.find(r => r.service === 'database');
    const authResult = results.find(r => r.service === 'authentication');
    const configResult = results.find(r => r.service === 'configuration');

    if (databaseResult?.status === 'unhealthy') {
      criticalIssues.push('Database connection failed - login will not work');
    }
    if (authResult?.status === 'unhealthy') {
      criticalIssues.push('Authentication system failed - login will not work');
    }
    if (configResult?.status === 'unhealthy') {
      criticalIssues.push('Critical configuration missing - login may not work');
    }

    const overallHealth = {
      service: 'overall-system',
      status: overallStatus,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`,
      details: {
        services: results,
        summary: {
          total: results.length,
          healthy: healthyCount,
          degraded: degradedCount,
          unhealthy: unhealthyCount
        },
        criticalIssues,
        loginFunctionality: criticalIssues.length === 0 ? 'operational' : 'impaired',
        environment: process.env.NODE_ENV,
        smartOnboardingDeployment: {
          detected: true,
          timestamp: '2024-11-03',
          commit: 'd9d4ca36a'
        }
      }
    };

    const httpStatus = overallStatus === 'healthy' ? 200 : 503;
    return NextResponse.json(overallHealth, { status: httpStatus });

  } catch (error) {
    console.error('Overall health check failed:', error);
    
    const errorDetails = {
      service: 'overall-system',
      status: 'unhealthy' as const,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown system error',
      details: {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        environment: process.env.NODE_ENV,
        criticalIssues: ['System health check completely failed']
      }
    };

    return NextResponse.json(errorDetails, { status: 503 });
  }
}