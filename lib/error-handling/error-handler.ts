/**
 * Error Handler Service
 * Provides retry, fallback, circuit breaker, and structured logging
 */

import { getCloudWatchMonitoring, type PerformanceEvent } from '../aws/cloudwatch';

// ============================================================================
// Types
// ============================================================================

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AWS_SERVICE = 'AWS_SERVICE',
  PERFORMANCE = 'PERFORMANCE',
  CACHE = 'CACHE',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface StructuredError {
  category: ErrorCategory;
  code: string;
  message: string;
  context: ErrorContext;
  originalError?: Error;
  retryable: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============================================================================
// Circuit Breaker State
// ============================================================================

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreakerState {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: number;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  recordSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  canAttempt(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }
    
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceLastFailure >= this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return true;
      }
      return false;
    }
    
    // HALF_OPEN state
    return true;
  }

  getState(): CircuitState {
    return this.state;
  }
}

// ============================================================================
// Error Handler
// ============================================================================

export class ErrorHandler {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private monitoring = getCloudWatchMonitoring();

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = options.initialDelay;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryable(error as Error, options.retryableErrors)) {
          throw error;
        }
        
        // Don't delay after last attempt
        if (attempt < options.maxRetries) {
          await this.sleep(delay);
          delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Fallback to stale cache on error
   */
  async fallbackToStaleCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheGetter: (key: string) => Promise<T | null>
  ): Promise<T> {
    try {
      return await fetcher();
    } catch (error) {
      // Try to get stale cache
      const staleData = await cacheGetter(key);
      if (staleData !== null) {
        // Log that we're using stale data
        await this.logError(error as Error, {
          operation: 'fallbackToStaleCache',
          sessionId: this.getSessionId(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date(),
          metadata: { key, usingStaleCache: true },
        });
        return staleData;
      }
      throw error;
    }
  }

  /**
   * Circuit breaker for external services
   */
  async circuitBreaker<T>(
    service: string,
    operation: () => Promise<T>,
    config?: CircuitBreakerConfig
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(service, config);
    
    if (!breaker.canAttempt()) {
      throw new Error(`Circuit breaker open for service: ${service}`);
    }

    try {
      const result = await operation();
      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();
      throw error;
    }
  }

  /**
   * Log structured error to CloudWatch
   */
  async logError(error: Error, context: ErrorContext): Promise<void> {
    const structuredError = this.categorizeError(error, context);
    
    const event: PerformanceEvent = {
      level: this.getSeverityLevel(structuredError.severity),
      message: structuredError.message,
      context: {
        category: structuredError.category,
        code: structuredError.code,
        operation: context.operation,
        userId: context.userId,
        sessionId: context.sessionId,
        url: context.url,
        userAgent: context.userAgent,
        retryable: structuredError.retryable,
        severity: structuredError.severity,
        stack: error.stack,
        ...context.metadata,
      },
      timestamp: context.timestamp,
    };

    try {
      await this.monitoring.logEvent(event);
    } catch (loggingError) {
      // Fallback to console if CloudWatch fails
      console.error('Failed to log to CloudWatch:', loggingError);
      console.error('Original error:', structuredError);
    }
  }

  /**
   * Categorize error into structured format
   */
  private categorizeError(error: Error, context: ErrorContext): StructuredError {
    const category = this.determineCategory(error);
    const code = this.extractErrorCode(error);
    const retryable = this.isRetryable(error);
    const severity = this.determineSeverity(error, category);

    return {
      category,
      code,
      message: error.message,
      context,
      originalError: error,
      retryable,
      severity,
    };
  }

  /**
   * Determine error category
   */
  private determineCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      name.includes('networkerror')
    ) {
      return ErrorCategory.NETWORK;
    }

    // AWS service errors
    if (
      message.includes('cloudwatch') ||
      message.includes('s3') ||
      message.includes('cloudfront') ||
      message.includes('lambda') ||
      name.includes('awserror')
    ) {
      return ErrorCategory.AWS_SERVICE;
    }

    // Performance errors
    if (
      message.includes('performance') ||
      message.includes('slow') ||
      message.includes('timeout')
    ) {
      return ErrorCategory.PERFORMANCE;
    }

    // Cache errors
    if (
      message.includes('cache') ||
      message.includes('redis') ||
      name.includes('cacheerror')
    ) {
      return ErrorCategory.CACHE;
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      name.includes('validationerror')
    ) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: any): string {
    return error.code || error.name || 'UNKNOWN_ERROR';
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error, retryableErrors?: string[]): boolean {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Custom retryable errors
    if (retryableErrors) {
      return retryableErrors.some(
        (pattern) =>
          message.includes(pattern.toLowerCase()) ||
          name.includes(pattern.toLowerCase())
      );
    }

    // Default retryable patterns
    const retryablePatterns = [
      'timeout',
      'network',
      'econnreset',
      'enotfound',
      'etimedout',
      '429', // Rate limit
      '500', // Server error
      '502', // Bad gateway
      '503', // Service unavailable
      '504', // Gateway timeout
    ];

    return retryablePatterns.some(
      (pattern) => message.includes(pattern) || name.includes(pattern)
    );
  }

  /**
   * Determine error severity
   */
  private determineSeverity(
    error: Error,
    category: ErrorCategory
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical errors
    if (category === ErrorCategory.AWS_SERVICE) {
      return 'CRITICAL';
    }

    // High severity
    if (
      category === ErrorCategory.NETWORK ||
      error.message.includes('authentication') ||
      error.message.includes('authorization')
    ) {
      return 'HIGH';
    }

    // Medium severity
    if (
      category === ErrorCategory.PERFORMANCE ||
      category === ErrorCategory.CACHE
    ) {
      return 'MEDIUM';
    }

    // Low severity
    return 'LOW';
  }

  /**
   * Get severity level for CloudWatch
   */
  private getSeverityLevel(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): 'INFO' | 'WARN' | 'ERROR' {
    switch (severity) {
      case 'LOW':
        return 'INFO';
      case 'MEDIUM':
        return 'WARN';
      case 'HIGH':
      case 'CRITICAL':
        return 'ERROR';
    }
  }

  /**
   * Get or create circuit breaker for service
   */
  private getCircuitBreaker(
    service: string,
    config?: CircuitBreakerConfig
  ): CircuitBreakerState {
    if (!this.circuitBreakers.has(service)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000, // 10 seconds
        ...config,
      };
      this.circuitBreakers.set(service, new CircuitBreakerState(defaultConfig));
    }
    return this.circuitBreakers.get(service)!;
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

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let errorHandlerInstance: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
  }
  return errorHandlerInstance;
}

// ============================================================================
// Default Retry Options
// ============================================================================

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// ============================================================================
// Alert Thresholds
// ============================================================================

export const ALERT_THRESHOLDS = {
  // Performance
  pageLoadTime: 3000, // 3 seconds
  apiResponseTime: 2000, // 2 seconds
  lcp: 2500, // 2.5 seconds
  fid: 100, // 100ms
  cls: 0.1, // 0.1 score

  // Resources
  memoryUsage: 0.85, // 85% of available
  cpuUsage: 0.8, // 80% of available

  // Errors
  errorRate: 0.05, // 5% error rate
  cacheHitRate: 0.7, // 70% minimum

  // Availability
  uptime: 0.999, // 99.9% uptime
};
