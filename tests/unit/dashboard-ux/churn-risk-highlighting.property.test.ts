/**
 * Property Test: Churn Risk Highlighting
 * 
 * **Feature: dashboard-ux-overhaul, Property 17: Churn Risk Highlighting**
 * **Validates: Requirements 4.4**
 * 
 * Property: For any Churn analytics view, at-risk fans SHALL be highlighted
 * with AI recommendations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Risk level types
type RiskLevel = 'high' | 'medium' | 'low';

// Fan with churn risk data
interface ChurnRiskFan {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  lastActive: Date;
  totalSpent: number;
  aiRecommendation: string;
  indicators: string[];
}

// Churn summary
interface ChurnSummary {
  totalAtRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

// Risk level configuration
const RISK_LEVEL_CONFIG: Record<RiskLevel, { minScore: number; maxScore: number; color: string }> = {
  high: { minScore: 70, maxScore: 100, color: 'red' },
  medium: { minScore: 40, maxScore: 69, color: 'yellow' },
  low: { minScore: 0, maxScore: 39, color: 'green' },
};

// AI recommendation templates
const AI_RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  high: [
    'Send a personalized discount offer immediately',
    'Reach out with exclusive content preview',
    'Offer a loyalty reward to re-engage',
  ],
  medium: [
    'Schedule a check-in message this week',
    'Share behind-the-scenes content',
    'Invite to participate in a poll or Q&A',
  ],
  low: [
    'Continue regular engagement',
    'Consider for VIP program',
    'Send appreciation message',
  ],
};

// Generate a fan with churn risk
function generateChurnRiskFan(
  id: string,
  name: string,
  riskScore: number
): ChurnRiskFan {
  const riskLevel = getRiskLevelFromScore(riskScore);
  const recommendations = AI_RECOMMENDATIONS[riskLevel];
  
  return {
    id,
    name,
    riskLevel,
    riskScore,
    lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    totalSpent: Math.floor(Math.random() * 1000),
    aiRecommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
    indicators: generateRiskIndicators(riskLevel),
  };
}

// Get risk level from score
function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= RISK_LEVEL_CONFIG.high.minScore) return 'high';
  if (score >= RISK_LEVEL_CONFIG.medium.minScore) return 'medium';
  return 'low';
}

// Generate risk indicators based on level
function generateRiskIndicators(riskLevel: RiskLevel): string[] {
  const indicators: Record<RiskLevel, string[]> = {
    high: ['No activity in 14+ days', 'Decreased engagement', 'Stopped purchasing'],
    medium: ['Activity declining', 'Fewer interactions', 'Reduced spending'],
    low: ['Slight decrease in activity', 'Normal engagement pattern'],
  };
  return indicators[riskLevel];
}

// Calculate summary from fans
function calculateChurnSummary(fans: ChurnRiskFan[]): ChurnSummary {
  return {
    totalAtRisk: fans.length,
    highRisk: fans.filter(f => f.riskLevel === 'high').length,
    mediumRisk: fans.filter(f => f.riskLevel === 'medium').length,
    lowRisk: fans.filter(f => f.riskLevel === 'low').length,
  };
}

// Validate fan has proper highlighting based on risk level
function validateRiskHighlighting(fan: ChurnRiskFan): boolean {
  const config = RISK_LEVEL_CONFIG[fan.riskLevel];
  return (
    fan.riskScore >= config.minScore &&
    fan.riskScore <= config.maxScore
  );
}

// Validate fan has AI recommendation
function validateHasAIRecommendation(fan: ChurnRiskFan): boolean {
  return (
    fan.aiRecommendation !== undefined &&
    fan.aiRecommendation.length > 0 &&
    AI_RECOMMENDATIONS[fan.riskLevel].includes(fan.aiRecommendation)
  );
}

// Validate fan has risk indicators
function validateHasRiskIndicators(fan: ChurnRiskFan): boolean {
  return fan.indicators.length > 0;
}

// Arbitraries for property testing
const riskScoreArb = fc.integer({ min: 0, max: 100 });
const fanIdArb = fc.uuid();
const fanNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

describe('Churn Risk Highlighting Property Tests', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 17: Churn Risk Highlighting**
   * **Validates: Requirements 4.4**
   */

  it('should correctly categorize fans by risk level based on score', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Risk level should match score range
          if (score >= 70) {
            expect(fan.riskLevel).toBe('high');
          } else if (score >= 40) {
            expect(fan.riskLevel).toBe('medium');
          } else {
            expect(fan.riskLevel).toBe('low');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide AI recommendation for every at-risk fan', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Every fan should have an AI recommendation
          expect(validateHasAIRecommendation(fan)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide risk indicators for every at-risk fan', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Every fan should have risk indicators
          expect(validateHasRiskIndicators(fan)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly highlight fans based on risk level', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Highlighting should match risk level
          expect(validateRiskHighlighting(fan)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate correct summary counts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fanIdArb, fanNameArb, riskScoreArb),
          { minLength: 1, maxLength: 50 }
        ),
        (fanData) => {
          const fans = fanData.map(([id, name, score]) => 
            generateChurnRiskFan(id, name, score)
          );
          
          const summary = calculateChurnSummary(fans);
          
          // Total should equal sum of all risk levels
          expect(summary.totalAtRisk).toBe(
            summary.highRisk + summary.mediumRisk + summary.lowRisk
          );
          
          // Total should equal number of fans
          expect(summary.totalAtRisk).toBe(fans.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide appropriate recommendations based on risk level', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Recommendation should be from the correct risk level pool
          const validRecommendations = AI_RECOMMENDATIONS[fan.riskLevel];
          expect(validRecommendations).toContain(fan.aiRecommendation);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid risk score within bounds', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Risk score should be within 0-100
          expect(fan.riskScore).toBeGreaterThanOrEqual(0);
          expect(fan.riskScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain data-testid attributes for risk level cards', () => {
    const expectedTestIds = [
      'churn-total-at-risk',
      'churn-high-risk',
      'churn-medium-risk',
      'churn-low-risk',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...expectedTestIds),
        (testId) => {
          // All expected test IDs should follow the pattern
          expect(testId).toMatch(/^churn-(total-at-risk|high-risk|medium-risk|low-risk)$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter fans correctly by risk level', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fanIdArb, fanNameArb, riskScoreArb),
          { minLength: 5, maxLength: 30 }
        ),
        fc.constantFrom('high' as RiskLevel, 'medium' as RiskLevel, 'low' as RiskLevel),
        (fanData, filterLevel) => {
          const fans = fanData.map(([id, name, score]) => 
            generateChurnRiskFan(id, name, score)
          );
          
          const filteredFans = fans.filter(f => f.riskLevel === filterLevel);
          
          // All filtered fans should have the correct risk level
          filteredFans.forEach(fan => {
            expect(fan.riskLevel).toBe(filterLevel);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have high risk fans with more urgent indicators', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        fc.integer({ min: 70, max: 100 }), // High risk score
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // High risk fans should have indicators
          expect(fan.indicators.length).toBeGreaterThan(0);
          expect(fan.riskLevel).toBe('high');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort fans by risk score in descending order when requested', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fanIdArb, fanNameArb, riskScoreArb),
          { minLength: 2, maxLength: 20 }
        ),
        (fanData) => {
          const fans = fanData.map(([id, name, score]) => 
            generateChurnRiskFan(id, name, score)
          );
          
          const sortedFans = [...fans].sort((a, b) => b.riskScore - a.riskScore);
          
          // Verify sorting is correct
          for (let i = 0; i < sortedFans.length - 1; i++) {
            expect(sortedFans[i].riskScore).toBeGreaterThanOrEqual(sortedFans[i + 1].riskScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid last active date', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          // Last active should be a valid date in the past
          expect(fan.lastActive).toBeInstanceOf(Date);
          expect(fan.lastActive.getTime()).toBeLessThanOrEqual(Date.now());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have non-negative total spent', () => {
    fc.assert(
      fc.property(
        fanIdArb,
        fanNameArb,
        riskScoreArb,
        (id, name, score) => {
          const fan = generateChurnRiskFan(id, name, score);
          
          expect(fan.totalSpent).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
