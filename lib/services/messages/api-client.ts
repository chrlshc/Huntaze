/**
 * Messages API Client - Optimized with Retry Logic
 * 
 * Provides retry logic, error handling, and timeout management for messages API
 */

import { MessagesError, MessagesErrorType } from './types';

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
} as const;

const TIMEOUT_MS = 10000; // 10 seconds

export class MessagesAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/messages') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make API request with retry and timeout
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const correlationId = this.generateCorrelationId();

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

        if (!response.ok) {
          throw await this.handleErrorResponse(response, correlationId);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on validation or permission errors
        if (this.isMessagesError(error)) {
          if (
            error.type === MessagesErrorType.VALIDATION_ERROR ||
            error.type === MessagesErrorType.PERMISSION_ERROR
          ) {
            throw error;
          }
        }

        // Last attempt - throw error
        if (attempt === RETRY_CONFIG.maxAttempts) {
          throw this.wrapError(lastError, correlationId);
        }

        // Log retry attempt
        console.log(`[MessagesAPI] Retry attempt ${attempt}/${RETRY_CONFIG.maxAttempts}:`, {
          endpoint,
          delay: `${delay}ms`,
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
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(
          MessagesErrorType.NETWORK_ERROR,
          'Request timeout',
          'Request took too long. Please try again.'
        );
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
  ): Promise<MessagesError> {
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
      correlationId: errorData.correlationId || correlationId,
    };
  }

  /**
   * Determine error type from status code
   */
  private getErrorType(status: number): MessagesErrorType {
    if (status === 400) return MessagesErrorType.VALIDATION_ERROR;
    if (status === 403) return MessagesErrorType.PERMISSION_ERROR;
    if (status === 429) return MessagesErrorType.RATE_LIMIT_ERROR;
    if (status >= 500) return MessagesErrorType.API_ERROR;
    return MessagesErrorType.NETWORK_ERROR;
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(type: MessagesErrorType, message: string): string {
    switch (type) {
      case MessagesErrorType.NETWORK_ERROR:
        return 'Connection issue. Please check your internet and try again.';
      case MessagesErrorType.VALIDATION_ERROR:
        return message || 'Invalid input. Please check your data and try again.';
      case MessagesErrorType.PERMISSION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case MessagesErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';
      case MessagesErrorType.API_ERROR:
        return 'Server error. Our team has been notified. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(type: MessagesErrorType): boolean {
    return (
      type === MessagesErrorType.NETWORK_ERROR ||
      type === MessagesErrorType.API_ERROR ||
      type === MessagesErrorType.RATE_LIMIT_ERROR
    );
  }

  /**
   * Check if error is a MessagesError
   */
  private isMessagesError(error: unknown): error is MessagesError {
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
   * Create MessagesError
   */
  private createError(
    type: MessagesErrorType,
    message: string,
    userMessage: string
  ): MessagesError {
    return {
      type,
      message,
      userMessage,
      retryable: this.isRetryable(type),
    };
  }

  /**
   * Wrap error with correlation ID
   */
  private wrapError(error: Error, correlationId: string): MessagesError {
    if (this.isMessagesError(error)) {
      return error;
    }

    return {
      type: MessagesErrorType.NETWORK_ERROR,
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
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export singleton instance
export const messagesAPI = new MessagesAPIClient();
