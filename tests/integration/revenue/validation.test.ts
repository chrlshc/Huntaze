/**
 * Revenue API - Input Validation Tests
 * 
 * Tests request validation and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { createTestUser, createAuthToken } from '../fixtures/factories';

describe('Revenue API - Input Validation', () => {
  let authToken: string;
  let creatorId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    const user = await createTestUser({ id: 'creator_validation' });
    authToken = await createAuthToken(user);
    creatorId = user.id;
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('GET /api/revenue/pricing', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await fetch('/api/revenue/pricing', {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('creatorId');
    });

    it('should return 400 for invalid creatorId format', async () => {
      const response = await fetch('/api/revenue/pricing?creatorId=invalid!!!id', {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid creatorId', async () => {
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/revenue/pricing/apply', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid priceType', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          priceType: 'invalid_type',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('priceType');
    });

    it('should return 400 for negative price', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          priceType: 'subscription',
          newPrice: -5.99,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('price');
    });

    it('should return 400 for zero price', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          priceType: 'subscription',
          newPrice: 0,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid pricing request', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
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
      });

      expect(response.status).not.toBe(400);
    });
  });

  describe('GET /api/revenue/churn', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await fetch('/api/revenue/churn', {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid riskLevel', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}&riskLevel=invalid`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('riskLevel');
    });

    it('should accept valid riskLevel values', async () => {
      const validLevels = ['high', 'medium', 'low'];

      for (const level of validLevels) {
        const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}&riskLevel=${level}`, {
          headers: { 'Cookie': `next-auth.session-token=${authToken}` },
        });

        expect(response.status).not.toBe(400);
      }
    });

    it('should accept request without riskLevel (all levels)', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/revenue/churn/reengage', () => {
    it('should return 400 when fanId is missing', async () => {
      const response = await fetch('/api/revenue/churn/reengage', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('fanId');
    });

    it('should accept valid re-engage request', async () => {
      const response = await fetch('/api/revenue/churn/reengage', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          fanId: 'fan_123',
          messageTemplate: 'Hey! Missing you...',
        }),
      });

      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/revenue/churn/bulk-reengage', () => {
    it('should return 400 when fanIds is not an array', async () => {
      const response = await fetch('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          fanIds: 'not_an_array',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when fanIds array is empty', async () => {
      const response = await fetch('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          fanIds: [],
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('empty');
    });

    it('should accept valid bulk re-engage request', async () => {
      const response = await fetch('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          fanIds: ['fan_1', 'fan_2', 'fan_3'],
          messageTemplate: 'Hey! Missing you...',
        }),
      });

      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/revenue/forecast/goal', () => {
    it('should return 400 for invalid goalAmount', async () => {
      const response = await fetch('/api/revenue/forecast/goal', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          goalAmount: -1000,
          targetMonth: '2024-12',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await fetch('/api/revenue/forecast/goal', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          goalAmount: 20000,
          targetMonth: 'invalid-date',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Malformed JSON', () => {
    it('should return 400 for malformed JSON in POST requests', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json {{{',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Content-Type Validation', () => {
    it('should accept application/json content type', async () => {
      const response = await fetch('/api/revenue/pricing/apply', {
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
      });

      expect(response.status).not.toBe(415);
    });
  });
});
