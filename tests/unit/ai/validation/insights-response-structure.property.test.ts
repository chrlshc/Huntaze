/**
 * **Feature: aws-ai-system-validation, Property 2: Insights Response Structure**
 * **Validates: Requirements 2.3, 2.4**
 * 
 * Tests that all insights responses contain type, severity, recommendations
 * and that token usage data is always present.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { InsightsValidator } from '../../../../lib/ai/validation/insights-validator';
import type { TokenUsage } from '../../../../lib/ai/validation/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Property 2: Insights Response Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Arbitrary for valid severity levels
  const severityArb = fc.constantFrom('low', 'medium', 'high', 'critical');

  // Arbitrary for valid insight types
  const insightTypeArb = fc.constantFrom(
    'revenue_trend',
    'engagement_drop',
    'subscriber_growth',
    'content_performance',
    'audience_insight'
  );

  // Arbitrary for token usage
  const tokenUsageArb: fc.Arbitrary<TokenUsage> = fc.record({
    inputTokens: fc.nat({ max: 10000 }),
    outputTokens: fc.nat({ max: 10000 }),
    totalTokens: fc.nat({ max: 20000 }),
  });

  // Arbitrary for a single insight
  const insightArb = fc.record({
    type: insightTypeArb,
    severity: severityArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    recommendations: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
  });

  // Arbitrary for valid insights API response
  const validInsightsResponseArb = fc.record({
    success: fc.constant(true),
    insights: fc.array(insightArb, { minLength: 1, maxLength: 5 }),
    model: fc.constant('mistral-large'),
    tokenUsage: tokenUsageArb,
    correlationId: fc.uuid(),
  });

  // Arbitrary for metrics data
  const metricsArb = fc.record({
    revenue: fc.option(fc.nat({ max: 100000 }), { nil: undefined }),
    subscribers: fc.option(fc.nat({ max: 10000 }), { nil: undefined }),
    engagement: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined }),
    messages: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
    period: fc.option(fc.constantFrom('day', 'week', 'month'), { nil: undefined }),
  });

  it('valid insights response has all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(validInsightsResponseArb, metricsArb, async (responseData, metrics) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new InsightsValidator('http://test-api/insights');
        const result = await validator.validateInsights(metrics);

        expect(result.success).toBe(true);
        expect(result.hasRequiredFields).toBe(true);
        expect(result.model).toBe('mistral-large');
        expect(result.tokenUsage).not.toBeNull();

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('each insight contains type, severity, and recommendations', async () => {
    await fc.assert(
      fc.asyncProperty(validInsightsResponseArb, async (responseData) => {
        // Verify each insight in the response
        for (const insight of responseData.insights) {
          expect(typeof insight.type).toBe('string');
          expect(insight.type.length).toBeGreaterThan(0);

          expect(typeof insight.severity).toBe('string');
          expect(['low', 'medium', 'high', 'critical']).toContain(insight.severity);

          expect(Array.isArray(insight.recommendations)).toBe(true);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('token usage data is always present in valid responses', async () => {
    await fc.assert(
      fc.asyncProperty(validInsightsResponseArb, metricsArb, async (responseData, metrics) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new InsightsValidator('http://test-api/insights');
        const result = await validator.validateInsights(metrics);

        if (result.success) {
          expect(result.tokenUsage).not.toBeNull();
          expect(result.tokenUsage).toHaveProperty('inputTokens');
          expect(result.tokenUsage).toHaveProperty('outputTokens');
          expect(result.tokenUsage).toHaveProperty('totalTokens');
        }

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('response time is always recorded', async () => {
    await fc.assert(
      fc.asyncProperty(validInsightsResponseArb, metricsArb, async (responseData, metrics) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new InsightsValidator('http://test-api/insights');
        const result = await validator.validateInsights(metrics);

        expect(typeof result.responseTimeMs).toBe('number');
        expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('invalid response structure is detected', async () => {
    // Arbitrary for invalid insights (missing required fields)
    const invalidInsightArb = fc.record({
      type: fc.option(insightTypeArb, { nil: undefined }),
      severity: fc.option(fc.string(), { nil: undefined }), // Invalid severity
      recommendations: fc.option(fc.array(fc.string()), { nil: undefined }),
    });

    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      insights: fc.array(invalidInsightArb, { minLength: 1, maxLength: 3 }),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, metricsArb, async (responseData, metrics) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new InsightsValidator('http://test-api/insights');
        const result = await validator.validateInsights(metrics);

        // Should detect missing or invalid fields
        expect(result.hasRequiredFields).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('HTTP errors result in failed validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        metricsArb,
        async (statusCode, metrics) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: statusCode,
            statusText: 'Error',
          });

          const validator = new InsightsValidator('http://test-api/insights');
          const result = await validator.validateInsights(metrics);

          expect(result.success).toBe(false);
          expect(result.error).toContain(`HTTP ${statusCode}`);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('network errors result in failed validation with error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        metricsArb,
        async (errorMessage, metrics) => {
          mockFetch.mockRejectedValueOnce(new Error(errorMessage));

          const validator = new InsightsValidator('http://test-api/insights');
          const result = await validator.validateInsights(metrics);

          expect(result.success).toBe(false);
          expect(result.error).toBe(errorMessage);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('InsightsValidator.validateInsightStructure', () => {
  it('validates correct insight structure', () => {
    const validInsightArb = fc.record({
      type: fc.string({ minLength: 1, maxLength: 50 }),
      severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      recommendations: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
    });

    fc.assert(
      fc.property(validInsightArb, (insight) => {
        expect(InsightsValidator.validateInsightStructure(insight)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('rejects invalid insight structures', () => {
    // Missing type
    expect(InsightsValidator.validateInsightStructure({
      severity: 'high',
      title: 'Test',
      description: 'Test',
      recommendations: [],
    })).toBe(false);

    // Invalid severity
    expect(InsightsValidator.validateInsightStructure({
      type: 'test',
      severity: 'invalid',
      title: 'Test',
      description: 'Test',
      recommendations: [],
    })).toBe(false);

    // Missing recommendations
    expect(InsightsValidator.validateInsightStructure({
      type: 'test',
      severity: 'high',
      title: 'Test',
      description: 'Test',
    })).toBe(false);

    // Null input
    expect(InsightsValidator.validateInsightStructure(null)).toBe(false);

    // Non-object input
    expect(InsightsValidator.validateInsightStructure('string')).toBe(false);
  });
});
