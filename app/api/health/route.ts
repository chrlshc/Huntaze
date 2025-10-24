/**
 * Health Check API Endpoint
 * Comprehensive health monitoring for all services with SLIs/SLOs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOptimizationEngine } from '@/lib/services/optimization-engine';
import { getContentIdeaGeneratorService } from '@/lib/services/content-idea-generator';
import { getContentGenerationService } from '@/lib/services/content-generation-service';
import { APIAuthService } from '@/lib/middleware/api-auth';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { getRequestCoalescer } from '@/lib/services/request-coalescer';
import { gracefulDegradation } from '@/lib/services/graceful-degradation';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: any;
  error?: string;
}

interface SLIMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  status: 'meeting' | 'at_risk' | 'breaching';
  trend: 'improving' | 'stable' | 'degrading';
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  slis: SLIMetric[];
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
    availability: number;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    connections: {
      active: number;
      idle: number;
    };
  };
  circuitBreakers: Record<string, any>;
  degradation: {
    status: string;
    metrics: any;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const monitoring = getAPIMonitoringService();
  
  try {
    console.log('[Health] Starting health check');

    // Check all services
    const serviceChecks = await Promise.allSettled([
      checkOptimizationEngine(),
      checkContentIdeaGenerator(),
      checkContentGenerationService(),
      checkAuthService(),
      checkMonitoringService(),
    ]);

    const services: ServiceHealth[] = serviceChecks.map((result, index) => {
      const serviceNames = [
        'optimization-engine',
        'content-idea-generator', 
        'content-generation-service',
        'auth-service',
        'monitoring-service'
      ];

      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: serviceNames[index],
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          error: result.reason?.message || 'Service check failed',
        };
      }
    });

    // Calculate overall status
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    const totalServices = services.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      overallStatus = 'healthy';
    } else if (healthyServices + degradedServices >= totalServices * 0.7) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    // Get system metrics
    const healthMetrics = monitoring.getHealthMetrics();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate uptime
    const uptime = Math.floor(process.uptime());

    // Get advanced service metrics
    const circuitBreakerMetrics = CircuitBreakerFactory.getAllMetrics();
    const coalescerMetrics = getRequestCoalescer().getMetrics();
    const degradationMetrics = gracefulDegradation.getMetrics();

    // Calculate SLIs (Service Level Indicators)
    const slis = calculateSLIs(healthMetrics, services);

    // Calculate availability (99.9% SLO)
    const availability = calculateAvailability(healthMetrics);

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      slis,
      metrics: {
        totalRequests: healthMetrics.totalRequests,
        errorRate: healthMetrics.errorRate,
        averageResponseTime: healthMetrics.averageResponseTime,
        cacheHitRate: healthMetrics.cacheHitRate,
        availability,
      },
      system: {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        cpu: {
          usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000), // Convert to ms
        },
        connections: {
          active: coalescerMetrics.pendingRequests,
          idle: coalescerMetrics.cacheSize,
        },
      },
      circuitBreakers: circuitBreakerMetrics,
      degradation: {
        status: 'operational',
        metrics: degradationMetrics,
      },
    };

    const duration = Date.now() - startTime;

    // Record health check metrics
    monitoring.recordMetric({
      endpoint: '/api/health',
      method: 'GET',
      statusCode: 200,
      responseTime: duration,
    });

    console.log(`[Health] Health check completed`, {
      status: overallStatus,
      duration,
      healthyServices,
      totalServices,
    });

    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overallStatus,
        'X-Response-Time': duration.toString(),
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[Health] Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });

    // Record error metrics
    monitoring.recordMetric({
      endpoint: '/api/health',
      method: 'GET',
      statusCode: 500,
      responseTime: duration,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check service failed',
      details: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Unknown error',
      } : undefined,
    }, { status: 500 });
  }
}

/**
 * Check optimization engine health
 */
async function checkOptimizationEngine(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const engine = getOptimizationEngine();
    const health = await engine.healthCheck();
    
    return {
      name: 'optimization-engine',
      status: health.status,
      responseTime: Date.now() - startTime,
      details: {
        services: health.services,
        metrics: health.metrics,
        issues: health.details,
      },
    };
  } catch (error) {
    return {
      name: 'optimization-engine',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check content idea generator health
 */
async function checkContentIdeaGenerator(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const service = getContentIdeaGeneratorService();
    
    // Simple test to verify service is working
    const testProfile = {
      id: 'health-check',
      niche: ['test'],
      contentTypes: ['photo'],
      audiencePreferences: [],
      performanceHistory: {
        topPerformingContent: [],
        engagementPatterns: {},
        revenueByCategory: {},
      },
      currentGoals: [],
      constraints: {
        equipment: [],
        location: [],
        timeAvailability: '',
      },
    };

    // This should be a lightweight operation
    const history = service.getIdeaHistory('health-check', 1);
    
    return {
      name: 'content-idea-generator',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        historySize: history.length,
      },
    };
  } catch (error) {
    return {
      name: 'content-idea-generator',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check content generation service health
 */
async function checkContentGenerationService(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const service = getContentGenerationService();
    const health = await service.healthCheck();
    
    return {
      name: 'content-generation-service',
      status: health.status,
      responseTime: Date.now() - startTime,
      details: {
        services: health.services,
        issues: health.details,
      },
    };
  } catch (error) {
    return {
      name: 'content-generation-service',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check auth service health
 */
async function checkAuthService(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const authService = APIAuthService.getInstance();
    const health = await authService.healthCheck();
    
    return {
      name: 'auth-service',
      status: health.status,
      responseTime: Date.now() - startTime,
      details: {
        checks: health.checks,
        metrics: health.metrics,
      },
    };
  } catch (error) {
    return {
      name: 'auth-service',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check monitoring service health
 */
async function checkMonitoringService(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const monitoring = getAPIMonitoringService();
    const metrics = monitoring.getHealthMetrics();
    const alerts = monitoring.getActiveAlerts();
    
    // Determine status based on metrics
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.errorRate > 10) {
      status = 'unhealthy';
    } else if (metrics.errorRate > 5 || alerts.length > 5) {
      status = 'degraded';
    }
    
    return {
      name: 'monitoring-service',
      status,
      responseTime: Date.now() - startTime,
      details: {
        metrics,
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      },
    };
  } catch (error) {
    return {
      name: 'monitoring-service',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detailed health check endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { includeDetails = false, services = [] } = body;

    if (!includeDetails) {
      // Return simple health check
      return GET(request);
    }

    // Return detailed health information
    const monitoring = getAPIMonitoringService();
    const endpointMetrics = monitoring.getEndpointMetrics();
    const alerts = monitoring.getActiveAlerts();

    const detailedResponse = {
      ...(await GET(request).then(res => res.json())),
      detailed: {
        endpointMetrics,
        alerts,
        serviceSpecific: services.length > 0 ? await getServiceSpecificHealth(services) : undefined,
      },
    };

    return NextResponse.json(detailedResponse);

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Failed to process detailed health check',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Get service-specific health information
 */
async function getServiceSpecificHealth(services: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const serviceName of services) {
    try {
      switch (serviceName) {
        case 'optimization-engine':
          const engine = getOptimizationEngine();
          results[serviceName] = {
            usage: engine.getAPIUsageStats(),
            health: await engine.healthCheck(),
          };
          break;

        case 'auth-service':
          const authService = APIAuthService.getInstance();
          results[serviceName] = {
            metrics: authService.getAuthMetrics(),
            health: await authService.healthCheck(),
          };
          break;

        case 'monitoring-service':
          const monitoring = getAPIMonitoringService();
          results[serviceName] = {
            metrics: monitoring.getHealthMetrics(),
            alerts: monitoring.getActiveAlerts(),
            endpointMetrics: monitoring.getEndpointMetrics(),
          };
          break;

        default:
          results[serviceName] = { error: 'Service not found' };
      }
    } catch (error) {
      results[serviceName] = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  return results;
}

/**
 * Calculate Service Level Indicators (SLIs)
 */
function calculateSLIs(healthMetrics: any, services: ServiceHealth[]): SLIMetric[] {
  const slis: SLIMetric[] = [];

  // Availability SLI (Target: 99.9%)
  const availability = calculateAvailability(healthMetrics);
  slis.push({
    name: 'Availability',
    current: availability,
    target: 99.9,
    unit: '%',
    status: availability >= 99.9 ? 'meeting' : availability >= 99.5 ? 'at_risk' : 'breaching',
    trend: 'stable', // Would be calculated from historical data
  });

  // Latency SLI (Target: P95 < 500ms)
  const p95Latency = healthMetrics.averageResponseTime * 1.5; // Approximation
  slis.push({
    name: 'P95 Latency',
    current: p95Latency,
    target: 500,
    unit: 'ms',
    status: p95Latency <= 500 ? 'meeting' : p95Latency <= 750 ? 'at_risk' : 'breaching',
    trend: 'stable',
  });

  // Error Rate SLI (Target: < 0.1%)
  slis.push({
    name: 'Error Rate',
    current: healthMetrics.errorRate,
    target: 0.1,
    unit: '%',
    status: healthMetrics.errorRate <= 0.1 ? 'meeting' : healthMetrics.errorRate <= 1 ? 'at_risk' : 'breaching',
    trend: 'stable',
  });

  // Throughput SLI (Target: > 100 RPS)
  const throughput = healthMetrics.totalRequests / (process.uptime() || 1);
  slis.push({
    name: 'Throughput',
    current: throughput,
    target: 100,
    unit: 'RPS',
    status: throughput >= 100 ? 'meeting' : throughput >= 50 ? 'at_risk' : 'breaching',
    trend: 'stable',
  });

  return slis;
}

/**
 * Calculate system availability
 */
function calculateAvailability(healthMetrics: any): number {
  if (healthMetrics.totalRequests === 0) return 100;
  
  const successfulRequests = healthMetrics.totalRequests - (healthMetrics.totalRequests * healthMetrics.errorRate / 100);
  return (successfulRequests / healthMetrics.totalRequests) * 100;
}