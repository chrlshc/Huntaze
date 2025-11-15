/**
 * Integration Tests - Churn API Routes
 * 
 * Tests for /api/revenue/churn endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_CREATOR_ID = 'test_creator_123';
const TEST_SESSION_TOKEN = process.env.TEST_SESSION_TOKEN || 'test_token';

// Response schemas
const ChurnRiskResponseSchema = z.object({
  summary: z.object({
    totalAtRisk: z.number().int().nonnegative(),
    highRisk: z.number().int().nonnegative(),
    mediumRisk: z.number().int().nonnegative(),
    lowRisk: z.number().int().nonnegative(),
  }),
  fans: z.array(z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    churnProbability: z.number().min(0).max(1),
    daysSinceLastActivity: z.number().int().nonnegative(),
    riskLevel: z.enum(['high', 'medium', 'low']),
    lifetimeValue: z.number().nonnegative(),
    lastMessage: z.string().optional(),
  })),
  metadata: z.object({
    lastCalculated: z.string(),
    modelVersion: z.string(),
  }),
});

async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${TEST_SESSION_TOKEN}`,
      'X-Correlation-ID': `test-${Date.now()}`,
      ...options.headers,
    },
  });
}

describe('GET /api/revenue/churn', () => {
  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(
        `${BASE_URL}/api/revenue/churn?creatorId=${TEST_CREATOR_ID}`
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 when accessing another creator\'s data', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=other_creator_456`
      );

      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await makeRequest('/api/revenue/churn');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('creatorId');
    });

    it('should return 400 when riskLevel is invalid', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}&riskLevel=invalid`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('riskLevel');
    });
  });

  describe('Success Cases', () => {
    it('should return all churn risks with valid schema', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = ChurnRiskResponseSchema.parse(data);

      // Verify summary totals match fan list
      const highRiskCount = validated.fans.filter(f => f.riskLevel === 'high').length;
      const mediumRiskCount = validated.fans.filter(f => f.riskLevel === 'medium').length;
      const lowRiskCount = validated.fans.filter(f => f.riskLevel === 'low').length;

      expect(validated.summary.highRisk).toBe(highRiskCount);
      expect(validated.summary.mediumRisk).toBe(mediumRiskCount);
      expect(validated.summary.lowRisk).toBe(lowRiskCount);
      expect(validated.summary.totalAtRisk).toBe(validated.fans.length);
    });

    it('should filter by high risk level', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}&riskLevel=high`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = ChurnRiskResponseSchema.parse(data);

      // All returned fans should be high risk
      validated.fans.forEach(fan => {
        expect(fan.riskLevel).toBe('high');
      });
    });

    it('should filter by medium risk level', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}&riskLevel=medium`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = ChurnRiskResponseSchema.parse(data);

      validated.fans.forEach(fan => {
        expect(fan.riskLevel).toBe('medium');
      });
    });

    it('should filter by low risk level', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}&riskLevel=low`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = ChurnRiskResponseSchema.parse(data);

      validated.fans.forEach(fan => {
        expect(fan.riskLevel).toBe('low');
      });
    });

    it('should return consistent churn probabilities', async () => {
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}`
      );

      const data = await response.json();
      const validated = ChurnRiskResponseSchema.parse(data);

      validated.fans.forEach(fan => {
        // High risk should have high probability
        if (fan.riskLevel === 'high') {
          expect(fan.churnProbability).toBeGreaterThan(0.7);
        }
        // Low risk should have low probability
        if (fan.riskLevel === 'low') {
          expect(fan.churnProbability).toBeLessThan(0.5);
        }
      });
    });
  });

  describe('Performance', () => {
    it('should respond within 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await makeRequest(
        `/api/revenue/churn?creatorId=${TEST_CREATOR_ID}`
      );
      
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });
  });
});

describe('POST /api/revenue/churn/reengage', () => {
  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/revenue/churn/reengage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanId: 'fan_123',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 when re-engaging for another creator', async () => {
      const response = await makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: 'other_creator_456',
          fanId: 'fan_123',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          fanId: 'fan_123',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('creatorId');
    });

    it('should return 400 when fanId is missing', async () => {
      const response = await makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('fanId');
    });
  });

  describe('Success Cases', () => {
    it('should re-engage fan successfully', async () => {
      const response = await makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanId: 'fan_123',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.messageId).toBeDefined();
      expect(typeof data.messageId).toBe('string');
    });

    it('should re-engage with custom message template', async () => {
      const response = await makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanId: 'fan_123',
          messageTemplate: 'Hey! Missing you...',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.messageId).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within 3 seconds', async () => {
      const startTime = Date.now();
      
      const response = await makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanId: 'fan_123',
        }),
      });
      
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000);
    });
  });
});

describe('POST /api/revenue/churn/bulk-reengage', () => {
  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/revenue/churn/bulk-reengage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanIds: ['fan_1', 'fan_2'],
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await makeRequest('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        body: JSON.stringify({
          fanIds: ['fan_1', 'fan_2'],
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when fanIds is missing', async () => {
      const response = await makeRequest('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when fanIds is empty array', async () => {
      const response = await makeRequest('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanIds: [],
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Success Cases', () => {
    it('should bulk re-engage multiple fans', async () => {
      const response = await makeRequest('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanIds: ['fan_1', 'fan_2', 'fan_3'],
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.sent).toBe(3);
      expect(data.failed).toBe(0);
    });

    it('should handle partial failures gracefully', async () => {
      const response = await makeRequest('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanIds: ['fan_1', 'invalid_fan', 'fan_3'],
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.sent).toBeGreaterThan(0);
      expect(data.sent + data.failed).toBe(3);
    });
  });

  describe('Performance', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      const fanIds = Array.from({ length: 10 }, (_, i) => `fan_${i}`);
      
      const response = await makeRequest('/api/revenue/churn/bulk-reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanIds,
        }),
      });
      
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 fans
    });
  });
});

describe('Concurrent Access', () => {
  it('should handle simultaneous churn data requests', async () => {
    const requests = Array.from({ length: 5 }, () =>
      makeRequest(`/api/revenue/churn?creatorId=${TEST_CREATOR_ID}`)
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should handle concurrent re-engagement requests', async () => {
    const requests = Array.from({ length: 3 }, (_, i) =>
      makeRequest('/api/revenue/churn/reengage', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          fanId: `fan_${i}`,
        }),
      })
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect([200, 429]).toContain(response.status);
    });
  });
});
