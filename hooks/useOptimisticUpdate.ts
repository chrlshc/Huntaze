import { useState, useCallback, useRef } from 'react';

/**
 * useOptimisticUpdate Hook
 * 
 * Implements optimistic UI updates for better perceived performance.
 * Updates UI immediately while syncing with server in background.
 * Automatically reverts changes if server request fails.
 * 
 * Performance Benefits:
 * - Instant UI feedback (0ms perceived latency)
 * - Better user experience during slow network conditions
 * - Automatic error recovery with rollback
 * 
 * Requirements: All requirements (performance is cross-cutting)
 */

interface OptimisticUpdateOptions<T> {
  /** Current data state */
  data: T;
  /** Function to update data on server */
  updateFn: (newData: T) => Promise<T>;
  /** Callback on successful update */
  onSuccess?: (data: T) => void;
  /** Callback on failed update */
  onError?: (error: Error, rollbackData: T) => void;
}

interface OptimisticUpdateResult<T> {
  /** Current data (optimistic or actual) */
  currentData: T;
  /** Whether an update is in progress */
  isUpdating: boolean;
  /** Whether the last update failed */
  hasError: boolean;
  /** Error from last failed update */
  error: Error | null;
  /** Perform optimistic update */
  update: (newData: T) => Promise<void>;
  /** Retry last failed update */
  retry: () => Promise<void>;
}

export function useOptimisticUpdate<T>({
  data,
  updateFn,
  onSuccess,
  onError,
}: OptimisticUpdateOptions<T>): OptimisticUpdateResult<T> {
  const [currentData, setCurrentData] = useState<T>(data);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Store previous data for rollback
  const previousDataRef = useRef<T>(data);
  const pendingUpdateRef = useRef<T | null>(null);
  
  const update = useCallback(async (newData: T) => {
    // Store current data for potential rollback
    previousDataRef.current = currentData;
    pendingUpdateRef.current = newData;
    
    // Optimistically update UI immediately
    setCurrentData(newData);
    setIsUpdating(true);
    setHasError(false);
    setError(null);
    
    try {
      // Sync with server in background
      const serverData = await updateFn(newData);
      
      // Update with server response (may differ from optimistic update)
      setCurrentData(serverData);
      setIsUpdating(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(serverData);
      }
    } catch (err) {
      // Rollback to previous data on error
      const rollbackData = previousDataRef.current;
      setCurrentData(rollbackData);
      setIsUpdating(false);
      setHasError(true);
      setError(err instanceof Error ? err : new Error('Update failed'));
      
      // Call error callback
      if (onError) {
        onError(err instanceof Error ? err : new Error('Update failed'), rollbackData);
      }
    }
  }, [currentData, updateFn, onSuccess, onError]);
  
  const retry = useCallback(async () => {
    if (pendingUpdateRef.current) {
      await update(pendingUpdateRef.current);
    }
  }, [update]);
  
  return {
    currentData,
    isUpdating,
    hasError,
    error,
    update,
    retry,
  };
}

/**
 * useOptimisticList Hook
 * 
 * Specialized hook for optimistic updates on list data (add, remove, update items).
 */

interface OptimisticListOptions<T> {
  /** Initial list data */
  initialData: T[];
  /** Key field for item identification */
  keyField: keyof T;
}

interface OptimisticListResult<T> {
  /** Current list data */
  items: T[];
  /** Whether any operation is in progress */
  isUpdating: boolean;
  /** Add item optimistically */
  addItem: (item: T, serverFn: () => Promise<T>) => Promise<void>;
  /** Remove item optimistically */
  removeItem: (key: T[keyof T], serverFn: () => Promise<void>) => Promise<void>;
  /** Update item optimistically */
  updateItem: (key: T[keyof T], updates: Partial<T>, serverFn: () => Promise<T>) => Promise<void>;
}

export function useOptimisticList<T>({
  initialData,
  keyField,
}: OptimisticListOptions<T>): OptimisticListResult<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const previousItemsRef = useRef<T[]>(initialData);
  
  const addItem = useCallback(async (item: T, serverFn: () => Promise<T>) => {
    previousItemsRef.current = items;
    
    // Optimistically add item
    setItems(prev => [...prev, item]);
    setIsUpdating(true);
    
    try {
      // Sync with server
      const serverItem = await serverFn();
      
      // Replace optimistic item with server response
      setItems(prev => prev.map(i => 
        i[keyField] === item[keyField] ? serverItem : i
      ));
      setIsUpdating(false);
    } catch (err) {
      // Rollback on error
      setItems(previousItemsRef.current);
      setIsUpdating(false);
      throw err;
    }
  }, [items, keyField]);
  
  const removeItem = useCallback(async (key: T[keyof T], serverFn: () => Promise<void>) => {
    previousItemsRef.current = items;
    
    // Optimistically remove item
    setItems(prev => prev.filter(item => item[keyField] !== key));
    setIsUpdating(true);
    
    try {
      // Sync with server
      await serverFn();
      setIsUpdating(false);
    } catch (err) {
      // Rollback on error
      setItems(previousItemsRef.current);
      setIsUpdating(false);
      throw err;
    }
  }, [items, keyField]);
  
  const updateItem = useCallback(async (
    key: T[keyof T],
    updates: Partial<T>,
    serverFn: () => Promise<T>
  ) => {
    previousItemsRef.current = items;
    
    // Optimistically update item
    setItems(prev => prev.map(item =>
      item[keyField] === key ? { ...item, ...updates } : item
    ));
    setIsUpdating(true);
    
    try {
      // Sync with server
      const serverItem = await serverFn();
      
      // Replace optimistic update with server response
      setItems(prev => prev.map(item =>
        item[keyField] === key ? serverItem : item
      ));
      setIsUpdating(false);
    } catch (err) {
      // Rollback on error
      setItems(previousItemsRef.current);
      setIsUpdating(false);
      throw err;
    }
  }, [items, keyField]);
  
  return {
    items,
    isUpdating,
    addItem,
    removeItem,
    updateItem,
  };
}
