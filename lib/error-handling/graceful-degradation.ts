/**
 * Graceful Degradation Strategies
 * Provides fallback mechanisms for service failures
 */

import { getErrorHandler, type ErrorContext } from './error-handler';

// ============================================================================
// Types
// ============================================================================

export interface DegradationStrategy<T> {
  primary: () => Promise<T>;
  fallback: () => Promise<T>;
  onDegradation?: (error: Error) => void;
}

export interface ServiceHealth {
  service: string;
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  degraded: boolean;
}

// ============================================================================
// Service Health Monitor
// ============================================================================

class ServiceHealthMonitor {
  private healthStatus = new Map<string, ServiceHealth>();
  private readonly FAILURE_THRESHOLD = 3;

  recordSuccess(service: string): void {
    const health = this.getHealth(service);
    health.healthy = true;
    health.degraded = false;
    health.consecutiveFailures = 0;
    health.lastCheck = new Date();
    this.healthStatus.set(service, health);
  }

  recordFailure(service: string): void {
    const health = this.getHealth(service);
    health.consecutiveFailures++;
    health.lastCheck = new Date();
    
    if (health.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      health.healthy = false;
      health.degraded = true;
    }
    
    this.healthStatus.set(service, health);
  }

  isHealthy(service: string): boolean {
    return this.getHealth(service).healthy;
  }

  isDegraded(service: string): boolean {
    return this.getHealth(service).degraded;
  }

  private getHealth(service: string): ServiceHealth {
    if (!this.healthStatus.has(service)) {
      this.healthStatus.set(service, {
        service,
        healthy: true,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        degraded: false,
      });
    }
    return this.healthStatus.get(service)!;
  }

  getAllHealth(): ServiceHealth[] {
    return Array.from(this.healthStatus.values());
  }
}

// ============================================================================
// Graceful Degradation Manager
// ============================================================================

export class GracefulDegradationManager {
  private healthMonitor = new ServiceHealthMonitor();
  private errorHandler = getErrorHandler();

  /**
   * Execute with graceful degradation
   */
  async executeWithDegradation<T>(
    service: string,
    strategy: DegradationStrategy<T>,
    context: Partial<ErrorContext>
  ): Promise<T> {
    try {
      const result = await strategy.primary();
      this.healthMonitor.recordSuccess(service);
      return result;
    } catch (error) {
      this.healthMonitor.recordFailure(service);
      
      // Log the error
      await this.errorHandler.logError(error as Error, {
        operation: `${service}_degradation`,
        sessionId: this.getSessionId(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date(),
        ...context,
        metadata: {
          ...context.metadata,
          service,
          degraded: true,
        },
      });

      // Call degradation callback
      if (strategy.onDegradation) {
        strategy.onDegradation(error as Error);
      }

      // Execute fallback
      try {
        return await strategy.fallback();
      } catch (fallbackError) {
        // Log fallback failure
        await this.errorHandler.logError(fallbackError as Error, {
          operation: `${service}_fallback_failure`,
          sessionId: this.getSessionId(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date(),
          ...context,
          metadata: {
            ...context.metadata,
            service,
            fallbackFailed: true,
          },
        });
        throw fallbackError;
      }
    }
  }

  /**
   * CDN Degradation: Fallback to origin server
   */
  async cdnDegradation<T>(
    cdnFetcher: () => Promise<T>,
    originFetcher: () => Promise<T>
  ): Promise<T> {
    return this.executeWithDegradation(
      'cdn',
      {
        primary: cdnFetcher,
        fallback: originFetcher,
        onDegradation: (error) => {
          console.warn('CDN degraded, falling back to origin:', error.message);
        },
      },
      { operation: 'cdn_fetch' }
    );
  }

  /**
   * Cache Degradation: Fetch fresh data with latency indication
   */
  async cacheDegradation<T>(
    cacheGetter: () => Promise<T | null>,
    freshFetcher: () => Promise<T>
  ): Promise<{ data: T; fromCache: boolean; latency?: number }> {
    const startTime = Date.now();
    
    try {
      const cached = await cacheGetter();
      if (cached !== null) {
        this.healthMonitor.recordSuccess('cache');
        return {
          data: cached,
          fromCache: true,
        };
      }
    } catch (error) {
      this.healthMonitor.recordFailure('cache');
      console.warn('Cache failed, fetching fresh data:', error);
    }

    // Fetch fresh data
    const data = await freshFetcher();
    const latency = Date.now() - startTime;
    
    return {
      data,
      fromCache: false,
      latency,
    };
  }

  /**
   * Image Optimization Degradation: Serve original image
   */
  async imageOptimizationDegradation(
    optimizedUrl: string,
    originalUrl: string
  ): Promise<string> {
    return this.executeWithDegradation(
      'image_optimization',
      {
        primary: async () => {
          // Try to load optimized image
          if (typeof window !== 'undefined') {
            return new Promise<string>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(optimizedUrl);
              img.onerror = () => reject(new Error('Failed to load optimized image'));
              img.src = optimizedUrl;
            });
          }
          return optimizedUrl;
        },
        fallback: async () => originalUrl,
        onDegradation: (error) => {
          console.warn('Image optimization failed, serving original:', error.message);
        },
      },
      { operation: 'image_load' }
    );
  }

  /**
   * Monitoring Degradation: Continue operation, log locally
   */
  async monitoringDegradation<T>(
    operation: () => Promise<T>,
    localLogger?: (data: any) => void
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Log locally if monitoring fails
      if (localLogger) {
        localLogger({
          error: (error as Error).message,
          timestamp: new Date(),
          note: 'Monitoring unavailable, logged locally',
        });
      } else {
        console.warn('Monitoring unavailable:', error);
      }
      
      // Continue operation despite monitoring failure
      throw error;
    }
  }

  /**
   * Lambda@Edge Degradation: CloudFront serves cached or origin response
   */
  async lambdaEdgeDegradation<T>(
    edgeFunction: () => Promise<T>,
    directFetch: () => Promise<T>
  ): Promise<T> {
    return this.executeWithDegradation(
      'lambda_edge',
      {
        primary: edgeFunction,
        fallback: directFetch,
        onDegradation: (error) => {
          console.warn('Lambda@Edge failed, using direct fetch:', error.message);
        },
      },
      { operation: 'edge_function' }
    );
  }

  /**
   * Get service health status
   */
  getServiceHealth(service: string): ServiceHealth {
    return this.healthMonitor.getAllHealth().find((h) => h.service === service) || {
      service,
      healthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      degraded: false,
    };
  }

  /**
   * Get all services health
   */
  getAllServicesHealth(): ServiceHealth[] {
    return this.healthMonitor.getAllHealth();
  }

  /**
   * Check if any service is degraded
   */
  isAnyServiceDegraded(): boolean {
    return this.healthMonitor.getAllHealth().some((h) => h.degraded);
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        window.sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return `server-session-${Date.now()}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let degradationManagerInstance: GracefulDegradationManager | null = null;

export function getDegradationManager(): GracefulDegradationManager {
  if (!degradationManagerInstance) {
    degradationManagerInstance = new GracefulDegradationManager();
  }
  return degradationManagerInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap async operation with automatic degradation
 */
export async function withDegradation<T>(
  service: string,
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  onDegradation?: (error: Error) => void
): Promise<T> {
  const manager = getDegradationManager();
  return manager.executeWithDegradation(
    service,
    { primary, fallback, onDegradation },
    { operation: service }
  );
}
