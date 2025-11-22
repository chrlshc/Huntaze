/**
 * useAIQuota Hook
 * 
 * React hook for fetching and monitoring AI quota status
 */

import { useState, useEffect, useCallback } from 'react';

type QuotaData = {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  plan: 'starter' | 'pro' | 'business';
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

      const res = await fetch('/api/ai/quota');

      if (!res.ok) {
        throw new Error('Failed to fetch quota');
      }

      const data = await res.json();
      setQuota(data.data);
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
