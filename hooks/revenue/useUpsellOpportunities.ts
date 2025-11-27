'use client';

/**
 * useUpsellOpportunities Hook
 * 
 * Fetches and manages upsell opportunities with automation settings
 */

import useSWR from 'swr';
import { useState } from 'react';
import { upsellService } from '@/lib/services/revenue';
import type {
  UpsellOpportunitiesResponse,
  SendUpsellRequest,
  AutomationSettings,
  RevenueError,
} from '@/lib/services/revenue';

const CACHE_KEY_PREFIX = 'upsell-opportunities';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseUpsellOpportunitiesOptions {
  creatorId: string;
  enabled?: boolean;
}

export function useUpsellOpportunities({
  creatorId,
  enabled = true,
}: UseUpsellOpportunitiesOptions) {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<RevenueError | null>(null);

  // Fetch upsell opportunities
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<UpsellOpportunitiesResponse, RevenueError>(
    enabled ? `${CACHE_KEY_PREFIX}:${creatorId}` : null,
    () => upsellService.getOpportunities(creatorId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: CACHE_TTL,
      onError: (err) => {
        console.error('[useUpsellOpportunities] Error:', err);
      },
    }
  );

  // Send upsell message
  const sendUpsell = async (request: SendUpsellRequest) => {
    setIsSending(true);
    setSendError(null);

    try {
      const result = await upsellService.sendUpsell(request);
      
      // Optimistic update - remove sent opportunity
      if (data) {
        mutate({
          ...data,
          opportunities: data.opportunities.filter(
            (opp) => opp.id !== request.opportunityId
          ),
          stats: {
            ...data.stats,
            totalOpportunities: data.stats.totalOpportunities - 1,
          },
        }, false);
      }
      
      // Refresh data
      await mutate();
      
      return result;
    } catch (err) {
      const error = err as RevenueError;
      setSendError(error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Dismiss opportunity
  const dismissOpportunity = async (opportunityId: string) => {
    try {
      await upsellService.dismissOpportunity(creatorId, opportunityId);
      
      // Optimistic update - remove dismissed opportunity
      if (data) {
        mutate({
          ...data,
          opportunities: data.opportunities.filter(
            (opp) => opp.id !== opportunityId
          ),
          stats: {
            ...data.stats,
            totalOpportunities: data.stats.totalOpportunities - 1,
          },
        }, false);
      }
      
      await mutate();
    } catch (err) {
      console.error('[useUpsellOpportunities] Dismiss error:', err);
      throw err;
    }
  };

  // Manual refresh
  const refresh = () => mutate();

  return {
    opportunities: data,
    isLoading,
    error,
    sendUpsell,
    dismissOpportunity,
    isSending,
    sendError,
    refresh,
  };
}

// Hook for automation settings
export function useUpsellAutomation(creatorId: string) {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<AutomationSettings, RevenueError>(
    `upsell-automation:${creatorId}`,
    () => upsellService.getAutomationSettings(creatorId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const updateSettings = async (settings: AutomationSettings) => {
    setIsUpdating(true);

    try {
      await upsellService.updateAutomationSettings(creatorId, settings);
      
      // Optimistic update
      mutate(settings, false);
      await mutate();
    } catch (err) {
      console.error('[useUpsellAutomation] Update error:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    settings: data,
    isLoading,
    error,
    updateSettings,
    isUpdating,
  };
}
