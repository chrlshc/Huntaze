/**
 * useLoadingState Hook
 * Task 5.1: Centralized loading state management
 * Requirements: 4.1
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingStateOptions {
  /**
   * Minimum time to show loading state (prevents flashing)
   */
  minDuration?: number;
  
  /**
   * Timeout for the operation
   */
  timeout?: number;
  
  /**
   * Callback when operation times out
   */
  onTimeout?: () => void;
  
  /**
   * Callback when operation completes
   */
  onComplete?: () => void;
  
  /**
   * Callback when operation fails
   */
  onError?: (error: Error) => void;
}

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  progress: number;
}

/**
 * Hook for managing loading states with minimum duration and timeout
 */
export function useLoadingState(options: LoadingStateOptions = {}) {
  const {
    minDuration = 300,
    timeout,
    onTimeout,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: 0,
  });

  const startTimeRef = useRef<number>(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start loading
   */
  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now();
    setState({
      isLoading: true,
      error: null,
      progress: 0,
    });

    // Set timeout if specified
    if (timeout && onTimeout) {
      timeoutIdRef.current = setTimeout(() => {
        onTimeout();
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: new Error('Operation timed out'),
        }));
      }, timeout);
    }
  }, [timeout, onTimeout]);

  /**
   * Stop loading with minimum duration enforcement
   */
  const stopLoading = useCallback(async (error?: Error) => {
    // Clear timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, minDuration - elapsed);

    // Wait for minimum duration if needed
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    setState({
      isLoading: false,
      error: error || null,
      progress: 100,
    });

    // Call callbacks
    if (error && onError) {
      onError(error);
    } else if (!error && onComplete) {
      onComplete();
    }
  }, [minDuration, onComplete, onError]);

  /**
   * Update progress (0-100)
   */
  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  /**
   * Execute an async operation with loading state
   */
  const execute = useCallback(async <T,>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    startLoading();
    
    try {
      const result = await operation();
      await stopLoading();
      return result;
    } catch (error) {
      await stopLoading(error as Error);
      return null;
    }
  }, [startLoading, stopLoading]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    setState({
      isLoading: false,
      error: null,
      progress: 0,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setProgress,
    execute,
    reset,
  };
}

/**
 * Hook for managing multiple loading states
 */
export function useMultipleLoadingStates<T extends string>(
  keys: T[]
): Record<T, LoadingState> & {
  startLoading: (key: T) => void;
  stopLoading: (key: T, error?: Error) => void;
  isAnyLoading: boolean;
} {
  const [states, setStates] = useState<Record<T, LoadingState>>(() => {
    const initial = {} as Record<T, LoadingState>;
    keys.forEach(key => {
      initial[key] = {
        isLoading: false,
        error: null,
        progress: 0,
      };
    });
    return initial;
  });

  const startLoading = useCallback((key: T) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        error: null,
        progress: 0,
      },
    }));
  }, []);

  const stopLoading = useCallback((key: T, error?: Error) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        isLoading: false,
        error: error || null,
        progress: 100,
      },
    }));
  }, []);

  const isAnyLoading = Object.values(states).some(
    (state: any) => state.isLoading
  );

  return {
    ...states,
    startLoading,
    stopLoading,
    isAnyLoading,
  };
}

/**
 * Hook for sequential loading states (wizard-like)
 */
export function useSequentialLoading(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<Error | null>(null);

  const isLoading = currentStep < steps.length;
  const progress = (completedSteps.size / steps.length) * 100;

  const nextStep = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  }, [currentStep, steps.length]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const setStepError = useCallback((error: Error) => {
    setError(error);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setError(null);
  }, []);

  return {
    currentStep,
    currentStepName: steps[currentStep],
    completedSteps: Array.from(completedSteps),
    isLoading,
    progress,
    error,
    nextStep,
    previousStep,
    setStepError,
    reset,
  };
}
