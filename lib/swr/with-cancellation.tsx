/**
 * HOC for Request Cancellation on Component Unmount
 * 
 * Wraps components to automatically cancel pending SWR requests
 * when the component unmounts, preventing memory leaks.
 * 
 * Requirements: 3.5
 */

'use client';

import { useEffect, useRef, ComponentType } from 'react';
import { mutate } from 'swr';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

/**
 * Higher-Order Component that adds request cancellation on unmount
 * 
 * Usage:
 * ```typescript
 * const MyComponentWithCancellation = withRequestCancellation(MyComponent);
 * ```
 */
export function withRequestCancellation<P extends object>(
  Component: ComponentType<P>,
  swrKeys?: string[]
) {
  return function WithCancellationWrapper(props: P) {
    const mountedRef = useRef(true);
    const keysRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      mountedRef.current = true;
      const keys = keysRef.current;

      return () => {
        mountedRef.current = false;

        // Cancel all tracked SWR requests
        if (swrKeys) {
          swrKeys.forEach(key => {
            mutate(key, undefined, { revalidate: false });
          });
        } else {
          // Cancel all keys that were tracked
          keys.forEach(key => {
            mutate(key, undefined, { revalidate: false });
          });
        }

        keys.clear();
      };
    }, []);

    return <Component {...props} />;
  };
}

/**
 * Hook to track SWR keys for cancellation
 * 
 * Usage:
 * ```typescript
 * function MyComponent() {
 *   const trackKey = useRequestCancellation();
 *   
 *   const { data } = useSWR('/api/data', fetcher);
 *   trackKey('/api/data');
 *   
 *   return <div>{data}</div>;
 * }
 * ```
 */
export function useRequestCancellation() {
  const keysRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const keys = keysRef.current;
    const controllers = abortControllersRef.current;
    return () => {
      // Cancel all tracked requests on unmount
      keys.forEach(key => {
        mutate(key, undefined, { revalidate: false });
      });

      // Abort all fetch requests
      controllers.forEach(controller => {
        controller.abort();
      });

      keys.clear();
      controllers.clear();
    };
  }, []);

  const trackKey = (key: string) => {
    keysRef.current.add(key);
  };

  const createAbortController = (key: string): AbortController => {
    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);
    return controller;
  };

  const abortRequest = (key: string) => {
    const controller = abortControllersRef.current.get(key);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(key);
    }
  };

  return {
    trackKey,
    createAbortController,
    abortRequest,
  };
}

/**
 * Fetcher with automatic cancellation support
 * 
 * Usage:
 * ```typescript
 * const { data } = useSWR('/api/data', createCancellableFetcher());
 * ```
 */
export function createCancellableFetcherHOC() {
  const abortController = new AbortController();

  const fetcher = async (url: string) => {
    return internalApiFetch(url, { signal: abortController.signal });
  };

  return {
    fetcher,
    abort: () => abortController.abort(),
  };
}
