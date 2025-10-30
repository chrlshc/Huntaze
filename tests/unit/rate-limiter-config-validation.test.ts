/**
 * Unit Tests - Rate Limiter Configuration Validation
 * Tests for Task 1.1: Configuration and Environment Variables
 * 
 * Coverage:
 * - Environment variable validation with Zod
 * - Configuration constants validation
 * - Startup validation logic
 * - Feature flag behavior
 * - Configuration status checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateRateLimiterConfig,
  isRateLimiterConfigured,
  getRateLimiterStatus,
  RATE_LIMITER_CONFIG,
  type RateLimiterEnv,
} from '../../lib/config/rate-limiter.config';

describe('Rate Limiter Configuration Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateRateLimiterConfig()', () => {
    it('should validate complete configuration', () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123/queue';
      process.env.RATE_LIMITER_ENABLED = 'true';

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
      expect(config.AWS_ACCESS_KEY_ID).toBe('test-key');
      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });

    it('should use default values for optional fields', () => {
      delete process.env.AWS_REGION;
      delete process.env.SQS_RATE_LIMITER_QUEUE;
      delete process.env.RATE_LIMITER_ENABLED;

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('huntaze-rate-limiter-queue');
      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });

    it('should transform RATE_LIMITER_ENABLED string to boolean', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';
      const config1 = validateRateLimiterConfig();
      expect(config1.RATE_LIMITER_ENABLED).toBe(true);

      process.env.RATE_LIMITER_ENABLED = 'false';
      const config2 = validateRateLimiterConfig();
      expect(config2.RATE_LIMITER_ENABLED).toBe(false);
    });

    it('should validate SQS queue URL format', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      expect(() => validateRateLimiterConfig()).toThrow();
    });

    it('should accept valid SQS queue URL', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue';

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toBe('https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue');
    });

    it('should handle missing optional AWS credentials', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const config = validateRateLimiterConfig();

      expect(config.AWS_ACCESS_KEY_ID).toBeUndefined();
      expect(config.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    });

    it('should validate OnlyFans API URL if provided', () => {
      process.env.ONLYFANS_API_URL = 'invalid-url';

      expect(() => validateRateLimiterConfig()).toThrow();
    });

    it('should accept valid OnlyFans API URL', () => {
      process.env.ONLYFANS_API_URL = 'https://onlyfans.com/api2/v2';

      const config = validateRateLimiterConfig();

      expect(config.ONLYFANS_API_URL).toBe('https://onlyfans.com/api2/v2');
    });
  });

  describe('isRateLimiterConfigured()', () => {
    it('should return true when configuration is valid', () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123/queue';

      const isConfigured = isRateLimiterConfigured();

      expect(isConfigured).toBe(true);
    });

    it('should return false when configuration is invalid', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      const isConfigured = isRateLimiterConfigured();

      expect(isConfigured).toBe(false);
    });

    it('should return true with default values', () => {
      delete process.env.SQS_RATE_LIMITER_QUEUE;
      delete process.env.AWS_REGION;

      const isConfigured = isRateLimiterConfigured();

      expect(isConfigured).toBe(true);
    });
  });

  describe('getRateLimiterStatus()', () => {
    it('should return complete status when configured and enabled', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';
      process.env.AWS_REGION = 'us-east-1';

      const status = getRateLimiterStatus();

      expect(status.configured).toBe(true);
      expect(status.enabled).toBe(true);
      expect(status.active).toBe(true);
      expect(status.queueUrl).toBeDefined();
      expect(status.region).toBe('us-east-1');
    });

    it('should return inactive when disabled', () => {
      process.env.RATE_LIMITER_ENABLED = 'false';

      const status = getRateLimiterStatus();

      expect(status.enabled).toBe(false);
      expect(status.active).toBe(false);
    });

    it('should return inactive when not configured', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      const status = getRateLimiterStatus();

      expect(status.configured).toBe(false);
      expect(status.active).toBe(false);
    });

    it('should include feature flags status', () => {
      const status = getRateLimiterStatus();

      expect(status.features).toBeDefined();
      expect(status.features.circuitBreaker).toBeDefined();
      expect(status.features.fallbackToDb).toBeDefined();
      expect(status.features.metrics).toBeDefined();
    });

    it('should return correct queue URL', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123/custom-queue';

      const status = getRateLimiterStatus();

      expect(status.queueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123/custom-queue');
    });
  });

  describe('RATE_LIMITER_CONFIG constants', () => {
    it('should have valid queue configuration', () => {
      expect(RATE_LIMITER_CONFIG.QUEUE.BATCH_SIZE).toBe(10);
      expect(RATE_LIMITER_CONFIG.QUEUE.VISIBILITY_TIMEOUT).toBe(90);
      expect(RATE_LIMITER_CONFIG.QUEUE.MESSAGE_RETENTION).toBe(345600);
      expect(RATE_LIMITER_CONFIG.QUEUE.URL).toBeDefined();
    });

    it('should have valid retry configuration', () => {
      expect(RATE_LIMITER_CONFIG.RETRY.MAX_ATTEMPTS).toBe(3);
      expect(RATE_LIMITER_CONFIG.RETRY.BASE_DELAY_MS).toBe(1000);
      expect(RATE_LIMITER_CONFIG.RETRY.MAX_DELAY_MS).toBe(30000);
      expect(RATE_LIMITER_CONFIG.RETRY.BACKOFF_MULTIPLIER).toBe(2);
      expect(RATE_LIMITER_CONFIG.RETRY.JITTER_FACTOR).toBe(0.1);
    });

    it('should have valid circuit breaker configuration', () => {
      expect(RATE_LIMITER_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD).toBe(5);
      expect(RATE_LIMITER_CONFIG.CIRCUIT_BREAKER.SUCCESS_THRESHOLD).toBe(2);
      expect(RATE_LIMITER_CONFIG.CIRCUIT_BREAKER.TIMEOUT_MS).toBe(60000);
      expect(RATE_LIMITER_CONFIG.CIRCUIT_BREAKER.HALF_OPEN_MAX_CALLS).toBe(3);
    });

    it('should have valid rate limit configuration', () => {
      expect(RATE_LIMITER_CONFIG.RATE_LIMIT.TOKENS_PER_WINDOW).toBe(10);
      expect(RATE_LIMITER_CONFIG.RATE_LIMIT.WINDOW_SECONDS).toBe(60);
      expect(RATE_LIMITER_CONFIG.RATE_LIMIT.BUCKET_CAPACITY).toBe(10);
    });

    it('should have valid timeout configuration', () => {
      expect(RATE_LIMITER_CONFIG.TIMEOUTS.SQS_SEND_MS).toBe(5000);
      expect(RATE_LIMITER_CONFIG.TIMEOUTS.API_CALL_MS).toBe(30000);
      expect(RATE_LIMITER_CONFIG.TIMEOUTS.HEALTH_CHECK_MS).toBe(3000);
    });

    it('should have valid monitoring configuration', () => {
      expect(RATE_LIMITER_CONFIG.MONITORING.CLOUDWATCH_NAMESPACE).toBe('Huntaze/OnlyFans');
      expect(RATE_LIMITER_CONFIG.MONITORING.METRICS_ENABLED).toBe(true);
      expect(RATE_LIMITER_CONFIG.MONITORING.LOG_LEVEL).toBeDefined();
    });

    it('should have valid feature flags', () => {
      expect(RATE_LIMITER_CONFIG.FEATURES.FALLBACK_TO_DB).toBe(true);
      expect(RATE_LIMITER_CONFIG.FEATURES.CIRCUIT_BREAKER_ENABLED).toBe(true);
      expect(RATE_LIMITER_CONFIG.FEATURES.METRICS_ENABLED).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string for RATE_LIMITER_ENABLED', () => {
      process.env.RATE_LIMITER_ENABLED = '';

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(false);
    });

    it('should handle whitespace in environment variables', () => {
      process.env.AWS_REGION = '  us-east-1  ';

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('  us-east-1  ');
    });

    it('should handle very long queue URLs', () => {
      const longUrl = 'https://sqs.us-east-1.amazonaws.com/' + '1'.repeat(1000) + '/queue';
      process.env.SQS_RATE_LIMITER_QUEUE = longUrl;

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toBe(longUrl);
    });

    it('should handle case-sensitive RATE_LIMITER_ENABLED', () => {
      process.env.RATE_LIMITER_ENABLED = 'TRUE';

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(false);
    });

    it('should handle numeric values for RATE_LIMITER_ENABLED', () => {
      process.env.RATE_LIMITER_ENABLED = '1';

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(false);
    });
  });

  describe('Regression Tests', () => {
    it('should maintain backward compatibility with default queue URL', () => {
      delete process.env.SQS_RATE_LIMITER_QUEUE;

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('317805897534');
      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('huntaze-rate-limiter-queue');
    });

    it('should maintain default region as us-east-1', () => {
      delete process.env.AWS_REGION;

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
    });

    it('should maintain default enabled state as true', () => {
      delete process.env.RATE_LIMITER_ENABLED;

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });
  });
});
