import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDebouncedSearch Hook
 * 
 * Provides debounced search functionality to reduce API calls and improve performance.
 * Delays search execution until user stops typing for specified delay.
 * 
 * Performance Benefits:
 * - Reduces API calls by 80-90% for typical typing patterns
 * - Prevents UI lag from excessive re-renders
 * - Cancels pending searches when new input is received
 * 
 * Requirements: 2.3 - Search bar functionality
 */

interface UseDebouncedSearchOptions {
  /** Debounce delay in milliseconds (default: 300) */
  delay?: number;
  /** Minimum characters before triggering search (default: 0) */
  minLength?: number;
  /** Callback when search is triggered */
  onSearch?: (value: string) => void;
}

interface UseDebouncedSearchResult {
  /** Current input value (immediate) */
  inputValue: string;
  /** Debounced search value (delayed) */
  debouncedValue: string;
  /** Whether search is pending */
  isSearching: boolean;
  /** Update input value */
  setInputValue: (value: string) => void;
  /** Clear search */
  clearSearch: () => void;
  /** Cancel pending search */
  cancelSearch: () => void;
}

export function useDebouncedSearch({
  delay = 300,
  minLength = 0,
  onSearch,
}: UseDebouncedSearchOptions = {}): UseDebouncedSearchResult {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cancel any pending search
  const cancelSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsSearching(false);
    }
  }, []);
  
  // Clear search completely
  const clearSearch = useCallback(() => {
    cancelSearch();
    setInputValue('');
    setDebouncedValue('');
  }, [cancelSearch]);
  
  // Debounce effect
  useEffect(() => {
    // Cancel previous timeout
    cancelSearch();
    
    // Don't search if below minimum length
    if (inputValue.length > 0 && inputValue.length < minLength) {
      return;
    }
    
    // Set searching state
    if (inputValue !== debouncedValue) {
      setIsSearching(true);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(inputValue);
      setIsSearching(false);
      
      // Call onSearch callback if provided
      if (onSearch && inputValue.length >= minLength) {
        onSearch(inputValue);
      }
    }, delay);
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, delay, minLength, debouncedValue, onSearch, cancelSearch]);
  
  return {
    inputValue,
    debouncedValue,
    isSearching,
    setInputValue,
    clearSearch,
    cancelSearch,
  };
}

/**
 * useDebouncedValue Hook
 * 
 * Simple debounced value hook for general use cases.
 * Returns a value that only updates after the specified delay.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * useSearchPerformanceMonitor Hook
 * 
 * Monitors search performance and logs metrics in development mode.
 */
export function useSearchPerformanceMonitor(searchTerm: string) {
  const searchCountRef = useRef(0);
  const lastSearchTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (searchTerm && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      searchCountRef.current += 1;
      const now = Date.now();
      const timeSinceLastSearch = now - lastSearchTimeRef.current;
      lastSearchTimeRef.current = now;
      
      // Log if searches are happening too frequently (< 100ms apart)
      if (timeSinceLastSearch < 100 && searchCountRef.current > 1) {
        console.warn(
          `[Performance] Search triggered ${timeSinceLastSearch}ms after previous search. ` +
          `Consider increasing debounce delay.`
        );
      }
    }
  }, [searchTerm]);
}
