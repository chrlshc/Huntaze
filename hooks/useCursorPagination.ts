/**
 * React hook for cursor-based pagination
 * 
 * Provides infinite scroll and load more functionality with cursor pagination
 * Requirements: 7.3 - Use cursor-based pagination for large datasets
 */

import { useState, useCallback } from 'react';
import useSWR from 'swr';

interface UseCursorPaginationOptions {
  endpoint: string;
  limit?: number;
  orderBy?: 'asc' | 'desc';
  enabled?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useCursorPagination<T = any>(options: UseCursorPaginationOptions) {
  const { endpoint, limit = 20, orderBy = 'desc', enabled = true } = options;
  
  const [cursor, setCursor] = useState<string | null>(null);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Build URL with query params
  const buildUrl = useCallback((currentCursor: string | null) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('orderBy', orderBy);
    if (currentCursor) {
      params.set('cursor', currentCursor);
    }
    return `${endpoint}?${params.toString()}`;
  }, [endpoint, limit, orderBy]);

  // Fetch current page
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<T>>(
    enabled ? buildUrl(cursor) : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Update accumulated data when new page loads
  if (data && data.data) {
    const newIds = new Set(data.data.map((item: any) => item.id));
    const existingIds = new Set(allData.map((item: any) => item.id));
    
    // Only add new items that aren't already in the list
    const newItems = data.data.filter((item: any) => !existingIds.has(item.id));
    
    if (newItems.length > 0) {
      setAllData(prev => [...prev, ...newItems]);
    }
    
    if (data.hasMore !== hasMore) {
      setHasMore(data.hasMore);
    }
  }

  // Load next page
  const loadMore = useCallback(() => {
    if (data?.nextCursor && hasMore && !isLoading) {
      setCursor(data.nextCursor);
    }
  }, [data, hasMore, isLoading]);

  // Reset pagination
  const reset = useCallback(() => {
    setCursor(null);
    setAllData([]);
    setHasMore(true);
    mutate();
  }, [mutate]);

  return {
    data: allData,
    error,
    isLoading,
    hasMore,
    loadMore,
    reset,
    currentPage: data,
  };
}

/**
 * Simpler hook for single-page cursor pagination (not infinite scroll)
 */
export function useCursorPage<T = any>(options: UseCursorPaginationOptions & { cursor?: string | null }) {
  const { endpoint, limit = 20, orderBy = 'desc', cursor = null, enabled = true } = options;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('orderBy', orderBy);
    if (cursor) {
      params.set('cursor', cursor);
    }
    return `${endpoint}?${params.toString()}`;
  }, [endpoint, limit, orderBy, cursor]);

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<T>>(
    enabled ? buildUrl() : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data: data?.data || [],
    nextCursor: data?.nextCursor || null,
    hasMore: data?.hasMore || false,
    error,
    isLoading,
    mutate,
  };
}
