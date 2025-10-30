import { useState, useEffect, useCallback } from 'react';

// Types
interface Subscriber {
  id: string;
  username: string;
  email: string;
  tier: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    messages: number;
    transactions: number;
  };
}

interface Earnings {
  total: {
    amount: number;
    transactions: number;
  };
  breakdown: {
    subscriptions: number;
    tips: number;
    messages: number;
  };
  topSpenders: Array<{
    id: string;
    username: string;
    tier: string;
    totalSpent: number;
  }>;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook: useSubscribers
export function useSubscribers(params?: {
  page?: number;
  pageSize?: number;
  tier?: string;
  search?: string;
}) {
  const [data, setData] = useState<Subscriber[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
      if (params?.tier) queryParams.set('tier', params.tier);
      if (params?.search) queryParams.set('search', params.search);

      const response = await fetch(`/api/onlyfans/subscribers?${queryParams}`);
      const result: PaginatedResponse<Subscriber> = await response.json();

      if (result.success) {
        setData(result.data);
        setMetadata(result.metadata);
      } else {
        setError(result.error?.message || 'Failed to fetch subscribers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.pageSize, params?.tier, params?.search]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const addSubscriber = async (subscriber: {
    username: string;
    email: string;
    tier?: string;
    onlyfansId?: string;
  }) => {
    try {
      const response = await fetch('/api/onlyfans/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriber),
      });

      const result: ApiResponse<Subscriber> = await response.json();

      if (result.success) {
        await fetchSubscribers(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to add subscriber');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    subscribers: data,
    metadata,
    loading,
    error,
    refetch: fetchSubscribers,
    addSubscriber,
  };
}

// Hook: useEarnings
export function useEarnings(range: 'week' | 'month' | 'year' = 'month') {
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/onlyfans/earnings?range=${range}`);
      const result: ApiResponse<Earnings> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch earnings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    earnings: data,
    loading,
    error,
    refetch: fetchEarnings,
  };
}
