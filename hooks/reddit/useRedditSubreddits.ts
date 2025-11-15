/**
 * Reddit Subreddits Hook - SWR Integration
 * Phase 2 & 3: Optimized with auto-caching and auto-revalidation
 */

'use client';

import useSWR from 'swr';

interface RedditSubreddit {
  name: string;
  display_name: string;
  subscribers: number;
  public_description: string;
}

interface UseRedditSubredditsProps {
  userId: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch subreddits');
  }
  
  return response.json();
};

export function useRedditSubreddits({ userId }: UseRedditSubredditsProps) {
  const { data, error, isLoading, mutate } = useSWR<RedditSubreddit[]>(
    userId ? `/api/reddit/subreddits?userId=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 10 * 60 * 1000, // 10 minutes (subreddits don't change often)
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    subreddits: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
