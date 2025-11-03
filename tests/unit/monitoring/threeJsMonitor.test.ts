import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ThreeJsMonitor from '../../../lib/monitoring/threeJsMonitor';

// Mock global objects
const mockCanvas = {
  getContext: vi.fn(() => ({
    getError: vi.fn(() => 0),
    isContextLost: vi.fn(() => false)
  }))
};

const mockPerformanceObserver = vi.fn();
const mockRequestAnimationFrame = vi.fn();

// Setup global mocks
global.document = {
  createElement: vi.fn(() => mockCanvas),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as any;

global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  location: { href: 'http://localhost:3000' },
  navigator: { userAgent: 'test-browser' },
  PerformanceObserver: mockPerformanceObserver,
  requestAnimationFrame: mockRequestAnimationFrame,
  performance: { now: vi.fn(() => Date.now()) }
} as any;

global.fetch = vi.fn();

describe('ThreeJsMonitor', () => {
  let monitor: ThreeJsMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new ThreeJsMonitor();
  });

  afterEach(() => {
    monitor.stopMonitoring();
    monitor.clearErrors();
  });

  describe('Initialization', () => {
    it('should initialize with empty error list', () => {
      expect(monitor.getRecentErrors()).toEqual([]);
    });

    it('should start monitoring when created', () => {
      expect(monitor['isMonitoring']).toBe(false);
      monitor.startMonitoring();
      expect(monitor['isMonitoring']).toBe(true);
    });
  });

  describe('Error Detection', () => {
    it('should detect Three.js related errors', () => {
      const threeError = new Error('WebGL context lost');
      threeError.stack = 'Error at three.js:123';

      expect(monitor['isThreeJsError'](threeError)).toBe(true);
    });

    it('should ignore non-Three.js errors', () => {
      const regularError = new Error('Regular application error');
      regularError.stack = 'Error at app.js:456';

      expect(monitor['isThreeJsError'](regularError)).toBe(false);
    });

    it('should detect WebGL related errors', () => {
      const webglError = new Error('CONTEXT_LOST_WEBGL');
      expect(monitor['isThreeJsError'](webglError)).toBe(true);
    });

    it('should detect shader related errors', () => {
      const shaderError = new Error('Shader compilation failed');
      expect(monitor['isThreeJsError'](shaderError)).toBe(true);
    });
  });

  describe('Error Logging', () => {
    it('should log Three.js errors', () => {
      const error = {
        type: 'rendering' as const,
        message: 'Test error',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      };

      monitor['logError'](error);
      
      const recentErrors = monitor.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0]).toMatchObject(error);
    });

    it('should limit error history to 100 entries', () => {
      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        monitor['logError']({
          type: 'rendering',
          message: `Error ${i}`,
          timestamp: Date.now(),
          userAgent: 'test-browser',
          url: 'http://localhost:3000'
        });
      }

      const allErrors = monitor['errors'];
      expect(allErrors).toHaveLength(100);
      expect(allErrors[0].message).toBe('Error 50'); // Should keep last 100
    });

    it('should send errors to monitoring service in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const error = {
        type: 'webgl' as const,
        message: 'WebGL context lost',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      };

      monitor['logError'](error);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Health Status', () => {
    it('should report healthy status with no errors', () => {
      expect(monitor.isHealthy()).toBe(true);
    });

    it('should report unhealthy status with critical errors', () => {
      monitor['logError']({
        type: 'webgl',
        message: 'WebGL context lost',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      expect(monitor.isHealthy()).toBe(false);
    });

    it('should report healthy status with only performance errors', () => {
      monitor['logError']({
        type: 'performance',
        message: 'Slow rendering',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      expect(monitor.isHealthy()).toBe(true);
    });

    it('should provide comprehensive health status', () => {
      monitor['logError']({
        type: 'rendering',
        message: 'Rendering error',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      const healthStatus = monitor.getHealthStatus();
      
      expect(healthStatus).toMatchObject({
        healthy: false,
        errorCount: 1,
        recentErrors: expect.arrayContaining([
          expect.objectContaining({
            type: 'rendering',
            message: 'Rendering error'
          })
        ]),
        stats: {
          rendering: 1
        }
      });
    });
  });

  describe('Error Statistics', () => {
    it('should calculate error statistics by type', () => {
      monitor['logError']({
        type: 'webgl',
        message: 'WebGL error 1',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      monitor['logError']({
        type: 'webgl',
        message: 'WebGL error 2',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      monitor['logError']({
        type: 'performance',
        message: 'Performance error',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      const stats = monitor.getErrorStats();
      expect(stats).toEqual({
        webgl: 2,
        performance: 1
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance entries', () => {
      const performanceEntry = {
        name: 'three-js-render',
        duration: 20, // > 16.67ms threshold
        entryType: 'measure'
      } as PerformanceEntry;

      monitor['trackPerformanceEntry'](performanceEntry);

      const recentErrors = monitor.getRecentErrors();
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0]).toMatchObject({
        type: 'performance',
        message: 'Slow Three.js operation: three-js-render'
      });
    });

    it('should not log fast performance entries', () => {
      const performanceEntry = {
        name: 'three-js-render',
        duration: 10, // < 16.67ms threshold
        entryType: 'measure'
      } as PerformanceEntry;

      monitor['trackPerformanceEntry'](performanceEntry);

      const recentErrors = monitor.getRecentErrors();
      expect(recentErrors).toHaveLength(0);
    });
  });

  describe('Monitoring Control', () => {
    it('should start and stop monitoring', () => {
      expect(monitor['isMonitoring']).toBe(false);
      
      monitor.startMonitoring();
      expect(monitor['isMonitoring']).toBe(true);
      
      monitor.stopMonitoring();
      expect(monitor['isMonitoring']).toBe(false);
    });

    it('should not start monitoring twice', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      monitor.startMonitoring();
      monitor.startMonitoring(); // Second call should be ignored
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });
  });

  describe('Error Clearing', () => {
    it('should clear all errors', () => {
      monitor['logError']({
        type: 'rendering',
        message: 'Test error',
        timestamp: Date.now(),
        userAgent: 'test-browser',
        url: 'http://localhost:3000'
      });

      expect(monitor.getRecentErrors()).toHaveLength(1);
      
      monitor.clearErrors();
      
      expect(monitor.getRecentErrors()).toHaveLength(0);
    });
  });
});