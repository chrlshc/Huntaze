'use client';

import { ThemeProvider } from '@/src/components/theme-provider';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import AmplifyProvider from '@/components/providers/AmplifyProvider';
import AuthProvider from '@/components/providers/AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AmplifyProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </AmplifyProvider>
  );
}
