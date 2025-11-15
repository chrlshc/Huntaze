/**
 * useChurnRisks Hook
 * 
 * Fetches and manages churn risk data with real-time updates
 */

import useSWR from 'swr';
import { useState } from 'react';
import { churnService } from '@/lib/services/revenue';
import type { ChurnRiskResponse, ReEngageRequest, RevenueError } from '@/lib/services/revenue';

const CACHE_KEY_PREFIX = 'churn-risks';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const REFRESH_INTERVAL = 60 * 1000; // 60 seconds

interface UseChurnRisksOptions {
  creatorId: string;
  riskLevel?: 'high' | 'medium' | 'low';
  enabled?: boolean;
  autoRefresh?: boolean;
}

export function useChurnRisks({
  creatorId,
  riskLevel,
  enabled = true,
  autoRefresh = true,
}: UseChurnRisksOptions) {
  const [isReEngaging, setIsReEngaging] = useState(false);
  const [reEngageError, setReEngageError] = useState<RevenueError | null>(null);

  // Fetch churn risks
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<ChurnRiskResponse, RevenueError>(
    enabled ? `${CACHE_KEY_PREFIX}:${creatorId}:${riskLevel || 'all'}` : null,
    () => churnService.getChurnRisks(creatorId, riskLevel),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: autoRefresh ? REFRESH_INTERVAL : 0,
      onError: (err) => {
        console.error('[useChurnRisks] Error:', err);
      },
    }
  );

  // Re-engage single fan
  const reEngageFan = async (request: ReEngageRequest) => {
    setIsReEngaging(true);
    setReEngageError(null);

    try {
      const result = await churnService.reEngageFan(request);
      
      // Refresh data after re-engagement
      await mutate();
      
      return result;
    } catch (err) {
      const error = err as RevenueError;
      setReEngageError(error);
      throw error;
    } finally {
      setIsReEngaging(false);
    }
  };

  // Bulk re-engage fans
  const bulkReEngage = async (
    fanIds: string[],
    messageTemplate?: string
  ) => {
    setIsReEngaging(true);
    setReEngageError(null);

    try {
      const result = await churnService.bulkReEngage(
        creatorId,
        fanIds,
        messageTemplate
      );
      
      // Refresh data after bulk re-engagement
      await mutate();
      
      return result;
    } catch (err) {
      const error = err as RevenueError;
      setReEngageError(error);
      throw error;
    } finally {
      setIsReEngaging(false);
    }
  };

  // Manual refresh
  const refresh = () => mutate();

  return {
    churnRisks: data,
    isLoading,
    error,
    reEngageFan,
    bulkReEngage,
    isReEngaging,
    reEngageError,
    refresh,
  };
}
