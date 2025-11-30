/**
 * Slow query logging for database performance monitoring
 * 
 * Logs queries that exceed a threshold and sends them to monitoring
 * Requirements: 7.5 - Log slow queries for optimization
 */

import { Prisma } from '@prisma/client';

/**
 * Configuration for slow query logging
 */
export interface SlowQueryConfig {
  /** Threshold in milliseconds (default: 1000ms) */
  threshold?: number;
  /** Whether to log to console (default: true in development) */
  logToConsole?: boolean;
  /** Whether to send to monitoring service (default: true in production) */
  sendToMonitoring?: boolean;
  /** Whether to include query parameters (default: false for security) */
  includeParams?: boolean;
  /** Whether to include stack trace (default: false) */
  includeStackTrace?: boolean;
}

/**
 * Slow query log entry
 */
export interface SlowQueryLog {
  timestamp: Date;
  query: string;
  duration: number;
  model?: string;
  operation?: string;
  params?: any;
  stackTrace?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SlowQueryConfig = {
  threshold: 1000, // 1 second
  logToConsole: process.env.NODE_ENV === 'development',
  sendToMonitoring: process.env.NODE_ENV === 'production',
  includeParams: false,
  includeStackTrace: false,
};

/**
 * In-memory store for slow queries (for testing/development)
 */
const slowQueryStore: SlowQueryLog[] = [];
const MAX_STORE_SIZE = 100;

/**
 * Log a slow query
 */
export function logSlowQuery(
  query: string,
  duration: number,
  options?: {
    model?: string;
    operation?: string;
    params?: any;
    config?: SlowQueryConfig;
  }
) {
  const config = { ...DEFAULT_CONFIG, ...options?.config };

  // Only log if duration exceeds threshold
  if (duration < config.threshold) {
    return;
  }

  const logEntry: SlowQueryLog = {
    timestamp: new Date(),
    query,
    duration,
    model: options?.model,
    operation: options?.operation,
  };

  if (config.includeParams && options?.params) {
    logEntry.params = options.params;
  }

  if (config.includeStackTrace) {
    logEntry.stackTrace = new Error().stack;
  }

  // Store in memory
  slowQueryStore.push(logEntry);
  if (slowQueryStore.length > MAX_STORE_SIZE) {
    slowQueryStore.shift();
  }

  // Log to console
  if (config.logToConsole) {
    console.warn('🐌 Slow Query Detected:', {
      duration: `${duration}ms`,
      model: logEntry.model,
      operation: logEntry.operation,
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    });
  }

  // Send to monitoring service
  if (config.sendToMonitoring) {
    sendToMonitoringService(logEntry).catch(err => {
      console.error('Failed to send slow query to monitoring:', err);
    });
  }

  return logEntry;
}

/**
 * Send slow query to monitoring service
 */
async function sendToMonitoringService(logEntry: SlowQueryLog): Promise<void> {
  // In production, this would send to CloudWatch, Datadog, etc.
  // For now, we'll just log it
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to CloudWatch
      // await cloudwatch.putMetricData({
      //   Namespace: 'Database',
      //   MetricData: [{
      //     MetricName: 'SlowQuery',
      //     Value: logEntry.duration,
      //     Unit: 'Milliseconds',
      //     Dimensions: [
      //       { Name: 'Model', Value: logEntry.model || 'unknown' },
      //       { Name: 'Operation', Value: logEntry.operation || 'unknown' },
      //     ],
      //   }],
      // });

      // For now, just log
      console.log('Would send to monitoring:', logEntry);
    } catch (error) {
      console.error('Error sending to monitoring:', error);
    }
  }
}

/**
 * Get all slow queries from the store
 */
export function getSlowQueries(): SlowQueryLog[] {
  return [...slowQueryStore];
}

/**
 * Clear the slow query store
 */
export function clearSlowQueries(): void {
  slowQueryStore.length = 0;
}

/**
 * Get slow query statistics
 */
export function getSlowQueryStats() {
  if (slowQueryStore.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: 0,
    };
  }

  const durations = slowQueryStore.map(q => q.duration);
  const sum = durations.reduce((a, b) => a + b, 0);

  return {
    count: slowQueryStore.length,
    avgDuration: sum / slowQueryStore.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
    byModel: groupByModel(slowQueryStore),
    byOperation: groupByOperation(slowQueryStore),
  };
}

/**
 * Group slow queries by model
 */
function groupByModel(queries: SlowQueryLog[]) {
  const grouped: Record<string, number> = {};
  queries.forEach(q => {
    const model = q.model || 'unknown';
    grouped[model] = (grouped[model] || 0) + 1;
  });
  return grouped;
}

/**
 * Group slow queries by operation
 */
function groupByOperation(queries: SlowQueryLog[]) {
  const grouped: Record<string, number> = {};
  queries.forEach(q => {
    const operation = q.operation || 'unknown';
    grouped[operation] = (grouped[operation] || 0) + 1;
  });
  return grouped;
}

/**
 * Prisma middleware for automatic slow query logging
 * 
 * Usage:
 * prisma.$use(createSlowQueryMiddleware({ threshold: 1000 }))
 */
export function createSlowQueryMiddleware(config?: SlowQueryConfig) {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    const start = Date.now();
    
    try {
      const result = await next(params);
      const duration = Date.now() - start;

      // Log if slow
      logSlowQuery(
        `${params.model}.${params.action}`,
        duration,
        {
          model: params.model,
          operation: params.action,
          params: params.args,
          config,
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Log slow failed queries too
      logSlowQuery(
        `${params.model}.${params.action} (FAILED)`,
        duration,
        {
          model: params.model,
          operation: params.action,
          params: params.args,
          config,
        }
      );

      throw error;
    }
  };
}

/**
 * Wrapper function to measure and log query execution time
 * 
 * Usage:
 * const users = await measureQuery(
 *   'User.findMany',
 *   () => prisma.users.findMany({ where: { active: true } })
 * );
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  config?: SlowQueryConfig
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    logSlowQuery(queryName, duration, { config });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logSlowQuery(`${queryName} (FAILED)`, duration, { config });
    throw error;
  }
}

/**
 * Decorator for measuring query execution time
 * 
 * Usage:
 * class UserService {
 *   @measureQueryTime('UserService.getUsers')
 *   async getUsers() {
 *     return prisma.users.findMany();
 *   }
 * }
 */
export function measureQueryTime(queryName: string, config?: SlowQueryConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return measureQuery(
        queryName,
        () => originalMethod.apply(this, args),
        config
      );
    };

    return descriptor;
  };
}
