'use client';

import { useState, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AsyncOperationWrapperProps {
  children: (props: {
    isLoading: boolean;
    error: Error | null;
    execute: <T>(operation: () => Promise<T>) => Promise<T | undefined>;
    reset: () => void;
  }) => ReactNode;
  onError?: (error: Error) => void;
  timeout?: number; // Timeout in milliseconds (default: 10000ms = 10s)
}

/**
 * Wrapper component for async operations that provides:
 * - Loading state management
 * - Error handling
 * - Timeout handling (show error after 10s)
 * - Prevents multiple simultaneous requests
 * 
 * Requirements: 15.1, 15.5
 */
export function AsyncOperationWrapper({
  children,
  onError,
  timeout = 10000,
}: AsyncOperationWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const execute = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
      // Prevent multiple simultaneous requests
      if (isLoading) {
        console.warn('AsyncOperationWrapper: Operation already in progress');
        return undefined;
      }

      setIsLoading(true);
      setError(null);

      // Set timeout to show error after specified duration
      const tid = setTimeout(() => {
        const timeoutError = new Error(
          `Operation timed out after ${timeout / 1000} seconds`
        );
        setError(timeoutError);
        setIsLoading(false);
        if (onError) {
          onError(timeoutError);
        }
      }, timeout);
      setTimeoutId(tid);

      try {
        const result = await operation();
        clearTimeout(tid);
        setTimeoutId(null);
        setIsLoading(false);
        return result;
      } catch (err) {
        clearTimeout(tid);
        setTimeoutId(null);
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        setIsLoading(false);
        if (onError) {
          onError(error);
        }
        return undefined;
      }
    },
    [isLoading, timeout, onError]
  );

  return <>{children({ isLoading, error, execute, reset })}</>;
}

/**
 * Loading spinner component for async operations
 */
export function AsyncLoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[var(--color-indigo)] animate-spin mx-auto mb-2" />
        <p className="text-sm text-[var(--color-text-sub)]">{message}</p>
      </div>
    </div>
  );
}

/**
 * Error display component for async operations
 */
export function AsyncErrorDisplay({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-[var(--radius-card)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Operation failed</h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          {onRetry && (
            <Button variant="danger" onClick={onRetry}>
  <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing async operations with loading states
 * 
 * Usage:
 * ```tsx
 * const { isLoading, error, execute } = useAsyncOperation();
 * 
 * const handleSubmit = async () => {
 *   const result = await execute(async () => {
 *     return await fetch('/api/endpoint');
 *   });
 * };
 * ```
 */
export function useAsyncOperation(options?: {
  onError?: (error: Error) => void;
  timeout?: number;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
      if (isLoading) {
        console.warn('useAsyncOperation: Operation already in progress');
        return undefined;
      }

      setIsLoading(true);
      setError(null);

      const timeout = options?.timeout || 10000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout / 1000} seconds`));
        }, timeout);
      });

      try {
        const result = await Promise.race([operation(), timeoutPromise]);
        setIsLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        setIsLoading(false);
        if (options?.onError) {
          options.onError(error);
        }
        return undefined;
      }
    },
    [isLoading, options]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return { isLoading, error, execute, reset };
}
