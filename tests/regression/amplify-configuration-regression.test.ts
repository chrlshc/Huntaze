/**
 * Regression Tests - Amplify Configuration
 * Tests for Task 1.1: Prevent regressions in Amplify environment variable configuration
 * 
 * Coverage:
 * - Configuration structure stability
 * - Default values consistency
 * - Backward compatibility
 * - Environment variable naming
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateRateLimiterConfig,
  getRateLimiterStatus,
  RATE_LIMITER_CONFIG,
} from '../../lib/config/rate-limiter.config';

describe('Amplify Configuration Regression Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration Structure Stability', () => {
    it('should maintain RATE_LIMITER_CONFIG structure', () => {
      expect(RATE_LIMITER_CONFIG).toHaveProperty('QUEUE');
      expect(RATE_LIMITER_CONFIG).toHaveProperty('RETRY');
      expect(RATE_LIMITER_CONFIG).toHaveProperty('CIRCUIT_BREAKER');
      expect(RATE_LIMITER_CONFIG).toHaveProperty('RATE_LIMIT');
      expect(RATE_LIMITER_CONFIG).toHaveProperty('TIMEOUTS');
      expect(RATE_LIMITER_CONFIG).toHaveProperty('MONITORING');
      expect(RATE_LIMITER_CONFIG).toHaveProperty('FEATURES');
    });

    it('should maintain QUEUE configuration properties', () => {
      expect(RATE_LIMITER_CONFIG.QUEUE).toHaveProperty('URL');
      expect(RATE_LIMITER_CONFIG.QUEUE).toHaveProperty('BATCH_SIZE');
      expect(RATE_LIMITER_CONFIG.QUEUE).toHaveProperty('VISIBILITY_TIMEOUT');
      expect(RATE_LIMITER_CONFIG.QUEUE).toHaveProperty('MESSAGE_RETENTION');
    });

    it('should maintain RETRY configuration properties', () => {
      expect(RATE_LIMITER_CONFIG.RETRY).toHaveProperty('MAX_ATTEMPTS');
      expect(RATE_LIMITER_CONFIG.RETRY).toHaveProperty('BASE_DELAY_MS');
      expect(RATE_LIMITER_CONFIG.RETRY).toHaveProperty('MAX_DELAY_MS');
      expect(RATE_LIMITER_CONFIG.RETRY).toHaveProperty('BACKOFF_MULTIPLIER');
      expect(RATE_LIMITER_CONFIG.RETRY).toHaveProperty('JITTER_FACTOR');
    });

    it('should maintain FEATURES configuration properties', () => {
      expect(RATE_LIMITER_CONFIG.FEATURES).toHaveProperty('ENABLED');
      expect(RATE_LIMITER_CONFIG.FEATURES).toHaveProperty('FALLBACK_TO_DB');
      expect(RATE_LIMITER_CONFIG.FEATURES).toHaveProperty('CIRCUIT_BREAKER_ENABLED');
      expect(RATE_LIMITER_CONFIG.FEATURES).toHaveProperty('METRICS_ENABLED');
    });
  });

  describe('Default Values Consistency', () => {
    it('should maintain default AWS region as us-east-1', () => {
      delete process.env.AWS_REGION;

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
    });

    it('should maintain default queue URL', () => {
      delete process.env.SQS_RATE_LIMITER_QUEUE;

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('317805897534');
      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('huntaze-rate-limiter-queue');
    });

    it('should maintain default RATE_LIMITER_ENABLED as true', () => {
      delete process.env.RATE_LIMITER_ENABLED;

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });

    it('should maintain batch size of 10', () => {
      expect(RATE_LIMITER_CONFIG.QUEUE.BATCH_SIZE).toBe(10);
    });

    it('should maintain max retry attempts of 3', () => {
      expect(RATE_LIMITER_CONFIG.RETRY.MAX_ATTEMPTS).toBe(3);
    });

    it('should maintain rate limit of 10 messages per minute', () => {
      expect(RATE_LIMITER_CONFIG.RATE_LIMIT.TOKENS_PER_WINDOW).toBe(10);
      expect(RATE_LIMITER_CONFIG.RATE_LIMIT.WINDOW_SECONDS).toBe(60);
    });
  });

  describe('Environment Variable Naming', () => {
    it('should maintain SQS_RATE_LIMITER_QUEUE variable name', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123/queue';

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toBeDefined();
    });

    it('should maintain RATE_LIMITER_ENABLED variable name', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBeDefined();
    });

    it('should maintain AWS_REGION variable name', () => {
      process.env.AWS_REGION = 'us-west-2';

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-west-2');
    });

    it('should maintain AWS_ACCESS_KEY_ID variable name', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';

      const config = validateRateLimiterConfig();

      expect(config.AWS_ACCESS_KEY_ID).toBe('test-key');
    });

    it('should maintain AWS_SECRET_ACCESS_KEY variable name', () => {
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

      const config = validateRateLimiterConfig();

      expect(config.AWS_SECRET_ACCESS_KEY).toBe('test-secret');
    });
  });

  describe('Backward Compatibility', () => {
    it('should support legacy configuration without breaking', () => {
      // Simulate old configuration
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue';

      expect(() => validateRateLimiterConfig()).not.toThrow();
    });

    it('should maintain validateRateLimiterConfig function signature', () => {
      expect(typeof validateRateLimiterConfig).toBe('function');
      expect(validateRateLimiterConfig.length).toBe(0);
    });

    it('should maintain getRateLimiterStatus function signature', () => {
      expect(typeof getRateLimiterStatus).toBe('function');
      expect(getRateLimiterStatus.length).toBe(0);
    });

    it('should maintain RATE_LIMITER_CONFIG as constant object', () => {
      expect(typeof RATE_LIMITER_CONFIG).toBe('object');
      expect(Object.isFrozen(RATE_LIMITER_CONFIG)).toBe(false); // Not frozen but const
    });
  });

  describe('Configuration Values Stability', () => {
    it('should maintain visibility timeout of 90 seconds', () => {
      expect(RATE_LIMITER_CONFIG.QUEUE.VISIBILITY_TIMEOUT).toBe(90);
    });

    it('should maintain message retention of 4 days', () => {
      expect(RATE_LIMITER_CONFIG.QUEUE.MESSAGE_RETENTION).toBe(345600);
    });

    it('should maintain base delay of 1 second', () => {
      expect(RATE_LIMITER_CONFIG.RETRY.BASE_DELAY_MS).toBe(1000);
    });

    it('should maintain max delay of 30 seconds', () => {
      expect(RATE_LIMITER_CONFIG.RETRY.MAX_DELAY_MS).toBe(30000);
    });

    it('should maintain backoff multiplier of 2', () => {
      expect(RATE_LIMITER_CONFIG.RETRY.BACKOFF_MULTIPLIER).toBe(2);
    });

    it('should maintain circuit breaker failure threshold of 5', () => {
      expect(RATE_LIMITER_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD).toBe(5);
    });

    it('should maintain circuit breaker timeout of 60 seconds', () => {
      expect(RATE_LIMITER_CONFIG.CIRCUIT_BREAKER.TIMEOUT_MS).toBe(60000);
    });

    it('should maintain CloudWatch namespace', () => {
      expect(RATE_LIMITER_CONFIG.MONITORING.CLOUDWATCH_NAMESPACE).toBe('Huntaze/OnlyFans');
    });
  });

  describe('Feature Flag Behavior', () => {
    it('should maintain feature flag enabled by default', () => {
      delete process.env.RATE_LIMITER_ENABLED;

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });

    it('should maintain fallback to DB feature enabled', () => {
      expect(RATE_LIMITER_CONFIG.FEATURES.FALLBACK_TO_DB).toBe(true);
    });

    it('should maintain circuit breaker feature enabled', () => {
      expect(RATE_LIMITER_CONFIG.FEATURES.CIRCUIT_BREAKER_ENABLED).toBe(true);
    });

    it('should maintain metrics feature enabled', () => {
      expect(RATE_LIMITER_CONFIG.FEATURES.METRICS_ENABLED).toBe(true);
    });
  });

  describe('Status Response Structure', () => {
    it('should maintain status response structure', () => {
      const status = getRateLimiterStatus();

      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('active');
      expect(status).toHaveProperty('queueUrl');
      expect(status).toHaveProperty('region');
      expect(status).toHaveProperty('features');
    });

    it('should maintain features object structure in status', () => {
      const status = getRateLimiterStatus();

      expect(status.features).toHaveProperty('circuitBreaker');
      expect(status.features).toHaveProperty('fallbackToDb');
      expect(status.features).toHaveProperty('metrics');
    });

    it('should maintain boolean types for status flags', () => {
      const status = getRateLimiterStatus();

      expect(typeof status.configured).toBe('boolean');
      expect(typeof status.enabled).toBe('boolean');
      expect(typeof status.active).toBe('boolean');
    });
  });

  describe('Error Handling Consistency', () => {
    it('should throw consistent error format for invalid queue URL', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      expect(() => validateRateLimiterConfig()).toThrow(/validation failed/);
    });

    it('should not throw for missing optional credentials', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      expect(() => validateRateLimiterConfig()).not.toThrow();
    });

    it('should maintain graceful degradation behavior', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      const status = getRateLimiterStatus();

      expect(status.configured).toBe(false);
      expect(status.active).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain RATE_LIMITER_ENABLED as boolean after transformation', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';

      const config = validateRateLimiterConfig();

      expect(typeof config.RATE_LIMITER_ENABLED).toBe('boolean');
    });

    it('should maintain string types for URLs', () => {
      const config = validateRateLimiterConfig();

      expect(typeof config.SQS_RATE_LIMITER_QUEUE).toBe('string');
      expect(typeof config.AWS_REGION).toBe('string');
    });

    it('should maintain optional types for credentials', () => {
      delete process.env.AWS_ACCESS_KEY_ID;

      const config = validateRateLimiterConfig();

      expect(config.AWS_ACCESS_KEY_ID).toBeUndefined();
    });
  });
});
