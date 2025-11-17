/**
 * API Client with Retry, Caching, and Error Handling
 * 
 * Provides a robust HTTP client for making API requests with:
 * - Automatic retry with exponential backoff
 * - Request/response caching
 * - Structured error handling
 * - Request deduplication
 * - Correlation ID tracking
 * - Performance logging
 */

import { retryWithBackoff, createApiError, ErrorCodes, type RetryConfig } from '../utils/errors';
import type { ApiResponse } from '../types/responses';

/**
 * Request options
 */
export interface RequestOptions extends RequestInit {
  retry?: Partial<RetryConfig>;
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  correlationId?: string;
  skipAuth?: boolean;
}

/**
 * Cache entry
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * In-flight request tracker for deduplication
 */
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Simple in-memory cache
 */
const cache = new Map<string, CacheEntry>();

/**
 * Generate cache key from URL and options
 */
function getCacheKey(url: string, options?: RequestOptions): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Get cached response if valid
 */
function getCachedResponse(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cached response
 */
function setCachedResponse(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear cache (useful for testing or manual cache invalidation)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(url: string, options?: RequestOptions): void {
  const key = getCacheKey(url, options);
  cache.delete(key);
}

/**
 * API Client class
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = '',
    defaultHeaders: HeadersInit = {},
    defaultTimeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Make an API request with retry and caching
   */
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const correlationId = options.correlationId || crypto.randomUUID();
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    // Check cache for GET requests
    if (options.cache !== false && (!options.method || options.method === 'GET')) {
      const cacheKey = getCacheKey(fullUrl, options);
      const cached = getCachedResponse(cacheKey);
      
      if (cached) {
        console.log(`[API Client] Cache hit for ${fullUrl}`, { correlationId });
        return cached;
      }
      
      // Check if request is already in-flight (deduplication)
      const inFlight = inFlightRequests.get(cacheKey);
      if (inFlight) {
        console.log(`[API Client] Deduplicating request for ${fullUrl}`, { correlationId });
        return inFlight;
      }
    }

    // Prepare request
    const requestPromise = this.executeRequest<T>(fullUrl, options, correlationId, startTime);
    
    // Track in-flight request
    if (options.cache !== false && (!options.method || options.method === 'GET')) {
      const cacheKey = getCacheKey(fullUrl, options);
      inFlightRequests.set(cacheKey, requestPromise);
      
      requestPromise.finally(() => {
        inFlightRequests.delete(cacheKey);
      });
    }
    
    return requestPromise;
  }

  /**
   * Execute the actual request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: RequestOptions,
    correlationId: string,
    startTime: number
  ): Promise<ApiResponse<T>> {
    const timeout = options.timeout || this.defaultTimeout;
    
    // Merge headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Correlation-Id': correlationId,
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Execute request with retry
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
          });
          
          // Check for HTTP errors
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw createApiError(
              errorData.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
              errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`,
              res.status,
              errorData.error?.details,
              correlationId
            );
          }
          
          return res;
        },
        options.retry,
        correlationId
      );

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();
      const duration = Date.now() - startTime;

      // Log successful request
      console.log(`[API Client] Request successful: ${url}`, {
        correlationId,
        duration,
        status: response.status,
      });

      // Cache successful GET requests
      if (options.cache !== false && (!options.method || options.method === 'GET')) {
        const cacheKey = getCacheKey(url, options);
        const cacheTTL = options.cacheTTL || 60000; // Default 1 minute
        setCachedResponse(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Handle timeout
      if (error.name === 'AbortError') {
        console.error(`[API Client] Request timeout: ${url}`, {
          correlationId,
          duration,
          timeout,
        });
        
        throw createApiError(
          ErrorCodes.EXTERNAL_API_ERROR,
          `Request timeout after ${timeout}ms`,
          408,
          { url, timeout },
          correlationId
        );
      }

      // Log error
      console.error(`[API Client] Request failed: ${url}`, {
        correlationId,
        duration,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Convenience methods
   */

  async get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || '/api',
  {},
  30000
);

/**
 * Create a custom API client
 */
export function createApiClient(
  baseUrl?: string,
  headers?: HeadersInit,
  timeout?: number
): ApiClient {
  return new ApiClient(baseUrl, headers, timeout);
}
