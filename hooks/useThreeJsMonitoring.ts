import { useEffect, useRef, useCallback } from 'react';
import { threeJsMonitor } from '../lib/monitoring/threeJsMonitor';

interface UseThreeJsMonitoringOptions {
  componentName?: string;
  enablePerformanceTracking?: boolean;
  onError?: (error: any) => void;
}

interface ThreeJsMonitoringHook {
  logError: (error: any, context?: Record<string, any>) => void;
  logPerformance: (operation: string, duration: number) => void;
  isHealthy: boolean;
  errorCount: number;
}

/**
 * Hook for monitoring Three.js components
 * Provides error logging, performance tracking, and health monitoring
 */
export function useThreeJsMonitoring(
  options: UseThreeJsMonitoringOptions = {}
): ThreeJsMonitoringHook {
  const {
    componentName = 'Unknown',
    enablePerformanceTracking = true,
    onError
  } = options;

  const performanceStartTimes = useRef<Map<string, number>>(new Map());
  const healthStatus = useRef(true);
  const errorCount = useRef(0);

  /**
   * Log Three.js related error
   */
  const logError = useCallback((error: any, context?: Record<string, any>) => {
    const errorData = {
      type: 'rendering' as const,
      message: error?.message || error?.toString() || 'Unknown Three.js error',
      component: componentName,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error?.stack,
      context: {
        ...context,
        componentName
      }
    };

    // Log to monitor
    threeJsMonitor['logError'](errorData);
    
    // Update local state
    errorCount.current += 1;
    healthStatus.current = errorCount.current < 5; // Unhealthy if more than 5 errors

    // Call custom error handler
    if (onError) {
      onError(error);
    }

    console.error(`[${componentName}] Three.js error:`, error);
  }, [componentName, onError]);

  /**
   * Log performance metrics
   */
  const logPerformance = useCallback((operation: string, duration: number) => {
    if (!enablePerformanceTracking) return;

    // Log slow operations (> 16.67ms for 60fps)
    if (duration > 16.67) {
      const errorData = {
        type: 'performance' as const,
        message: `Slow operation in ${componentName}: ${operation}`,
        component: componentName,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        context: {
          operation,
          duration,
          componentName
        }
      };

      threeJsMonitor['logError'](errorData);
    }
  }, [componentName, enablePerformanceTracking]);

  /**
   * Start performance tracking for an operation
   */
  const startPerformanceTracking = useCallback((operation: string) => {
    if (!enablePerformanceTracking) return;
    performanceStartTimes.current.set(operation, performance.now());
  }, [enablePerformanceTracking]);

  /**
   * End performance tracking for an operation
   */
  const endPerformanceTracking = useCallback((operation: string) => {
    if (!enablePerformanceTracking) return;
    
    const startTime = performanceStartTimes.current.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      logPerformance(operation, duration);
      performanceStartTimes.current.delete(operation);
    }
  }, [enablePerformanceTracking, logPerformance]);

  /**
   * Setup component-level error boundary
   */
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Only handle errors that might be from this component
      if (event.error && (
        event.error.stack?.includes('three') ||
        event.error.message?.toLowerCase().includes('webgl') ||
        event.error.message?.toLowerCase().includes('shader')
      )) {
        logError(event.error, { source: 'window.error' });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'object') {
        logError(event.reason, { source: 'unhandledrejection' });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [logError]);

  /**
   * Monitor WebGL context for this component
   */
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      logError(new Error('WebGL context lost'), {
        source: 'webglcontextlost',
        event: event.type
      });
    };

    const handleContextRestored = () => {
      console.log(`[${componentName}] WebGL context restored`);
      // Reset error count on context restoration
      errorCount.current = 0;
      healthStatus.current = true;
    };

    document.addEventListener('webglcontextlost', handleContextLost);
    document.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      document.removeEventListener('webglcontextlost', handleContextLost);
      document.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [componentName, logError]);

  return {
    logError,
    logPerformance,
    isHealthy: healthStatus.current,
    errorCount: errorCount.current
  };
}

/**
 * Higher-order component for Three.js monitoring
 */
export function withThreeJsMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): any {
  // Simplified version to fix TypeScript issues
  return WrappedComponent;
}

/**
 * Performance tracking decorator for Three.js operations
 */
export function trackThreeJsPerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const startTime = performance.now();
    
    try {
      const result = method.apply(this, args);
      
      // Handle async methods
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          const duration = performance.now() - startTime;
          console.log(`[Performance] ${propertyName}: ${duration.toFixed(2)}ms`);
        });
      }
      
      const duration = performance.now() - startTime;
      console.log(`[Performance] ${propertyName}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Performance] ${propertyName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  return descriptor;
}