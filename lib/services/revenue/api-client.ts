/**
 * Revenue Optimization - Base API Client
 * 
 * Provides retry logic, error handling, timeout management, and monitoring
 */

import { RevenueError, RevenueErrorType } from './types';
import { revenueAPIMonitor } from './api-monitoring';

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
} as const;

const TIMEOUT_MS = 10000; // 10 seconds

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();
const DEDUP_WINDOW = 1000; // 1 second

export class RevenueAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/revenue') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make API request with retry, timeout, deduplication, and monitoring
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const correlationId = this.generateCorrelationId();
    const method = options.method || 'GET';
    const startTime = Date.now();

    // Request deduplication for GET requests
    if (method === 'GET') {
      const cacheKey = this.getCacheKey(endpoint, options);
      const cachedRequest = requestCache.get(cacheKey);
      
      if (cachedRequest) {
        console.log('[RevenueAPI] Deduplicating request:', { endpoint, correlationId });
        return cachedRequest;
      }

      // Create new request promise
      const requestPromise = this.executeRequest<T>(url, options, correlationId, startTime);
      requestCache.set(cacheKey, requestPromise);

      // Clear from cache after dedup window
      setTimeout(() => requestCache.delete(cacheKey), DEDUP_WINDOW);

      return requestPromise;
    }

    return this.executeRequest<T>(url, options, correlationId, startTime);
  }

  /**
   * Execute API request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    correlationId: string,
    startTime: number
  ): Promise<T> {
    const method = options.method || 'GET';
    const endpoint = url.replace(this.baseUrl, '');
    let lastError: Error | undefined;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            ...options.headers,
          },
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const error = await this.handleErrorResponse(response, correlationId);
          
          // Log failed request
          revenueAPIMonitor.logAPICall({
            endpoint,
            method,
            duration,
            status: response.status,
            success: false,
            correlationId,
            timestamp: new Date().toISOString(),
            error: error.message,
          });

          throw error;
        }

        const data = await response.json();

        // Log successful request
        revenueAPIMonitor.logAPICall({
          endpoint,
          method,
          duration,
          status: response.status,
          success: true,
          correlationId,
          timestamp: new Date().toISOString(),
        });

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on validation or permission errors
        if (this.isRevenueError(error)) {
          if (
            error.type === RevenueErrorType.VALIDATION_ERROR ||
            error.type === RevenueErrorType.PERMISSION_ERROR
          ) {
            throw error;
          }
        }

        // Last attempt - throw error
        if (attempt === RETRY_CONFIG.maxAttempts) {
          const duration = Date.now() - startTime;
          revenueAPIMonitor.logAPICall({
            endpoint,
            method,
            duration,
            status: 0,
            success: false,
            correlationId,
            timestamp: new Date().toISOString(),
            error: lastError.message,
          });

          throw this.wrapError(lastError, correlationId);
        }

        // Log retry attempt
        console.warn(`[RevenueAPI] Retry attempt ${attempt}/${RETRY_CONFIG.maxAttempts}:`, {
          endpoint,
          error: lastError.message,
          correlationId,
        });

        // Wait before retry
        await this.sleep(delay);
        delay = Math.min(
          delay * RETRY_CONFIG.backoffFactor,
          RETRY_CONFIG.maxDelay
        ) as typeof RETRY_CONFIG.initialDelay;
      }
    }

    throw this.wrapError(lastError!, correlationId);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle error response from API
   */
  private async handleErrorResponse(
    response: Response,
    correlationId: string
  ): Promise<RevenueError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const errorType = this.getErrorType(response.status);
    const userMessage = this.getUserMessage(errorType, errorData.message);

    return {
      type: errorType,
      message: errorData.message || response.statusText,
      userMessage,
      retryable: this.isRetryable(errorType),
      correlationId,
    };
  }

  /**
   * Determine error type from status code
   */
  private getErrorType(status: number): RevenueErrorType {
    if (status === 400) return RevenueErrorType.VALIDATION_ERROR;
    if (status === 403) return RevenueErrorType.PERMISSION_ERROR;
    if (status === 429) return RevenueErrorType.RATE_LIMIT_ERROR;
    if (status >= 500) return RevenueErrorType.API_ERROR;
    return RevenueErrorType.NETWORK_ERROR;
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(type: RevenueErrorType, message: string): string {
    switch (type) {
      case RevenueErrorType.NETWORK_ERROR:
        return 'Connection issue. Please check your internet and try again.';
      case RevenueErrorType.VALIDATION_ERROR:
        return message || 'Invalid input. Please check your data and try again.';
      case RevenueErrorType.PERMISSION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case RevenueErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';
      case RevenueErrorType.API_ERROR:
        return 'Server error. Our team has been notified. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(type: RevenueErrorType): boolean {
    return (
      type === RevenueErrorType.NETWORK_ERROR ||
      type === RevenueErrorType.API_ERROR ||
      type === RevenueErrorType.RATE_LIMIT_ERROR
    );
  }

  /**
   * Check if error is a RevenueError
   */
  private isRevenueError(error: unknown): error is RevenueError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error &&
      'userMessage' in error &&
      'retryable' in error
    );
  }

  /**
   * Wrap error with correlation ID
   */
  private wrapError(error: Error, correlationId: string): RevenueError {
    if (this.isRevenueError(error)) {
      return error;
    }

    return {
      type: RevenueErrorType.NETWORK_ERROR,
      message: error.message,
      userMessage: 'Connection issue. Please try again.',
      retryable: true,
      correlationId,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `rev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if response is cacheable
   */
  private isCacheable(endpoint: string): boolean {
    // Only cache GET requests for read operations
    return endpoint.includes('/pricing') || 
           endpoint.includes('/churn') || 
           endpoint.includes('/upsells') ||
           endpoint.includes('/forecast') ||
           endpoint.includes('/payouts');
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(endpoint: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }
}

// Export singleton instance
export const revenueAPI = new RevenueAPIClient();
