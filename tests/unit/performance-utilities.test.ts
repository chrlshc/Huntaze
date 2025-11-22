/**
 * Performance Utilities Tests
 * 
 * Tests for performance optimization utilities
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dynamicImport, shouldCodeSplit, performanceMonitor, EXTERNAL_DOMAINS } from '@/lib/utils/performance';

describe('Performance Utilities', () => {
  describe('dynamicImport', () => {
    it('should successfully import a module', async () => {
      const mockModule = { default: 'test' };
      const importFn = vi.fn().mockResolvedValue(mockModule);
      
      const result = await dynamicImport(importFn);
      
      expect(result).toBe(mockModule);
      expect(importFn).toHaveBeenCalledOnce();
    });

    it('should return fallback on import failure', async () => {
      const fallback = { default: 'fallback' };
      const importFn = vi.fn().mockRejectedValue(new Error('Import failed'));
      
      const result = await dynamicImport(importFn, fallback);
      
      expect(result).toBe(fallback);
    });

    it('should throw error if no fallback provided', async () => {
      const importFn = vi.fn().mockRejectedValue(new Error('Import failed'));
      
      await expect(dynamicImport(importFn)).rejects.toThrow('Import failed');
    });
  });

  describe('shouldCodeSplit', () => {
    it('should not split small components', () => {
      expect(shouldCodeSplit(30, 'low')).toBe(false);
      expect(shouldCodeSplit(40, 'medium')).toBe(false);
    });

    it('should not split high-frequency components', () => {
      expect(shouldCodeSplit(100, 'high')).toBe(false);
      expect(shouldCodeSplit(200, 'high')).toBe(false);
    });

    it('should split large low-frequency components', () => {
      expect(shouldCodeSplit(250, 'low')).toBe(true);
      expect(shouldCodeSplit(300, 'low')).toBe(true);
    });

    it('should split medium-sized medium-frequency components', () => {
      expect(shouldCodeSplit(150, 'medium')).toBe(true);
      expect(shouldCodeSplit(120, 'medium')).toBe(true);
    });

    it('should not split medium-sized low-frequency components below threshold', () => {
      expect(shouldCodeSplit(80, 'medium')).toBe(false);
    });
  });

  describe('performanceMonitor', () => {
    beforeEach(() => {
      // Mock performance API
      global.performance = {
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn().mockReturnValue([{ duration: 100 }]),
        getEntriesByType: vi.fn().mockReturnValue([]),
      } as any;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should mark performance points', () => {
      performanceMonitor.mark('test-mark');
      
      expect(performance.mark).toHaveBeenCalledWith('test-mark');
    });

    it('should measure between marks', () => {
      const duration = performanceMonitor.measure('test-measure', 'start', 'end');
      
      expect(performance.measure).toHaveBeenCalledWith('test-measure', 'start', 'end');
      expect(duration).toBe(100);
    });

    it('should handle measurement errors gracefully', () => {
      (performance.measure as any).mockImplementation(() => {
        throw new Error('Measurement failed');
      });
      
      const duration = performanceMonitor.measure('test-measure', 'start', 'end');
      
      expect(duration).toBeNull();
    });

    it('should return null when performance API is not available', () => {
      global.performance = undefined as any;
      
      performanceMonitor.mark('test');
      const duration = performanceMonitor.measure('test', 'start', 'end');
      
      expect(duration).toBeNull();
    });

    it('should get core web vitals', () => {
      const mockNavigation = {
        responseStart: 100,
        requestStart: 50,
        domContentLoadedEventEnd: 200,
        domContentLoadedEventStart: 150,
      };
      
      const mockPaint = [
        { name: 'first-contentful-paint', startTime: 120 },
      ];
      
      (performance.getEntriesByType as any)
        .mockImplementation((type: string) => {
          if (type === 'navigation') return [mockNavigation];
          if (type === 'paint') return mockPaint;
          return [];
        });
      
      const vitals = performanceMonitor.getCoreWebVitals();
      
      expect(vitals).toEqual({
        fcp: 120,
        lcp: null,
        fid: null,
        cls: null,
        ttfb: 50,
        domContentLoaded: 50,
      });
    });
  });

  describe('EXTERNAL_DOMAINS', () => {
    it('should include all required external domains', () => {
      expect(EXTERNAL_DOMAINS).toContain('https://api.dicebear.com');
      expect(EXTERNAL_DOMAINS).toContain('https://ui-avatars.com');
      expect(EXTERNAL_DOMAINS).toContain('https://cdn.huntaze.com');
      expect(EXTERNAL_DOMAINS).toContain('https://static.onlyfansassets.com');
    });

    it('should have at least 4 domains', () => {
      expect(EXTERNAL_DOMAINS.length).toBeGreaterThanOrEqual(4);
    });
  });
});
