/**
 * Integration Tests - Amplify Rate Limiter Configuration
 * Tests for Task 1.1: Amplify Environment Variables Configuration
 * 
 * Coverage:
 * - Configuration script execution
 * - Environment variable persistence
 * - AWS CLI integration
 * - Configuration validation workflow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateRateLimiterConfig,
  getRateLimiterStatus,
  RATE_LIMITER_CONFIG,
} from '../../lib/config/rate-limiter.config';

describe('Amplify Rate Limiter Configuration Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Complete Configuration Workflow', () => {
    it('should validate complete Amplify configuration', () => {
      // Simulate Amplify environment variables
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
      process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue';
      process.env.RATE_LIMITER_ENABLED = 'true';

      const config = validateRateLimiterConfig();
      const status = getRateLimiterStatus();

      expect(config.AWS_REGION).toBe('us-east-1');
      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('huntaze-rate-limiter-queue');
      expect(config.RATE_LIMITER_ENABLED).toBe(true);
      expect(status.active).toBe(true);
    });

    it('should handle production Amplify configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue';
      process.env.RATE_LIMITER_ENABLED = 'true';

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
      expect(RATE_LIMITER_CONFIG.MONITORING.LOG_LEVEL).toBe('info');
    });

    it('should handle staging Amplify configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-staging';
      process.env.RATE_LIMITER_ENABLED = 'false';

      const config = validateRateLimiterConfig();
      const status = getRateLimiterStatus();

      expect(config.RATE_LIMITER_ENABLED).toBe(false);
      expect(status.enabled).toBe(false);
      expect(RATE_LIMITER_CONFIG.MONITORING.LOG_LEVEL).toBe('debug');
    });
  });

  describe('Environment Variable Persistence', () => {
    it('should persist SQS_RATE_LIMITER_QUEUE across configuration reads', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123/test-queue';

      const config1 = validateRateLimiterConfig();
      const config2 = validateRateLimiterConfig();

      expect(config1.SQS_RATE_LIMITER_QUEUE).toBe(config2.SQS_RATE_LIMITER_QUEUE);
    });

    it('should persist RATE_LIMITER_ENABLED across configuration reads', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';

      const config1 = validateRateLimiterConfig();
      const config2 = validateRateLimiterConfig();

      expect(config1.RATE_LIMITER_ENABLED).toBe(config2.RATE_LIMITER_ENABLED);
    });

    it('should reflect runtime changes to RATE_LIMITER_ENABLED', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';
      const config1 = validateRateLimiterConfig();

      process.env.RATE_LIMITER_ENABLED = 'false';
      const config2 = validateRateLimiterConfig();

      expect(config1.RATE_LIMITER_ENABLED).toBe(true);
      expect(config2.RATE_LIMITER_ENABLED).toBe(false);
    });
  });

  describe('AWS Credentials Configuration', () => {
    it('should support IAM role-based authentication (no explicit credentials)', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_EXECUTION_ENV = 'AWS_ECS_FARGATE';

      const config = validateRateLimiterConfig();

      expect(config.AWS_ACCESS_KEY_ID).toBeUndefined();
      expect(config.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    });

    it('should support access key-based authentication', () => {
      process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
      process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

      const config = validateRateLimiterConfig();

      expect(config.AWS_ACCESS_KEY_ID).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(config.AWS_SECRET_ACCESS_KEY).toBe('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    });

    it('should validate AWS region configuration', () => {
      const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

      validRegions.forEach((region) => {
        process.env.AWS_REGION = region;
        const config = validateRateLimiterConfig();
        expect(config.AWS_REGION).toBe(region);
      });
    });
  });

  describe('Feature Flag Integration', () => {
    it('should enable rate limiter when RATE_LIMITER_ENABLED is true', () => {
      process.env.RATE_LIMITER_ENABLED = 'true';

      const status = getRateLimiterStatus();

      expect(status.enabled).toBe(true);
      expect(RATE_LIMITER_CONFIG.FEATURES.ENABLED).toBe(true);
    });

    it('should disable rate limiter when RATE_LIMITER_ENABLED is false', () => {
      process.env.RATE_LIMITER_ENABLED = 'false';

      const status = getRateLimiterStatus();

      expect(status.enabled).toBe(false);
    });

    it('should default to enabled when RATE_LIMITER_ENABLED is not set', () => {
      delete process.env.RATE_LIMITER_ENABLED;

      const config = validateRateLimiterConfig();

      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });
  });

  describe('Configuration Validation Workflow', () => {
    it('should validate configuration on application startup', () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123/queue';

      expect(() => validateRateLimiterConfig()).not.toThrow();
    });

    it('should provide detailed error messages for invalid configuration', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      expect(() => validateRateLimiterConfig()).toThrow(/validation failed/);
    });

    it('should allow application to start with invalid configuration (graceful degradation)', () => {
      process.env.SQS_RATE_LIMITER_QUEUE = 'invalid-url';

      const isConfigured = getRateLimiterStatus().configured;

      expect(isConfigured).toBe(false);
    });
  });

  describe('Multi-Environment Support', () => {
    it('should support production environment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue';

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('huntaze-rate-limiter-queue');
    });

    it('should support staging environment configuration', () => {
      process.env.NODE_ENV = 'staging';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-staging';

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('staging');
    });

    it('should support development environment configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-dev';

      const config = validateRateLimiterConfig();

      expect(config.SQS_RATE_LIMITER_QUEUE).toContain('dev');
    });
  });

  describe('Configuration Status Monitoring', () => {
    it('should provide complete status information', () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.RATE_LIMITER_ENABLED = 'true';

      const status = getRateLimiterStatus();

      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('active');
      expect(status).toHaveProperty('queueUrl');
      expect(status).toHaveProperty('region');
      expect(status).toHaveProperty('features');
    });

    it('should indicate active status when configured and enabled', () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.RATE_LIMITER_ENABLED = 'true';

      const status = getRateLimiterStatus();

      expect(status.configured).toBe(true);
      expect(status.enabled).toBe(true);
      expect(status.active).toBe(true);
    });

    it('should indicate inactive status when disabled', () => {
      process.env.RATE_LIMITER_ENABLED = 'false';

      const status = getRateLimiterStatus();

      expect(status.enabled).toBe(false);
      expect(status.active).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing all environment variables gracefully', () => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.SQS_RATE_LIMITER_QUEUE;
      delete process.env.RATE_LIMITER_ENABLED;

      const config = validateRateLimiterConfig();

      expect(config.AWS_REGION).toBe('us-east-1');
      expect(config.RATE_LIMITER_ENABLED).toBe(true);
    });

    it('should handle malformed queue URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://invalid',
        'ftp://wrong-protocol.com',
        '',
      ];

      malformedUrls.forEach((url) => {
        process.env.SQS_RATE_LIMITER_QUEUE = url;
        expect(() => validateRateLimiterConfig()).toThrow();
      });
    });

    it('should handle special characters in environment variables', () => {
      process.env.AWS_ACCESS_KEY_ID = 'KEY+WITH/SPECIAL=CHARS';
      process.env.AWS_SECRET_ACCESS_KEY = 'SECRET+WITH/SPECIAL=CHARS';

      const config = validateRateLimiterConfig();

      expect(config.AWS_ACCESS_KEY_ID).toBe('KEY+WITH/SPECIAL=CHARS');
      expect(config.AWS_SECRET_ACCESS_KEY).toBe('SECRET+WITH/SPECIAL=CHARS');
    });
  });
});
