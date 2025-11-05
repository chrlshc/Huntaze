/**
 * Load Shedding Middleware
 * Next.js middleware integration for admission control and load shedding
 */

import { NextRequest, NextResponse } from 'next/server';
import { admissionController, AdmissionDecision, PriorityClass } from './admissionController';

export interface LoadSheddingMiddlewareConfig {
  enabled: boolean;
  excludePaths: string[];
  includePaths: string[];
  defaultPriority: PriorityClass;
  customHeaders: boolean;
  metricsCollection: boolean;
}

class LoadSheddingMiddleware {
  private config: LoadSheddingMiddlewareConfig;
  private requestMetrics = new Map<string, {
    count: number;
    admitted: number;
    rejected: number;
    throttled: number;
    lastReset: number;
  }>();

  constructor(config: LoadSheddingMiddlewareConfig) {
    this.config = config;
  }

  async handle(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    
    try {
      // Check if load shedding is enabled
      if (!this.config.enabled) {
        return NextResponse.next();
      }

      // Check if path should be excluded
      if (this.shouldExcludePath(request.nextUrl.pathname)) {
        return NextResponse.next();
      }

      // Check if path should be included (if includePaths is specified)
      if (this.config.includePaths.length > 0 && !this.shouldIncludePath(request.nextUrl.pathname)) {
        return NextResponse.next();
      }

      // Prepare request for admission control
      const admissionRequest = {
        path: request.nextUrl.pathname,
        method: request.method,
        headers: this.extractHeaders(request),
        priority: this.determinePriority(request)
      };

      // Check admission
      const admissionResult = await admissionController.checkAdmission(admissionRequest);

      // Record metrics
      if (this.config.metricsCollection) {
        this.recordMetrics(request.nextUrl.pathname, admissionResult.decision);
      }

      // Handle admission decision
      switch (admissionResult.decision) {
        case AdmissionDecision.REJECT:
          return this.createRejectionResponse(admissionResult);

        case AdmissionDecision.THROTTLE:
          return this.createThrottleResponse(admissionResult);

        case AdmissionDecision.ADMIT:
          return this.createAdmissionResponse(request, admissionResult);

        default:
          return NextResponse.next();
      }
    } catch (error) {
      console.error('Load shedding middleware error:', error);
      
      // Fail open - allow request to proceed
      return NextResponse.next();
    }
  }

  private shouldExcludePath(pathname: string): boolean {
    return this.config.excludePaths.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pathname.startsWith(pattern);
    });
  }

  private shouldIncludePath(pathname: string): boolean {
    return this.config.includePaths.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pathname.startsWith(pattern);
    });
  }

  private extractHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Extract relevant headers for admission control
    const relevantHeaders = [
      'user-agent',
      'x-forwarded-for',
      'x-real-ip',
      'authorization',
      'x-api-key',
      'x-priority-class',
      'x-request-id'
    ];

    relevantHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value) {
        headers[headerName] = value;
      }
    });

    return headers;
  }

  private determinePriority(request: NextRequest): PriorityClass {
    // Check for explicit priority header
    const priorityHeader = request.headers.get('x-priority-class');
    if (priorityHeader && Object.values(PriorityClass).includes(priorityHeader as PriorityClass)) {
      return priorityHeader as PriorityClass;
    }

    // Determine priority based on path and method
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Critical paths
    if (pathname.startsWith('/api/auth/') ||
        pathname.startsWith('/api/health/') ||
        pathname.startsWith('/api/payments/')) {
      return PriorityClass.CRITICAL;
    }

    // Important paths
    if (pathname.startsWith('/api/users/') ||
        pathname.startsWith('/api/content/') ||
        pathname.startsWith('/api/crm/') ||
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return PriorityClass.IMPORTANT;
    }

    // Default to best-effort
    return this.config.defaultPriority;
  }

  private createRejectionResponse(admissionResult: any): NextResponse {
    const response = new NextResponse(
      JSON.stringify({
        error: 'Service Temporarily Unavailable',
        message: admissionResult.reason,
        code: 'LOAD_SHEDDING_ACTIVE',
        shedLevel: admissionResult.shedLevel,
        retryAfter: admissionResult.retryAfter
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': admissionResult.retryAfter ? Math.ceil(admissionResult.retryAfter / 1000).toString() : '60'
        }
      }
    );

    if (this.config.customHeaders) {
      this.addCustomHeaders(response, admissionResult);
    }

    return response;
  }

  private createThrottleResponse(admissionResult: any): NextResponse {
    const response = new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: admissionResult.reason,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: admissionResult.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': admissionResult.retryAfter ? Math.ceil(admissionResult.retryAfter / 1000).toString() : '1'
        }
      }
    );

    if (this.config.customHeaders) {
      this.addCustomHeaders(response, admissionResult);
    }

    return response;
  }

  private createAdmissionResponse(request: NextRequest, admissionResult: any): NextResponse {
    const response = NextResponse.next();

    if (this.config.customHeaders) {
      this.addCustomHeaders(response, admissionResult);
    }

    // Add priority class header for downstream services
    response.headers.set('X-Priority-Class', admissionResult.priorityClass);
    response.headers.set('X-Shed-Level', admissionResult.shedLevel.toString());

    return response;
  }

  private addCustomHeaders(response: NextResponse, admissionResult: any): void {
    // Add load shedding information headers
    response.headers.set('X-Load-Shedding-Decision', admissionResult.decision);
    response.headers.set('X-Load-Shedding-Level', admissionResult.shedLevel.toString());
    response.headers.set('X-Priority-Class', admissionResult.priorityClass);
    
    // Add system metrics headers
    const metrics = admissionResult.metrics;
    response.headers.set('X-System-CPU', metrics.cpu.toFixed(1));
    response.headers.set('X-System-Memory', metrics.memory.toFixed(1));
    response.headers.set('X-System-Latency-P95', metrics.latencyP95.toFixed(0));
    response.headers.set('X-System-Queue-Depth', metrics.queueDepth.toString());
  }

  private recordMetrics(path: string, decision: AdmissionDecision): void {
    const now = Date.now();
    const key = this.getMetricsKey(path);
    
    let metrics = this.requestMetrics.get(key);
    if (!metrics) {
      metrics = {
        count: 0,
        admitted: 0,
        rejected: 0,
        throttled: 0,
        lastReset: now
      };
      this.requestMetrics.set(key, metrics);
    }

    // Reset metrics every hour
    if (now - metrics.lastReset > 3600000) {
      metrics.count = 0;
      metrics.admitted = 0;
      metrics.rejected = 0;
      metrics.throttled = 0;
      metrics.lastReset = now;
    }

    metrics.count++;
    switch (decision) {
      case AdmissionDecision.ADMIT:
        metrics.admitted++;
        break;
      case AdmissionDecision.REJECT:
        metrics.rejected++;
        break;
      case AdmissionDecision.THROTTLE:
        metrics.throttled++;
        break;
    }
  }

  private getMetricsKey(path: string): string {
    // Group similar paths together for metrics
    if (path.startsWith('/api/')) {
      const parts = path.split('/');
      if (parts.length >= 3) {
        return `/api/${parts[2]}/*`;
      }
    }
    return path;
  }

  // Public API methods
  updateConfig(newConfig: Partial<LoadSheddingMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [path, metrics] of this.requestMetrics) {
      result[path] = {
        ...metrics,
        admissionRate: metrics.count > 0 ? (metrics.admitted / metrics.count) * 100 : 100,
        rejectionRate: metrics.count > 0 ? (metrics.rejected / metrics.count) * 100 : 0,
        throttleRate: metrics.count > 0 ? (metrics.throttled / metrics.count) * 100 : 0
      };
    }

    return result;
  }

  clearMetrics(): void {
    this.requestMetrics.clear();
  }

  getConfig(): LoadSheddingMiddlewareConfig {
    return { ...this.config };
  }
}

// Global instance
export const loadSheddingMiddleware = new LoadSheddingMiddleware({
  enabled: true,
  excludePaths: [
    '/api/health',
    '/api/monitoring',
    '/api/load-shedding',
    '/_next',
    '/favicon.ico',
    '/robots.txt'
  ],
  includePaths: [], // Empty means include all non-excluded paths
  defaultPriority: PriorityClass.BEST_EFFORT,
  customHeaders: true,
  metricsCollection: true
});

// Middleware function for Next.js
export async function middleware(request: NextRequest): Promise<NextResponse> {
  return loadSheddingMiddleware.handle(request);
}

// Configuration for Next.js middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Convenience functions
export const getLoadSheddingMetrics = () => loadSheddingMiddleware.getMetrics();
export const updateLoadSheddingConfig = (config: Partial<LoadSheddingMiddlewareConfig>) =>
  loadSheddingMiddleware.updateConfig(config);
export const clearLoadSheddingMetrics = () => loadSheddingMiddleware.clearMetrics();