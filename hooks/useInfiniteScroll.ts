'use client';

import { useState, useCallback, useEffect } from 'react';

export interface InfiniteScrollConfig<T> {
  initialItems?: T[];
  itemsPerPage?: number;
  fetchItems: (page: number, limit: number) => Promise<T[]>;
  onError?: (error: Error) => void;
}

export interface InfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  reset: () => void;
  refresh: () => void;
}

/**
 * Hook for infinite scroll functionality
 */
export function useInfiniteScroll<T>({
  initialItems = [],
  itemsPerPage = 50,
  fetchItems,
  onError,
}: InfiniteScrollConfig<T>): InfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchItems(page, itemsPerPage);
      
      if (newItems.length === 0 || newItems.length < itemsPerPage) {
        setHasMore(false);
      }

      setItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load items');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, isLoading, hasMore, fetchItems, onError]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [initialItems]);

  const refresh = useCallback(async () => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(true);

    try {
      const newItems = await fetchItems(1, itemsPerPage);
      
      if (newItems.length === 0 || newItems.length < itemsPerPage) {
        setHasMore(false);
      }

      setItems(newItems);
      setPage(2);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh items');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, fetchItems, onError]);

  // Load initial items
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      loadMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
  };
}

export default useInfiniteScroll;
