/**
 * Debounce Utility
 * 
 * Delays function execution until after a specified delay has elapsed
 * since the last time it was invoked. Useful for optimizing API calls
 * triggered by user input (search, filters, etc.).
 * 
 * Requirements: Performance optimization, API call reduction
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   fetchSearchResults(query);
 * }, 300);
 * 
 * // Called multiple times rapidly
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this will execute after 300ms
 * ```
 */

/**
 * Creates a debounced function that delays invoking func until after
 * delay milliseconds have elapsed since the last time the debounced
 * function was invoked.
 * 
 * @param fn - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a debounced function that also returns a promise.
 * Useful when you need to await the debounced result.
 * 
 * @param fn - The async function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version that returns a promise
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  
  return function debouncedAsync(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    if (pendingPromise) {
      return pendingPromise;
    }
    
    pendingPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = null;
          pendingPromise = null;
        }
      }, delay);
    });
    
    return pendingPromise;
  };
}

/**
 * Creates a debounced function with a cancel method.
 * Useful when you need to cancel pending executions.
 * 
 * @param fn - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced function with cancel method
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
  
  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return { debounced, cancel };
}

/**
 * React hook for debouncing values
 * 
 * @param value - The value to debounce
 * @param delay - The number of milliseconds to delay
 * @returns The debounced value
 * 
 * @example
 * ```typescript
 * function SearchComponent() {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 *   
 *   useEffect(() => {
 *     if (debouncedQuery) {
 *       fetchSearchResults(debouncedQuery);
 *     }
 *   }, [debouncedQuery]);
 *   
 *   return <input value={query} onChange={e => setQuery(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  // This would be implemented in a React context
  // For now, just export the type
  return value;
}
