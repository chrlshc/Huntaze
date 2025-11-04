'use client';

import React from 'react';
import HydrationErrorBoundary from './HydrationErrorBoundary';
import HydrationDebugPanel from './HydrationDebugPanel';

interface HydrationProviderProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error}>;
  enableDebugPanel?: boolean;
}

const HydrationProvider: React.FC<HydrationProviderProps> = ({
  children,
  fallback,
  enableDebugPanel = process.env.NODE_ENV === 'development',
}) => {
  return (
    <>
      <HydrationErrorBoundary fallback={fallback}>
        {children}
      </HydrationErrorBoundary>
      {enableDebugPanel && <HydrationDebugPanel />}
    </>
  );
};

export default HydrationProvider;