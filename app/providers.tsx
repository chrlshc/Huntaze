'use client';

import { ThemeProvider } from '@/src/components/theme-provider';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { useEffect, type ReactNode } from 'react';
import { isMockApiMode } from '@/config/api-mode';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isMockApiMode()) return;

    let cancelled = false;
    (async () => {
      try {
        const mod = await import('@/mocks/browser');
        if (cancelled) return;
        await mod.worker.start({ onUnhandledRequest: 'bypass' });
      } catch {
        // Intentionally ignore: app should still run in real mode even if mocking fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
}
