/**
 * Instagram Account Hook - SWR Integration with Real OAuth Support
 * Phase 3: Client-side caching and revalidation
 * Updated: Check for real OAuth connections and use real data
 */

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface InstagramAccountInfo {
  accountId: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  isConnected: boolean;
  source: 'api' | 'cache' | 'mock' | 'default';
}

const fetcher = async (url: string): Promise<InstagramAccountInfo> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch Instagram account');
  }
  return response.json();
};

export function useInstagramAccount(userId: string | null, options?: { requireRealConnection?: boolean }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  // Check if user has a real Instagram OAuth connection
  useEffect(() => {
    if (!session?.user?.id || hasCheckedConnection) return;

    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/status');
        if (!response.ok) {
          setHasCheckedConnection(true);
          return;
        }
        
        const { integrations } = await response.json();
        const instagramIntegration = integrations.find(
          (int: any) => int.provider === 'instagram' && int.isConnected
        );
        
        setIsConnected(!!instagramIntegration);
        setHasCheckedConnection(true);
      } catch (error) {
        console.error('Failed to check Instagram connection:', error);
        setHasCheckedConnection(true);
      }
    };

    checkConnection();
  }, [session?.user?.id, hasCheckedConnection]);

  // Only fetch if we have a userId and either:
  // - We don't require a real connection, OR
  // - We have checked and confirmed a real connection exists
  const shouldFetch = userId && (!options?.requireRealConnection || (hasCheckedConnection && isConnected));

  const { data, error, mutate, isValidating } = useSWR<InstagramAccountInfo>(
    shouldFetch ? `/api/instagram/account/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000,
      dedupingInterval: 5000,
    }
  );

  // If real connection is required but not available, return error
  const finalError = options?.requireRealConnection && hasCheckedConnection && !isConnected
    ? new Error('Please connect your Instagram account to view real data')
    : error;

  return {
    account: data,
    isLoading: !error && !data && userId !== null && (!options?.requireRealConnection || !hasCheckedConnection),
    isValidating,
    isConnected,
    error: finalError,
    refresh: mutate,
  };
}
