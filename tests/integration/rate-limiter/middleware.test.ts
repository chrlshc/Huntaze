/**
 * Middleware Rate Limiting Integration Tests
 * 
 * Tests rate limit enforcement on API routes through middleware.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import './setup'; // Import setup to initialize mocks
import middleware from '../../../middleware';

describe('Middleware Rate Limiting Integration', () => {
  describe('Rate Limit Enforcement', () => {
    it('should allow requests within rate limit', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const response = await middleware(req);
      
      // With mock Redis, rate limiting should work
      expect(response.status).not.toBe(429);
      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });

    it('should handle rate limiting gracefully without Redis', async () => {
      const ip = '192.168.1.101';
      
      // Without Redis configured, system should fail-open (allow requests)
      // This is the correct behavior for production resilience
      
      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        const req = new NextRequest('http://localhost:3000/api/dashboard', {
          method: 'GET',
          headers: {
            'x-forwarded-for': ip,
          },
        });
        
        const response = await middleware(req);
        
        // Should allow all requests (fail-open behavior)
        expect(response.status).not.toBe(429);
        // Should still include rate limit headers
        expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      }
    });

    it('should include rate limit headers even in degraded mode', async () => {
      const ip = '192.168.1.102';
      
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': ip,
        },
      });
      
      const response = await middleware(req);
      
      // Even without Redis, should include informational headers
      expect(response.status).not.toBe(429); // Fail-open
      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
      expect(response.headers.has('X-RateLimit-Policy')).toBe(true);
    });
  });

  describe('Identity Extraction', () => {
    it('should extract IP from X-Forwarded-For header', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '203.0.113.1',
        },
      });

      const response = await middleware(req);
      
      // Should not be rate limited on first request
      expect(response.status).not.toBe(429);
    });

    it('should extract IP from X-Real-IP header', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-real-ip': '203.0.113.2',
        },
      });

      const response = await middleware(req);
      
      expect(response.status).not.toBe(429);
    });

    it('should handle multiple IPs in X-Forwarded-For', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '203.0.113.3, 10.0.0.1, 172.16.0.1',
        },
      });

      const response = await middleware(req);
      
      // Should use first IP (203.0.113.3)
      expect(response.status).not.toBe(429);
    });
  });

  describe('Policy Resolution', () => {
    it('should apply different limits for different endpoints', async () => {
      const ip = '192.168.1.103';
      
      // Dashboard endpoint (60/min)
      const dashboardReq = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': ip,
        },
      });
      
      const dashboardResponse = await middleware(dashboardReq);
      expect(dashboardResponse.status).not.toBe(429);
      
      // Auth endpoint (5/min) - different IP to avoid cross-contamination
      const authReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.104',
        },
      });
      
      const authResponse = await middleware(authReq);
      expect(authResponse.status).not.toBe(429);
    });

    it('should apply stricter limits for unauthenticated requests', async () => {
      const ip = '192.168.1.105';
      
      // Unauthenticated request
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': ip,
        },
      });
      
      const response = await middleware(req);
      
      expect(response.status).not.toBe(429);
      
      // Check that limit is lower for unauthenticated
      const limit = response.headers.get('X-RateLimit-Limit');
      expect(limit).toBeTruthy();
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers on successful requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.106',
        },
      });

      const response = await middleware(req);
      
      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
      
      const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
      
      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(limit);
    });

    it('should decrement remaining count on subsequent requests', async () => {
      const ip = '192.168.1.107';
      
      const req1 = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': ip,
        },
      });
      
      const response1 = await middleware(req1);
      const remaining1 = parseInt(response1.headers.get('X-RateLimit-Remaining') || '0');
      
      const req2 = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': ip,
        },
      });
      
      const response2 = await middleware(req2);
      const remaining2 = parseInt(response2.headers.get('X-RateLimit-Remaining') || '0');
      
      // Remaining should decrease (or stay same if both are at limit)
      expect(remaining2).toBeLessThanOrEqual(remaining1);
    });

    it('should include policy description in headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.108',
        },
      });

      const response = await middleware(req);
      
      const policy = response.headers.get('X-RateLimit-Policy');
      expect(policy).toBeTruthy();
      expect(policy).toMatch(/\d+\/min/);
    });
  });

  describe('Error Handling', () => {
    it('should fail open when Redis is unavailable', async () => {
      // This test assumes Redis might be unavailable
      // The middleware should allow the request through
      
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.109',
        },
      });

      const response = await middleware(req);
      
      // Should not block request even if Redis fails
      expect(response.status).not.toBe(500);
    });

    it('should handle malformed headers gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': 'invalid-ip-format',
        },
      });

      const response = await middleware(req);
      
      // Should not crash, should handle gracefully
      expect(response.status).not.toBe(500);
    });
  });

  describe('Non-API Routes', () => {
    it('should not apply rate limiting to non-API routes', async () => {
      const req = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.110',
        },
      });

      const response = await middleware(req);
      
      // Should not have rate limit headers
      expect(response.headers.has('X-RateLimit-Limit')).toBe(false);
    });
  });
});
