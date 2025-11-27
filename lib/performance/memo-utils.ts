/**
 * React.memo Utilities
 * Task 5.3: Optimize re-renders with memoization
 * Requirements: 4.4
 */

import { memo, ComponentType } from 'react';

/**
 * Deep comparison for React.memo
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Shallow comparison for React.memo
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Create a memoized component with custom comparison
 */
export function memoWithComparison<P extends object>(
  Component: ComponentType<P>,
  compare?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): ComponentType<P> {
  return memo(Component, compare);
}

/**
 * Memo with deep comparison
 */
export function memoDeep<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component, deepEqual);
}

/**
 * Memo with shallow comparison (default React.memo behavior)
 */
export function memoShallow<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component, shallowEqual);
}

/**
 * Memo with specific prop comparison
 */
export function memoByProps<P extends object>(
  Component: ComponentType<P>,
  propsToCompare: Array<keyof P>
): ComponentType<P> {
  return memo(Component, (prevProps, nextProps) => {
    return propsToCompare.every(
      prop => prevProps[prop] === nextProps[prop]
    );
  });
}

/**
 * Memo that ignores specific props
 */
export function memoIgnoreProps<P extends object>(
  Component: ComponentType<P>,
  propsToIgnore: Array<keyof P>
): ComponentType<P> {
  return memo(Component, (prevProps, nextProps) => {
    const prevFiltered = { ...prevProps };
    const nextFiltered = { ...nextProps };

    propsToIgnore.forEach(prop => {
      delete prevFiltered[prop];
      delete nextFiltered[prop];
    });

    return shallowEqual(prevFiltered, nextFiltered);
  });
}

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
): ComponentType<P> {
  const name = componentName || Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();

      const result = Component(props);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // Warn if render takes longer than one frame (16ms)
        console.warn(
          `[Performance] ${name} took ${renderTime.toFixed(2)}ms to render`
        );
      }

      return result;
    }

    return Component(props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`;

  return WrappedComponent;
}

/**
 * Debounced component updates
 */
export function withDebounce<P extends object>(
  Component: ComponentType<P>,
  delay: number = 300
): ComponentType<P> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestProps: P | null = null;

  const DebouncedComponent = (props: P) => {
    latestProps = props;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (latestProps) {
        Component(latestProps);
      }
    }, delay);

    return null;
  };

  return DebouncedComponent;
}

/**
 * Throttled component updates
 */
export function withThrottle<P extends object>(
  Component: ComponentType<P>,
  limit: number = 100
): ComponentType<P> {
  let lastRun = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const ThrottledComponent = (props: P) => {
    const now = Date.now();

    if (now - lastRun >= limit) {
      lastRun = now;
      return Component(props);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      lastRun = Date.now();
      Component(props);
    }, limit - (now - lastRun));

    return null;
  };

  return ThrottledComponent;
}

/**
 * Batch component updates
 */
export class ComponentUpdateBatcher {
  private queue: Array<() => void> = [];
  private rafId: number | null = null;

  schedule(update: () => void) {
    this.queue.push(update);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    const updates = [...this.queue];
    this.queue = [];
    this.rafId = null;

    updates.forEach(update => update());
  }

  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.queue = [];
  }
}

/**
 * Create a batched update scheduler
 */
export function createUpdateBatcher(): ComponentUpdateBatcher {
  return new ComponentUpdateBatcher();
}

/**
 * Optimize list rendering with keys
 */
export function optimizeListKeys<T>(
  items: T[],
  getKey: (item: T, index: number) => string | number
): Array<{ key: string | number; item: T; index: number }> {
  return items.map((item, index) => ({
    key: getKey(item, index),
    item,
    index,
  }));
}

/**
 * Virtual scrolling helper
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}
