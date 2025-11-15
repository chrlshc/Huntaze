/**
 * Rate Limit Configuration Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRateLimitPolicy,
  validateRateLimitPolicy,
  isIPWhitelisted,
  DEFAULT_POLICY,
  RATE_LIMIT_POLICIES,
} from '../../../lib/config/rate-limits';
import { RateLimitPolicy } from '../../../lib/services/rate-limiter/types';

describe('Rate Limit Configuration', () => {
  describe('getRateLimitPolicy', () => {
    it('should return exact match policy', () => {
      const policy = getRateLimitPolicy('/api/auth/login');
      
      expect(policy.perMinute).toBe(5);
      expect(policy.perHour).toBe(20);
      expect(policy.algorithm).toBe('sliding-window');
    });
    
    it('should return prefix match policy', () => {
      const policy = getRateLimitPolicy('/api/auth/login/callback');
      
      // Should match /api/auth/login prefix
      expect(policy.perMinute).toBe(5);
    });
    
    it('should return default policy when no match', () => {
      const policy = getRateLimitPolicy('/api/unknown/endpoint');
      
      expect(policy.perMinute).toBe(DEFAULT_POLICY.perMinute);
      expect(policy.perHour).toBe(DEFAULT_POLICY.perHour);
    });
    
    it('should apply tier overrides for premium users', () => {
      const policy = getRateLimitPolicy('/api/content/upload', 'premium');
      
      expect(policy.perHour).toBe(500);
      expect(policy.perDay).toBe(2000);
    });
    
    it('should apply tier overrides for enterprise users', () => {
      const policy = getRateLimitPolicy('/api/content/upload', 'enterprise');
      
      expect(policy.perHour).toBe(2000);
      expect(policy.perDay).toBe(10000);
    });
    
    it('should use base policy for free tier', () => {
      const policy = getRateLimitPolicy('/api/content/upload', 'free');
      
      expect(policy.perHour).toBe(100);
      expect(policy.perDay).toBe(500);
    });
    
    it('should handle AI endpoint with wildcard', () => {
      const policy = getRateLimitPolicy('/api/ai/suggestions');
      
      expect(policy.perMinute).toBe(20);
      expect(policy.perHour).toBe(500);
    });
  });
  
  describe('validateRateLimitPolicy', () => {
    it('should accept valid policy', () => {
      const validPolicy: RateLimitPolicy = {
        perMinute: 100,
        perHour: 5000,
        algorithm: 'sliding-window',
      };
      
      expect(() => validateRateLimitPolicy(validPolicy)).not.toThrow();
    });
    
    it('should reject negative perMinute', () => {
      const invalidPolicy: RateLimitPolicy = {
        perMinute: -1,
        algorithm: 'sliding-window',
      };
      
      expect(() => validateRateLimitPolicy(invalidPolicy)).toThrow('perMinute must be positive');
    });
    
    it('should reject zero perMinute', () => {
      const invalidPolicy: RateLimitPolicy = {
        perMinute: 0,
        algorithm: 'sliding-window',
      };
      
      expect(() => validateRateLimitPolicy(invalidPolicy)).toThrow('perMinute must be positive');
    });
    
    it('should reject perHour less than perMinute', () => {
      const invalidPolicy: RateLimitPolicy = {
        perMinute: 100,
        perHour: 50,
        algorithm: 'sliding-window',
      };
      
      expect(() => validateRateLimitPolicy(invalidPolicy)).toThrow('perHour must be >= perMinute');
    });
    
    it('should reject perDay less than perHour', () => {
      const invalidPolicy: RateLimitPolicy = {
        perMinute: 100,
        perHour: 5000,
        perDay: 1000,
        algorithm: 'sliding-window',
      };
      
      expect(() => validateRateLimitPolicy(invalidPolicy)).toThrow('perDay must be >= perHour');
    });
    
    it('should reject negative burst', () => {
      const invalidPolicy: RateLimitPolicy = {
        perMinute: 100,
        burst: -5,
        algorithm: 'token-bucket',
      };
      
      expect(() => validateRateLimitPolicy(invalidPolicy)).toThrow('burst must be non-negative');
    });
    
    it('should accept policy with burst', () => {
      const validPolicy: RateLimitPolicy = {
        perMinute: 100,
        burst: 10,
        algorithm: 'token-bucket',
      };
      
      expect(() => validateRateLimitPolicy(validPolicy)).not.toThrow();
    });
  });
  
  describe('isIPWhitelisted', () => {
    it('should return false for non-whitelisted IP', () => {
      expect(isIPWhitelisted('192.168.1.1')).toBe(false);
    });
    
    // Note: Actual whitelist testing would require mocking process.env
    // which is done in integration tests
  });
  
  describe('Policy Definitions', () => {
    it('should have authentication endpoints with strict limits', () => {
      const loginPolicy = RATE_LIMIT_POLICIES['/api/auth/login'];
      
      expect(loginPolicy.perMinute).toBeLessThanOrEqual(5);
      expect(loginPolicy.algorithm).toBe('sliding-window');
    });
    
    it('should have upload endpoints with burst support', () => {
      const uploadPolicy = RATE_LIMIT_POLICIES['/api/content/upload'];
      
      expect(uploadPolicy.algorithm).toBe('token-bucket');
      expect(uploadPolicy.burst).toBeGreaterThan(0);
    });
    
    it('should have tier overrides for premium features', () => {
      const uploadPolicy = RATE_LIMIT_POLICIES['/api/content/upload'];
      
      expect(uploadPolicy.tiers).toBeDefined();
      expect(uploadPolicy.tiers?.premium).toBeDefined();
      expect(uploadPolicy.tiers?.enterprise).toBeDefined();
    });
  });
});
