'use client';

import { ThemeProvider } from '@/src/contexts/ThemeContext';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
}