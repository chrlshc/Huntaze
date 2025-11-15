/**
 * Reddit Account Hook - SWR Integration
 * Phase 2 & 3: Optimized with auto-caching, auto-revalidation, and error handling
 */

'use client';

import useSWR from 'swr';

interface RedditAccount {
  id: string;
  name: string;
  icon_img: string;
  link_karma: number;
  comment_karma: number;
}

interface UseRedditAccountProps {
  userId: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch Reddit account');
  }
  
  return response.json();
};

export function useRedditAccount({ userId }: UseRedditAccountProps) {
  const { data, error, isLoading, mutate } = useSWR<RedditAccount>(
    userId ? `/api/reddit/account?userId=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      shouldRetryOnError: (error) => {
        // Don't retry on auth errors
        return !error.message.includes('auth') && !error.message.includes('token');
      },
    }
  );

  return {
    account: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
