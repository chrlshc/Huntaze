/**
 * Unit Tests - Onboarding Analytics Optimizations
 * 
 * Tests for the optimized analytics service including:
 * - Debouncing functionality
 * - Consent caching
 * - Batch tracking with detailed responses
 * - Timeout handling
 * - Retryable error detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  trackOnboardingEvent,
  trackOnboardingEvents,
  checkAnalyticsConsent,
  clearConsentCache,
  createAPIResponse,
  generateCorrelationId,
  type OnboardingEvent,
  type TrackingResult,
  type BatchTrackingResponse,
  type AnalyticsAPIResponse
} from '@/lib/services/onboarding-analytics';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn()
  }))
}));

vi.mock('@/lib/db/repositories/onboarding-events', () => ({
  OnboardingEventsRepository: vi.fn(() => ({
    trackEvent: vi.fn()
  }))
}));

describe('Onboarding Analytics Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearConsentCache(); // Clear cache before each test
  });

  afterEach(() => {
    clearConsentCache(); // Clean up after each test
  });

  describe('Debouncing', () => {
    it('should debounce duplicate events within 1 second', async () => {
      const userId = 'test-user-123';
      const event: OnboardingEvent = {
        type: 'onboarding.step_completed',
        stepId: 'payments',
        durationMs: 1000
      };

      // First call should succeed
      const result1 = await trackOnboardingEvent(userId, event);
      expect(result1.success).toBe(true);
      expect(result1.debounced).toBeUndefined();

      // Second call within 1s should be debounced
      const result2 = await trackOnboardingEvent(userId, event);
      expect(result2.success).toBe(true);
      expect(result2.debounced).toBe(true);
      expect(result2.skippedReason).toBe('debounced');
    });

    it('should allow event after debounce period', async () => {
      const userId = 'test-user-123';
      const event: OnboardingEvent = {
        type: 'onboarding.step_completed',
        stepId: 'payments',
        durationMs: 1000
      };

      // First call
      await trackOnboardingEvent(userId, event);

      // Wait for debounce period to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call after 1s should succeed
      const result = await trackOnboardingEvent(userId, event);
      expect(result.success).toBe(true);
      expect(result.debounced).toBeUndefined();
    });

    it('should not debounce different event types', async () => {
      const userId = 'test-user-123';
      
      const event1: OnboardingEvent = {
        type: 'onboarding.step_started',
        stepId: 'payments',
        version: 1,
        entrypoint: 'dashboard'
      };
      
      const event2: OnboardingEvent = {
        type: 'onboarding.step_completed',
        stepId: 'payments',
        durationMs: 1000
      };

      const result1 = await trackOnboardingEvent(userId, event1);
      const result2 = await trackOnboardingEvent(userId, event2);

      expect(result1.success).toBe(true);
      expect(result1.debounced).toBeUndefined();
      expect(result2.success).toBe(true);
      expect(result2.debounced).toBeUndefined();
    });

    it('should not debounce different step IDs', async () => {
      const userId = 'test-user-123';
      
      const event1: OnboardingEvent = {
        type: 'onboarding.step_completed',
        stepId: 'payments',
        durationMs: 1000
      };
      
      const event2: OnboardingEvent = {
        type: 'onboarding.step_completed',
        stepId: 'theme',
        durationMs: 2000
      };

      const result1 = await trackOnboardingEvent(userId, event1);
      const result2 = await trackOnboardingEvent(userId, event2);

      expect(result1.success).toBe(true);
      expect(result1.debounced).toBeUndefined();
      expect(result2.success).toBe(true);
      expect(result2.debounced).toBeUndefined();
    });
  });

  describe('Consent Caching', () => {
    it('should cache consent check results', async () => {
      const userId = 'test-user-123';
      const { getPool } = await import('@/lib/db');
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ granted: true }]
      });
      
      (getPool as any).mockReturnValue({ query: mockQuery });

      // First call - should hit database
      const consent1 = await checkAnalyticsConsent(userId);
      expect(consent1).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const consent2 = await checkAnalyticsConsent(userId);
      expect(consent2).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should invalidate cache for specific user', async () => {
      const userId = 'test-user-123';
      const { getPool } = await import('@/lib/db');
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ granted: true }]
      });
      
      (getPool as any).mockReturnValue({ query: mockQuery });

      // First call
      await checkAnalyticsConsent(userId);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Clear cache for this user
      clearConsentCache(userId);

      // Second call - should hit database again
      await checkAnalyticsConsent(userId);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should invalidate all cache', async () => {
      const userId1 = 'test-user-1';
      const userId2 = 'test-user-2';
      const { getPool } = await import('@/lib/db');
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ granted: true }]
      });
      
      (getPool as any).mockReturnValue({ query: mockQuery });

      // Cache for both users
      await checkAnalyticsConsent(userId1);
      await checkAnalyticsConsent(userId2);
      expect(mockQuery).toHaveBeenCalledTimes(2);

      // Clear all cache
      clearConsentCache();

      // Both should hit database again
      await checkAnalyticsConsent(userId1);
      await checkAnalyticsConsent(userId2);
      expect(mockQuery).toHaveBeenCalledTimes(4);
    });

    it('should expire cache after TTL', async () => {
      const userId = 'test-user-123';
      const { getPool } = await import('@/lib/db');
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ granted: true }]
      });
      
      (getPool as any).mockReturnValue({ query: mockQuery });

      // First call
      await checkAnalyticsConsent(userId);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Mock time passing (5 minutes + 1ms)
      vi.useFakeTimers();
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Second call - cache should be expired
      await checkAnalyticsConsent(userId);
      expect(mockQuery).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('Batch Tracking', () => {
    it('should return detailed batch response', async () => {
      const userId = 'test-user-123';
      const events: OnboardingEvent[] = [
        { type: 'onboarding.step_started', stepId: 'payments', version: 1, entrypoint: 'dashboard' },
        { type: 'onboarding.viewed', page: '/onboarding', userRole: 'owner' },
        { type: 'onboarding.step_completed', stepId: 'theme', durationMs: 3000 }
      ];

      const response = await trackOnboardingEvents(userId, events);

      expect(response).toMatchObject({
        totalEvents: 3,
        successCount: expect.any(Number),
        failureCount: expect.any(Number),
        results: expect.any(Array),
        correlationId: expect.any(String)
      });

      expect(response.results).toHaveLength(3);
      expect(response.successCount + response.failureCount).toBe(3);
    });

    it('should handle partial failures in batch', async () => {
      const userId = 'test-user-123';
      const events: OnboardingEvent[] = [
        { type: 'onboarding.step_completed', stepId: 'valid', durationMs: 1000 },
        { type: 'invalid_type' as any, stepId: 'test' }, // Invalid event type
        { type: 'onboarding.viewed', page: '/test', userRole: 'owner' }
      ];

      const response = await trackOnboardingEvents(userId, events);

      expect(response.totalEvents).toBe(3);
      expect(response.failureCount).toBeGreaterThan(0);
      expect(response.successCount).toBeGreaterThan(0);
      
      // Check that failed events have error messages
      const failedResults = response.results.filter(r => !r.success);
      failedResults.forEach(result => {
        expect(result.error).toBeDefined();
        expect(result.correlationId).toBeDefined();
      });
    });

    it('should assign unique correlation IDs to batch events', async () => {
      const userId = 'test-user-123';
      const events: OnboardingEvent[] = [
        { type: 'onboarding.viewed', page: '/page1', userRole: 'owner' },
        { type: 'onboarding.viewed', page: '/page2', userRole: 'owner' }
      ];

      const response = await trackOnboardingEvents(userId, events);

      const correlationIds = response.results.map(r => r.correlationId);
      const uniqueIds = new Set(correlationIds);
      
      expect(uniqueIds.size).toBe(correlationIds.length);
      
      // All should start with batch correlation ID
      correlationIds.forEach(id => {
        expect(id).toContain(response.correlationId);
      });
    });
  });

  describe('API Response Helper', () => {
    it('should create success response', () => {
      const data = { userId: '123', eventId: 'abc' };
      const correlationId = generateCorrelationId();

      const response = createAPIResponse(true, data, null, correlationId);

      expect(response).toMatchObject({
        success: true,
        data,
        correlationId,
        timestamp: expect.any(String)
      });
      expect(response.error).toBeUndefined();
    });

    it('should create error response', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        details: { field: 'userId' }
      };
      const correlationId = generateCorrelationId();

      const response = createAPIResponse(false, null, error, correlationId);

      expect(response).toMatchObject({
        success: false,
        error,
        correlationId,
        timestamp: expect.any(String)
      });
      expect(response.data).toBeUndefined();
    });

    it('should include ISO timestamp', () => {
      const correlationId = generateCorrelationId();
      const response = createAPIResponse(true, {}, null, correlationId);

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      const timestamp = new Date(response.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('Correlation IDs', () => {
    it('should generate valid UUID v4', () => {
      const id = generateCorrelationId();
      
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateCorrelationId());
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(100);
    });

    it('should include correlation ID in tracking results', async () => {
      const userId = 'test-user-123';
      const event: OnboardingEvent = {
        type: 'onboarding.viewed',
        page: '/test',
        userRole: 'owner'
      };

      const result = await trackOnboardingEvent(userId, event);

      expect(result.correlationId).toBeDefined();
      expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('should preserve provided correlation ID', async () => {
      const userId = 'test-user-123';
      const providedId = 'custom-correlation-id';
      const event: OnboardingEvent = {
        type: 'onboarding.viewed',
        page: '/test',
        userRole: 'owner'
      };

      const result = await trackOnboardingEvent(
        userId,
        event,
        { correlationId: providedId }
      );

      expect(result.correlationId).toBe(providedId);
    });
  });

  describe('Error Handling', () => {
    it('should return failure result on error', async () => {
      const userId = 'test-user-123';
      const event: OnboardingEvent = {
        type: 'invalid_type' as any,
        stepId: 'test'
      };

      const result = await trackOnboardingEvent(userId, event);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.correlationId).toBeDefined();
    });

    it('should not throw on tracking failure', async () => {
      const userId = 'test-user-123';
      const event: OnboardingEvent = {
        type: 'invalid_type' as any,
        stepId: 'test'
      };

      // Should not throw
      await expect(
        trackOnboardingEvent(userId, event)
      ).resolves.toBeDefined();
    });

    it('should validate user ID', async () => {
      const event: OnboardingEvent = {
        type: 'onboarding.viewed',
        page: '/test',
        userRole: 'owner'
      };

      const result = await trackOnboardingEvent('', event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid userId');
    });
  });

  describe('Performance', () => {
    it('should track events in parallel for batch', async () => {
      const userId = 'test-user-123';
      const events: OnboardingEvent[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'onboarding.viewed',
        page: `/page-${i}`,
        userRole: 'owner'
      }));

      const start = Date.now();
      await trackOnboardingEvents(userId, events);
      const duration = Date.now() - start;

      // Parallel execution should be faster than sequential
      // 10 events * 100ms each = 1000ms sequential
      // Parallel should be < 500ms
      expect(duration).toBeLessThan(500);
    });

    it('should use cached consent for multiple events', async () => {
      const userId = 'test-user-123';
      const { getPool } = await import('@/lib/db');
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ granted: true }]
      });
      
      (getPool as any).mockReturnValue({ query: mockQuery });

      const events: OnboardingEvent[] = Array.from({ length: 5 }, (_, i) => ({
        type: 'onboarding.viewed',
        page: `/page-${i}`,
        userRole: 'owner'
      }));

      await trackOnboardingEvents(userId, events);

      // Should only check consent once (cached for subsequent events)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});
