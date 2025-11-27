/**
 * Lazy Loading Utilities
 * Task 5.3: Optimize performance with lazy loading
 * Requirements: 4.4
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Lazy load a component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        // If this is the last retry, throw the error
        if (i === retries - 1) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, interval * (i + 1)));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to load component after retries');
  });
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): void {
  // Access the _payload to trigger loading
  const payload = (lazyComponent as any)._payload;
  if (payload && typeof payload._result === 'function') {
    payload._result();
  }
}

/**
 * Lazy load multiple components
 */
export function lazyLoadComponents<T extends Record<string, ComponentType<any>>>(
  imports: Record<keyof T, () => Promise<{ default: ComponentType<any> }>>
): Record<keyof T, LazyExoticComponent<ComponentType<any>>> {
  const components: any = {};

  for (const [key, importFn] of Object.entries(imports)) {
    components[key] = lazyWithRetry(importFn);
  }

  return components;
}

/**
 * Intersection Observer based lazy loading
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedElements = new Set<Element>();

  constructor(
    private onIntersect: (element: Element) => void,
    private options: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.01,
    }
  ) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        options
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
        this.loadedElements.add(entry.target);
        this.onIntersect(entry.target);
        this.observer?.unobserve(entry.target);
      }
    });
  }

  observe(element: Element) {
    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.onIntersect(element);
    }
  }

  unobserve(element: Element) {
    this.observer?.unobserve(element);
    this.loadedElements.delete(element);
  }

  disconnect() {
    this.observer?.disconnect();
    this.loadedElements.clear();
  }
}

/**
 * Lazy load images
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
) {
  if (placeholder) {
    img.src = placeholder;
  }

  const loader = new LazyLoader(element => {
    const image = element as HTMLImageElement;
    image.src = src;
    image.classList.add('loaded');
  });

  loader.observe(img);

  return () => loader.disconnect();
}

/**
 * Prefetch resources
 */
export function prefetchResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' = 'fetch'
) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  link.href = href;

  document.head.appendChild(link);
}

/**
 * Preload critical resources
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' = 'fetch',
  crossOrigin?: 'anonymous' | 'use-credentials'
) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;

  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * Dynamic import with error handling
 */
export async function dynamicImport<T = any>(
  modulePath: string,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await import(/* @vite-ignore */ modulePath);
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(`Failed to load module: ${modulePath}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error(`Failed to load module: ${modulePath}`);
}

/**
 * Code splitting helper for route-based lazy loading
 */
export function createRouteLazyLoader<T extends ComponentType<any>>(
  routes: Record<string, () => Promise<{ default: T }>>
): Record<string, LazyExoticComponent<T>> {
  const lazyRoutes: Record<string, LazyExoticComponent<T>> = {};

  for (const [path, loader] of Object.entries(routes)) {
    lazyRoutes[path] = lazyWithRetry(loader);
  }

  return lazyRoutes;
}

/**
 * Defer non-critical scripts
 */
export function deferScript(src: string, onLoad?: () => void) {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;

  if (onLoad) {
    script.onload = onLoad;
  }

  document.body.appendChild(script);
}

/**
 * Load script asynchronously
 */
export function loadScriptAsync(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document is not available'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.body.appendChild(script);
  });
}
