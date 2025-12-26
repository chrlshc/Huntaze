'use client';

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
    // Ignore cleanup failures to avoid blocking app startup.
  }
}

export function MockApiProvider({ children }: { children: ReactNode }) {
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
        // Ignore MSW failures to keep the app usable in real mode.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
