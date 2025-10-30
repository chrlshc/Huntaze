/**
 * OnlyFans Gateway Implementation
 * 
 * Production-ready implementation with:
 * - Comprehensive error handling
 * - Exponential backoff retry strategy
 * - Token refresh and authentication
 * - Request caching
 * - Rate limiting
 * - Detailed logging
 * - Metrics collection
 * 
 * @module lib/services/onlyfans/gateway
 */

import {
  OnlyFansGateway,
  OnlyFansGatewayConfig,
  ApiResponse,
  ApiError,
  ErrorCode,
  Conversation,
  Message,
  AuthToken,
  HealthStatus,
  HumanApproval,
  RetryContext,
  CacheEntry,
  RequestMetrics,
  DEFAULT_GATEWAY_CONFIG,
} from './types';

// ============================================================================
// Gateway Implementation
// ============================================================================

export class OnlyFansGatewayImpl implements OnlyFansGateway {
  private config: OnlyFansGatewayConfig;
  private cache = new Map<string, CacheEntry<unknown>>();
  private requestCount = { perMinute: 0, perHour: 0 };
  private metrics: RequestMetrics[] = [];
  private lastMinuteReset = Date.now();
  private lastHourReset = Date.now();

  constructor(config: OnlyFansGatewayConfig) {
    this.config = {
      ...DEFAULT_GATEWAY_CONFIG,
      ...config,
    } as OnlyFansGatewayConfig;

    this.log('info', 'OnlyFans Gateway initialized', { config: this.sanitizeConfig() });
  }

  // ==========================================================================
  // Public API Methods
  // ==========================================================================

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.executeWithRetry(
      'getConversations',
      async () => {
        const cacheKey = 'conversations';
        const cached = this.getFromCache<Conversation[]>(cacheKey);
        if (cached) {
          this.log('debug', 'Returning cached conversations');
          return this.successResponse(cached);
        }

        const response = await this.makeRequest<Conversation[]>({
          method: 'GET',
          endpoint: '/api/conversations',
        });

        if (response.success) {
          this.setCache(cacheKey, response.data);
        }

        return response;
      }
    );
  }

  async getMessages(
    userId: string,
    cursor?: string
  ): Promise<ApiResponse<{ messages: Message[]; nextCursor?: string }>> {
    return this.executeWithRetry(
      'getMessages',
      async () => {
        const cacheKey = `messages:${userId}:${cursor || 'initial'}`;
        const cached = this.getFromCache<{ messages: Message[]; nextCursor?: string }>(cacheKey);
        if (cached) {
          this.log('debug', 'Returning cached messages', { userId, cursor });
          return this.successResponse(cached);
        }

        const endpoint = cursor
          ? `/api/messages/${userId}?cursor=${cursor}`
          : `/api/messages/${userId}`;

        const response = await this.makeRequest<{ messages: Message[]; nextCursor?: string }>({
          method: 'GET',
          endpoint,
        });

        if (response.success) {
          this.setCache(cacheKey, response.data);
        }

        return response;
      }
    );
  }

  async sendMessage(
    userId: string,
    content: string,
    humanApproval: HumanApproval
  ): Promise<ApiResponse<{ messageId: string }>> {
    // Validate human approval
    if (!this.validateHumanApproval(humanApproval)) {
      return this.errorResponse({
        code: ErrorCode.COMPLIANCE_VIOLATION,
        message: 'Invalid human approval metadata',
        retryable: false,
      });
    }

    return this.executeWithRetry(
      'sendMessage',
      async () => {
        // Clear cache for this conversation
        this.invalidateCache(`messages:${userId}`);
        this.invalidateCache('conversations');

        const response = await this.makeRequest<{ messageId: string }>({
          method: 'POST',
          endpoint: `/api/messages/${userId}`,
          body: {
            content,
            humanApproval,
          },
        });

        if (response.success) {
          this.log('info', 'Message sent successfully', {
            userId,
            messageId: response.data.messageId,
            approvedBy: humanApproval.approvedBy,
          });
        }

        return response;
      }
    );
  }

  async refreshAuth(): Promise<ApiResponse<AuthToken>> {
    this.log('info', 'Refreshing authentication token');

    return this.executeWithRetry(
      'refreshAuth',
      async () => {
        const response = await this.makeRequest<AuthToken>({
          method: 'POST',
          endpoint: '/api/auth/refresh',
          skipAuth: true,
        });

        if (response.success) {
          // Update config with new token
          this.config.auth.sessionToken = response.data.accessToken;
          this.log('info', 'Authentication token refreshed successfully');
        }

        return response;
      }
    );
  }

  async healthCheck(): Promise<ApiResponse<HealthStatus>> {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - new Date(m.timestamp).getTime() < 60000 // Last minute
    );

    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = recentMetrics.length > 0 ? errorCount / recentMetrics.length : 0;
    const avgLatency = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.durationMs, 0) / recentMetrics.length
      : 0;

    const status: HealthStatus = {
      status: errorRate > 0.5 ? 'unhealthy' : errorRate > 0.2 ? 'degraded' : 'healthy',
      lastSuccessfulRequest: recentMetrics.find(m => m.statusCode < 400)?.timestamp,
      errorRate,
      averageLatencyMs: avgLatency,
      rateLimitRemaining: this.getRateLimitRemaining(),
    };

    return this.successResponse(status);
  }

  // ==========================================================================
  // Core Request Logic
  // ==========================================================================

  private async makeRequest<T>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    body?: unknown;
    skipAuth?: boolean;
  }): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        return this.errorResponse({
          code: ErrorCode.RATE_LIMIT,
          message: 'Rate limit exceeded',
          retryable: true,
        });
      }

      // Build request
      const url = `${this.config.baseUrl || ''}${options.endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      };

      if (!options.skipAuth) {
        headers['Authorization'] = `Bearer ${this.config.auth.sessionToken}`;
        if (this.config.auth.cookies) {
          headers['Cookie'] = this.formatCookies(this.config.auth.cookies);
        }
      }

      this.log('debug', 'Making request', {
        method: options.method,
        endpoint: options.endpoint,
        requestId,
      });

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Record metrics
      const durationMs = Date.now() - startTime;
      this.recordMetrics({
        endpoint: options.endpoint,
        method: options.method,
        statusCode: response.status,
        durationMs,
        retryCount: 0,
        cached: false,
        timestamp: new Date().toISOString(),
      });

      // Handle response
      if (!response.ok) {
        return this.handleErrorResponse(response, requestId);
      }

      const data = await response.json();
      return this.successResponse(data, requestId);

    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        this.log('warn', 'Request timeout', { endpoint: options.endpoint, requestId });
        return this.errorResponse({
          code: ErrorCode.TIMEOUT,
          message: `Request timeout after ${this.config.timeout}ms`,
          retryable: true,
        });
      }

      this.log('error', 'Request failed', {
        endpoint: options.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      });

      return this.errorResponse({
        code: ErrorCode.NETWORK_ERROR,
        message: error instanceof Error ? error.message : 'Network error',
        retryable: true,
      });
    }
  }

  // ==========================================================================
  // Retry Logic
  // ==========================================================================

  private async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    const context: RetryContext = { attempt: 0 };

    for (let attempt = 0; attempt <= this.config.retry.maxRetries; attempt++) {
      context.attempt = attempt;

      if (attempt > 0) {
        const delay = this.calculateRetryDelay(attempt);
        context.nextRetryDelayMs = delay;
        
        this.log('info', 'Retrying request', {
          operation,
          attempt,
          delayMs: delay,
          lastError: context.lastError,
        });

        await this.sleep(delay);
      }

      const result = await fn();

      if (result.success) {
        if (attempt > 0) {
          this.log('info', 'Request succeeded after retry', { operation, attempt });
        }
        return result;
      }

      context.lastError = result.error;

      // Check if error is retryable
      if (!this.isRetryable(result.error)) {
        this.log('warn', 'Non-retryable error, aborting', {
          operation,
          error: result.error,
        });
        return result;
      }

      // Last attempt failed
      if (attempt === this.config.retry.maxRetries) {
        this.log('error', 'All retry attempts exhausted', {
          operation,
          attempts: attempt + 1,
          lastError: result.error,
        });
        return result;
      }
    }

    // Should never reach here
    return this.errorResponse({
      code: ErrorCode.UNKNOWN,
      message: 'Unexpected retry loop exit',
      retryable: false,
    });
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.config.retry.initialDelayMs * Math.pow(this.config.retry.backoffMultiplier, attempt - 1),
      this.config.retry.maxDelayMs
    );

    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  private isRetryable(error: ApiError): boolean {
    return this.config.retry.retryableErrors.includes(error.code);
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  private getFromCache<T>(key: string): T | null {
    if (!this.config.cache.enabled) return null;

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    if (!this.config.cache.enabled) return;

    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + this.config.cache.ttlMs,
    });

    // Enforce max size
    if (this.config.cache.maxSize && this.cache.size > this.config.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset counters if needed
    if (now - this.lastMinuteReset > 60000) {
      this.requestCount.perMinute = 0;
      this.lastMinuteReset = now;
    }
    if (now - this.lastHourReset > 3600000) {
      this.requestCount.perHour = 0;
      this.lastHourReset = now;
    }

    // Check limits
    if (this.config.rateLimit) {
      if (this.requestCount.perMinute >= this.config.rateLimit.maxRequestsPerMinute) {
        this.log('warn', 'Per-minute rate limit exceeded');
        return false;
      }
      if (this.requestCount.perHour >= this.config.rateLimit.maxRequestsPerHour) {
        this.log('warn', 'Per-hour rate limit exceeded');
        return false;
      }
    }

    // Increment counters
    this.requestCount.perMinute++;
    this.requestCount.perHour++;

    return true;
  }

  private getRateLimitRemaining(): number {
    if (!this.config.rateLimit) return -1;
    return Math.min(
      this.config.rateLimit.maxRequestsPerMinute - this.requestCount.perMinute,
      this.config.rateLimit.maxRequestsPerHour - this.requestCount.perHour
    );
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  private async handleErrorResponse(
    response: Response,
    requestId: string
  ): Promise<ApiResponse<never>> {
    let errorCode: ErrorCode;
    let message: string;

    switch (response.status) {
      case 401:
        errorCode = ErrorCode.UNAUTHORIZED;
        message = 'Authentication required';
        break;
      case 403:
        errorCode = ErrorCode.FORBIDDEN;
        message = 'Access forbidden';
        break;
      case 404:
        errorCode = ErrorCode.NOT_FOUND;
        message = 'Resource not found';
        break;
      case 429:
        errorCode = ErrorCode.RATE_LIMIT;
        message = 'Rate limit exceeded';
        break;
      case 500:
        errorCode = ErrorCode.INTERNAL_ERROR;
        message = 'Internal server error';
        break;
      case 503:
        errorCode = ErrorCode.SERVICE_UNAVAILABLE;
        message = 'Service unavailable';
        break;
      default:
        errorCode = response.status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
        message = `HTTP ${response.status}`;
    }

    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // Ignore JSON parse errors
    }

    return this.errorResponse({
      code: errorCode,
      message,
      retryable: [ErrorCode.RATE_LIMIT, ErrorCode.INTERNAL_ERROR, ErrorCode.SERVICE_UNAVAILABLE].includes(errorCode),
    }, requestId);
  }

  // ==========================================================================
  // Response Helpers
  // ==========================================================================

  private successResponse<T>(data: T, requestId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestId || this.generateRequestId(),
      },
    };
  }

  private errorResponse(error: ApiError, requestId?: string): ApiResponse<never> {
    return {
      success: false,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestId || this.generateRequestId(),
      },
    };
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  private validateHumanApproval(approval: HumanApproval): boolean {
    if (!approval.approvedBy || !approval.approvedAt) {
      this.log('error', 'Invalid human approval: missing required fields', { approval });
      return false;
    }

    // Validate timestamp is recent (within last 5 minutes)
    const approvedAt = new Date(approval.approvedAt).getTime();
    const now = Date.now();
    if (now - approvedAt > 5 * 60 * 1000) {
      this.log('error', 'Invalid human approval: timestamp too old', { approval });
      return false;
    }

    return true;
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (!this.config.logging.enabled) return;

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logging.level];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const logData = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(data && typeof data === 'object' ? data : { data }),
      };
      console[level === 'debug' ? 'log' : level](JSON.stringify(logData));
    }
  }

  private recordMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatCookies(cookies: Record<string, string>): string {
    return Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  private sanitizeConfig(): unknown {
    return {
      ...this.config,
      auth: {
        sessionToken: '***REDACTED***',
        cookies: this.config.auth.cookies ? '***REDACTED***' : undefined,
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new OnlyFans Gateway instance
 * 
 * @param config - Gateway configuration
 * @returns Configured gateway instance
 * 
 * @example
 * ```typescript
 * const gateway = createOnlyFansGateway({
 *   auth: {
 *     sessionToken: 'your-token',
 *   },
 *   retry: {
 *     maxRetries: 3,
 *     initialDelayMs: 1000,
 *     maxDelayMs: 10000,
 *     backoffMultiplier: 2,
 *     retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT],
 *   },
 *   cache: {
 *     enabled: true,
 *     ttlMs: 300000,
 *   },
 *   timeout: 30000,
 *   logging: {
 *     enabled: true,
 *     level: 'info',
 *   },
 * });
 * ```
 */
export function createOnlyFansGateway(config: OnlyFansGatewayConfig): OnlyFansGateway {
  return new OnlyFansGatewayImpl(config);
}
