/**
 * Monitoring Middleware for Next.js API Routes
 * 
 * Automatically tracks:
 * - API response times
 * - Error rates
 * - Request counts
 * - Cache hit ratios
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudWatchService, recordAPILatency, recordErrorRate, logError } from '../monitoring/cloudwatch.service';
import { goldenSignals } from '../monitoring/telemetry';

// Track request metrics
const requestMetrics = {
  total: 0,
  errors: 0,
  lastReset: Date.now(),
};

/**
 * Monitoring middleware for API routes
 */
export function withMonitoring<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  routeName: string
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    const [request] = args;
    const method = request.method || 'GET';
    
    // Increment active connections
    goldenSignals.incrementActiveConnections();
    requestMetrics.total++;

    let response: Response;
    let statusCode = 200;

    try {
      // Execute handler
      response = await handler(...args);
      statusCode = response.status;

      // Track errors
      if (statusCode >= 400) {
        requestMetrics.errors++;
        
        // Log error to CloudWatch
        if (statusCode >= 500) {
          await logError(
            `API error: ${method} ${routeName}`,
            undefined,
            {
              statusCode,
              method,
              route: routeName,
            }
          );
        }
      }

      return response;
    } catch (error) {
      requestMetrics.errors++;
      statusCode = 500;

      // Log error to CloudWatch
      await logError(
        `API exception: ${method} ${routeName}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          method,
          route: routeName,
        }
      );

      throw error;
    } finally {
      const duration = performance.now() - startTime;

      // Decrement active connections
      goldenSignals.decrementActiveConnections();

      // Record metrics
      await recordAPILatency(routeName, method, duration);
      
      // Record to golden signals
      goldenSignals.recordRequestDuration(duration, method, routeName, statusCode);
      goldenSignals.incrementRequestCount(method, routeName, statusCode);

      if (statusCode >= 400) {
        goldenSignals.recordError(
          method,
          routeName,
          statusCode >= 500 ? 'ServerError' : 'ClientError',
          statusCode
        );
      }

      // Periodically report error rate (every 100 requests)
      if (requestMetrics.total % 100 === 0) {
        await recordErrorRate(requestMetrics.errors, requestMetrics.total);
        
        // Reset counters every hour
        if (Date.now() - requestMetrics.lastReset > 3600000) {
          requestMetrics.total = 0;
          requestMetrics.errors = 0;
          requestMetrics.lastReset = Date.now();
        }
      }
    }
  }) as T;
}

/**
 * Monitoring middleware for Next.js middleware
 */
export async function monitoringMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  const startTime = performance.now();
  const { pathname, method } = request.nextUrl;

  // Skip monitoring for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return undefined;
  }

  // Track request
  goldenSignals.incrementActiveConnections();

  // Continue with request
  const response = NextResponse.next();

  // Record metrics
  const duration = performance.now() - startTime;
  goldenSignals.decrementActiveConnections();
  goldenSignals.recordRequestDuration(duration, method, pathname, response.status);

  return response;
}

/**
 * Initialize monitoring on app startup
 */
export async function initializeMonitoring(): Promise<void> {
  try {
    await cloudWatchService.initialize();
    console.log('✅ Monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize monitoring:', error);
  }
}
