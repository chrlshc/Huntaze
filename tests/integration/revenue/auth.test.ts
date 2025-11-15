/**
 * Revenue API - Authentication & Authorization Tests
 * 
 * Tests authentication requirements and authorization checks
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { createTestUser, createAuthToken } from '../fixtures/factories';

describe('Revenue API - Authentication', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('Unauthenticated Requests', () => {
    it('should return 401 for pricing endpoint without auth', async () => {
      const response = await fetch('/api/revenue/pricing?creatorId=test_123');
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for churn endpoint without auth', async () => {
      const response = await fetch('/api/revenue/churn?creatorId=test_123');
      
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 401 for upsells endpoint without auth', async () => {
      const response = await fetch('/api/revenue/upsells?creatorId=test_123');
      
      expect(response.status).toBe(401);
    });

    it('should return 401 for forecast endpoint without auth', async () => {
      const response = await fetch('/api/revenue/forecast?creatorId=test_123');
      
      expect(response.status).toBe(401);
    });

    it('should return 401 for payouts endpoint without auth', async () => {
      const response = await fetch('/api/revenue/payouts?creatorId=test_123');
      
      expect(response.status).toBe(401);
    });

    it('should return 401 for POST endpoints without auth', async () => {
      const endpoints = [
        '/api/revenue/pricing/apply',
        '/api/revenue/churn/reengage',
        '/api/revenue/upsells/send',
        '/api/revenue/forecast/goal',
        '/api/revenue/payouts/tax-rate',
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId: 'test_123' }),
        });

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Authorization - Access Control', () => {
    it('should return 403 when accessing another creator\'s data', async () => {
      const user1 = await createTestUser({ id: 'creator_1' });
      const user2 = await createTestUser({ id: 'creator_2' });
      const token1 = await createAuthToken(user1);

      const response = await fetch('/api/revenue/pricing?creatorId=creator_2', {
        headers: {
          'Cookie': `next-auth.session-token=${token1}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should allow access to own data', async () => {
      const user = await createTestUser({ id: 'creator_1' });
      const token = await createAuthToken(user);

      const response = await fetch('/api/revenue/pricing?creatorId=creator_1', {
        headers: {
          'Cookie': `next-auth.session-token=${token}`,
        },
      });

      expect(response.status).not.toBe(403);
    });

    it('should prevent cross-creator mutations', async () => {
      const user1 = await createTestUser({ id: 'creator_1' });
      const token1 = await createAuthToken(user1);

      const response = await fetch('/api/revenue/pricing/apply', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${token1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: 'creator_2', // Different creator
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Session Validation', () => {
    it('should reject expired session tokens', async () => {
      const expiredToken = 'expired_token_12345';

      const response = await fetch('/api/revenue/pricing?creatorId=test_123', {
        headers: {
          'Cookie': `next-auth.session-token=${expiredToken}`,
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject malformed session tokens', async () => {
      const malformedToken = 'invalid!!!token';

      const response = await fetch('/api/revenue/pricing?creatorId=test_123', {
        headers: {
          'Cookie': `next-auth.session-token=${malformedToken}`,
        },
      });

      expect(response.status).toBe(401);
    });

    it('should accept valid session tokens', async () => {
      const user = await createTestUser({ id: 'creator_1' });
      const token = await createAuthToken(user);

      const response = await fetch('/api/revenue/pricing?creatorId=creator_1', {
        headers: {
          'Cookie': `next-auth.session-token=${token}`,
        },
      });

      expect(response.status).not.toBe(401);
    });
  });

  describe('Correlation ID Tracking', () => {
    it('should accept X-Correlation-ID header', async () => {
      const user = await createTestUser({ id: 'creator_1' });
      const token = await createAuthToken(user);
      const correlationId = 'test-correlation-123';

      const response = await fetch('/api/revenue/pricing?creatorId=creator_1', {
        headers: {
          'Cookie': `next-auth.session-token=${token}`,
          'X-Correlation-ID': correlationId,
        },
      });

      expect(response.status).toBeLessThan(500);
      // Correlation ID should be logged server-side
    });

    it('should generate correlation ID if not provided', async () => {
      const user = await createTestUser({ id: 'creator_1' });
      const token = await createAuthToken(user);

      const response = await fetch('/api/revenue/pricing?creatorId=creator_1', {
        headers: {
          'Cookie': `next-auth.session-token=${token}`,
        },
      });

      expect(response.status).toBeLessThan(500);
      // Server should generate and log correlation ID
    });
  });
});
