'use client';

import useSWR, { type Fetcher, type Key, type SWRConfiguration, type SWRResponse } from 'swr';
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

export function useInternalSWR<Data = unknown, Error = InternalApiError, SWRKey extends Key = Key>(
  key: SWRKey,
  fetcher?: Fetcher<Data, SWRKey> | null,
  config?: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>,
): SWRResponse<Data, Error> {
  const response = useSWR<Data, Error, SWRKey>(key, fetcher ?? null, config);

  if (isAbortError(response.error)) {
    return { ...response, error: undefined };
  }

  return response;
}
