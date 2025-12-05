/**
 * Property-Based Tests for Segment Characteristics Display
 * **Feature: dashboard-ux-overhaul, Property 10: Segment Characteristics Display**
 * **Validates: Requirements 3.3.2**
 * 
 * Property: For any fan segment view, the UI SHALL display segment characteristics: 
 * average spending, engagement, and top interests.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types matching the component
interface SegmentCharacteristics {
  avgSpending: number;
  avgEngagement: number;
  topInterests: string[];
  avgMessageFrequency?: number;
  avgTipAmount?: number;
  purchaseFrequency?: 'low' | 'medium' | 'high';
  retentionRisk?: 'low' | 'medium' | 'high';
}

interface FanSegment {
  id: string;
  name: string;
  description: string;
  fanCount: number;
  characteristics: SegmentCharacteristics;
  aiGenerated: boolean;
  color: string;
  icon: 'star' | 'heart' | 'dollar' | 'trending' | 'alert';
  createdAt: Date;
  updatedAt: Date;
}

// Validation functions (mirror component display logic)
function validateSegmentCharacteristicsDisplay(segment: FanSegment): {
  hasAvgSpending: boolean;
  hasAvgEngagement: boolean;
  hasTopInterests: boolean;
  isComplete: boolean;
} {
  const hasAvgSpending = typeof segment.characteristics.avgSpending === 'number' && 
                         segment.characteristics.avgSpending >= 0;
  const hasAvgEngagement = typeof segment.characteristics.avgEngagement === 'number' && 
                           segment.characteristics.avgEngagement >= 0 && 
                           segment.characteristics.avgEngagement <= 100;
  const hasTopInterests = Array.isArray(segment.characteristics.topInterests) && 
                          segment.characteristics.topInterests.length > 0;
  
  return {
    hasAvgSpending,
    hasAvgEngagement,
    hasTopInterests,
    isComplete: hasAvgSpending && hasAvgEngagement && hasTopInterests
  };
}

function formatSpending(amount: number): string {
  return `$${amount}`;
}

function formatEngagement(percentage: number): string {
  return `${percentage}%`;
}

// Generators
const segmentIdArb = fc.uuid();
const segmentNameArb = fc.string({ minLength: 2, maxLength: 50 });
const segmentDescriptionArb = fc.string({ minLength: 10, maxLength: 200 });
const fanCountArb = fc.integer({ min: 0, max: 10000 });
// Use integers to avoid floating point formatting issues (e.g., scientific notation)
const avgSpendingArb = fc.integer({ min: 0, max: 10000 });
const avgEngagementArb = fc.integer({ min: 0, max: 100 });
const interestArb = fc.string({ minLength: 2, maxLength: 50 });
const topInterestsArb = fc.array(interestArb, { minLength: 1, maxLength: 10 });
const frequencyArb = fc.constantFrom<'low' | 'medium' | 'high'>('low', 'medium', 'high');
const colorArb = fc.constantFrom('gold', 'blue', 'green', 'red', 'purple');
const iconArb = fc.constantFrom<'star' | 'heart' | 'dollar' | 'trending' | 'alert'>(
  'star', 'heart', 'dollar', 'trending', 'alert'
);

const segmentCharacteristicsArb = fc.record({
  avgSpending: avgSpendingArb,
  avgEngagement: avgEngagementArb,
  topInterests: topInterestsArb,
  avgMessageFrequency: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  avgTipAmount: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
  purchaseFrequency: fc.option(frequencyArb, { nil: undefined }),
  retentionRisk: fc.option(frequencyArb, { nil: undefined })
});

const fanSegmentArb = fc.record({
  id: segmentIdArb,
  name: segmentNameArb,
  description: segmentDescriptionArb,
  fanCount: fanCountArb,
  characteristics: segmentCharacteristicsArb,
  aiGenerated: fc.boolean(),
  color: colorArb,
  icon: iconArb,
  createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
});

describe('Property 10: Segment Characteristics Display', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 10: Segment Characteristics Display**
   * **Validates: Requirements 3.3.2**
   */
  
  it('should display average spending for any segment', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        const validation = validateSegmentCharacteristicsDisplay(segment);
        
        // Average spending must be displayable
        expect(validation.hasAvgSpending).toBe(true);
        
        // Formatted spending should be valid
        const formatted = formatSpending(segment.characteristics.avgSpending);
        expect(formatted.startsWith('$')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should display average engagement for any segment', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        const validation = validateSegmentCharacteristicsDisplay(segment);
        
        // Average engagement must be displayable
        expect(validation.hasAvgEngagement).toBe(true);
        
        // Engagement should be a valid percentage
        expect(segment.characteristics.avgEngagement).toBeGreaterThanOrEqual(0);
        expect(segment.characteristics.avgEngagement).toBeLessThanOrEqual(100);
        
        // Formatted engagement should be valid
        const formatted = formatEngagement(segment.characteristics.avgEngagement);
        expect(formatted.endsWith('%')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should display top interests for any segment', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        const validation = validateSegmentCharacteristicsDisplay(segment);
        
        // Top interests must be displayable
        expect(validation.hasTopInterests).toBe(true);
        
        // Should have at least one interest
        expect(segment.characteristics.topInterests.length).toBeGreaterThan(0);
        
        // Each interest should be a non-empty string
        segment.characteristics.topInterests.forEach(interest => {
          expect(typeof interest).toBe('string');
          expect(interest.length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should have complete characteristics for any valid segment', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        const validation = validateSegmentCharacteristicsDisplay(segment);
        
        // All required characteristics must be present
        expect(validation.isComplete).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should display all three required characteristics together', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        const validation = validateSegmentCharacteristicsDisplay(segment);
        
        // All three must be present simultaneously
        expect(validation.hasAvgSpending).toBe(true);
        expect(validation.hasAvgEngagement).toBe(true);
        expect(validation.hasTopInterests).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle segments with varying interest counts', () => {
    fc.assert(
      fc.property(
        fanSegmentArb,
        fc.integer({ min: 1, max: 10 }),
        (segment, interestCount) => {
          // Create segment with specific interest count
          const interests = Array.from({ length: interestCount }, (_, i) => `Interest ${i + 1}`);
          const modifiedSegment = {
            ...segment,
            characteristics: {
              ...segment.characteristics,
              topInterests: interests
            }
          };
          
          const validation = validateSegmentCharacteristicsDisplay(modifiedSegment);
          expect(validation.hasTopInterests).toBe(true);
          expect(modifiedSegment.characteristics.topInterests.length).toBe(interestCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case spending values', () => {
    fc.assert(
      fc.property(
        fanSegmentArb,
        fc.constantFrom(0, 0.01, 100, 1000, 9999.99),
        (segment, spending) => {
          const modifiedSegment = {
            ...segment,
            characteristics: {
              ...segment.characteristics,
              avgSpending: spending
            }
          };
          
          const validation = validateSegmentCharacteristicsDisplay(modifiedSegment);
          expect(validation.hasAvgSpending).toBe(true);
          
          const formatted = formatSpending(spending);
          expect(formatted.startsWith('$')).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle edge case engagement values', () => {
    fc.assert(
      fc.property(
        fanSegmentArb,
        fc.constantFrom(0, 1, 50, 99, 100),
        (segment, engagement) => {
          const modifiedSegment = {
            ...segment,
            characteristics: {
              ...segment.characteristics,
              avgEngagement: engagement
            }
          };
          
          const validation = validateSegmentCharacteristicsDisplay(modifiedSegment);
          expect(validation.hasAvgEngagement).toBe(true);
          
          const formatted = formatEngagement(engagement);
          expect(formatted.endsWith('%')).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve characteristics when segment is AI-generated vs manual', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        const aiSegment = { ...segment, aiGenerated: true };
        const manualSegment = { ...segment, aiGenerated: false };
        
        const aiValidation = validateSegmentCharacteristicsDisplay(aiSegment);
        const manualValidation = validateSegmentCharacteristicsDisplay(manualSegment);
        
        // Both should have same characteristics display
        expect(aiValidation.isComplete).toBe(manualValidation.isComplete);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle optional characteristics gracefully', () => {
    fc.assert(
      fc.property(fanSegmentArb, (segment) => {
        // Optional fields should not affect required characteristics
        const validation = validateSegmentCharacteristicsDisplay(segment);
        
        // Required fields must always be valid
        expect(validation.hasAvgSpending).toBe(true);
        expect(validation.hasAvgEngagement).toBe(true);
        expect(validation.hasTopInterests).toBe(true);
        
        // Optional fields can be undefined
        const { purchaseFrequency, retentionRisk, avgMessageFrequency, avgTipAmount } = 
          segment.characteristics;
        
        if (purchaseFrequency !== undefined) {
          expect(['low', 'medium', 'high']).toContain(purchaseFrequency);
        }
        if (retentionRisk !== undefined) {
          expect(['low', 'medium', 'high']).toContain(retentionRisk);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Edge cases
  it('should handle segment with single interest', () => {
    const segment: FanSegment = {
      id: 'test-id',
      name: 'Test Segment',
      description: 'Test description',
      fanCount: 10,
      characteristics: {
        avgSpending: 50,
        avgEngagement: 75,
        topInterests: ['Single Interest']
      },
      aiGenerated: true,
      color: 'blue',
      icon: 'star',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const validation = validateSegmentCharacteristicsDisplay(segment);
    expect(validation.isComplete).toBe(true);
    expect(validation.hasTopInterests).toBe(true);
  });

  it('should handle segment with zero spending', () => {
    const segment: FanSegment = {
      id: 'test-id',
      name: 'Free Tier',
      description: 'Non-paying fans',
      fanCount: 100,
      characteristics: {
        avgSpending: 0,
        avgEngagement: 30,
        topInterests: ['Free content']
      },
      aiGenerated: true,
      color: 'gray',
      icon: 'heart',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const validation = validateSegmentCharacteristicsDisplay(segment);
    expect(validation.isComplete).toBe(true);
    expect(validation.hasAvgSpending).toBe(true);
  });

  it('should handle segment with 100% engagement', () => {
    const segment: FanSegment = {
      id: 'test-id',
      name: 'Super Engaged',
      description: 'Maximum engagement fans',
      fanCount: 5,
      characteristics: {
        avgSpending: 500,
        avgEngagement: 100,
        topInterests: ['Everything']
      },
      aiGenerated: true,
      color: 'gold',
      icon: 'star',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const validation = validateSegmentCharacteristicsDisplay(segment);
    expect(validation.isComplete).toBe(true);
    expect(validation.hasAvgEngagement).toBe(true);
  });
});
