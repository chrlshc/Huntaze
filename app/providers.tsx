'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/src/contexts/ThemeContext';

// Dynamically import NotificationProvider to avoid SSR issues
const NotificationProvider = dynamic(
  () => import('@/components/notifications/NotificationProvider').then(mod => mod.NotificationProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
}