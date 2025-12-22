import { useMemo } from 'react';

/**
 * useVirtualizedTable Hook
 * 
 * Determines whether to use virtualized scrolling based on dataset size.
 * Automatically switches to virtual scrolling for large datasets to maintain performance.
 * 
 * Performance Strategy:
 * - Small datasets (< 100 rows): Use regular table for simplicity
 * - Medium datasets (100-500 rows): Use regular table with pagination
 * - Large datasets (> 500 rows): Use virtual scrolling for optimal performance
 * 
 * Requirements: 2.7, 6.4 - Table performance optimization
 */

interface UseVirtualizedTableOptions {
  /** Number of items in the dataset */
  itemCount: number;
  /** Threshold for enabling virtualization (default: 500) */
  virtualizationThreshold?: number;
  /** Force virtualization regardless of item count */
  forceVirtualization?: boolean;
}

interface UseVirtualizedTableResult {
  /** Whether to use virtualized scrolling */
  shouldVirtualize: boolean;
  /** Recommended row height for virtualized table */
  recommendedRowHeight: number;
  /** Recommended table height for virtualized table */
  recommendedTableHeight: number;
}

export function useVirtualizedTable({
  itemCount,
  virtualizationThreshold = 500,
  forceVirtualization = false,
}: UseVirtualizedTableOptions): UseVirtualizedTableResult {
  const result = useMemo(() => {
    const shouldVirtualize = forceVirtualization || itemCount > virtualizationThreshold;
    
    // Calculate optimal row height based on content density
    const recommendedRowHeight = 60; // Standard row height
    
    // Calculate optimal table height (show ~10 rows at a time)
    const visibleRows = Math.min(10, itemCount);
    const recommendedTableHeight = (visibleRows * recommendedRowHeight) + 45; // +45 for header
    
    return {
      shouldVirtualize,
      recommendedRowHeight,
      recommendedTableHeight,
    };
  }, [itemCount, virtualizationThreshold, forceVirtualization]);
  
  return result;
}

/**
 * Performance monitoring for table rendering
 */
export function useTablePerformanceMonitor(itemCount: number) {
  useMemo(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      // Log performance warning for large non-virtualized tables
      if (itemCount > 500) {
        console.warn(
          `[Performance] Rendering table with ${itemCount} rows. ` +
          `Consider using VirtualizedTable for better performance.`
        );
      }
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 100) {
          console.warn(
            `[Performance] Table render took ${renderTime.toFixed(2)}ms. ` +
            `Consider optimization strategies.`
          );
        }
      };
    }
  }, [itemCount]);
}
