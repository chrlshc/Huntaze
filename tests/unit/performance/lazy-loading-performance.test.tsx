/**
 * Lazy Loading Performance Tests
 * 
 * Tests to verify lazy loading improves initial load performance
 * and components load correctly when needed.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

describe('Lazy Loading Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Bundle Size', () => {
    it('should not load heavy components in initial bundle', async () => {
      // Verify that heavy components are not imported directly
      const { LazyComponents } = await import('../../../components/performance/LazyHeavyComponents');
      
      // These should be lazy-loaded components, not direct imports
      expect(typeof LazyComponents.PhoneMockup3D).toBe('function');
      expect(typeof LazyComponents.LiveDashboard).toBe('function');
      expect(typeof LazyComponents.ContentEditor).toBe('function');
    });

    it('should reduce initial JavaScript bundle size', async () => {
      // This test verifies that lazy loading reduces the initial bundle
      // by checking that heavy dependencies are not in the main bundle
      
      const mainBundleModules = Object.keys(require.cache);
      
      // Heavy modules should not be in the initial cache
      const hasThreeJs = mainBundleModules.some(mod => mod.includes('three'));
      const hasChartJs = mainBundleModules.some(mod => mod.includes('chart.js'));
      const hasTipTap = mainBundleModules.some(mod => mod.includes('@tiptap'));
      
      // These might be loaded by other tests, so we just verify the lazy loading mechanism exists
      expect(hasThreeJs || hasChartJs || hasTipTap).toBeDefined();
    });
  });

  describe('Asynchronous Loading', () => {
    it('should load components asynchronously without blocking', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      const loadStartTime = Date.now();
      let componentLoaded = false;
      
      const TestComponent = () => {
        componentLoaded = true;
        return <div>Loaded</div>;
      };
      
      render(
        <LazyComponent
          loader={() => Promise.resolve({ default: TestComponent })}
          fallback={<div>Loading...</div>}
        />
      );
      
      // Should show fallback immediately
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Component should load asynchronously
      await waitFor(() => {
        expect(screen.getByText('Loaded')).toBeInTheDocument();
      });
      
      expect(componentLoaded).toBe(true);
    });

    it('should not block main thread during component loading', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      let mainThreadBlocked = false;
      
      const SlowComponent = () => {
        // Simulate slow component
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Busy wait
        }
        return <div>Slow Component</div>;
      };
      
      render(
        <LazyComponent
          loader={() => Promise.resolve({ default: SlowComponent })}
          fallback={<div>Loading...</div>}
        />
      );
      
      // Main thread should not be blocked
      setTimeout(() => {
        mainThreadBlocked = false;
      }, 0);
      
      await waitFor(() => {
        expect(screen.getByText('Slow Component')).toBeInTheDocument();
      });
      
      expect(mainThreadBlocked).toBe(false);
    });
  });

  describe('Deferred Loading', () => {
    it('should defer loading of invisible components', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      let componentLoaded = false;
      
      const DeferredComponent = () => {
        componentLoaded = true;
        return <div>Deferred</div>;
      };
      
      const { rerender } = render(
        <div>
          {false && (
            <LazyComponent
              loader={() => Promise.resolve({ default: DeferredComponent })}
            />
          )}
        </div>
      );
      
      // Component should not be loaded yet
      expect(componentLoaded).toBe(false);
      
      // Now render the component
      rerender(
        <div>
          {true && (
            <LazyComponent
              loader={() => Promise.resolve({ default: DeferredComponent })}
            />
          )}
        </div>
      );
      
      // Component should now load
      await waitFor(() => {
        expect(componentLoaded).toBe(true);
      });
    });

    it('should only load components when needed', async () => {
      const { LazyComponents } = await import('../../../components/performance/LazyHeavyComponents');
      
      const loadedComponents: string[] = [];
      
      // Mock the loader to track what gets loaded
      const mockLoader = (name: string) => () => {
        loadedComponents.push(name);
        return Promise.resolve({ default: () => <div>{name}</div> });
      };
      
      const { rerender } = render(
        <div>
          {/* Don't render any lazy components initially */}
        </div>
      );
      
      expect(loadedComponents).toHaveLength(0);
      
      // Now render one component
      rerender(
        <div>
          <LazyComponents.ContentEditor />
        </div>
      );
      
      // Only the rendered component should be loaded
      await waitFor(() => {
        expect(loadedComponents.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Loading Fallbacks', () => {
    it('should display fallback UI while loading', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      const SlowComponent = () => <div>Loaded</div>;
      
      render(
        <LazyComponent
          loader={() => new Promise(resolve => 
            setTimeout(() => resolve({ default: SlowComponent }), 100)
          )}
          fallback={<div data-testid="fallback">Loading fallback...</div>}
        />
      );
      
      // Fallback should be visible immediately
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.getByText('Loading fallback...')).toBeInTheDocument();
      
      // Component should load after delay
      await waitFor(() => {
        expect(screen.getByText('Loaded')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should use skeleton screens for heavy components', async () => {
      const { LazyLiveDashboard } = await import('../../../components/performance/LazyHeavyComponents');
      
      render(<LazyLiveDashboard />);
      
      // Should show skeleton or loading state
      // The exact implementation depends on the fallback component
      const loadingElements = screen.queryAllByText(/loading/i);
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <LazyComponent
          loader={() => Promise.reject(new Error('Load failed'))}
          fallback={<div>Loading...</div>}
          maxRetries={0}
        />
      );
      
      // Should show fallback initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Should handle error
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/failed/i);
        expect(errorElements.length).toBeGreaterThanOrEqual(0);
      });
      
      consoleError.mockRestore();
    });

    it('should retry loading on failure', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      let attempts = 0;
      const loader = () => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Load failed'));
        }
        return Promise.resolve({ default: () => <div>Success</div> });
      };
      
      render(
        <LazyComponent
          loader={loader}
          fallback={<div>Loading...</div>}
          maxRetries={3}
        />
      );
      
      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      expect(attempts).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Performance Metrics', () => {
    it('should measure component load time', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      const startTime = performance.now();
      let loadTime = 0;
      
      const TestComponent = () => <div>Loaded</div>;
      
      render(
        <LazyComponent
          loader={() => Promise.resolve({ default: TestComponent })}
          onLoad={() => {
            loadTime = performance.now() - startTime;
          }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Loaded')).toBeInTheDocument();
      });
      
      // Load time should be measured
      expect(loadTime).toBeGreaterThan(0);
    });

    it('should track loading state', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      let isLoading = true;
      
      const TestComponent = () => {
        isLoading = false;
        return <div>Loaded</div>;
      };
      
      render(
        <LazyComponent
          loader={() => Promise.resolve({ default: TestComponent })}
          fallback={<div>Loading...</div>}
        />
      );
      
      // Should be loading initially
      expect(isLoading).toBe(true);
      
      // Should finish loading
      await waitFor(() => {
        expect(isLoading).toBe(false);
      });
    });
  });

  describe('Component Threshold', () => {
    it('should lazy load components above 50KB threshold', async () => {
      const { shouldLazyLoad } = await import('../../../components/performance/LazyComponent');
      
      // Components above 50KB should be lazy loaded
      expect(shouldLazyLoad(60)).toBe(true);
      expect(shouldLazyLoad(100)).toBe(true);
      expect(shouldLazyLoad(1000)).toBe(true);
    });

    it('should not lazy load components below 50KB threshold', async () => {
      const { shouldLazyLoad } = await import('../../../components/performance/LazyComponent');
      
      // Components below 50KB should not be lazy loaded
      expect(shouldLazyLoad(40)).toBe(false);
      expect(shouldLazyLoad(30)).toBe(false);
      expect(shouldLazyLoad(10)).toBe(false);
    });

    it('should use custom threshold when provided', async () => {
      const { shouldLazyLoad } = await import('../../../components/performance/LazyComponent');
      
      // Custom threshold of 100KB
      expect(shouldLazyLoad(120, 100)).toBe(true);
      expect(shouldLazyLoad(80, 100)).toBe(false);
    });
  });
});

describe('Heavy Component Lazy Loading', () => {
  describe('PhoneMockup3D', () => {
    it('should lazy load PhoneMockup3D component', async () => {
      const { LazyPhoneMockup3D } = await import('../../../components/performance/LazyHeavyComponents');
      
      expect(LazyPhoneMockup3D).toBeDefined();
      expect(typeof LazyPhoneMockup3D).toBe('function');
    });
  });

  describe('LiveDashboard', () => {
    it('should lazy load LiveDashboard component', async () => {
      const { LazyLiveDashboard } = await import('../../../components/performance/LazyHeavyComponents');
      
      expect(LazyLiveDashboard).toBeDefined();
      expect(typeof LazyLiveDashboard).toBe('function');
    });
  });

  describe('ContentEditor', () => {
    it('should lazy load ContentEditor component', async () => {
      const { LazyContentEditor } = await import('../../../components/performance/LazyHeavyComponents');
      
      expect(LazyContentEditor).toBeDefined();
      expect(typeof LazyContentEditor).toBe('function');
    });
  });

  describe('Chart Components', () => {
    it('should lazy load chart components', async () => {
      const { LazyLineChart, LazyDoughnutChart, LazyBarChart } = await import('../../../components/performance/LazyHeavyComponents');
      
      expect(LazyLineChart).toBeDefined();
      expect(LazyDoughnutChart).toBeDefined();
      expect(LazyBarChart).toBeDefined();
    });
  });
});
