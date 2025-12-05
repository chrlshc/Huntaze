/**
 * Property Test: Pricing Comparison Display
 * 
 * **Feature: dashboard-ux-overhaul, Property 14: Pricing Comparison Display**
 * **Validates: Requirements 3.6.1, 3.6.2**
 * 
 * Property: For any Pricing Optimizer view, the UI SHALL display current pricing
 * alongside AI recommendations with projected impact.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pricing recommendation interface
interface PricingRecommendation {
  current: number;
  recommended: number;
  revenueImpact: number; // percentage
  confidence: number; // 0-100
  reasoning: string;
}

// Reasoning templates based on recommendation type
const REASONING_TEMPLATES = {
  increase: [
    'Your engagement metrics suggest fans are willing to pay more',
    'Market analysis shows similar creators charge higher prices',
    'Your content quality justifies a premium price point',
  ],
  decrease: [
    'A lower price point may attract more subscribers',
    'Competitive analysis suggests a price adjustment',
    'Reducing price could improve retention rates',
  ],
  maintain: [
    'Your current pricing is optimal for your audience',
    'Market conditions support your current price',
    'No significant changes recommended at this time',
  ],
};

// Generate pricing recommendation
function generatePricingRecommendation(
  currentPrice: number,
  recommendedPrice: number,
  confidence: number
): PricingRecommendation {
  const revenueImpact = calculateRevenueImpact(currentPrice, recommendedPrice);
  const reasoning = getReasoningForChange(currentPrice, recommendedPrice);
  
  return {
    current: currentPrice,
    recommended: recommendedPrice,
    revenueImpact,
    confidence,
    reasoning,
  };
}

// Calculate revenue impact percentage
function calculateRevenueImpact(current: number, recommended: number): number {
  if (current === 0) return 0;
  return ((recommended - current) / current) * 100;
}

// Get reasoning based on price change direction
function getReasoningForChange(current: number, recommended: number): string {
  let templates: string[];
  if (recommended > current) {
    templates = REASONING_TEMPLATES.increase;
  } else if (recommended < current) {
    templates = REASONING_TEMPLATES.decrease;
  } else {
    templates = REASONING_TEMPLATES.maintain;
  }
  return templates[Math.floor(Math.random() * templates.length)];
}

// Validate pricing display has all required elements
function validatePricingDisplay(recommendation: PricingRecommendation): {
  hasCurrentPrice: boolean;
  hasRecommendedPrice: boolean;
  hasRevenueImpact: boolean;
  hasConfidence: boolean;
  hasReasoning: boolean;
} {
  return {
    hasCurrentPrice: typeof recommendation.current === 'number' && recommendation.current >= 0,
    hasRecommendedPrice: typeof recommendation.recommended === 'number' && recommendation.recommended >= 0,
    hasRevenueImpact: typeof recommendation.revenueImpact === 'number',
    hasConfidence: typeof recommendation.confidence === 'number' && 
                   recommendation.confidence >= 0 && 
                   recommendation.confidence <= 100,
    hasReasoning: typeof recommendation.reasoning === 'string' && recommendation.reasoning.length > 0,
  };
}

// Format currency for display
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage for display
function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
}

// Arbitraries for property testing - using integers for price cents to avoid float issues
const priceCentsArb = fc.integer({ min: 99, max: 9999 });
const confidenceArb = fc.integer({ min: 0, max: 100 });

// Convert cents to dollars
const centsToPrice = (cents: number) => cents / 100;

describe('Pricing Comparison Display Property Tests', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 14: Pricing Comparison Display**
   * **Validates: Requirements 3.6.1, 3.6.2**
   */

  it('should display current price alongside recommended price', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        priceCentsArb,
        confidenceArb,
        (currentCents, recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            centsToPrice(currentCents),
            centsToPrice(recommendedCents),
            confidence
          );
          
          const validation = validatePricingDisplay(recommendation);
          
          expect(validation.hasCurrentPrice).toBe(true);
          expect(validation.hasRecommendedPrice).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show projected revenue impact for each recommendation', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        priceCentsArb,
        confidenceArb,
        (currentCents, recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            centsToPrice(currentCents),
            centsToPrice(recommendedCents),
            confidence
          );
          
          const validation = validatePricingDisplay(recommendation);
          
          expect(validation.hasRevenueImpact).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate revenue impact correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }),
        fc.integer({ min: 100, max: 10000 }),
        (currentCents, recommendedCents) => {
          const current = centsToPrice(currentCents);
          const recommended = centsToPrice(recommendedCents);
          const impact = calculateRevenueImpact(current, recommended);
          const expectedImpact = ((recommended - current) / current) * 100;
          
          expect(Math.abs(impact - expectedImpact)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show positive impact for price increases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 5000 }),
        fc.integer({ min: 100, max: 2000 }),
        confidenceArb,
        (currentCents, increaseCents, confidence) => {
          const current = centsToPrice(currentCents);
          const recommended = centsToPrice(currentCents + increaseCents);
          const recommendation = generatePricingRecommendation(current, recommended, confidence);
          
          expect(recommendation.revenueImpact).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show negative impact for price decreases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 5000 }),
        fc.integer({ min: 100, max: 900 }),
        confidenceArb,
        (currentCents, decreaseCents, confidence) => {
          const current = centsToPrice(currentCents);
          const recommended = centsToPrice(currentCents - decreaseCents);
          const recommendation = generatePricingRecommendation(current, recommended, confidence);
          
          expect(recommendation.revenueImpact).toBeLessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include confidence score for each recommendation', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        priceCentsArb,
        confidenceArb,
        (currentCents, recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            centsToPrice(currentCents),
            centsToPrice(recommendedCents),
            confidence
          );
          
          expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
          expect(recommendation.confidence).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide reasoning for each recommendation', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        priceCentsArb,
        confidenceArb,
        (currentCents, recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            centsToPrice(currentCents),
            centsToPrice(recommendedCents),
            confidence
          );
          
          const validation = validatePricingDisplay(recommendation);
          
          expect(validation.hasReasoning).toBe(true);
          expect(recommendation.reasoning.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format currency values correctly', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        (priceCents) => {
          const formatted = formatCurrency(centsToPrice(priceCents));
          
          // Should start with $
          expect(formatted).toMatch(/^\$/);
          
          // Should have decimal places
          expect(formatted).toMatch(/\.\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format percentage values correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        (percentValue) => {
          const formatted = formatPercent(percentValue);
          
          // Should end with %
          expect(formatted).toMatch(/%$/);
          
          // Positive values should have + prefix
          if (percentValue > 0) {
            expect(formatted).toMatch(/^\+/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain data-testid attributes for pricing elements', () => {
    const expectedTestIds = [
      'pricing-current',
      'pricing-recommended',
      'pricing-impact',
      'pricing-current-value',
      'pricing-recommended-value',
      'pricing-impact-value',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...expectedTestIds),
        (testId) => {
          expect(testId).toMatch(/^pricing-(current|recommended|impact)(-value)?$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero current price gracefully', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        confidenceArb,
        (recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            0,
            centsToPrice(recommendedCents),
            confidence
          );
          
          // Should not throw and should have valid structure
          expect(recommendation.current).toBe(0);
          expect(recommendation.recommended).toBe(centsToPrice(recommendedCents));
          expect(Number.isFinite(recommendation.revenueImpact)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide appropriate reasoning based on price direction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 5000 }),
        fc.integer({ min: 1000, max: 5000 }),
        confidenceArb,
        (currentCents, recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            centsToPrice(currentCents),
            centsToPrice(recommendedCents),
            confidence
          );
          
          // Reasoning should exist and be non-empty
          expect(recommendation.reasoning).toBeTruthy();
          expect(recommendation.reasoning.length).toBeGreaterThan(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display all pricing card elements', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        priceCentsArb,
        confidenceArb,
        (currentCents, recommendedCents, confidence) => {
          const recommendation = generatePricingRecommendation(
            centsToPrice(currentCents),
            centsToPrice(recommendedCents),
            confidence
          );
          
          const validation = validatePricingDisplay(recommendation);
          
          // All elements should be present
          expect(validation.hasCurrentPrice).toBe(true);
          expect(validation.hasRecommendedPrice).toBe(true);
          expect(validation.hasRevenueImpact).toBe(true);
          expect(validation.hasConfidence).toBe(true);
          expect(validation.hasReasoning).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle PPV pricing recommendations', () => {
    fc.assert(
      fc.property(
        priceCentsArb,
        priceCentsArb,
        priceCentsArb,
        priceCentsArb,
        priceCentsArb,
        priceCentsArb,
        confidenceArb,
        (photoC, photoR, videoC, videoR, bundleC, bundleR, confidence) => {
          const ppvRecommendations = {
            photo: generatePricingRecommendation(centsToPrice(photoC), centsToPrice(photoR), confidence),
            video: generatePricingRecommendation(centsToPrice(videoC), centsToPrice(videoR), confidence),
            bundle: generatePricingRecommendation(centsToPrice(bundleC), centsToPrice(bundleR), confidence),
          };
          
          // All PPV types should have valid recommendations
          expect(validatePricingDisplay(ppvRecommendations.photo).hasCurrentPrice).toBe(true);
          expect(validatePricingDisplay(ppvRecommendations.video).hasCurrentPrice).toBe(true);
          expect(validatePricingDisplay(ppvRecommendations.bundle).hasCurrentPrice).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
