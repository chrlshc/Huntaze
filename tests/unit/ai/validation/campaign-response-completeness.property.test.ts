/**
 * **Feature: aws-ai-system-validation, Property 3: Campaign Response Completeness**
 * **Validates: Requirements 3.2, 3.3**
 * 
 * Tests that campaigns always include subject, body, variations
 * and that engagement scores are valid numbers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CampaignValidator } from '../../../../lib/ai/validation/campaign-validator';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Property 3: Campaign Response Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Arbitrary for valid engagement score (0-100)
  const engagementScoreArb = fc.float({ min: 0, max: 100, noNaN: true });

  // Arbitrary for campaign variation
  const variationArb = fc.record({
    subject: fc.string({ minLength: 1, maxLength: 200 }),
    body: fc.string({ minLength: 1, maxLength: 2000 }),
    engagementScore: engagementScoreArb,
  });

  // Arbitrary for valid campaign API response
  const validCampaignResponseArb = fc.record({
    success: fc.constant(true),
    campaign: fc.record({
      subject: fc.string({ minLength: 1, maxLength: 200 }),
      body: fc.string({ minLength: 1, maxLength: 2000 }),
      variations: fc.array(variationArb, { minLength: 1, maxLength: 5 }),
    }),
    correlationId: fc.uuid(),
    model: fc.constant('mistral-large'),
  });

  // Arbitrary for campaign request
  const campaignRequestArb = fc.record({
    goal: fc.option(fc.constantFrom('engagement', 'sales', 'retention'), { nil: undefined }),
    audience: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    tone: fc.option(fc.constantFrom('professional', 'casual', 'playful'), { nil: undefined }),
    productType: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  });

  it('valid campaign response has subject, body, and variations', async () => {
    await fc.assert(
      fc.asyncProperty(validCampaignResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        expect(result.success).toBe(true);
        expect(result.hasSubjectLine).toBe(true);
        expect(result.hasBodyContent).toBe(true);
        expect(result.hasVariations).toBe(true);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('engagement scores are always valid numbers between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(validCampaignResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        if (result.success) {
          expect(result.engagementScores.length).toBeGreaterThan(0);
          
          for (const score of result.engagementScores) {
            expect(typeof score).toBe('number');
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
            expect(Number.isNaN(score)).toBe(false);
          }
        }

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('correlation ID is always present for tracing', async () => {
    await fc.assert(
      fc.asyncProperty(validCampaignResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        if (result.success) {
          expect(typeof result.correlationId).toBe('string');
          expect(result.correlationId.length).toBeGreaterThan(0);
        }

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('response time is always recorded', async () => {
    await fc.assert(
      fc.asyncProperty(validCampaignResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        expect(typeof result.responseTimeMs).toBe('number');
        expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('missing subject line is detected', async () => {
    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      campaign: fc.record({
        subject: fc.constant(''), // Empty subject
        body: fc.string({ minLength: 1, maxLength: 2000 }),
        variations: fc.array(variationArb, { minLength: 1, maxLength: 3 }),
      }),
      correlationId: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        expect(result.hasSubjectLine).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('missing body content is detected', async () => {
    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      campaign: fc.record({
        subject: fc.string({ minLength: 1, maxLength: 200 }),
        body: fc.constant(''), // Empty body
        variations: fc.array(variationArb, { minLength: 1, maxLength: 3 }),
      }),
      correlationId: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        expect(result.hasBodyContent).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('missing variations is detected', async () => {
    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      campaign: fc.record({
        subject: fc.string({ minLength: 1, maxLength: 200 }),
        body: fc.string({ minLength: 1, maxLength: 2000 }),
        variations: fc.constant([]), // Empty variations
      }),
      correlationId: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, campaignRequestArb, async (responseData, request) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new CampaignValidator('http://test-api/campaigns');
        const result = await validator.validateCampaignGenerator(request);

        expect(result.hasVariations).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('HTTP errors result in failed validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        campaignRequestArb,
        async (statusCode, request) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: statusCode,
            statusText: 'Error',
          });

          const validator = new CampaignValidator('http://test-api/campaigns');
          const result = await validator.validateCampaignGenerator(request);

          expect(result.success).toBe(false);
          expect(result.error).toContain(`HTTP ${statusCode}`);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('CampaignValidator static methods', () => {
  it('validateVariationStructure accepts valid variations', () => {
    const validVariationArb = fc.record({
      subject: fc.string({ minLength: 1, maxLength: 200 }),
      body: fc.string({ minLength: 1, maxLength: 2000 }),
      engagementScore: fc.float({ min: 0, max: 100, noNaN: true }),
    });

    fc.assert(
      fc.property(validVariationArb, (variation) => {
        expect(CampaignValidator.validateVariationStructure(variation)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('validateVariationStructure rejects invalid variations', () => {
    // Missing subject
    expect(CampaignValidator.validateVariationStructure({
      body: 'Test body',
      engagementScore: 50,
    })).toBe(false);

    // Empty subject
    expect(CampaignValidator.validateVariationStructure({
      subject: '',
      body: 'Test body',
      engagementScore: 50,
    })).toBe(false);

    // Invalid engagement score (out of range)
    expect(CampaignValidator.validateVariationStructure({
      subject: 'Test',
      body: 'Test body',
      engagementScore: 150,
    })).toBe(false);

    // Null input
    expect(CampaignValidator.validateVariationStructure(null)).toBe(false);
  });

  it('areValidEngagementScores validates score arrays', () => {
    const validScoresArb = fc.array(
      fc.float({ min: 0, max: 100, noNaN: true }),
      { minLength: 1, maxLength: 10 }
    );

    fc.assert(
      fc.property(validScoresArb, (scores) => {
        expect(CampaignValidator.areValidEngagementScores(scores)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('areValidEngagementScores rejects invalid scores', () => {
    expect(CampaignValidator.areValidEngagementScores([101])).toBe(false);
    expect(CampaignValidator.areValidEngagementScores([-1])).toBe(false);
    expect(CampaignValidator.areValidEngagementScores([NaN])).toBe(false);
    expect(CampaignValidator.areValidEngagementScores(['50'])).toBe(false);
  });
});
