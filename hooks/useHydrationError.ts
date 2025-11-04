'use client';

import { useEffect, useState } from 'react';
import { hydrationErrorLogger, HydrationError } from '@/lib/services/hydrationErrorLogger';

export interface UseHydrationErrorReturn {
  errors: HydrationError[];
  errorCount: number;
  hasErrors: boolean;
  clearErrors: () => void;
  getErrorStats: () => {
    total: number;
    byType: Record<string, number>;
    resolved: number;
    unresolved: number;
  };
}

export function useHydrationError(): UseHydrationErrorReturn {
  const [errors, setErrors] = useState<HydrationError[]>([]);

  useEffect(() => {
    // Get initial errors
    setErrors(hydrationErrorLogger.getErrors());

    // Set up periodic refresh to catch new errors
    const interval = setInterval(() => {
      setErrors(hydrationErrorLogger.getErrors());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearErrors = () => {
    hydrationErrorLogger.clearErrors();
    setErrors([]);
  };

  const getErrorStats = () => {
    return hydrationErrorLogger.getErrorStats();
  };

  return {
    errors,
    errorCount: errors.length,
    hasErrors: errors.length > 0,
    clearErrors,
    getErrorStats,
  };
}

// Hook for development debugging
export function useHydrationDebug() {
  const [isEnabled, setIsEnabled] = useState(false);
  const { errors, errorCount, clearErrors, getErrorStats } = useHydrationError();

  useEffect(() => {
    // Only enable in development
    if (process.env.NODE_ENV === 'development') {
      setIsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (isEnabled && typeof window !== 'undefined') {
      // Add global debugging functions
      (window as any).__hydrationDebug = {
        getErrors: () => hydrationErrorLogger.getErrors(),
        clearErrors: () => hydrationErrorLogger.clearErrors(),
        getStats: () => hydrationErrorLogger.getErrorStats(),
        logError: (error: Error) => {
          hydrationErrorLogger.logHydrationError({
            error,
            errorInfo: { componentStack: 'Manual test error' },
            isHydrationError: true,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date(),
          });
        },
      };

      console.log('🔧 Hydration Debug Tools Available:');
      console.log('- __hydrationDebug.getErrors() - Get all hydration errors');
      console.log('- __hydrationDebug.clearErrors() - Clear all errors');
      console.log('- __hydrationDebug.getStats() - Get error statistics');
      console.log('- __hydrationDebug.logError(error) - Log a test error');
    }
  }, [isEnabled]);

  return {
    isEnabled,
    errors,
    errorCount,
    clearErrors,
    getErrorStats,
  };
}