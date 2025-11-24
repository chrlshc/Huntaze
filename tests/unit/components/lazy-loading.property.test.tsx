/**
 * Property-Based Tests for Lazy Loading System
 * 
 * Tests universal properties that should hold for lazy-loaded components
 * using fast-check for property-based testing.
 * 
 * Feature: linear-ui-performance-refactor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import React, { ComponentType } from 'react';
import { LazyComponent, shouldLazyLoad } from '@/components/performance/LazyComponent';

// Helper to sanitize component names for CSS selectors
const sanitizeName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
};

// Mock components for testing
const createMockComponent = (name: string): ComponentType<any> => {
  // Sanitize name for use in test IDs (remove special characters that break CSS selectors)
  const sanitizedName = sanitizeName(name);
  const Component = (props: any) => (
    <div data-testid={`mock-component-${sanitizedName}`} data-loaded="true">
      {name} Component Loaded
      {props.testProp && <span data-testid="test-prop">{props.testProp}</span>}
    </div>
  );
  Component.displayName = name;
  return Component;
};

// Helper to create a loader that resolves to a component
const createLoader = (componentName: string, delay: number = 0) => {
  return () => new Promise<{ default: ComponentType<any> }>((resolve) => {
    setTimeout(() => {
      resolve({ default: createMockComponent(componentName) });
    }, delay);
  });
};

// Helper to create a loader that fails
const createFailingLoader = (errorMessage: string) => {
  return () => new Promise<{ default: ComponentType<any> }>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, 10);
  });
};

describe('Lazy Loading Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Increase timeout for async property tests
  const testTimeout = 10000;

  /**
   * Property 21: Lazy loading for invisible components
   * 
   * For any heavy component that is not immediately visible in the viewport,
   * it should not be loaded until it becomes necessary
   * 
   * Validates: Requirements 7.2
   * 
   * Feature: linear-ui-performance-refactor, Property 21: Lazy loading for invisible components
   */
  describe('Property 21: Lazy loading for invisible components', () => {
    it('should defer loading until component is rendered', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          async (componentName) => {
            const sanitizedName = componentName.replace(/[^a-zA-Z0-9-_]/g, '_');
            const loadSpy = vi.fn();
            const loader = () => {
              loadSpy();
              return createLoader(componentName, 20)();
            };

            // Component not rendered yet - loader should not be called
            expect(loadSpy).not.toHaveBeenCalled();

            // Render the lazy component
            const { container } = render(
              <LazyComponent loader={loader} />
            );

            // Loader should be called when component is rendered
            expect(loadSpy).toHaveBeenCalledTimes(1);

            // Wait for component to load
            await waitFor(() => {
              const loadedComponent = container.querySelector(`[data-testid="mock-component-${sanitizedName}"]`);
              expect(loadedComponent).toBeTruthy();
            }, { timeout: 2000 });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not load component until LazyComponent wrapper is mounted', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          async (componentName, shouldMount) => {
            const loadSpy = vi.fn();
            const loader = () => {
              loadSpy();
              return createLoader(componentName, 20)();
            };

            // Initially, loader should not be called
            expect(loadSpy).not.toHaveBeenCalled();

            if (shouldMount) {
              // Mount the component
              const { container } = render(
                <LazyComponent loader={loader} />
              );

              // Loader should be called
              expect(loadSpy).toHaveBeenCalled();

              // Wait for load
              await waitFor(() => {
                const loadedComponent = container.querySelector(`[data-testid="mock-component-${sanitizeName(componentName)}"]`);
                expect(loadedComponent).toBeTruthy();
              }, { timeout: 2000 });
            } else {
              // Don't mount - loader should never be called
              expect(loadSpy).not.toHaveBeenCalled();
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display fallback UI while component is not loaded', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 20, max: 100 }),
          async (componentName, loadDelay) => {
            const { container } = render(
              <LazyComponent 
                loader={createLoader(componentName, loadDelay)}
                fallback={<div data-testid="custom-fallback">Loading...</div>}
              />
            );

            // Fallback should be visible immediately
            const fallback = container.querySelector('[data-testid="custom-fallback"]');
            expect(fallback).toBeTruthy();

            // Component should not be loaded yet
            const component = container.querySelector(`[data-testid="mock-component-${sanitizeName(componentName)}"]`);
            expect(component).toBeFalsy();

            // Wait for component to load
            await waitFor(() => {
              const loadedComponent = container.querySelector(`[data-testid="mock-component-${sanitizeName(componentName)}"]`);
              expect(loadedComponent).toBeTruthy();
            }, { timeout: 2000 });

            // Fallback should be removed after load
            const fallbackAfterLoad = container.querySelector('[data-testid="custom-fallback"]');
            expect(fallbackAfterLoad).toBeFalsy();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should only load heavy components above threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          fc.integer({ min: 30, max: 100 }),
          (componentSizeKB, thresholdKB) => {
            const shouldLazy = shouldLazyLoad(componentSizeKB, thresholdKB);
            
            if (componentSizeKB > thresholdKB) {
              expect(shouldLazy).toBe(true);
            } else {
              expect(shouldLazy).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default threshold of 50KB when not specified', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          (componentSizeKB) => {
            const shouldLazy = shouldLazyLoad(componentSizeKB);
            
            if (componentSizeKB > 50) {
              expect(shouldLazy).toBe(true);
            } else {
              expect(shouldLazy).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 22: Asynchronous component loading
   * 
   * For any heavy component being loaded, the loading should be asynchronous
   * and not block the main JavaScript thread
   * 
   * Validates: Requirements 7.3
   * 
   * Feature: linear-ui-performance-refactor, Property 22: Asynchronous component loading
   */
  describe('Property 22: Asynchronous component loading', () => {
    it('should load components asynchronously without blocking', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 20, max: 100 }),
          async (componentName, loadDelay) => {
            const beforeRender = Date.now();
            
            const { container } = render(
              <LazyComponent loader={createLoader(componentName, loadDelay)} />
            );

            const afterRender = Date.now();
            const renderTime = afterRender - beforeRender;

            // Render should complete quickly (not blocked by async load)
            // Allow 50ms for render overhead
            expect(renderTime).toBeLessThan(100);

            // Fallback should be visible immediately
            const fallback = container.querySelector('[data-testid="lazy-loading-fallback"]');
            expect(fallback).toBeTruthy();

            // Wait for async load to complete
            await waitFor(() => {
              const loadedComponent = container.querySelector(`[data-testid="mock-component-${sanitizeName(componentName)}"]`);
              expect(loadedComponent).toBeTruthy();
            }, { timeout: 2000 });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle multiple async loads concurrently', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 3 }),
          async (componentNames) => {
            const uniqueNames = [...new Set(componentNames)];
            const startTime = Date.now();

            // Render multiple lazy components
            const containers = uniqueNames.map(name => {
              const { container } = render(
                <LazyComponent 
                  loader={createLoader(name, 50)}
                  key={name}
                />
              );
              return container;
            });

            const renderTime = Date.now() - startTime;

            // All renders should complete quickly (not sequential)
            expect(renderTime).toBeLessThan(200);

            // All fallbacks should be visible
            containers.forEach(container => {
              const fallback = container.querySelector('[data-testid="lazy-loading-fallback"]');
              expect(fallback).toBeTruthy();
            });

            // Wait for all components to load
            await Promise.all(
              uniqueNames.map((name, index) =>
                waitFor(() => {
                  const loadedComponent = containers[index].querySelector(
                    `[data-testid="mock-component-${sanitizeName(name)}"]`
                  );
                  expect(loadedComponent).toBeTruthy();
                }, { timeout: 2000 })
              )
            );

            return true;
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should pass props to loaded component asynchronously', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (componentName, propValue) => {
            const { container } = render(
              <LazyComponent 
                loader={createLoader(componentName, 20)}
                componentProps={{ testProp: propValue }}
              />
            );

            // Wait for component to load
            await waitFor(() => {
              const loadedComponent = container.querySelector(`[data-testid="mock-component-${sanitizeName(componentName)}"]`);
              expect(loadedComponent).toBeTruthy();
            }, { timeout: 2000 });

            // Verify props were passed
            const propElement = container.querySelector('[data-testid="test-prop"]');
            expect(propElement).toBeTruthy();
            expect(propElement?.textContent).toBe(propValue);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should call onLoad callback after async load completes', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          async (componentName) => {
            const onLoadSpy = vi.fn();

            const { container } = render(
              <LazyComponent 
                loader={createLoader(componentName, 20)}
                onLoad={onLoadSpy}
              />
            );

            // Wait for component to load
            await waitFor(() => {
              const loadedComponent = container.querySelector(`[data-testid="mock-component-${sanitizeName(componentName)}"]`);
              expect(loadedComponent).toBeTruthy();
            }, { timeout: 2000 });

            // onLoad should be called after load
            await waitFor(() => {
              expect(onLoadSpy).toHaveBeenCalled();
            }, { timeout: 1000 });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle async load failures gracefully', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (errorMessage) => {
            const onErrorSpy = vi.fn();

            const { container } = render(
              <LazyComponent 
                loader={createFailingLoader(errorMessage)}
                onError={onErrorSpy}
                maxRetries={0}
              />
            );

            // Wait for error to occur
            await waitFor(() => {
              const errorElement = container.querySelector('[data-testid="lazy-loading-error"]');
              expect(errorElement).toBeTruthy();
            }, { timeout: 2000 });

            // onError should be called
            await waitFor(() => {
              expect(onErrorSpy).toHaveBeenCalled();
              expect(onErrorSpy).toHaveBeenCalledWith(expect.any(Error));
            }, { timeout: 1000 });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Combined Properties Test
   * 
   * Verifies that all lazy loading properties work together correctly
   */
  describe('Combined Lazy Loading Properties', () => {
    it('should satisfy all lazy loading properties simultaneously', { timeout: 20000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            componentName: fc.string({ minLength: 1, maxLength: 20 }),
            loadDelay: fc.integer({ min: 20, max: 100 }),
            componentSize: fc.integer({ min: 30, max: 150 }),
            threshold: fc.integer({ min: 40, max: 100 }),
            propValue: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          async (config) => {
            const onLoadSpy = vi.fn();
            const startTime = Date.now();

            // Property 21: Check threshold logic
            const shouldLazy = shouldLazyLoad(config.componentSize, config.threshold);
            expect(shouldLazy).toBe(config.componentSize > config.threshold);

            const { container } = render(
              <LazyComponent 
                loader={createLoader(config.componentName, config.loadDelay)}
                componentProps={{ testProp: config.propValue }}
                onLoad={onLoadSpy}
                threshold={config.threshold}
              />
            );

            const renderTime = Date.now() - startTime;

            // Property 22: Async loading should not block
            expect(renderTime).toBeLessThan(100);

            // Property 21: Fallback should be visible while loading
            const fallback = container.querySelector('[data-testid="lazy-loading-fallback"]');
            expect(fallback).toBeTruthy();

            // Wait for component to load
            await waitFor(() => {
              const loadedComponent = container.querySelector(
                `[data-testid="mock-component-${sanitizeName(config.componentName)}"]`
              );
              expect(loadedComponent).toBeTruthy();
            }, { timeout: 2000 });

            // Property 22: Props should be passed correctly
            const propElement = container.querySelector('[data-testid="test-prop"]');
            expect(propElement?.textContent).toBe(config.propValue);

            // Property 22: onLoad callback should be called
            await waitFor(() => {
              expect(onLoadSpy).toHaveBeenCalled();
            }, { timeout: 1000 });

            return true;
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
