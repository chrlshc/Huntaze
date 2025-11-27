'use client';

/**
 * Loading State Hook
 * 
 * **Feature: performance-optimization-aws, Task 7: Enhanced Loading State Management**
 * 
 * Provides intelligent loading state management with:
 * - Skeleton screen support
 * - Progress indicators for operations > 1 second
 * - Independent loading states per section
 * - Smooth transitions without layout jumps
 * - Background update handling without loading states for cached content
 * - Minimum loading duration to prevent flashing
 * - Staggered loading for multiple items
 * - Error state handling
 * - Accessibility announcements
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type LoadingType = 'skeleton' | 'spinner' | 'progress' | 'none';

interface LoadingStateOptions {
  minDuration?: number; // Minimum loading duration in ms
  staggerDelay?: number; // Delay between items in ms
  enableStagger?: boolean;
  loadingType?: LoadingType; // Type of loading indicator
  showProgressAfter?: number; // Show progress indicator after N ms (default: 1000)
  hasCachedData?: boolean; // Whether cached data is available
  sectionId?: string; // Unique identifier for independent section loading
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
  onError?: (error: Error) => void;
}

interface LoadingState {
  isLoading: boolean;
  isMinDurationMet: boolean;
  error: Error | null;
  progress: number;
  staggerIndex: number;
  loadingType: LoadingType;
  showProgress: boolean; // Whether to show progress indicator
  isBackgroundUpdate: boolean; // Whether this is a background update with cached data
  sectionId?: string;
}

interface LoadingActions {
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: Error) => void;
  clearError: () => void;
  setProgress: (progress: number) => void;
  nextStagger: () => void;
  resetStagger: () => void;
}

export const useLoadingState = (options: LoadingStateOptions = {}): [LoadingState, LoadingActions] => {
  const {
    minDuration = 500,
    staggerDelay = 100,
    enableStagger = false,
    loadingType = 'skeleton',
    showProgressAfter = 1000,
    hasCachedData = false,
    sectionId,
    onLoadingStart,
    onLoadingEnd,
    onError
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    isMinDurationMet: false,
    error: null,
    progress: 0,
    staggerIndex: 0,
    loadingType,
    showProgress: false,
    isBackgroundUpdate: false,
    sectionId
  });

  const loadingStartTime = useRef<number | null>(null);
  const minDurationTimer = useRef<NodeJS.Timeout | null>(null);
  const staggerTimer = useRef<NodeJS.Timeout | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    loadingStartTime.current = Date.now();
    
    // If we have cached data, this is a background update - don't show loading state
    const isBackgroundUpdate = hasCachedData;
    
    setState(prev => ({ 
      ...prev, 
      isLoading: !isBackgroundUpdate, // Don't show loading if background update
      isMinDurationMet: false, 
      error: null,
      showProgress: false,
      isBackgroundUpdate
    }));
    
    // Set minimum duration timer
    if (!isBackgroundUpdate) {
      minDurationTimer.current = setTimeout(() => {
        setState(prev => ({ ...prev, isMinDurationMet: true }));
      }, minDuration);
    }

    // Set progress indicator timer (show after 1 second)
    if (!isBackgroundUpdate && showProgressAfter > 0) {
      progressTimer.current = setTimeout(() => {
        setState(prev => ({ ...prev, showProgress: true }));
      }, showProgressAfter);
    }

    onLoadingStart?.();
  }, [minDuration, showProgressAfter, hasCachedData, onLoadingStart]);

  const stopLoading = useCallback(() => {
    // Clear progress timer if still running
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }

    const now = Date.now();
    const elapsed = loadingStartTime.current ? now - loadingStartTime.current : 0;
    const remainingTime = Math.max(0, minDuration - elapsed);

    const finishLoading = () => {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        progress: 100,
        showProgress: false,
        isBackgroundUpdate: false
      }));
      onLoadingEnd?.();
    };

    // If background update, finish immediately
    if (state.isBackgroundUpdate) {
      finishLoading();
      return;
    }

    // Otherwise respect minimum duration for smooth transitions
    if (remainingTime > 0) {
      setTimeout(finishLoading, remainingTime);
    } else {
      finishLoading();
    }
  }, [minDuration, state.isBackgroundUpdate, onLoadingEnd]);

  const setError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
    onError?.(error);
  }, [onError]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }));
  }, []);

  const nextStagger = useCallback(() => {
    if (!enableStagger) return;
    
    setState(prev => ({ ...prev, staggerIndex: prev.staggerIndex + 1 }));
    
    if (staggerTimer.current) {
      clearTimeout(staggerTimer.current);
    }
    
    staggerTimer.current = setTimeout(() => {
      // Stagger logic handled by component
    }, staggerDelay);
  }, [enableStagger, staggerDelay]);

  const resetStagger = useCallback(() => {
    setState(prev => ({ ...prev, staggerIndex: 0 }));
    if (staggerTimer.current) {
      clearTimeout(staggerTimer.current);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (minDurationTimer.current) {
        clearTimeout(minDurationTimer.current);
      }
      if (staggerTimer.current) {
        clearTimeout(staggerTimer.current);
      }
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }
    };
  }, []);

  const actions: LoadingActions = {
    startLoading,
    stopLoading,
    setError,
    clearError,
    setProgress,
    nextStagger,
    resetStagger
  };

  return [state, actions];
};

// Specialized hook for data fetching
export const useDataLoadingState = <T,>(fetchFn: () => Promise<T>, deps: React.DependencyList = []) => {
  const [loadingState, actions] = useLoadingState({
    minDuration: 300,
    onLoadingStart: () => {
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Loading data...';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  });

  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback(async () => {
    try {
      actions.startLoading();
      const result = await fetchFn();
      setData(result);
      actions.stopLoading();
    } catch (error) {
      actions.setError(error as Error);
    }
  }, [fetchFn, actions]);

  useEffect(() => {
    fetchData();
  }, deps);

  return {
    data,
    ...loadingState,
    refetch: fetchData,
    ...actions
  };
};

// Hook for staggered list loading
export const useStaggeredLoading = (itemCount: number, staggerDelay: number = 100) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (visibleCount >= itemCount) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, staggerDelay);

    return () => clearTimeout(timer);
  }, [visibleCount, itemCount, staggerDelay]);

  const reset = useCallback(() => {
    setVisibleCount(0);
    setIsComplete(false);
  }, []);

  return {
    visibleCount,
    isComplete,
    reset,
    shouldShow: (index: number) => index < visibleCount
  };
};

export default useLoadingState;
