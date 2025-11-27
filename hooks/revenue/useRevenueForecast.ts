'use client';

/**
 * useRevenueForecast Hook
 * 
 * Fetches and manages revenue forecast data with goal setting
 */

import useSWR from 'swr';
import { useState } from 'react';
import { forecastService } from '@/lib/services/revenue';
import type { RevenueForecastResponse, RevenueError } from '@/lib/services/revenue';

const CACHE_KEY_PREFIX = 'revenue-forecast';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface UseRevenueForecastOptions {
  creatorId: string;
  months?: number;
  enabled?: boolean;
}

export function useRevenueForecast({
  creatorId,
  months = 12,
  enabled = true,
}: UseRevenueForecastOptions) {
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [goalError, setGoalError] = useState<RevenueError | null>(null);

  // Fetch revenue forecast
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<RevenueForecastResponse, RevenueError>(
    enabled ? `${CACHE_KEY_PREFIX}:${creatorId}:${months}` : null,
    () => forecastService.getForecast(creatorId, months),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      refreshInterval: CACHE_TTL,
      onError: (err) => {
        console.error('[useRevenueForecast] Error:', err);
      },
    }
  );

  // Set revenue goal
  const setGoal = async (goalAmount: number, targetMonth: string) => {
    setIsSettingGoal(true);
    setGoalError(null);

    try {
      const result = await forecastService.setGoal(
        creatorId,
        goalAmount,
        targetMonth
      );
      
      // Refresh forecast data
      await mutate();
      
      return result;
    } catch (err) {
      const error = err as RevenueError;
      setGoalError(error);
      throw error;
    } finally {
      setIsSettingGoal(false);
    }
  };

  // Run scenario analysis
  const runScenario = async (changes: {
    newSubscribers?: number;
    priceIncrease?: number;
    churnReduction?: number;
  }) => {
    try {
      return await forecastService.getScenario(creatorId, changes);
    } catch (err) {
      console.error('[useRevenueForecast] Scenario error:', err);
      throw err;
    }
  };

  // Manual refresh
  const refresh = () => mutate();

  return {
    forecast: data,
    isLoading,
    error,
    setGoal,
    runScenario,
    isSettingGoal,
    goalError,
    refresh,
  };
}
