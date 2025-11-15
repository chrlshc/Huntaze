/**
 * Base API Client
 * 
 * Reusable API client with:
 * - Retry logic with exponential backoff
 * - Timeout protection
 * - Error handling with correlation IDs
 * - Request/response logging
 * - Type safety
 */

import { APIError, APIErrorType, APIErrorHandler } from './errors';
import { Logger } from './logger';

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,      // 100ms
  maxDelay: 2000,         // 2s
  backoffFactor: 2,       // Exponential
} as const;

const TIMEOUT_MS = 10000; // 10 seconds

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retryable?: boolean;
  correlationId?: string;
}

export class BaseAPIClient {
  protected baseUrl: string;
  protected logger: Logger;

  constructor(baseUrl: string, context: string = 'APIClient') {
    this.baseUrl = baseUrl;
    this.logger = new Logger(context);
  }

  /**
   * Make API request with retry and timeout
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const correlationId = options.correlationId || this.generateCorrelationId();
    const timeout = options.timeout || TIMEOUT_MS;
    const retryable = options.retryable !== false;

    this.logger.setCorrelationId(correlationId);
    this.logger.info(`Request started`, {
      method: options.method || 'GET',
      url,
      timeout,
      retryable,
    });

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
        }, timeout);

        if (!response.ok) {
          throw await this.handleErrorResponse(response, correlationId);
        }

        const data = await response.json();
        
        this.logger.info(`Request successful`, {
          attempt,
          statusCode: response.status,
          duration: Date.now(),
        });

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const apiError = APIErrorHandler.handle(error, correlationId);
        
        this.logger.warn(`Request failed`, {
          attempt,
          error: apiError.message,
          type: apiError.type,
          retryable: apiError.retryable,
        });

        // Don't retry on validation or permission errors
        if (!retryable || !apiError.retryable) {
          this.logger.error(`Request aborted (not retryable)`, lastError, {
            errorType: apiError.type,
          });
          throw apiError;
        }

        // Last attempt - throw error
        if (attempt === RETRY_CONFIG.maxAttempts) {
          this.logger.error(`Request failed after ${attempt} attempts`, lastError);
          throw apiError;
        }

        // Wait before retry (exponential backoff)
        this.logger.info(`Retrying in ${delay}ms`, { attempt, nextAttempt: attempt + 1 });
        await this.sleep(delay);
        delay = Math.min(
          delay * RETRY_CONFIG.backoffFactor,
          RETRY_CONFIG.maxDelay
        ) as typeof RETRY_CONFIG.initialDelay;
      }
    }

    throw APIErrorHandler.handle(lastError!, correlationId);
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions
  ): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    
    return this.request<T>(`${endpoint}${queryString}`, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
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
  ): Promise<APIError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const errorType = this.getErrorType(response.status);
    const userMessage = APIErrorHandler.getUserMessage(errorType, errorData.message);

    return {
      type: errorType,
      message: errorData.message || response.statusText,
      userMessage,
      retryable: APIErrorHandler.isRetryable(errorType),
      correlationId,
      statusCode: response.status,
    };
  }

  /**
   * Determine error type from status code
   */
  private getErrorType(status: number): APIErrorType {
    if (status === 400) return APIErrorType.VALIDATION_ERROR;
    if (status === 401) return APIErrorType.AUTHENTICATION_ERROR;
    if (status === 403) return APIErrorType.PERMISSION_ERROR;
    if (status === 404) return APIErrorType.NOT_FOUND_ERROR;
    if (status === 429) return APIErrorType.RATE_LIMIT_ERROR;
    if (status >= 500) return APIErrorType.API_ERROR;
    return APIErrorType.NETWORK_ERROR;
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
    return `api-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
