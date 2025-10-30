import { useState, useEffect, useCallback } from 'react';

// Types
interface AnalyticsOverview {
  overview: {
    revenue: {
      current: number;
      change: number;
      changeType: 'increase' | 'decrease';
    };
    subscribers: {
      current: number;
      change: number;
      changeType: 'increase' | 'decrease';
    };
    messages: {
      current: number;
      change: number;
      changeType: 'increase' | 'decrease';
    };
    views: {
      current: number;
      change: number;
      changeType: 'increase' | 'decrease';
    };
  };
  topContent: Array<{
    id: string;
    title: string;
    type: string;
    engagement: number;
    createdAt: string;
  }>;
  subscriberGrowth: Array<{
    date: string;
    count: number;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook: useAnalytics
export function useAnalytics(range: 'week' | 'month' | 'year' = 'month') {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/overview?range=${range}`);
      const result: ApiResponse<AnalyticsOverview> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics: data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
