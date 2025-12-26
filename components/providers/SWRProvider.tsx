'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { InternalApiError } from '@/lib/api/client/internal-api-client';

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  if (error instanceof InternalApiError) {
    return error.code === 'ABORTED';
  }

  if ('name' in error && (error as { name?: string }).name === 'AbortError') {
    return true;
  }

  return 'code' in error && (error as { code?: string }).code === 'ABORTED';
}

function getRetryDelayMs(retryCount: number, intervalMs: number): number {
  const cappedRetryCount = retryCount < 8 ? retryCount : 8;
  return Math.floor((Math.random() + 0.5) * (1 << cappedRetryCount)) * intervalMs;
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        onErrorRetry: (error, _key, config, revalidate, opts) => {
          if (isAbortError(error)) return;

          const retryCount = opts.retryCount ?? 0;
          const maxRetryCount = config.errorRetryCount;
          if (typeof maxRetryCount !== 'undefined' && retryCount > maxRetryCount) return;

          const interval =
            typeof config.errorRetryInterval === 'number' ? config.errorRetryInterval : 5000;
          const timeout = getRetryDelayMs(retryCount, interval);

          setTimeout(() => revalidate(opts), timeout);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
