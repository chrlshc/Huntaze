'use client';

import { ThemeProvider } from '@/src/components/theme-provider';
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
