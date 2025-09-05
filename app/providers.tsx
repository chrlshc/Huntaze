'use client';

import { Suspense } from 'react';
import { ThemeProvider } from '@/src/contexts/ThemeContext';

// Lazy load NotificationProvider with error boundary
const NotificationProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  try {
    const { NotificationProvider } = require('@/components/notifications/NotificationProvider');
    return <NotificationProvider>{children}</NotificationProvider>;
  } catch (error) {
    console.warn('NotificationProvider failed to load:', error);
    // Return children without notification provider as fallback
    return <>{children}</>;
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={<>{children}</>}>
        <NotificationProviderWrapper>
          {children}
        </NotificationProviderWrapper>
      </Suspense>
    </ThemeProvider>
  );
}