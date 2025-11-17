/**
 * React Hook for API Client
 * 
 * Provides a React hook for making API requests with:
 * - Loading states
 * - Error handling
 * - Automatic retries
 * - Request cancellation
 * - TypeScript support
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, type RequestOptions } from '@/lib/api/client/api-client';
import type { ApiResponse } from '@/lib/api/types/responses';

/**
 * API request state
 */
export interface ApiState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  correlationId: string | null;
}

/**
 * API request result
 */
export interface ApiResult<T> extends ApiState<T> {
  execute: (options?: RequestOptions) => Promise<ApiResponse<T>>;
  reset: () => void;
}

/**
 * Hook options
 */
export interface UseApiOptions extends RequestOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * useApi Hook
 * 
 * @param method - HTTP method
 * @param url - API endpoint URL
 * @param options - Request options
 * @returns API request state and execute function
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useApi('GET', '/api/users');
 * 
 * // Execute request
 * await execute();
 * ```
 */
export function useApi<T = any>(
  method: string,
  url: string,
  options: UseApiOptions = {}
): ApiResult<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: false,
    correlationId: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (executeOptions?: RequestOptions): Promise<ApiResponse<T>> => {
      // Cancel previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // Merge options
      const finalOptions: RequestOptions = {
        ...options,
        ...executeOptions,
        method,
        signal: abortControllerRef.current.signal,
      };

      // Set loading state
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
        }));
      }

      try {
        const response = await apiClient.request<T>(url, finalOptions);

        if (isMountedRef.current) {
          setState({
            data: response.data || null,
            error: null,
            loading: false,
            correlationId: response.correlationId,
          });

          // Call success callback
          if (options.onSuccess && response.data) {
            options.onSuccess(response.data);
          }
        }

        return response;
      } catch (error: any) {
        if (isMountedRef.current && error.name !== 'AbortError') {
          setState({
            data: null,
            error,
            loading: false,
            correlationId: error.correlationId || null,
          });

          // Call error callback
          if (options.onError) {
            options.onError(error);
          }
        }

        throw error;
      }
    },
    [method, url, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
      correlationId: null,
    });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [options.immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Convenience hooks for common HTTP methods
 */

export function useGet<T = any>(url: string, options?: UseApiOptions): ApiResult<T> {
  return useApi<T>('GET', url, options);
}

export function usePost<T = any>(url: string, options?: UseApiOptions): ApiResult<T> {
  return useApi<T>('POST', url, options);
}

export function usePut<T = any>(url: string, options?: UseApiOptions): ApiResult<T> {
  return useApi<T>('PUT', url, options);
}

export function usePatch<T = any>(url: string, options?: UseApiOptions): ApiResult<T> {
  return useApi<T>('PATCH', url, options);
}

export function useDelete<T = any>(url: string, options?: UseApiOptions): ApiResult<T> {
  return useApi<T>('DELETE', url, options);
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 * 
 * @example
 * ```typescript
 * const { mutate, loading, error } = useMutation('POST', '/api/users');
 * 
 * const handleSubmit = async (data) => {
 *   await mutate({ body: JSON.stringify(data) });
 * };
 * ```
 */
export function useMutation<T = any>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  options?: UseApiOptions
): Omit<ApiResult<T>, 'execute'> & { mutate: (data?: any, opts?: RequestOptions) => Promise<ApiResponse<T>> } {
  const { execute, ...rest } = useApi<T>(method, url, options);

  const mutate = useCallback(
    async (data?: any, opts?: RequestOptions): Promise<ApiResponse<T>> => {
      return execute({
        ...opts,
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [execute]
  );

  return {
    ...rest,
    mutate,
  };
}
