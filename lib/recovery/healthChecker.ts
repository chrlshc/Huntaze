/**
 * Health Check Framework
 * Comprehensive service health monitoring and validation
 */

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  UNKNOWN = 'UNKNOWN'
}

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  timeout: number;
  critical: boolean;
}

export interface SystemHealth {
  status: HealthStatus;
  checks: Record<string, HealthCheckResult>;
  timestamp: number;
  uptime: number;
}

class HealthChecker {
  private checks = new Map<string, HealthCheck>();
  private lastResults = new Map<string, HealthCheckResult>();
  private startTime = Date.now();

  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  async runCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      return {
        status: HealthStatus.UNKNOWN,
        message: `Health check '${name}' not found`,
        timestamp: Date.now(),
        duration: 0
      };
    }

    const startTime = Date.now();
    
    try {
      // Run check with timeout
      const result = await Promise.race([
        check.check(),
        this.timeoutPromise(check.timeout, name)
      ]);

      result.duration = Date.now() - startTime;
      result.timestamp = Date.now();
      
      this.lastResults.set(name, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result: HealthCheckResult = {
        status: HealthStatus.UNHEALTHY,
        message: `Health check failed: ${errorMessage}`,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        metadata: { error: errorMessage }
      };
      
      this.lastResults.set(name, result);
      return result;
    }
  }

  async runAllChecks(): Promise<SystemHealth> {
    const results: Record<string, HealthCheckResult> = {};
    const checkPromises: Promise<void>[] = [];

    // Run all checks in parallel
    for (const [name] of this.checks) {
      checkPromises.push(
        this.runCheck(name).then(result => {
          results[name] = result;
        })
      );
    }

    await Promise.all(checkPromises);

    // Determine overall system health
    const overallStatus = this.calculateOverallHealth(results);

    return {
      status: overallStatus,
      checks: results,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime
    };
  }

  private calculateOverallHealth(results: Record<string, HealthCheckResult>): HealthStatus {
    let hasUnhealthy = false;
    let hasDegraded = false;

    for (const [name, result] of Object.entries(results)) {
      const check = this.checks.get(name);
      
      if (result.status === HealthStatus.UNHEALTHY) {
        if (check?.critical) {
          return HealthStatus.UNHEALTHY; // Critical service is down
        }
        hasUnhealthy = true;
      } else if (result.status === HealthStatus.DEGRADED) {
        hasDegraded = true;
      }
    }

    if (hasUnhealthy || hasDegraded) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  private timeoutPromise(timeout: number, checkName: string): Promise<HealthCheckResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check '${checkName}' timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  getLastResult(name: string): HealthCheckResult | undefined {
    return this.lastResults.get(name);
  }

  getAllLastResults(): Record<string, HealthCheckResult> {
    const results: Record<string, HealthCheckResult> = {};
    for (const [name, result] of this.lastResults) {
      results[name] = result;
    }
    return results;
  }

  removeCheck(name: string): void {
    this.checks.delete(name);
    this.lastResults.delete(name);
  }

  clearResults(): void {
    this.lastResults.clear();
  }
}

// Global instance
export const healthChecker = new HealthChecker();

// Pre-configured health checks
export const setupDefaultHealthChecks = () => {
  // Database health check
  healthChecker.registerCheck({
    name: 'database',
    timeout: 5000,
    critical: true,
    check: async (): Promise<HealthCheckResult> => {
      try {
        const { db } = await import('@/lib/db');
        const startTime = Date.now();
        
        // Simple query to test connection
        await db.query('SELECT 1');
        
        return {
          status: HealthStatus.HEALTHY,
          message: 'Database connection is healthy',
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          status: HealthStatus.UNHEALTHY,
          message: `Database connection failed: ${errorMessage}`,
          timestamp: Date.now(),
          duration: 0,
          metadata: { error: errorMessage }
        };
      }
    }
  });

  // Cache health check
  healthChecker.registerCheck({
    name: 'cache',
    timeout: 3000,
    critical: false,
    check: async (): Promise<HealthCheckResult> => {
      try {
        const { cacheManager } = await import('@/lib/cache/cacheManager');
        const testKey = 'health-check-test';
        const testValue = Date.now().toString();
        
        // Test cache write and read
        await cacheManager.set(testKey, testValue, { ttl: 10 });
        const retrieved = await cacheManager.get(testKey);
        
        if (retrieved === testValue) {
          return {
            status: HealthStatus.HEALTHY,
            message: 'Cache is functioning properly',
            timestamp: Date.now(),
            duration: 0
          };
        } else {
          return {
            status: HealthStatus.DEGRADED,
            message: 'Cache read/write test failed',
            timestamp: Date.now(),
            duration: 0
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          status: HealthStatus.DEGRADED,
          message: `Cache check failed: ${errorMessage}`,
          timestamp: Date.now(),
          duration: 0,
          metadata: { error: errorMessage }
        };
      }
    }
  });

  // Memory health check
  healthChecker.registerCheck({
    name: 'memory',
    timeout: 1000,
    critical: false,
    check: async (): Promise<HealthCheckResult> => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const usagePercent = (heapUsedMB / heapTotalMB) * 100;

      let status = HealthStatus.HEALTHY;
      let message = `Memory usage: ${heapUsedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`;

      if (usagePercent > 90) {
        status = HealthStatus.UNHEALTHY;
        message = `Critical memory usage: ${usagePercent.toFixed(1)}%`;
      } else if (usagePercent > 75) {
        status = HealthStatus.DEGRADED;
        message = `High memory usage: ${usagePercent.toFixed(1)}%`;
      }

      return {
        status,
        message,
        timestamp: Date.now(),
        duration: 0,
        metadata: {
          heapUsed: heapUsedMB,
          heapTotal: heapTotalMB,
          usagePercent,
          rss: memUsage.rss / 1024 / 1024,
          external: memUsage.external / 1024 / 1024
        }
      };
    }
  });

  // Disk space health check
  healthChecker.registerCheck({
    name: 'disk',
    timeout: 2000,
    critical: false,
    check: async (): Promise<HealthCheckResult> => {
      try {
        const fs = await import('fs/promises');
        const stats = await fs.stat('.');
        
        // This is a simplified check - in production you'd want to check actual disk usage
        return {
          status: HealthStatus.HEALTHY,
          message: 'Disk access is healthy',
          timestamp: Date.now(),
          duration: 0
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          status: HealthStatus.DEGRADED,
          message: `Disk check failed: ${errorMessage}`,
          timestamp: Date.now(),
          duration: 0,
          metadata: { error: errorMessage }
        };
      }
    }
  });
};

// Convenience functions
export const checkSystemHealth = () => healthChecker.runAllChecks();
export const checkServiceHealth = (serviceName: string) => healthChecker.runCheck(serviceName);
export const getLastHealthResults = () => healthChecker.getAllLastResults();