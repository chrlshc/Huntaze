'use client';

/**
 * useAIQuota Hook
 * 
 * React hook for fetching and monitoring AI quota status
 */

import { useState, useEffect, useCallback } from 'react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { aiQuotaResponseSchema } from '@/lib/schemas/api-responses';

type QuotaData = {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  plan?: 'starter' | 'pro' | 'business';
};

type UseAIQuotaReturn = {
  quota: QuotaData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isNearLimit: boolean;
  isAtLimit: boolean;
};

export function useAIQuota(autoRefresh = false, refreshInterval = 60000): UseAIQuotaReturn {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await internalApiFetch<{
        success: boolean;
        quota?: QuotaData | null;
        error?: string;
      }>('/api/ai/quota', { schema: aiQuotaResponseSchema });

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch quota');
      }

      setQuota(data.quota ?? null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quota';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();

    if (autoRefresh) {
      const interval = setInterval(fetchQuota, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchQuota, autoRefresh, refreshInterval]);

  const isNearLimit = quota ? quota.percentUsed >= 80 : false;
  const isAtLimit = quota ? quota.percentUsed >= 95 : false;

  return {
    quota,
    loading,
    error,
    refresh: fetchQuota,
    isNearLimit,
    isAtLimit,
  };
}
