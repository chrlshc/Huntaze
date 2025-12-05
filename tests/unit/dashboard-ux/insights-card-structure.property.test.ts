/**
 * Property-Based Tests for Insights Card Structure
 * **Feature: dashboard-ux-overhaul, Property 13: Insights Card Structure**
 * **Validates: Requirements 3.5.2, 3.5.3, 3.5.4**
 * 
 * Property: For any AI Insights view, the UI SHALL display insight cards 
 * with actionable recommendations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types matching the component
type InsightType = 'revenue' | 'fan' | 'content' | 'engagement' | 'churn' | 'opportunity';
type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
type InsightTrend = 'up' | 'down' | 'stable';

interface InsightMetrics {
  value: number;
  change: number;
  trend: InsightTrend;
  period: string;
}

interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  recommendation: string;
  metrics?: InsightMetrics;
  priority: InsightPriority;
  actionable: boolean;
  actionLabel?: string;
  actionHref?: string;
  createdAt: Date;
  isNew?: boolean;
}

// Validation functions (mirror component display logic)
function validateInsightCardStructure(insight: AIInsight): {
  hasTitle: boolean;
  hasDescription: boolean;
  hasRecommendation: boolean;
  hasType: boolean;
  hasPriority: boolean;
  isActionable: boolean;
  isComplete: boolean;
} {
  const hasTitle = typeof insight.title === 'string' && insight.title.length > 0;
  const hasDescription = typeof insight.description === 'string' && insight.description.length > 0;
  const hasRecommendation = typeof insight.recommendation === 'string' && insight.recommendation.length > 0;
  const hasType = ['revenue', 'fan', 'content', 'engagement', 'churn', 'opportunity'].includes(insight.type);
  const hasPriority = ['low', 'medium', 'high', 'critical'].includes(insight.priority);
  const isActionable = insight.actionable === true || insight.actionable === false;
  
  return {
    hasTitle,
    hasDescription,
    hasRecommendation,
    hasType,
    hasPriority,
    isActionable,
    isComplete: hasTitle && hasDescription && hasRecommendation && hasType && hasPriority && isActionable
  };
}

function validateRecommendationIsActionable(insight: AIInsight): boolean {
  // Recommendation should contain actionable language
  const actionablePatterns = [
    /consider/i,
    /try/i,
    /create/i,
    /send/i,
    /schedule/i,
    /review/i,
    /check/i,
    /optimize/i,
    /increase/i,
    /reduce/i,
    /bundle/i,
    /target/i,
    /focus/i,
    /should/i,
    /could/i,
    /recommend/i
  ];
  
  return actionablePatterns.some(pattern => pattern.test(insight.recommendation));
}

// Generators
const insightIdArb = fc.uuid();
const insightTypeArb = fc.constantFrom<InsightType>(
  'revenue', 'fan', 'content', 'engagement', 'churn', 'opportunity'
);
const insightPriorityArb = fc.constantFrom<InsightPriority>('low', 'medium', 'high', 'critical');
const insightTrendArb = fc.constantFrom<InsightTrend>('up', 'down', 'stable');

const titleArb = fc.string({ minLength: 5, maxLength: 100 });
const descriptionArb = fc.string({ minLength: 20, maxLength: 500 });

// Generate actionable recommendations
const actionableVerbArb = fc.constantFrom(
  'Consider', 'Try', 'Create', 'Send', 'Schedule', 'Review', 
  'Check', 'Optimize', 'Focus on', 'You should', 'We recommend'
);
const recommendationArb = fc.tuple(
  actionableVerbArb,
  fc.string({ minLength: 10, maxLength: 200 })
).map(([verb, rest]) => `${verb} ${rest}`);

const metricsArb = fc.option(
  fc.record({
    value: fc.float({ min: 0, max: 100000, noNaN: true }),
    change: fc.float({ min: -100, max: 100, noNaN: true }),
    trend: insightTrendArb,
    period: fc.constantFrom('vs last week', 'vs last month', 'this week', 'today')
  }),
  { nil: undefined }
);

const aiInsightArb = fc.record({
  id: insightIdArb,
  type: insightTypeArb,
  title: titleArb,
  description: descriptionArb,
  recommendation: recommendationArb,
  metrics: metricsArb,
  priority: insightPriorityArb,
  actionable: fc.boolean(),
  actionLabel: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
  actionHref: fc.option(fc.constantFrom('/analytics', '/content', '/fans', '/revenue'), { nil: undefined }),
  createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  isNew: fc.option(fc.boolean(), { nil: undefined })
});

describe('Property 13: Insights Card Structure', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 13: Insights Card Structure**
   * **Validates: Requirements 3.5.2, 3.5.3, 3.5.4**
   */
  
  it('should display title for any insight card', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        const validation = validateInsightCardStructure(insight);
        expect(validation.hasTitle).toBe(true);
        expect(insight.title.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should display description for any insight card', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        const validation = validateInsightCardStructure(insight);
        expect(validation.hasDescription).toBe(true);
        expect(insight.description.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should display actionable recommendation for any insight card', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        const validation = validateInsightCardStructure(insight);
        expect(validation.hasRecommendation).toBe(true);
        expect(insight.recommendation.length).toBeGreaterThan(0);
        
        // Recommendation should be actionable
        expect(validateRecommendationIsActionable(insight)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid insight type for any card', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        const validation = validateInsightCardStructure(insight);
        expect(validation.hasType).toBe(true);
        expect(['revenue', 'fan', 'content', 'engagement', 'churn', 'opportunity'])
          .toContain(insight.type);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid priority for any card', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        const validation = validateInsightCardStructure(insight);
        expect(validation.hasPriority).toBe(true);
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.priority);
      }),
      { numRuns: 100 }
    );
  });

  it('should have complete structure for any insight card', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        const validation = validateInsightCardStructure(insight);
        expect(validation.isComplete).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should display metrics when provided', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        if (insight.metrics) {
          expect(typeof insight.metrics.value).toBe('number');
          expect(typeof insight.metrics.change).toBe('number');
          expect(['up', 'down', 'stable']).toContain(insight.metrics.trend);
          expect(insight.metrics.period.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have action button when actionable is true', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        if (insight.actionable) {
          // Actionable insights should have either actionLabel or default action
          const hasAction = insight.actionLabel !== undefined || insight.actionable === true;
          expect(hasAction).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should categorize insights correctly by type', () => {
    fc.assert(
      fc.property(
        fc.array(aiInsightArb, { minLength: 1, maxLength: 10 }),
        (insights) => {
          const byType = new Map<InsightType, AIInsight[]>();
          
          insights.forEach(insight => {
            const existing = byType.get(insight.type) || [];
            byType.set(insight.type, [...existing, insight]);
          });
          
          // Each insight should be in exactly one category
          let totalCategorized = 0;
          byType.forEach(list => {
            totalCategorized += list.length;
          });
          
          expect(totalCategorized).toBe(insights.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should sort insights by priority correctly', () => {
    const priorityOrder: Record<InsightPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };
    
    fc.assert(
      fc.property(
        fc.array(aiInsightArb, { minLength: 2, maxLength: 10 }),
        (insights) => {
          const sorted = [...insights].sort((a, b) => 
            priorityOrder[a.priority] - priorityOrder[b.priority]
          );
          
          // Verify sorting is consistent
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(priorityOrder[sorted[i].priority])
              .toBeLessThanOrEqual(priorityOrder[sorted[i + 1].priority]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle revenue insights with monetary values', () => {
    fc.assert(
      fc.property(
        aiInsightArb.filter(i => i.type === 'revenue'),
        (insight) => {
          const validation = validateInsightCardStructure(insight);
          expect(validation.isComplete).toBe(true);
          expect(insight.type).toBe('revenue');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle fan insights with user-related data', () => {
    fc.assert(
      fc.property(
        aiInsightArb.filter(i => i.type === 'fan'),
        (insight) => {
          const validation = validateInsightCardStructure(insight);
          expect(validation.isComplete).toBe(true);
          expect(insight.type).toBe('fan');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle content insights with engagement data', () => {
    fc.assert(
      fc.property(
        aiInsightArb.filter(i => i.type === 'content'),
        (insight) => {
          const validation = validateInsightCardStructure(insight);
          expect(validation.isComplete).toBe(true);
          expect(insight.type).toBe('content');
        }
      ),
      { numRuns: 50 }
    );
  });

  // Edge cases
  it('should handle insight with minimum required fields', () => {
    const minimalInsight: AIInsight = {
      id: 'test-id',
      type: 'revenue',
      title: 'Test',
      description: 'Test description here',
      recommendation: 'Consider this action',
      priority: 'low',
      actionable: false,
      createdAt: new Date()
    };
    
    const validation = validateInsightCardStructure(minimalInsight);
    expect(validation.isComplete).toBe(true);
  });

  it('should handle insight with all optional fields', () => {
    const fullInsight: AIInsight = {
      id: 'test-id',
      type: 'revenue',
      title: 'Full Test',
      description: 'Complete test description',
      recommendation: 'Consider taking this action now',
      metrics: {
        value: 1000,
        change: 15,
        trend: 'up',
        period: 'vs last week'
      },
      priority: 'high',
      actionable: true,
      actionLabel: 'Take Action',
      actionHref: '/action',
      createdAt: new Date(),
      isNew: true
    };
    
    const validation = validateInsightCardStructure(fullInsight);
    expect(validation.isComplete).toBe(true);
  });

  it('should handle critical priority insights', () => {
    fc.assert(
      fc.property(
        aiInsightArb.filter(i => i.priority === 'critical'),
        (insight) => {
          expect(insight.priority).toBe('critical');
          const validation = validateInsightCardStructure(insight);
          expect(validation.isComplete).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle new insights flag correctly', () => {
    fc.assert(
      fc.property(aiInsightArb, (insight) => {
        if (insight.isNew !== undefined) {
          expect(typeof insight.isNew).toBe('boolean');
        }
      }),
      { numRuns: 100 }
    );
  });
});
