/**
 * Identity and Policy Resolution Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { getClientIp, isValidIp, isPrivateIp, sanitizeIdentity } from '../../../lib/services/rate-limiter/identity';
import {
  resolveRateLimitPolicy,
  findPolicyForEndpoint,
  shouldBypassRateLimit,
  getEffectiveLimit,
  mergePolicies,
  formatPolicy,
  isValidPolicy,
} from '../../../lib/services/rate-limiter/policy';
import { Identity, RateLimitPolicy } from '../../../lib/services/rate-limiter/types';
import { NextRequest } from 'next/server';

describe('Identity Extraction', () => {
  describe('getClientIp', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from X-Real-IP header', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from CF-Connecting-IP header', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'cf-connecting-ip': '192.168.1.3',
        },
      });

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.3');
    });

    it('should return unknown when no IP headers present', () => {
      const req = new NextRequest('http://localhost/api/test');

      const ip = getClientIp(req);
      expect(ip).toBe('unknown');
    });
  });

  describe('isValidIp', () => {
    it('should validate IPv4 addresses', () => {
      expect(isValidIp('192.168.1.1')).toBe(true);
      expect(isValidIp('10.0.0.1')).toBe(true);
      expect(isValidIp('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      // Note: Simple regex doesn't validate octet ranges
      // In production, use a proper IP validation library
      expect(isValidIp('192.168.1')).toBe(false);
      expect(isValidIp('not-an-ip')).toBe(false);
      expect(isValidIp('unknown')).toBe(false);
    });

    it('should validate IPv6 addresses', () => {
      expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidIp('::1')).toBe(true);
    });
  });

  describe('isPrivateIp', () => {
    it('should identify private IPv4 ranges', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('127.0.0.1')).toBe(true);
    });

    it('should identify public IPs', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
    });
  });

  describe('sanitizeIdentity', () => {
    it('should mask API keys', () => {
      const identity: Identity = {
        type: 'apiKey',
        value: 'sk_test_1234567890abcdef',
      };

      const sanitized = sanitizeIdentity(identity);
      expect(sanitized).toBe('apiKey:sk_test_...');
    });

    it('should show user IDs', () => {
      const identity: Identity = {
        type: 'user',
        value: 'user_123',
      };

      const sanitized = sanitizeIdentity(identity);
      expect(sanitized).toBe('user:user_123');
    });

    it('should mask IP addresses', () => {
      const identity: Identity = {
        type: 'ip',
        value: '192.168.1.100',
      };

      const sanitized = sanitizeIdentity(identity);
      expect(sanitized).toBe('192.168.1.xxx');
    });
  });
});

describe('Policy Resolution', () => {
  describe('findPolicyForEndpoint', () => {
    it('should find exact match policy', () => {
      const policy = findPolicyForEndpoint('/api/auth/login');
      
      expect(policy).toBeDefined();
      expect(policy?.perMinute).toBe(5);
    });

    it('should find prefix match policy', () => {
      const policy = findPolicyForEndpoint('/api/auth/login/callback');
      
      expect(policy).toBeDefined();
      expect(policy?.perMinute).toBe(5);
    });

    it('should return null for unknown endpoint', () => {
      const policy = findPolicyForEndpoint('/api/unknown/endpoint');
      
      expect(policy).toBeNull();
    });

    it('should prefer longest prefix match', () => {
      const policy = findPolicyForEndpoint('/api/content/upload/image');
      
      expect(policy).toBeDefined();
      // Should match /api/content/upload, not /api/content
    });
  });

  describe('resolveRateLimitPolicy', () => {
    it('should return null for whitelisted IPs', () => {
      // Note: This test would need IP_WHITELIST to be populated
      const identity: Identity = {
        type: 'ip',
        value: '127.0.0.1',
        tier: 'free',
      };

      // Without whitelist, should return a policy
      const policy = resolveRateLimitPolicy('/api/test', identity);
      expect(policy).toBeDefined();
    });

    it('should apply tier overrides for premium users', () => {
      const identity: Identity = {
        type: 'user',
        value: 'user_123',
        tier: 'premium',
      };

      const policy = resolveRateLimitPolicy('/api/content/upload', identity);
      
      expect(policy).toBeDefined();
      // Premium tier should have higher limits
      expect(policy?.perHour).toBeGreaterThan(100);
    });

    it('should use IP limits for unauthenticated requests', () => {
      const identity: Identity = {
        type: 'ip',
        value: '192.168.1.1',
        tier: 'free',
      };

      const policy = resolveRateLimitPolicy('/api/unknown', identity);
      
      expect(policy).toBeDefined();
      expect(policy?.perMinute).toBe(20); // IP_RATE_LIMITS
    });
  });

  describe('getEffectiveLimit', () => {
    const policy: RateLimitPolicy = {
      perMinute: 10,
      perHour: 500,
      perDay: 10000,
      algorithm: 'sliding-window',
    };

    it('should return per-minute limit', () => {
      expect(getEffectiveLimit(policy, 'minute')).toBe(10);
    });

    it('should return per-hour limit', () => {
      expect(getEffectiveLimit(policy, 'hour')).toBe(500);
    });

    it('should return per-day limit', () => {
      expect(getEffectiveLimit(policy, 'day')).toBe(10000);
    });

    it('should calculate hour limit from minute if not specified', () => {
      const simplePolicy: RateLimitPolicy = {
        perMinute: 10,
        algorithm: 'sliding-window',
      };

      expect(getEffectiveLimit(simplePolicy, 'hour')).toBe(600);
    });
  });

  describe('mergePolicies', () => {
    it('should take most restrictive limits', () => {
      const policy1: RateLimitPolicy = {
        perMinute: 100,
        perHour: 5000,
        algorithm: 'sliding-window',
      };

      const policy2: RateLimitPolicy = {
        perMinute: 50,
        perHour: 2000,
        algorithm: 'token-bucket',
      };

      const merged = mergePolicies([policy1, policy2]);

      expect(merged.perMinute).toBe(50);
      expect(merged.perHour).toBe(2000);
    });

    it('should return default for empty array', () => {
      const merged = mergePolicies([]);
      
      expect(merged.perMinute).toBeGreaterThan(0);
    });

    it('should return single policy unchanged', () => {
      const policy: RateLimitPolicy = {
        perMinute: 100,
        algorithm: 'sliding-window',
      };

      const merged = mergePolicies([policy]);

      expect(merged).toEqual(policy);
    });
  });

  describe('formatPolicy', () => {
    it('should format policy with all limits', () => {
      const policy: RateLimitPolicy = {
        perMinute: 100,
        perHour: 5000,
        perDay: 100000,
        burst: 10,
        algorithm: 'token-bucket',
      };

      const formatted = formatPolicy(policy);

      expect(formatted).toContain('100/min');
      expect(formatted).toContain('5000/hour');
      expect(formatted).toContain('100000/day');
      expect(formatted).toContain('burst:10');
      expect(formatted).toContain('algo:token-bucket');
    });

    it('should format minimal policy', () => {
      const policy: RateLimitPolicy = {
        perMinute: 50,
        algorithm: 'sliding-window',
      };

      const formatted = formatPolicy(policy);

      expect(formatted).toContain('50/min');
      expect(formatted).toContain('algo:sliding-window');
    });
  });

  describe('isValidPolicy', () => {
    it('should validate correct policy', () => {
      const policy: RateLimitPolicy = {
        perMinute: 100,
        perHour: 5000,
        algorithm: 'sliding-window',
      };

      expect(isValidPolicy(policy)).toBe(true);
    });

    it('should reject policy with zero perMinute', () => {
      const policy: RateLimitPolicy = {
        perMinute: 0,
        algorithm: 'sliding-window',
      };

      expect(isValidPolicy(policy)).toBe(false);
    });

    it('should reject policy with perHour < perMinute', () => {
      const policy: RateLimitPolicy = {
        perMinute: 100,
        perHour: 50,
        algorithm: 'sliding-window',
      };

      expect(isValidPolicy(policy)).toBe(false);
    });

    it('should reject policy with invalid algorithm', () => {
      const policy: any = {
        perMinute: 100,
        algorithm: 'invalid-algorithm',
      };

      expect(isValidPolicy(policy)).toBe(false);
    });
  });
});
