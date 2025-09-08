'use client';
import { useState, useEffect, ReactNode } from 'react';

interface DebugWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function DebugWrapper({ children, fallback }: DebugWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    setIsClient(true);
    
    // Capture hydration errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('Hydration') || event.message?.includes('Text content')) {
        console.error('Hydration Error Detected:', event);
        setDebugInfo(prev => ({
          ...prev,
          hydrationError: event.message,
          timestamp: new Date().toISOString(),
          stack: event.error?.stack
        }));
      }
    };
    
    window.addEventListener('error', handleError);
    
    // Also capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Hydration')) {
        console.error('Hydration Promise Rejection:', event);
        setDebugInfo(prev => ({
          ...prev,
          promiseRejection: event.reason?.message,
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Log debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0) {
      console.log('🐛 Debug Info:', debugInfo);
    }
  }, [debugInfo]);

  // Avoid hydration mismatch by rendering differently on server
  if (!isClient) {
    return (
      <div className="loading-placeholder">
        {fallback || (
          <div className="skeleton-loader h-full w-full rounded-lg" />
        )}
      </div>
    );
  }

  // Show debug overlay in development if there are errors
  if (process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0) {
    return (
      <>
        {children}
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <h3 className="font-bold mb-2">Hydration Error</h3>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </>
    );
  }

  return <>{children}</>;
}