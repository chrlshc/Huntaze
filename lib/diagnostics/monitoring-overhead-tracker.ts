/**
 * Monitoring Overhead Measurement
 * Measures the performance impact of monitoring itself
 */

export interface OverheadMetrics {
  cpuImpact: number; // percentage
  memoryUsage: number; // bytes
  avgOverheadPerRequest: number; // ms
  totalOverhead: number; // ms
  monitoringCallCount: number;
}

interface OverheadSample {
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  timestamp: Date;
}

class MonitoringOverheadTracker {
  private samples: OverheadSample[] = [];
  private enabled: boolean = false;
  private baselineMemory: number = 0;

  enable() {
    this.enabled = true;
    this.samples = [];
    this.baselineMemory = this.getMemoryUsage();
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    // Browser fallback
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  trackMonitoringCall<T>(fn: () => T): T {
    if (!this.enabled) {
      return fn();
    }

    const memoryBefore = this.getMemoryUsage();
    const start = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.samples.push({
        duration,
        memoryBefore,
        memoryAfter,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.samples.push({
        duration,
        memoryBefore,
        memoryAfter,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  async trackMonitoringCallAsync<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const memoryBefore = this.getMemoryUsage();
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.samples.push({
        duration,
        memoryBefore,
        memoryAfter,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.samples.push({
        duration,
        memoryBefore,
        memoryAfter,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  getMetrics(): OverheadMetrics {
    if (this.samples.length === 0) {
      return {
        cpuImpact: 0,
        memoryUsage: 0,
        avgOverheadPerRequest: 0,
        totalOverhead: 0,
        monitoringCallCount: 0,
      };
    }

    const totalOverhead = this.samples.reduce((sum, s) => sum + s.duration, 0);
    const avgOverheadPerRequest = totalOverhead / this.samples.length;

    const currentMemory = this.getMemoryUsage();
    const memoryUsage = currentMemory - this.baselineMemory;

    // Estimate CPU impact as percentage of time spent in monitoring
    // This is a rough estimate based on overhead duration
    const cpuImpact = Math.min(
      100,
      (avgOverheadPerRequest / 1000) * 100 // Convert to percentage
    );

    return {
      cpuImpact,
      memoryUsage: Math.max(0, memoryUsage),
      avgOverheadPerRequest,
      totalOverhead,
      monitoringCallCount: this.samples.length,
    };
  }

  getSamples(): OverheadSample[] {
    return [...this.samples];
  }

  reset() {
    this.samples = [];
    this.baselineMemory = this.getMemoryUsage();
  }
}

// Singleton instance
export const monitoringOverheadTracker = new MonitoringOverheadTracker();

/**
 * Decorator to track monitoring overhead
 */
export function trackOverhead() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return monitoringOverheadTracker.trackMonitoringCall(() =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Async decorator to track monitoring overhead
 */
export function trackOverheadAsync() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return monitoringOverheadTracker.trackMonitoringCallAsync(() =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
