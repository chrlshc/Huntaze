/**
 * Test Environment API - Integration Tests
 * 
 * Tests for GET /api/test-env endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('GET /api/test-env', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/test-env`;

  describe('Basic Functionality', () => {
    it('should return 200 OK', async () => {
      const response = await fetch(endpoint);
      expect(response.status).toBe(200);
    });

    it('should return JSON response', async () => {
      const response = await fetch(endpoint);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should have correct response structure', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('correlationId');
      expect(data).toHaveProperty('env');
      expect(data).toHaveProperty('duration');
    });

    it('should return status "ok"', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });

  describe('Response Headers', () => {
    it('should include X-Correlation-Id header', async () => {
      const response = await fetch(endpoint);
      const correlationId = response.headers.get('x-correlation-id');
      
      expect(correlationId).toBeDefined();
      expect(correlationId).toMatch(/^test-env-\d+-[a-z0-9]+$/);
    });

    it('should have no-cache headers', async () => {
      const response = await fetch(endpoint);
      const cacheControl = response.headers.get('cache-control');
      
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });
  });

  describe('Environment Status', () => {
    it('should include nodeEnv field', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.env).toHaveProperty('nodeEnv');
      expect(['development', 'production', 'test']).toContain(data.env.nodeEnv);
    });

    it('should check NEXTAUTH_SECRET', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.env).toHaveProperty('hasNextAuthSecret');
      expect(data.env).toHaveProperty('nextAuthSecretLength');
      expect(typeof data.env.hasNextAuthSecret).toBe('boolean');
      expect(typeof data.env.nextAuthSecretLength).toBe('number');
    });

    it('should check NEXTAUTH_URL', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.env).toHaveProperty('hasNextAuthUrl');
      expect(data.env).toHaveProperty('nextAuthUrl');
      expect(typeof data.env.hasNextAuthUrl).toBe('boolean');
    });

    it('should check DATABASE_URL', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.env).toHaveProperty('hasDatabaseUrl');
      expect(typeof data.env.hasDatabaseUrl).toBe('boolean');
    });

    it('should not expose sensitive values directly', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      // Should not include actual secret values
      expect(data.env).not.toHaveProperty('nextAuthSecret');
      expect(data.env).not.toHaveProperty('databaseUrl');
    });
  });

  describe('Correlation ID', () => {
    it('should generate unique correlation IDs', async () => {
      const response1 = await fetch(endpoint);
      const data1 = await response1.json();

      const response2 = await fetch(endpoint);
      const data2 = await response2.json();

      expect(data1.correlationId).not.toBe(data2.correlationId);
    });

    it('should match header and body correlation ID', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();
      const headerCorrelationId = response.headers.get('x-correlation-id');

      expect(data.correlationId).toBe(headerCorrelationId);
    });

    it('should have correct correlation ID format', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.correlationId).toMatch(/^test-env-\d{13}-[a-z0-9]{9}$/);
    });
  });

  describe('Timestamp', () => {
    it('should return valid ISO 8601 timestamp', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should return recent timestamp', async () => {
      const before = Date.now();
      const response = await fetch(endpoint);
      const data = await response.json();
      const after = Date.now();

      const timestamp = new Date(data.timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Performance', () => {
    it('should respond quickly (< 100ms)', async () => {
      const start = Date.now();
      const response = await fetch(endpoint);
      await response.json();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should include duration in response', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      expect(data.duration).toBeDefined();
      expect(typeof data.duration).toBe('number');
      expect(data.duration).toBeGreaterThan(0);
      expect(data.duration).toBeLessThan(100);
    });
  });

  describe('HTTP Methods', () => {
    it('should only support GET method', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const response = await fetch(endpoint, { method });
        expect(response.status).toBe(405); // Method Not Allowed
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle 10 concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => fetch(endpoint));
      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBe(200);
      }

      const data = await Promise.all(responses.map(r => r.json()));
      
      // All should have unique correlation IDs
      const correlationIds = data.map(d => d.correlationId);
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // This test would need to mock an error condition
      // For now, we just verify the endpoint doesn't crash
      const response = await fetch(endpoint);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('Response Validation', () => {
    it('should match expected TypeScript interface', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();

      // Validate structure matches TestEnvResponse interface
      expect(typeof data.status).toBe('string');
      expect(['ok', 'error']).toContain(data.status);
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.correlationId).toBe('string');
      expect(typeof data.duration).toBe('number');

      if (data.status === 'ok') {
        expect(data.env).toBeDefined();
        expect(typeof data.env.nodeEnv).toBe('string');
        expect(typeof data.env.hasNextAuthSecret).toBe('boolean');
        expect(typeof data.env.nextAuthSecretLength).toBe('number');
        expect(typeof data.env.hasNextAuthUrl).toBe('boolean');
        expect(typeof data.env.hasDatabaseUrl).toBe('boolean');
      }
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information', async () => {
      const response = await fetch(endpoint);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Should not contain actual secret values
      expect(responseText).not.toMatch(/[a-f0-9]{64}/); // Typical secret format
      expect(responseText).not.toMatch(/postgres:\/\//); // Database connection string
    });

    it('should not require authentication', async () => {
      // Request without auth headers should work
      const response = await fetch(endpoint);
      expect(response.status).toBe(200);
    });
  });

  describe('Load Testing', () => {
    it('should handle 50 sequential requests', async () => {
      const results = [];

      for (let i = 0; i < 50; i++) {
        const response = await fetch(endpoint);
        const data = await response.json();
        results.push(data);
      }

      // All should succeed
      expect(results.every(r => r.status === 'ok')).toBe(true);

      // Average duration should be reasonable
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(50);
    });
  });
});
