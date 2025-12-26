'use client';

/**
 * Conditional Performance Monitor
 * Only renders in development mode
 * Implements sampling to reduce overhead
 */

import { useEffect, useState } from 'react';
import { productionSafeMonitoring } from '@/lib/monitoring/production-safe-monitoring';

interface ConditionalMonitorProps {
  children?: React.ReactNode;
}

export function ConditionalMonitor({ children }: ConditionalMonitorProps) {
  const [shouldRender] = useState(() => productionSafeMonitoring.shouldMonitor());

  useEffect(() => {
    // Cleanup: flush metrics on unmount
    return () => {
      productionSafeMonitoring.forceFlush();
    };
  }, []);

  // Don't render anything in production
  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HOC to wrap components with conditional monitoring
 */
export function withConditionalMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const WrappedComponent = (props: P) => {
    const [shouldRender] = useState(() => productionSafeMonitoring.shouldMonitor());

    if (!shouldRender) {
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = displayName || `withConditionalMonitoring(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
