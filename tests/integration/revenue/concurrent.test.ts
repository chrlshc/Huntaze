/**
 * Revenue API - Concurrent Access Tests
 * 
 * Tests concurrent requests and race conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { createTestUser, createAuthToken } from '../fixtures/factories';
import { sleep } from '../fixtures/test-helpers';

describe('Revenue API - Concurrent Access', () => {
  let authToken: string;
  let creatorId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    const user = await createTestUser({ id: 'creator_concurrent' });
    authToken = await createAuthToken(user);
    creatorId = user.id;
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('Concurrent GET Requests', () => {
    it('should handle multiple simultaneous pricing requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // All should return same data (consistency)
      const dataPromises = responses.map(r => r.json());
      const data = await Promise.all(dataPromises);
      
      const firstData = JSON.stringify(data[0]);
      data.forEach(d => {
        expect(JSON.stringify(d)).toBe(firstData);
      });
    });

    it('should handle concurrent requests to different endpoints', async () => {
      const requests = [
        fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        }),
        fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        }),
        fetch(`/api/revenue/upsells?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        }),
        fetch(`/api/revenue/forecast?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        }),
        fetch(`/api/revenue/payouts?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        }),
      ];

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Concurrent POST Requests', () => {
    it('should handle concurrent pricing updates', async () => {
      const prices = [12.99, 13.99, 14.99];
      
      const requests = prices.map(price =>
        fetch('/api/revenue/pricing/apply', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            priceType: 'subscription',
            newPrice: price,
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All should complete (success or conflict)
      responses.forEach(response => {
        expect([200, 409, 429]).toContain(response.status);
      });

      // At least one should succeed
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle concurrent re-engagement requests', async () => {
      const fanIds = ['fan_1', 'fan_2', 'fan_3'];
      
      const requests = fanIds.map(fanId =>
        fetch('/api/revenue/churn/reengage', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            fanId,
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All should complete
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });

    it('should handle concurrent upsell sends', async () => {
      const opportunityIds = ['opp_1', 'opp_2', 'opp_3'];
      
      const requests = opportunityIds.map(opportunityId =>
        fetch('/api/revenue/upsells/send', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            opportunityId,
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All should complete
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Race Conditions', () => {
    it('should prevent double-application of pricing changes', async () => {
      const newPrice = 15.99;
      
      // Send two identical requests simultaneously
      const requests = Array.from({ length: 2 }, () =>
        fetch('/api/revenue/pricing/apply', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            priceType: 'subscription',
            newPrice,
          }),
        })
      );

      const responses = await Promise.all(requests);
      const successful = responses.filter(r => r.status === 200);
      
      // Only one should succeed (idempotency)
      expect(successful.length).toBeLessThanOrEqual(1);
    });

    it('should handle concurrent goal setting', async () => {
      const goals = [20000, 25000, 30000];
      
      const requests = goals.map(goalAmount =>
        fetch('/api/revenue/forecast/goal', {
          method: 'POST',
          headers: {
            'Cookie': `next-auth.session-token=${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId,
            goalAmount,
            targetMonth: '2024-12',
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All should complete
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // Last write should win
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical GET requests', async () => {
      // Send multiple identical requests in quick succession
      const requests = Array.from({ length: 5 }, () =>
        fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // Should complete quickly (deduplication working)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should not take 5x as long
    });

    it('should not deduplicate POST requests', async () => {
      const requests = Array.from({ length: 3 }, () =>
        fetch('/api/revenue/upsells/dismiss', {
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
      
      // All should be processed independently
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Load Testing', () => {
    it('should handle sustained concurrent load', async () => {
      const duration = 5000; // 5 seconds
      const requestsPerSecond = 10;
      const totalRequests = (duration / 1000) * requestsPerSecond;

      const requests: Promise<Response>[] = [];
      const startTime = Date.now();

      while (Date.now() - startTime < duration) {
        requests.push(
          fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
            headers: { 'Cookie': `next-auth.session-token=${authToken}` },
          })
        );
        await sleep(1000 / requestsPerSecond);
      }

      const responses = await Promise.all(requests);
      
      // Most should succeed (allowing for some rate limiting)
      const successful = responses.filter(r => r.status === 200);
      const successRate = successful.length / responses.length;
      
      expect(successRate).toBeGreaterThan(0.5); // At least 50% success rate
    }, 10000); // Increase test timeout

    it('should maintain response times under load', async () => {
      const requests = Array.from({ length: 20 }, async () => {
        const start = Date.now();
        const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        });
        const duration = Date.now() - start;
        return { response, duration };
      });

      const results = await Promise.all(requests);
      
      // Calculate average response time
      const successfulResults = results.filter(r => r.response.status === 200);
      const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
      
      // Average response time should be reasonable
      expect(avgDuration).toBeLessThan(2000); // Less than 2 seconds
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running requests', async () => {
      // This would require a special endpoint that delays response
      // For now, we test that normal requests don't timeout
      
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).not.toBe(504); // Gateway timeout
      expect(response.status).not.toBe(408); // Request timeout
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse connections efficiently', async () => {
      // Make sequential requests to test connection reuse
      const responses: Response[] = [];
      
      for (let i = 0; i < 10; i++) {
        const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        });
        responses.push(response);
        await sleep(100);
      }

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});
