'use client';

import { ThemeProvider } from '@/src/components/theme-provider';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { useEffect, type ReactNode } from 'react';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

async function unregisterMswServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const mswRegistrations = registrations.filter((registration) => {
      const scriptUrl =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        '';
      return scriptUrl.includes('mockServiceWorker.js');
    });

    await Promise.all(mswRegistrations.map((registration) => registration.unregister()));
  } catch {
    // Intentionally ignore: cleanup should not block app startup.
  }
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!ENABLE_MOCK_DATA) {
      void unregisterMswServiceWorker();
      return;
    }

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
