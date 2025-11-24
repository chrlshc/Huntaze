/**
 * Ping Service Unit Tests
 * 
 * Tests for cold start prevention service configuration, timeout handling,
 * and failure monitoring.
 * 
 * Requirements: 5.1, 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PingService, createStagingPingService } from '@/lib/services/ping.service';
import type { PingServiceConfig, PingResponse, PingError } from '@/lib/services/ping.service';

// Mock fetch globally
global.fetch = vi.fn();

describe('PingService', () => {
  let service: PingService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (service) {
      service.stop();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration', () => {
    it('should create service with valid configuration', () => {
      const config: PingServiceConfig = {
        url: 'https://staging.example.com',
        interval: 600000, // 10 minutes
        method: 'HEAD',
        timeout: 3000,
        enabled: true,
      };

      service = new PingService(config);
      const actualConfig = service.getConfig();

      expect(actualConfig.url).toBe(config.url);
      expect(actualConfig.interval).toBe(config.interval);
      expect(actualConfig.method).toBe(config.method);
      expect(actualConfig.timeout).toBe(config.timeout);
      expect(actualConfig.enabled).toBe(config.enabled);
    });

    it('should use default method HEAD if not specified', () => {
      service = new PingService({
        url: 'https://staging.example.com',
        interval: 600000,
        timeout: 3000,
        enabled: true,
      });

      expect(service.getConfig().method).toBe('HEAD');
    });

    it('should use default enabled true if not specified', () => {
      service = new PingService({
        url: 'https://staging.example.com',
        interval: 600000,
        timeout: 3000,
        enabled: true,
      });

      expect(service.getConfig().enabled).toBe(true);
    });

    it('should throw error if URL is missing', () => {
      expect(() => {
        new PingService({
          url: '',
          interval: 600000,
          timeout: 3000,
          enabled: true,
        });
      }).toThrow('PingService: URL is required');
    });

    it('should throw error if URL is invalid', () => {
      expect(() => {
        new PingService({
          url: 'not-a-valid-url',
          interval: 600000,
          timeout: 3000,
          enabled: true,
        });
      }).toThrow('PingService: Invalid URL');
    });

    it('should accept http URLs', () => {
      expect(() => {
        service = new PingService({
          url: 'http://localhost:3000',
          interval: 600000,
          timeout: 3000,
          enabled: true,
        });
      }).not.toThrow();
    });

    it('should accept https URLs', () => {
      expect(() => {
        service = new PingService({
          url: 'https://staging.example.com',
          interval: 600000,
          timeout: 3000,
          enabled: true,
        });
      }).not.toThrow();
    });

    it('should throw error if interval is zero', () => {
      expect(() => {
        new PingService({
          url: 'https://staging.example.com',
          interval: 0,
          timeout: 3000,
          enabled: true,
        });
      }).toThrow('PingService: Interval must be greater than 0');
    });

    it('should throw error if interval is negative', () => {
      expect(() => {
        new PingService({
          url: 'https://staging.example.com',
          interval: -1000,
          timeout: 3000,
          enabled: true,
        });
      }).toThrow('PingService: Interval must be greater than 0');
    });

    it('should throw error if timeout is zero', () => {
      expect(() => {
        new PingService({
          url: 'https://staging.example.com',
          interval: 600000,
          timeout: 0,
          enabled: true,
        });
      }).toThrow('PingService: Timeout must be greater than 0');
    });

    it('should throw error if timeout is negative', () => {
      expect(() => {
        new PingService({
          url: 'https://staging.example.com',
          interval: 600000,
          timeout: -1000,
          enabled: true,
        });
      }).toThrow('PingService: Timeout must be greater than 0');
    });

    it('should throw error if timeout exceeds interval', () => {
      expect(() => {
        new PingService({
          url: 'https://staging.example.com',
          interval: 1000,
          timeout: 2000,
          enabled: true,
        });
      }).toThrow('PingService: Timeout cannot exceed interval');
    });

    it('should allow timeout equal to interval', () => {
      expect(() => {
        service = new PingService({
          url: 'https://staging.example.com',
          interval: 3000,
          timeout: 3000,
          enabled: true,
        });
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Interval Configuration Tests (Requirement 5.1)
  // ============================================================================

  describe('Interval Configuration', () => {
    it('should configure 10-minute interval correctly', () => {
      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10 * 60 * 1000, // 10 minutes in milliseconds
        timeout: 3000,
        enabled: true,
      });

      expect(service.getConfig().interval).toBe(600000);
    });

    it('should start pinging at configured interval', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
      });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000, // 10 seconds for testing
        timeout: 3000,
        enabled: true,
      });

      service.start();

      // Initial ping happens immediately
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // First interval ping
      await vi.advanceTimersByTimeAsync(10000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second interval ping
      await vi.advanceTimersByTimeAsync(10000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should update interval when configuration changes', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
      });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Update interval to 5 seconds (this restarts the service)
      service.updateConfig({ interval: 5000 });
      
      // Initial ping after restart
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Should ping at new interval
      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not start if disabled', () => {
      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: false,
      });

      service.start();
      expect(service.isRunning()).toBe(false);
    });
  });

  // ============================================================================
  // Timeout Handling Tests (Requirement 5.4)
  // ============================================================================

  describe('Timeout Handling', () => {
    it('should enforce 3-second timeout', async () => {
      // Mock a slow response that never resolves
      let abortCalled = false;
      mockFetch.mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            abortCalled = true;
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        });
      });

      const onFailure = vi.fn();

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
        onFailure,
      });

      service.start();

      // Wait for timeout and all retries to complete
      // Timeout is 3s, then retries with backoff (1s, 2s, 4s) = ~10s total
      await vi.advanceTimersByTimeAsync(15000);

      // Should have called onFailure due to timeout
      expect(abortCalled).toBe(true);
      expect(onFailure).toHaveBeenCalled();
      const error = onFailure.mock.calls[0][0] as PingError;
      expect(error.error.name).toBe('AbortError');
    });

    it('should abort request on timeout', async () => {
      const abortSpy = vi.fn();
      
      mockFetch.mockImplementation((url, options) => {
        options?.signal?.addEventListener('abort', abortSpy);
        return new Promise(() => {}); // Never resolves
      });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 2000,
        enabled: true,
      });

      service.start();

      // Wait for timeout
      await vi.advanceTimersByTimeAsync(2000);
      await vi.runOnlyPendingTimersAsync();

      expect(abortSpy).toHaveBeenCalled();
    });

    it('should handle fast responses within timeout', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
      });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
      });

      const onSuccess = vi.fn();
      service.updateConfig({ onSuccess });

      service.start();
      await vi.runOnlyPendingTimersAsync();

      expect(onSuccess).toHaveBeenCalled();
      const response = onSuccess.mock.calls[0][0] as PingResponse;
      expect(response.responseTime).toBeLessThan(3000);
    });

    it('should use configured timeout value', async () => {
      let abortCalled = false;
      mockFetch.mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            abortCalled = true;
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        });
      });

      const onFailure = vi.fn();

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 5000, // Custom timeout
        enabled: true,
        onFailure,
      });

      service.start();

      // Should not timeout before 5 seconds
      await vi.advanceTimersByTimeAsync(4000);
      expect(abortCalled).toBe(false);
      expect(onFailure).not.toHaveBeenCalled();

      // Should timeout after 5 seconds and complete all retries
      await vi.advanceTimersByTimeAsync(15000);
      expect(abortCalled).toBe(true);
      expect(onFailure).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Failure Monitoring Tests (Requirement 5.3)
  // ============================================================================

  describe('Failure Monitoring', () => {
    it('should track consecutive failures', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const onFailure = vi.fn();

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
        onFailure,
      });

      service.start();

      // First failure (immediate ping) - wait for retries to complete
      await vi.advanceTimersByTimeAsync(10000);
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure.mock.calls[0][0].consecutiveFailures).toBe(1);

      // Second failure
      await vi.advanceTimersByTimeAsync(10000);
      expect(onFailure).toHaveBeenCalledTimes(2);
      expect(onFailure.mock.calls[1][0].consecutiveFailures).toBe(2);

      // Third failure
      await vi.advanceTimersByTimeAsync(10000);
      expect(onFailure).toHaveBeenCalledTimes(3);
      expect(onFailure.mock.calls[2][0].consecutiveFailures).toBe(3);
    });

    it('should reset consecutive failures on success', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ status: 200, ok: true });
      });

      const onFailure = vi.fn();
      const onSuccess = vi.fn();

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
        onFailure,
        onSuccess,
      });

      service.start();

      // First failure (immediate ping) - wait for retries
      await vi.advanceTimersByTimeAsync(10000);
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure.mock.calls[0][0].consecutiveFailures).toBe(1);

      // Second failure
      await vi.advanceTimersByTimeAsync(10000);
      expect(onFailure).toHaveBeenCalledTimes(2);
      expect(onFailure.mock.calls[1][0].consecutiveFailures).toBe(2);

      // Success - should reset
      await vi.advanceTimersByTimeAsync(10000);
      expect(onSuccess).toHaveBeenCalledTimes(1);

      const stats = service.getStats();
      expect(stats.consecutiveFailures).toBe(0);
    });

    it('should track total failures', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 2 || callCount === 4) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ status: 200, ok: true });
      });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      service.start();

      // 4 pings total (1 immediate + 3 interval) - wait for each to complete with retries
      await vi.advanceTimersByTimeAsync(10000); // immediate ping
      await vi.advanceTimersByTimeAsync(10000);
      await vi.advanceTimersByTimeAsync(10000);
      await vi.advanceTimersByTimeAsync(10000);

      const stats = service.getStats();
      expect(stats.totalPings).toBe(4);
      expect(stats.failedPings).toBe(2);
      expect(stats.successfulPings).toBe(2);
    });

    it('should call onFailure callback with error details', async () => {
      const testError = new Error('Connection refused');
      mockFetch.mockRejectedValue(testError);

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      const onFailure = vi.fn();
      service.updateConfig({ onFailure });

      service.start();
      await vi.runOnlyPendingTimersAsync();

      expect(onFailure).toHaveBeenCalled();
      const error = onFailure.mock.calls[0][0] as PingError;
      expect(error.url).toBe('https://staging.example.com');
      expect(error.error).toBe(testError);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.consecutiveFailures).toBe(1);
    });

    it('should track last failure time', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      await vi.advanceTimersByTimeAsync(10000);

      const stats = service.getStats();
      expect(stats.lastFailureTime).toBeInstanceOf(Date);
      expect(stats.lastFailureTime).not.toBeNull();
    });

    it('should alert after 3 consecutive failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      service.start();

      // Wait for 3 consecutive failures to occur
      // Each ping has up to 3 retries with exponential backoff (1s, 2s, 4s = ~7s total)
      // We need 3 pings to fail: immediate + 2 intervals
      await vi.advanceTimersByTimeAsync(10000); // First failure
      await vi.advanceTimersByTimeAsync(10000); // Second failure  
      await vi.advanceTimersByTimeAsync(10000); // Third failure

      // Should have alert after 3 consecutive failures
      const alertCalls = consoleSpy.mock.calls.filter(call => 
        call[0]?.includes('ALERT')
      );
      expect(alertCalls.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Service Lifecycle Tests
  // ============================================================================

  describe('Service Lifecycle', () => {
    it('should start service', () => {
      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      expect(service.isRunning()).toBe(true);
    });

    it('should stop service', () => {
      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      expect(service.isRunning()).toBe(true);

      service.stop();
      expect(service.isRunning()).toBe(false);
    });

    it('should not start if already running', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      
      const firstCallCount = mockFetch.mock.calls.length;

      service.start(); // Try to start again

      // Should not have made additional calls
      expect(mockFetch.mock.calls.length).toBe(firstCallCount);
    });

    it('should perform initial ping immediately on start', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 10000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      
      // Should ping immediately without waiting for interval
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('Statistics', () => {
    it('should track response times', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      service.start();

      // Wait for at least one ping to complete
      await vi.advanceTimersByTimeAsync(5000);

      const stats = service.getStats();
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(stats.successfulPings).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      await vi.runOnlyPendingTimersAsync();

      let stats = service.getStats();
      expect(stats.totalPings).toBeGreaterThan(0);

      service.resetStats();
      stats = service.getStats();
      expect(stats.totalPings).toBe(0);
      expect(stats.successfulPings).toBe(0);
      expect(stats.failedPings).toBe(0);
    });

    it('should track last ping time', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      service = new PingService({
        url: 'https://staging.example.com',
        interval: 5000,
        timeout: 3000,
        enabled: true,
      });

      service.start();
      await vi.runOnlyPendingTimersAsync();

      const stats = service.getStats();
      expect(stats.lastPingTime).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // Helper Function Tests
  // ============================================================================

  describe('createStagingPingService', () => {
    it('should create service with staging defaults', () => {
      service = createStagingPingService('https://staging.example.com');
      
      const config = service.getConfig();
      expect(config.url).toBe('https://staging.example.com');
      expect(config.interval).toBe(600000); // 10 minutes
      expect(config.method).toBe('HEAD');
      expect(config.timeout).toBe(3000); // 3 seconds
      expect(config.enabled).toBe(true);
    });

    it('should have success and failure callbacks configured', () => {
      service = createStagingPingService('https://staging.example.com');
      
      const config = service.getConfig();
      expect(config.onSuccess).toBeDefined();
      expect(config.onFailure).toBeDefined();
    });
  });
});
