'use client';

/**
 * usePayoutSchedule Hook
 * 
 * Fetches and manages payout schedule with export functionality
 */

import useSWR from 'swr';
import { useState } from 'react';
import { payoutService } from '@/lib/services/revenue';
import type { PayoutScheduleResponse, RevenueError } from '@/lib/services/revenue';

const CACHE_KEY_PREFIX = 'payout-schedule';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface UsePayoutScheduleOptions {
  creatorId: string;
  enabled?: boolean;
}

export function usePayoutSchedule({
  creatorId,
  enabled = true,
}: UsePayoutScheduleOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<RevenueError | null>(null);
  const [isUpdatingTax, setIsUpdatingTax] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch payout schedule
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<PayoutScheduleResponse, RevenueError>(
    enabled ? `${CACHE_KEY_PREFIX}:${creatorId}` : null,
    () => payoutService.getPayoutSchedule(creatorId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: CACHE_TTL,
      onError: (err) => {
        console.error('[usePayoutSchedule] Error:', err);
      },
    }
  );

  // Export payouts
  const exportPayouts = async (format: 'csv' | 'pdf' = 'csv') => {
    setIsExporting(true);
    setExportError(null);

    try {
      await payoutService.downloadPayouts(creatorId, format);
    } catch (err) {
      const error = err as RevenueError;
      setExportError(error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  // Update tax rate
  const updateTaxRate = async (taxRate: number) => {
    setIsUpdatingTax(true);

    try {
      await payoutService.updateTaxRate(creatorId, taxRate);
      
      // Optimistic update
      if (data) {
        const taxEstimate = data.summary.totalExpected * taxRate;
        mutate({
          ...data,
          summary: {
            ...data.summary,
            taxEstimate,
            netIncome: data.summary.totalExpected - taxEstimate,
          },
        }, false);
      }
      
      await mutate();
    } catch (err) {
      console.error('[usePayoutSchedule] Tax update error:', err);
      throw err;
    } finally {
      setIsUpdatingTax(false);
    }
  };

  // Sync platform
  const syncPlatform = async (platform: 'onlyfans' | 'fansly' | 'patreon') => {
    setIsSyncing(true);

    try {
      await payoutService.syncPlatform(creatorId, platform);
      
      // Refresh data after sync
      await mutate();
    } catch (err) {
      console.error('[usePayoutSchedule] Sync error:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual refresh
  const refresh = () => mutate();

  return {
    payouts: data,
    isLoading,
    error,
    exportPayouts,
    updateTaxRate,
    syncPlatform,
    isExporting,
    exportError,
    isUpdatingTax,
    isSyncing,
    refresh,
  };
}
