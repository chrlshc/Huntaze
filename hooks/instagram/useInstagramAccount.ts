/**
 * Instagram Account Hook - SWR Integration
 * Phase 3: Client-side caching and revalidation
 */

import useSWR from 'swr';
import { InstagramAccountInfo } from '@/lib/services/instagram/types';

const fetcher = async (url: string): Promise<InstagramAccountInfo> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch Instagram account');
  }
  return response.json();
};

export function useInstagramAccount(userId: string | null) {
  const { data, error, mutate, isValidating } = useSWR<InstagramAccountInfo>(
    userId ? `/api/instagram/account/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000,
      dedupingInterval: 5000,
    }
  );

  return {
    account: data,
    isLoading: !error && !data && userId !== null,
    isValidating,
    error,
    refresh: mutate,
  };
}
