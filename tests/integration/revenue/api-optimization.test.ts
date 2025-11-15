/**
 * Revenue API Optimization Tests
 * 
 * Tests pour valider les optimisations d'intégration API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { revenueAPIMonitor } from '@/lib/services/revenue/api-monitoring';
import {
  validatePricingRequest,
  validateReEngageRequest,
  validateUpsellRequest,
  validateCreatorId,
  sanitizeInput,
  ValidationError,
} from '@/lib/services/revenue/api-validator';

describe('Revenue API Optimization - Validation', () => {
  describe('validatePricingRequest', () => {
    it('should accept valid pricing request', () => {
      expect(() => {
        validatePricingRequest({
          creatorId: 'creator_123',
          priceType: 'subscription',
          newPrice: 12.99,
        });
      }).not.toThrow();
    });

    it('should reject negative price', () => {
      expect(() => {
        validatePricingRequest({
          creatorId: 'creator_123',
          priceType: 'subscription',
          newPrice: -5,
        });
      }).toThrow(ValidationError);
    });

    it('should reject price over 999.99', () => {
      expect(() => {
        validatePricingRequest({
          creatorId: 'creator_123',
          priceType: 'subscription',
          newPrice: 1000,
        });
      }).toThrow(ValidationError);
    });

    it('should require contentId for PPV', () => {
      expect(() => {
        validatePricingRequest({
          creatorId: 'creator_123',
          priceType: 'ppv',
          newPrice: 9.99,
        });
      }).toThrow(ValidationError);
    });
  });

  describe('validateReEngageRequest', () => {
    it('should accept valid re-engage request', () => {
      expect(() => {
        validateReEngageRequest({
          creatorId: 'creator_123',
          fanId: 'fan_456',
        });
      }).not.toThrow();
    });

    it('should reject empty creatorId', () => {
      expect(() => {
        validateReEngageRequest({
          creatorId: '',
          fanId: 'fan_456',
        });
      }).toThrow(ValidationError);
    });

    it('should reject message over 1000 chars', () => {
      expect(() => {
        validateReEngageRequest({
          creatorId: 'creator_123',
          fanId: 'fan_456',
          messageTemplate: 'a'.repeat(1001),
        });
      }).toThrow(ValidationError);
    });
  });

  describe('validateUpsellRequest', () => {
    it('should accept valid upsell request', () => {
      expect(() => {
        validateUpsellRequest({
          creatorId: 'creator_123',
          opportunityId: 'opp_789',
        });
      }).not.toThrow();
    });

    it('should reject empty opportunityId', () => {
      expect(() => {
        validateUpsellRequest({
          creatorId: 'creator_123',
          opportunityId: '',
        });
      }).toThrow(ValidationError);
    });
  });

  describe('validateCreatorId', () => {
    it('should accept valid creator ID', () => {
      expect(validateCreatorId('creator_123abc')).toBe(true);
    });

    it('should reject short ID', () => {
      expect(validateCreatorId('short')).toBe(false);
    });

    it('should reject ID with special chars', () => {
      expect(validateCreatorId('creator@123')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>Hello');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('should limit length to 1000 chars', () => {
      const longString = 'a'.repeat(1500);
      const result = sanitizeInput(longString);
      expect(result.length).toBe(1000);
    });
  });
});

describe('Revenue API Optimization - Monitoring', () => {
  beforeEach(() => {
    revenueAPIMonitor.clear();
  });

  describe('revenueAPIMonitor', () => {
    it('should initialize with empty metrics', () => {
      const summary = revenueAPIMonitor.getSummary();
      expect(summary.totalCalls).toBe(0);
    });

    it('should log API call metrics', () => {
      revenueAPIMonitor.logAPICall({
        endpoint: '/pricing',
        method: 'GET',
        duration: 234,
        status: 200,
        success: true,
        correlationId: 'test-123',
        timestamp: new Date().toISOString(),
      });

      const summary = revenueAPIMonitor.getSummary();
      expect(summary.totalCalls).toBe(1);
      expect(summary.successRate).toBe(100);
    });

    it('should track failed requests', () => {
      revenueAPIMonitor.logAPICall({
        endpoint: '/pricing',
        method: 'GET',
        duration: 500,
        status: 500,
        success: false,
        correlationId: 'test-456',
        timestamp: new Date().toISOString(),
        error: 'Server error',
      });

      const failures = revenueAPIMonitor.getFailedRequests();
      expect(failures.length).toBe(1);
      expect(failures[0].success).toBe(false);
      expect(failures[0].error).toBe('Server error');
    });

    it('should track slow queries', () => {
      revenueAPIMonitor.logAPICall({
        endpoint: '/forecast',
        method: 'GET',
        duration: 2500,
        status: 200,
        success: true,
        correlationId: 'test-789',
        timestamp: new Date().toISOString(),
      });

      const slowQueries = revenueAPIMonitor.getSlowQueries();
      expect(slowQueries.length).toBe(1);
      expect(slowQueries[0].duration).toBeGreaterThan(2000);
    });

    it('should calculate average duration', () => {
      revenueAPIMonitor.logAPICall({
        endpoint: '/pricing',
        method: 'GET',
        duration: 100,
        status: 200,
        success: true,
        correlationId: 'test-1',
        timestamp: new Date().toISOString(),
      });

      revenueAPIMonitor.logAPICall({
        endpoint: '/pricing',
        method: 'GET',
        duration: 200,
        status: 200,
        success: true,
        correlationId: 'test-2',
        timestamp: new Date().toISOString(),
      });

      const summary = revenueAPIMonitor.getSummary();
      expect(summary.averageDuration).toBe(150);
    });

    it('should calculate success rate', () => {
      // 3 successful
      for (let i = 0; i < 3; i++) {
        revenueAPIMonitor.logAPICall({
          endpoint: '/pricing',
          method: 'GET',
          duration: 100,
          status: 200,
          success: true,
          correlationId: `test-${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      // 1 failed
      revenueAPIMonitor.logAPICall({
        endpoint: '/pricing',
        method: 'GET',
        duration: 100,
        status: 500,
        success: false,
        correlationId: 'test-fail',
        timestamp: new Date().toISOString(),
      });

      const summary = revenueAPIMonitor.getSummary();
      expect(summary.totalCalls).toBe(4);
      expect(summary.successRate).toBe(75);
      expect(summary.errorRate).toBe(25);
    });

    it('should limit metrics to 1000 entries', () => {
      // Add 1100 metrics
      for (let i = 0; i < 1100; i++) {
        revenueAPIMonitor.logAPICall({
          endpoint: '/pricing',
          method: 'GET',
          duration: 100,
          status: 200,
          success: true,
          correlationId: `test-${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      const summary = revenueAPIMonitor.getSummary();
      expect(summary.totalCalls).toBe(1000); // Should be capped at 1000
    });
  });
});

describe('Revenue API Optimization - Integration', () => {
  it('should have all validation functions exported', () => {
    expect(validatePricingRequest).toBeDefined();
    expect(validateReEngageRequest).toBeDefined();
    expect(validateUpsellRequest).toBeDefined();
    expect(validateCreatorId).toBeDefined();
    expect(sanitizeInput).toBeDefined();
  });

  it('should have monitoring functions exported', () => {
    expect(revenueAPIMonitor.logAPICall).toBeDefined();
    expect(revenueAPIMonitor.getSummary).toBeDefined();
    expect(revenueAPIMonitor.getSlowQueries).toBeDefined();
    expect(revenueAPIMonitor.getFailedRequests).toBeDefined();
    expect(revenueAPIMonitor.clear).toBeDefined();
  });

  it('ValidationError should have correct properties', () => {
    const error = new ValidationError('Test error', 'testField');
    expect(error.message).toBe('Test error');
    expect(error.field).toBe('testField');
    expect(error.name).toBe('ValidationError');
  });
});
