/**
 * Database Query Time Measurement
 * Intercepts Prisma queries to measure execution time
 */

export interface QueryMetrics {
  endpoint: string;
  query: string;
  duration: number;
  count: number;
  calledFrom: string[];
  timestamp: Date;
}

export interface QueryStats {
  totalQueries: number;
  avgDuration: number;
  slowQueries: QueryMetrics[];
  queryByEndpoint: Map<string, QueryMetrics[]>;
}

class DBQueryTracker {
  private queries: QueryMetrics[] = [];
  private enabled: boolean = false;
  private slowQueryThreshold: number = 100; // ms

  enable() {
    this.enabled = true;
    this.queries = [];
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  trackQuery(
    query: string,
    duration: number,
    endpoint: string,
    calledFrom: string
  ) {
    if (!this.enabled) return;

    const existingQuery = this.queries.find(
      (q) => q.query === query && q.endpoint === endpoint
    );

    if (existingQuery) {
      existingQuery.count++;
      existingQuery.duration += duration;
      if (!existingQuery.calledFrom.includes(calledFrom)) {
        existingQuery.calledFrom.push(calledFrom);
      }
    } else {
      this.queries.push({
        endpoint,
        query,
        duration,
        count: 1,
        calledFrom: [calledFrom],
        timestamp: new Date(),
      });
    }
  }

  getStats(): QueryStats {
    const totalQueries = this.queries.reduce((sum, q) => sum + q.count, 0);
    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const avgDuration = totalQueries > 0 ? totalDuration / totalQueries : 0;

    const slowQueries = this.queries
      .filter((q) => q.duration / q.count > this.slowQueryThreshold)
      .sort((a, b) => b.duration / b.count - a.duration / a.count);

    const queryByEndpoint = new Map<string, QueryMetrics[]>();
    this.queries.forEach((q) => {
      const existing = queryByEndpoint.get(q.endpoint) || [];
      existing.push(q);
      queryByEndpoint.set(q.endpoint, existing);
    });

    return {
      totalQueries,
      avgDuration,
      slowQueries,
      queryByEndpoint,
    };
  }

  getQueries(): QueryMetrics[] {
    return [...this.queries];
  }

  reset() {
    this.queries = [];
  }

  setSlowQueryThreshold(ms: number) {
    this.slowQueryThreshold = ms;
  }
}

// Singleton instance
export const dbQueryTracker = new DBQueryTracker();

/**
 * Middleware to wrap Prisma queries with tracking
 */
export function createPrismaQueryMiddleware() {
  return async (params: any, next: any) => {
    const start = performance.now();
    const result = await next(params);
    const duration = performance.now() - start;

    // Extract caller information from stack trace
    const stack = new Error().stack || '';
    const callerLine = stack.split('\n')[3] || 'unknown';
    const callerMatch = callerLine.match(/at\s+(.+?)\s+\(/);
    const caller = callerMatch ? callerMatch[1] : 'unknown';

    // Track the query
    dbQueryTracker.trackQuery(
      `${params.model}.${params.action}`,
      duration,
      params.model || 'unknown',
      caller
    );

    return result;
  };
}
