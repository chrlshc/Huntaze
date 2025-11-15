/**
 * Health Check API - Integration Tests
 * 
 * Tests the /api/health endpoint for basic server health verification
 */

import { describe, it, expect } from 'vitest';
import { GET } from '../../../app/api/health/route';

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return valid status code', async () => {
      const response = await GET();

      // 200 if healthy, 503 if degraded, 500 if unhealthy
      expect([200, 503, 500]).toContain(response.status);
    });

    it('should return valid JSON response', async () => {
      const response = await GET();

      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    it('should include status field', async () => {
      const response = await GET();

      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });

    it('should include timestamp in ISO format', async () => {
      const response = await GET();

      const data = await response.json();
      expect(data.timestamp).toBeDefined();
      
      // Validate ISO 8601 format
      const timestamp = new Date(data.timestamp);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });

    it('should return recent timestamp (within 5 seconds)', async () => {
      const beforeRequest = Date.now();
      
      const response = await GET();

      const afterRequest = Date.now();
      const data = await response.json();
      const responseTime = new Date(data.timestamp).getTime();

      expect(responseTime).toBeGreaterThanOrEqual(beforeRequest);
      expect(responseTime).toBeLessThanOrEqual(afterRequest + 5000);
    });

    it('should have correct Content-Type header', async () => {
      const response = await GET();

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should not require authentication', async () => {
      // Request without auth headers - just call GET directly
      const response = await GET();

      // Should return valid status regardless of auth
      expect([200, 503, 500]).toContain(response.status);
    });

    it('should respond quickly (< 100ms)', async () => {
      const startTime = Date.now();
      
      await GET();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => GET());

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect([200, 503, 500]).toContain(response.status);
      });
    });

    it('should return consistent response structure', async () => {
      const response1 = await GET();
      const response2 = await GET();

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
    });
  });

  describe('Response Validation', () => {
    it('should match expected schema', async () => {
      const response = await GET();

      const data = await response.json();

      // Validate schema
      expect(data).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should not expose sensitive information', async () => {
      const response = await GET();

      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Should not contain sensitive data
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('secret');
      expect(responseText).not.toContain('token');
      expect(responseText).not.toContain('key');
    });

    it('should have minimal response size', async () => {
      const response = await GET();

      const data = await response.json();
      const responseSize = JSON.stringify(data).length;

      // Should be small (< 500 bytes)
      expect(responseSize).toBeLessThan(500);
    });
  });

  describe('Load Testing', () => {
    it('should handle 100 sequential requests', async () => {
      const results = [];

      for (let i = 0; i < 100; i++) {
        const response = await GET();
        results.push(response.status);
      }

      const validCount = results.filter(status => [200, 503, 500].includes(status)).length;
      expect(validCount).toBe(100);
    });

    it('should handle 50 concurrent requests', async () => {
      const requests = Array.from({ length: 50 }, () => GET());

      const responses = await Promise.all(requests);
      const validCount = responses.filter(r => [200, 503, 500].includes(r.status)).length;

      expect(validCount).toBe(50);
    });
  });

  describe('Monitoring Integration', () => {
    it('should be suitable for uptime monitoring', async () => {
      const response = await GET();

      // Fast response (200 or 503 depending on config)
      expect([200, 503]).toContain(response.status);
      
      // Simple response
      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });

    it('should provide consistent response for health checks', async () => {
      const responses = await Promise.all([
        GET(),
        GET(),
        GET(),
      ]);

      const statuses = responses.map(r => r.status);
      expect(new Set(statuses).size).toBe(1); // All same status
      expect([200, 503, 500]).toContain(statuses[0]);
    });
  });
});
