/**
 * usePricingRecommendations Hook
 * 
 * Fetches and manages pricing recommendations with caching
 */

import useSWR from 'swr';
import { useState } from 'react';
import { pricingService } from '@/lib/services/revenue';
import type { PricingRecommendation, ApplyPricingRequest, RevenueError } from '@/lib/services/revenue';

const CACHE_KEY_PREFIX = 'pricing-recommendations';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UsePricingRecommendationsOptions {
  creatorId: string;
  enabled?: boolean;
}

export function usePricingRecommendations({
  creatorId,
  enabled = true,
}: UsePricingRecommendationsOptions) {
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<RevenueError | null>(null);

  // Fetch pricing recommendations
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<PricingRecommendation, RevenueError>(
    enabled ? `${CACHE_KEY_PREFIX}:${creatorId}` : null,
    () => pricingService.getRecommendations(creatorId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: CACHE_TTL,
      onError: (err) => {
        console.error('[usePricingRecommendations] Error:', err);
      },
    }
  );

  // Apply pricing recommendation
  const applyPricing = async (request: ApplyPricingRequest) => {
    setIsApplying(true);
    setApplyError(null);

    try {
      const result = await pricingService.applyPricing(request);
      
      // Optimistic update - refresh data
      await mutate();
      
      return result;
    } catch (err) {
      const error = err as RevenueError;
      setApplyError(error);
      throw error;
    } finally {
      setIsApplying(false);
    }
  };

  // Manual refresh
  const refresh = () => mutate();

  return {
    recommendations: data,
    isLoading,
    error,
    applyPricing,
    isApplying,
    applyError,
    refresh,
  };
}
