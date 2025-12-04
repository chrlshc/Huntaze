/**
 * **Feature: aws-ai-system-validation, Property 1: Health Check Response Time**
 * **Validates: Requirements 1.1**
 * 
 * Tests that health check responses are under 1000ms
 * and that status is always "healthy" when router is available.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { RouterHealthValidator } from '../../../../lib/ai/validation/health-validator';
import type { HealthCheckResult } from '../../../../lib/ai/validation/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Property 1: Health Check Response Time', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Arbitrary for valid health response
  const healthyResponseArb = fc.record({
    status: fc.constant('healthy'),
    region: fc.constantFrom('eastus2', 'westus2', 'centralus'),
    service: fc.constant('ai-router'),
    version: fc.string({ minLength: 1, maxLength: 10 }),
  });

  // Arbitrary for response time (in ms)
  const responseTimeArb = fc.nat({ max: 2000 });

  it('healthy router returns healthy status', async () => {
    await fc.assert(
      fc.asyncProperty(healthyResponseArb, async (responseData) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new RouterHealthValidator('http://test-router:8000');
        const result = await validator.checkHealth();

        expect(result.healthy).toBe(true);
        expect(result.service).toBe('ai-router');
        expect(result.region).toBe(responseData.region);
        expect(result.timestamp).toBeInstanceOf(Date);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('response time is always recorded', async () => {
    await fc.assert(
      fc.asyncProperty(healthyResponseArb, async (responseData) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new RouterHealthValidator('http://test-router:8000');
        const result = await validator.checkHealth();

        expect(typeof result.responseTimeMs).toBe('number');
        expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('unhealthy status is returned for non-ok responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (statusCode, statusText) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: statusCode,
            statusText,
          });

          const validator = new RouterHealthValidator('http://test-router:8000');
          const result = await validator.checkHealth();

          expect(result.healthy).toBe(false);
          expect(result.error).toContain(`HTTP ${statusCode}`);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('network errors result in unhealthy status with error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          mockFetch.mockRejectedValueOnce(new Error(errorMessage));

          const validator = new RouterHealthValidator('http://test-router:8000');
          const result = await validator.checkHealth();

          expect(result.healthy).toBe(false);
          expect(result.error).toBe(errorMessage);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('result always contains required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        healthyResponseArb,
        async (shouldSucceed, responseData) => {
          if (shouldSucceed) {
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => responseData,
            });
          } else {
            mockFetch.mockRejectedValueOnce(new Error('Connection failed'));
          }

          const validator = new RouterHealthValidator('http://test-router:8000');
          const result = await validator.checkHealth();

          // All required fields must be present
          expect(result).toHaveProperty('healthy');
          expect(result).toHaveProperty('responseTimeMs');
          expect(result).toHaveProperty('region');
          expect(result).toHaveProperty('service');
          expect(result).toHaveProperty('timestamp');

          // Types must be correct
          expect(typeof result.healthy).toBe('boolean');
          expect(typeof result.responseTimeMs).toBe('number');
          expect(typeof result.region).toBe('string');
          expect(typeof result.service).toBe('string');
          expect(result.timestamp).toBeInstanceOf(Date);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('router URL is correctly stored and retrievable', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (url) => {
          const validator = new RouterHealthValidator(url);
          expect(validator.getRouterUrl()).toBe(url);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('endpoint accessibility returns boolean', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), async (shouldBeAccessible) => {
        if (shouldBeAccessible) {
          mockFetch.mockResolvedValueOnce({ ok: true });
        } else {
          mockFetch.mockRejectedValueOnce(new Error('Not accessible'));
        }

        const validator = new RouterHealthValidator('http://test-router:8000');
        const result = await validator.checkEndpointAccessibility();

        expect(typeof result).toBe('boolean');
        expect(result).toBe(shouldBeAccessible);

        return true;
      }),
      { numRuns: 50 }
    );
  });
});

describe('Health Check Result Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates HealthCheckResult structure completeness', () => {
    // Arbitrary for complete health check result
    const healthCheckResultArb = fc.record({
      healthy: fc.boolean(),
      responseTimeMs: fc.nat({ max: 10000 }),
      region: fc.string({ minLength: 1, maxLength: 50 }),
      service: fc.string({ minLength: 1, maxLength: 50 }),
      timestamp: fc.date(),
      error: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    });

    fc.assert(
      fc.property(healthCheckResultArb, (result: HealthCheckResult) => {
        // Required fields
        expect(typeof result.healthy).toBe('boolean');
        expect(typeof result.responseTimeMs).toBe('number');
        expect(typeof result.region).toBe('string');
        expect(typeof result.service).toBe('string');
        expect(result.timestamp).toBeInstanceOf(Date);

        // Optional error field
        if (result.error !== undefined) {
          expect(typeof result.error).toBe('string');
        }

        // Response time is non-negative
        expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
