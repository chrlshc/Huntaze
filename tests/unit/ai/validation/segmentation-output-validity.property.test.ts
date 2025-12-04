/**
 * **Feature: aws-ai-system-validation, Property 4: Segmentation Output Validity**
 * **Validates: Requirements 4.1, 4.3, 4.4**
 * 
 * Tests that all fans are categorized into valid segments,
 * churn probability is always in [0, 1], and recommendations are always present.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SegmentationValidator } from '../../../../lib/ai/validation/segmentation-validator';
import { VALID_FAN_SEGMENTS } from '../../../../lib/ai/validation/types';
import type { FanSegment } from '../../../../lib/ai/validation/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Property 4: Segmentation Output Validity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Arbitrary for valid fan segment
  const segmentArb: fc.Arbitrary<FanSegment> = fc.constantFrom(...VALID_FAN_SEGMENTS);

  // Arbitrary for valid churn probability [0, 1]
  const churnProbabilityArb = fc.float({ min: 0, max: 1, noNaN: true });

  // Arbitrary for confidence [0, 1]
  const confidenceArb = fc.float({ min: 0, max: 1, noNaN: true });

  // Arbitrary for segmented fan
  const segmentedFanArb = fc.record({
    fanId: fc.uuid(),
    segment: segmentArb,
    churnProbability: churnProbabilityArb,
    confidence: confidenceArb,
    recommendations: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
  });

  // Arbitrary for valid segmentation API response
  const validSegmentationResponseArb = fc.record({
    success: fc.constant(true),
    segmentedFans: fc.array(segmentedFanArb, { minLength: 1, maxLength: 10 }),
    model: fc.constant('deepseek-r1'),
    summary: fc.option(
      fc.record({
        totalFans: fc.nat({ max: 1000 }),
        segmentCounts: fc.record({
          Whales: fc.nat({ max: 100 }),
          Regulars: fc.nat({ max: 100 }),
          'At-risk': fc.nat({ max: 100 }),
          New: fc.nat({ max: 100 }),
          Dormant: fc.nat({ max: 100 }),
        }),
      }),
      { nil: undefined }
    ),
  });

  // Arbitrary for fan input - use ISO date strings directly
  const isoDateStringArb = fc.integer({ min: 2020, max: 2025 }).chain(year =>
    fc.integer({ min: 1, max: 12 }).chain(month =>
      fc.integer({ min: 1, max: 28 }).map(day =>
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
      )
    )
  );
  
  const fanArb = fc.record({
    id: fc.uuid(),
    name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    totalSpent: fc.option(fc.nat({ max: 100000 }), { nil: undefined }),
    subscriptionDate: fc.option(isoDateStringArb, { nil: undefined }),
    lastActivity: fc.option(isoDateStringArb, { nil: undefined }),
    messageCount: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
  });

  const fansArb = fc.array(fanArb, { minLength: 1, maxLength: 10 });

  it('all fans are categorized into valid segments', async () => {
    await fc.assert(
      fc.asyncProperty(validSegmentationResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(result.validSegments).toBe(true);
        
        // All returned segments should be valid
        for (const segment of result.segments) {
          expect(VALID_FAN_SEGMENTS).toContain(segment);
        }

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('churn probability is always in [0, 1] range', async () => {
    await fc.assert(
      fc.asyncProperty(validSegmentationResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(result.churnProbabilityValid).toBe(true);
        
        // Average churn probability should also be in valid range
        if (result.churnProbability !== undefined) {
          expect(result.churnProbability).toBeGreaterThanOrEqual(0);
          expect(result.churnProbability).toBeLessThanOrEqual(1);
        }

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('recommendations are always present for each fan', async () => {
    await fc.assert(
      fc.asyncProperty(validSegmentationResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(result.hasRecommendations).toBe(true);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('response time is always recorded', async () => {
    await fc.assert(
      fc.asyncProperty(validSegmentationResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(typeof result.responseTimeMs).toBe('number');
        expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('model is recorded (should be deepseek-r1)', async () => {
    await fc.assert(
      fc.asyncProperty(validSegmentationResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(typeof result.model).toBe('string');
        expect(result.model.length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('invalid segments are detected', async () => {
    const invalidSegmentedFanArb = fc.record({
      fanId: fc.uuid(),
      segment: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !VALID_FAN_SEGMENTS.includes(s as FanSegment)),
      churnProbability: churnProbabilityArb,
      confidence: confidenceArb,
      recommendations: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
    });

    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      segmentedFans: fc.array(invalidSegmentedFanArb, { minLength: 1, maxLength: 5 }),
      model: fc.constant('deepseek-r1'),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(result.validSegments).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('invalid churn probabilities are detected', async () => {
    const invalidChurnArb = fc.oneof(
      fc.float({ min: Math.fround(1.01), max: Math.fround(10) }),
      fc.float({ min: Math.fround(-10), max: Math.fround(-0.01) })
    );

    const invalidSegmentedFanArb = fc.record({
      fanId: fc.uuid(),
      segment: segmentArb,
      churnProbability: invalidChurnArb,
      confidence: confidenceArb,
      recommendations: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
    });

    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      segmentedFans: fc.array(invalidSegmentedFanArb, { minLength: 1, maxLength: 5 }),
      model: fc.constant('deepseek-r1'),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(result.churnProbabilityValid).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('missing recommendations are detected', async () => {
    const noRecommendationsArb = fc.record({
      fanId: fc.uuid(),
      segment: segmentArb,
      churnProbability: churnProbabilityArb,
      confidence: confidenceArb,
      recommendations: fc.constant([]), // Empty recommendations
    });

    const invalidResponseArb = fc.record({
      success: fc.constant(true),
      segmentedFans: fc.array(noRecommendationsArb, { minLength: 1, maxLength: 5 }),
      model: fc.constant('deepseek-r1'),
    });

    await fc.assert(
      fc.asyncProperty(invalidResponseArb, fansArb, async (responseData, fans) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const validator = new SegmentationValidator('http://test-api/segment');
        const result = await validator.validateFanSegmentation(fans);

        expect(result.hasRecommendations).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('HTTP errors result in failed validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fansArb,
        async (statusCode, fans) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: statusCode,
            statusText: 'Error',
          });

          const validator = new SegmentationValidator('http://test-api/segment');
          const result = await validator.validateFanSegmentation(fans);

          expect(result.success).toBe(false);
          expect(result.error).toContain(`HTTP ${statusCode}`);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('SegmentationValidator static methods', () => {
  it('validateSegmentedFanStructure accepts valid fans', () => {
    const validFanArb = fc.record({
      fanId: fc.uuid(),
      segment: fc.constantFrom(...VALID_FAN_SEGMENTS),
      churnProbability: fc.float({ min: 0, max: 1, noNaN: true }),
      confidence: fc.float({ min: 0, max: 1, noNaN: true }),
      recommendations: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
    });

    fc.assert(
      fc.property(validFanArb, (fan) => {
        expect(SegmentationValidator.validateSegmentedFanStructure(fan)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('validateSegmentedFanStructure rejects invalid fans', () => {
    // Invalid segment
    expect(SegmentationValidator.validateSegmentedFanStructure({
      fanId: '123',
      segment: 'InvalidSegment',
      churnProbability: 0.5,
      confidence: 0.8,
      recommendations: [],
    })).toBe(false);

    // Invalid churn probability
    expect(SegmentationValidator.validateSegmentedFanStructure({
      fanId: '123',
      segment: 'Whales',
      churnProbability: 1.5,
      confidence: 0.8,
      recommendations: [],
    })).toBe(false);

    // Null input
    expect(SegmentationValidator.validateSegmentedFanStructure(null)).toBe(false);
  });

  it('getValidSegments returns all valid segments', () => {
    const segments = SegmentationValidator.getValidSegments();
    
    expect(segments).toContain('Whales');
    expect(segments).toContain('Regulars');
    expect(segments).toContain('At-risk');
    expect(segments).toContain('New');
    expect(segments).toContain('Dormant');
    expect(segments.length).toBe(5);
  });
});
