/**
 * Revenue API - Rate Limiting Tests
 * 
 * Tests rate limiting behavior and throttling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { createTestUser, createAuthToken } from '../fixtures/factories';
import { sleep } from '../fixtures/test-helpers';

describe('Revenue API - Rate Limiting', () => {
  let authToken: string;
  let creatorId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    const user = await createTestUser({ id: 'creator_ratelimit' });
    authToken = await createAuthToken(user);
    creatorId = user.id;
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    // Wait between tests to avoid rate limit carryover
    await sleep(1000);
  });

  describe('GET Endpoint Rate Limits', () => {
    it('should allow reasonable number of GET requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map(r => r.status);

      // All should succeed (not rate limited)
      expect(statuses.every(s => s !== 429)).toBe(true);
    });

    it('should rate limit excessive GET requests', async () => {
      const requests = Array.from({ length: 20 }, () =>
        fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      // At least some should be rate limited
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers in response', async () => {
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      // Check for standard rate limit headers
      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });

    it('should return 429 with retry-after header when rate limited', async () => {
      // Exhaust rate limit
      const requests = Array.from({ length: 20 }, () =>
        fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.find(r => r.status === 429);

      if (rateLimited) {
        expect(rateLimited.headers.has('Retry-After')).toBe(true);
        const data = await rateLimited.json();
        expect(data.error).toContain('Too many requests');
      }
    });
  });

  describe('POST Endpoint Rate Limits', () => {
    it('should have stricter limits on mutation endpoints', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch('/api/revenue/pricing/apply', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            priceType: 'subscription',
            newPrice: 12.99,
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      // Mutations should be rate limited more aggressively
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should rate limit upsell send operations', async () => {
      const requests = Array.from({ length: 15 }, () =>
        fetch('/api/revenue/upsells/send', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            opportunityId: 'opp_123',
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should rate limit bulk operations more strictly', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch('/api/revenue/churn/bulk-reengage', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            fanIds: ['fan_1', 'fan_2', 'fan_3'],
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      // Bulk operations should be limited quickly
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Per-User Rate Limiting', () => {
    it('should track rate limits per user', async () => {
      const user2 = await createTestUser({ id: 'creator_ratelimit_2' });
      const token2 = await createAuthToken(user2);

      // Exhaust rate limit for user 1
      await Promise.all(
        Array.from({ length: 20 }, () =>
          fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
            headers: { 'Cookie': `next-auth.session-token=${authToken}` },
          })
        )
      );

      // User 2 should still be able to make requests
      const response = await fetch(`/api/revenue/pricing?creatorId=${user2.id}`, {
        headers: { 'Cookie': `next-auth.session-token=${token2}` },
      });

      expect(response.status).not.toBe(429);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit after time window', async () => {
      // Exhaust rate limit
      await Promise.all(
        Array.from({ length: 20 }, () =>
          fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
            headers: { 'Cookie': `next-auth.session-token=${authToken}` },
          })
        )
      );

      // Wait for rate limit window to reset (e.g., 60 seconds)
      await sleep(61000);

      // Should be able to make requests again
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).not.toBe(429);
    }, 70000); // Increase test timeout
  });

  describe('Rate Limit Headers', () => {
    it('should decrement remaining count with each request', async () => {
      const response1 = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const remaining1 = parseInt(response1.headers.get('X-RateLimit-Remaining') || '0');

      await sleep(100);

      const response2 = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const remaining2 = parseInt(response2.headers.get('X-RateLimit-Remaining') || '0');

      expect(remaining2).toBeLessThan(remaining1);
    });

    it('should provide accurate reset timestamp', async () => {
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const resetHeader = response.headers.get('X-RateLimit-Reset');
      expect(resetHeader).toBeDefined();

      const resetTime = parseInt(resetHeader || '0');
      const now = Math.floor(Date.now() / 1000);

      // Reset time should be in the future
      expect(resetTime).toBeGreaterThan(now);
      // But not too far in the future (within 2 minutes)
      expect(resetTime).toBeLessThan(now + 120);
    });
  });

  describe('Different Endpoints Different Limits', () => {
    it('should have independent rate limits per endpoint', async () => {
      // Exhaust pricing endpoint
      await Promise.all(
        Array.from({ length: 20 }, () =>
          fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
            headers: { 'Cookie': `next-auth.session-token=${authToken}` },
          })
        )
      );

      // Churn endpoint should still work
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).not.toBe(429);
    });
  });

  describe('Export Endpoint Rate Limiting', () => {
    it('should rate limit export operations', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch(`/api/revenue/payouts/export?creatorId=${creatorId}&format=csv`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      // Export operations should be limited
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
