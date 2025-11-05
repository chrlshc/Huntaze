/**
 * Simplified Telemetry for Huntaze
 * Implements the 4 Golden Signals: Latency, Traffic, Errors, Saturation
 * Note: OpenTelemetry dependencies removed for build stability
 */

import { performance } from 'perf_hooks';

// Simplified Golden Signals Metrics (in-memory storage)
class GoldenSignalsMetrics {
  private static instance: GoldenSignalsMetrics;
  
  // In-memory metrics storage
  private metrics = {
    requestDuration: [] as Array<{ duration: number; method: string; route: string; status: number; timestamp: number }>,
    requestCount: new Map<string, number>(),
    errorCount: new Map<string, number>(),
    activeConnections: 0,
    cacheHits: new Map<string, number>(),
    cacheMisses: new Map<string, number>(),
    dbQueries: [] as Array<{ duration: number; operation: string; table: string; success: boolean; timestamp: number }>
  };

  static getInstance(): GoldenSignalsMetrics {
    if (!GoldenSignalsMetrics.instance) {
      GoldenSignalsMetrics.instance = new GoldenSignalsMetrics();
    }
    return GoldenSignalsMetrics.instance;
  }

  // 1. LATENCY - Record request duration
  recordRequestDuration(duration: number, method: string, route: string, status: number) {
    this.metrics.requestDuration.push({
      duration,
      method,
      route,
      status,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 entries
    if (this.metrics.requestDuration.length > 1000) {
      this.metrics.requestDuration = this.metrics.requestDuration.slice(-1000);
    }
  }

  // 2. TRAFFIC - Increment request count
  incrementRequestCount(method: string, route: string, status: number) {
    const key = `${method}:${route}:${status}`;
    this.metrics.requestCount.set(key, (this.metrics.requestCount.get(key) || 0) + 1);
  }

  // 3. ERRORS - Record errors
  recordError(method: string, route: string, errorType: string, status: number) {
    const key = `${method}:${route}:${errorType}:${status}`;
    this.metrics.errorCount.set(key, (this.metrics.errorCount.get(key) || 0) + 1);
  }

  // 4. SATURATION - Track active connections
  incrementActiveConnections() {
    this.metrics.activeConnections++;
  }

  decrementActiveConnections() {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  // Cache metrics
  recordCacheHit(cacheType: string, key?: string) {
    const cacheKey = `${cacheType}:hit`;
    this.metrics.cacheHits.set(cacheKey, (this.metrics.cacheHits.get(cacheKey) || 0) + 1);
  }

  recordCacheMiss(cacheType: string, key?: string) {
    const cacheKey = `${cacheType}:miss`;
    this.metrics.cacheMisses.set(cacheKey, (this.metrics.cacheMisses.get(cacheKey) || 0) + 1);
  }

  // Database metrics
  recordDbQuery(duration: number, operation: string, table?: string, success: boolean = true) {
    this.metrics.dbQueries.push({
      duration,
      operation,
      table: table || 'unknown',
      success,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 entries
    if (this.metrics.dbQueries.length > 1000) {
      this.metrics.dbQueries = this.metrics.dbQueries.slice(-1000);
    }
  }

  // Get current metrics summary
  getMetricsSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Filter recent data
    const recentRequests = this.metrics.requestDuration.filter(r => r.timestamp > oneHourAgo);
    const recentQueries = this.metrics.dbQueries.filter(q => q.timestamp > oneHourAgo);
    
    return {
      requests: {
        total: recentRequests.length,
        averageLatency: recentRequests.length > 0 
          ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length 
          : 0,
        errorRate: recentRequests.length > 0 
          ? (recentRequests.filter(r => r.status >= 400).length / recentRequests.length) * 100 
          : 0
      },
      connections: {
        active: this.metrics.activeConnections
      },
      cache: {
        hits: Array.from(this.metrics.cacheHits.values()).reduce((sum, count) => sum + count, 0),
        misses: Array.from(this.metrics.cacheMisses.values()).reduce((sum, count) => sum + count, 0)
      },
      database: {
        queries: recentQueries.length,
        averageLatency: recentQueries.length > 0 
          ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length 
          : 0,
        successRate: recentQueries.length > 0 
          ? (recentQueries.filter(q => q.success).length / recentQueries.length) * 100 
          : 100
      }
    };
  }

  // Utility method to instrument requests with automatic metrics
  async instrumentRequest<T>(
    name: string,
    operation: () => Promise<T>,
    attributes: Record<string, string> = {}
  ): Promise<T> {
    const startTime = performance.now();
    let status = 200;

    try {
      const result = await operation();
      return result;
    } catch (error) {
      status = 500;
      
      // Record error metrics
      this.recordError(
        attributes.method || 'unknown',
        attributes.route || 'unknown',
        error instanceof Error ? error.constructor.name : 'UnknownError',
        500
      );
      
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      // Record latency and traffic metrics
      this.recordRequestDuration(duration, attributes.method || 'unknown', attributes.route || 'unknown', status);
      this.incrementRequestCount(attributes.method || 'unknown', attributes.route || 'unknown', status);
    }
  }
}

// Initialize simplified telemetry
export function initializeTelemetry() {
  const serviceName = 'huntaze-app';
  const serviceVersion = process.env.npm_package_version || '1.0.0';
  const environment = process.env.NODE_ENV || 'development';

  console.log('🔍 Simplified telemetry initialized');
  console.log(`🏷️  Service: ${serviceName} v${serviceVersion} (${environment})`);
  console.log('📊 Metrics available via /api/monitoring/golden-signals');

  return {
    serviceName,
    serviceVersion,
    environment,
    initialized: true
  };
}

// Export singleton instance
export const goldenSignals = GoldenSignalsMetrics.getInstance();

// Middleware for Next.js API routes
export function withTelemetry<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  routeName: string
): T {
  return (async (...args: any[]) => {
    const [req, res] = args;
    const method = req.method || 'unknown';
    const startTime = performance.now();

    // Increment active connections
    goldenSignals.incrementActiveConnections();

    try {
      const result = await goldenSignals.instrumentRequest(
        `${method} ${routeName}`,
        () => handler(...args),
        {
          method,
          route: routeName,
          'http.method': method,
          'http.route': routeName,
        }
      );

      return result;
    } finally {
      // Decrement active connections
      goldenSignals.decrementActiveConnections();
    }
  }) as T;
}

// Health check for telemetry
export function getTelemetryHealth() {
  return {
    status: 'healthy',
    service: 'huntaze-app',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics_endpoint: 'http://localhost:9090/metrics',
    timestamp: new Date().toISOString(),
  };
}