/**
 * Azure Cost Reporting Service - Property-Based Tests
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 34.1: Write property test for cost reporting
 * Task 34.2: Write property test for cost optimization
 * **Property 16: Cost report aggregation**
 * **Property 18: Cost optimization recommendations**
 * **Validates: Requirements 5.3, 5.5**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureCostReportingService,
  calculateRequestCost,
  type CostEntry,
  type CostPeriod,
} from '../../../lib/ai/azure/azure-cost-reporting.service';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const accountIdArb = fc.stringMatching(/^account-[a-z0-9]{8}$/);

const creatorIdArb = fc.option(
  fc.stringMatching(/^creator-[a-z0-9]{8}$/),
  { nil: undefined }
);

const deploymentArb = fc.constantFrom(
  'gpt-4-turbo-prod',
  'gpt-4-standard-prod',
  'gpt-35-turbo-prod',
  'text-embedding-ada-002-prod'
);

const modelArb = fc.constantFrom(
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'text-embedding-ada-002'
);

const tierArb = fc.constantFrom('premium', 'standard', 'economy');

const operationArb = fc.constantFrom(
  'chat',
  'completion',
  'embedding',
  'analysis',
  'moderation'
);

const tokenCountArb = fc.integer({ min: 1, max: 10000 });

const costArb = fc.float({ min: Math.fround(0.0001), max: Math.fround(10), noNaN: true });

const successArb = fc.boolean();

const periodArb = fc.constantFrom<CostPeriod>('day', 'week', 'month', 'quarter', 'year');

const timestampArb = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2024-12-31'),
});

const costEntryArb = fc.record({
  timestamp: timestampArb,
  accountId: accountIdArb,
  creatorId: creatorIdArb,
  deployment: deploymentArb,
  model: modelArb,
  tier: tierArb,
  operation: operationArb,
  promptTokens: tokenCountArb,
  completionTokens: tokenCountArb,
  totalTokens: tokenCountArb,
  cost: costArb,
  success: successArb,
}).map(entry => ({
  ...entry,
  id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  totalTokens: entry.promptTokens + entry.completionTokens,
})) as fc.Arbitrary<CostEntry>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Azure Cost Reporting Service - Property-Based Tests', () => {
  let service: AzureCostReportingService;

  beforeEach(() => {
    AzureCostReportingService.resetInstance();
    service = new AzureCostReportingService();
  });

  afterEach(() => {
    service.clearCostEntries();
  });

  /**
   * **Feature: huntaze-ai-azure-migration, Property 16: Cost report aggregation**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any cost report generation, costs should be correctly
   * aggregated by creator, model, and operation type.
   */
  describe('Property 16: Cost report aggregation', () => {
    it('should correctly sum total cost across all entries', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 100 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            // Filter entries with valid timestamps within range
            const validEntries = entries.filter(
              e => !isNaN(e.timestamp.getTime()) && 
                   e.timestamp >= startDate && 
                   e.timestamp <= endDate
            );

            const report = service.generateReport(entries, 'year', startDate, endDate);

            const expectedTotalCost = validEntries.reduce((sum, e) => sum + e.cost, 0);
            expect(report.totalCost).toBeCloseTo(expectedTotalCost, 4);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly sum total tokens across all entries', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 100 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const validEntries = entries.filter(
              e => !isNaN(e.timestamp.getTime()) && 
                   e.timestamp >= startDate && 
                   e.timestamp <= endDate
            );

            const report = service.generateReport(entries, 'year', startDate, endDate);

            const expectedTotalTokens = validEntries.reduce((sum, e) => sum + e.totalTokens, 0);
            expect(report.totalTokens).toBe(expectedTotalTokens);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly count total requests', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 100 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const validEntries = entries.filter(
              e => !isNaN(e.timestamp.getTime()) && 
                   e.timestamp >= startDate && 
                   e.timestamp <= endDate
            );

            const report = service.generateReport(entries, 'year', startDate, endDate);

            expect(report.totalRequests).toBe(validEntries.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly calculate success rate', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 100 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const validEntries = entries.filter(
              e => !isNaN(e.timestamp.getTime()) && 
                   e.timestamp >= startDate && 
                   e.timestamp <= endDate
            );

            if (validEntries.length === 0) return; // Skip if no valid entries

            const report = service.generateReport(entries, 'year', startDate, endDate);

            const successCount = validEntries.filter(e => e.success).length;
            const expectedSuccessRate = successCount / validEntries.length;
            
            expect(report.successRate).toBeCloseTo(expectedSuccessRate, 10);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should aggregate by creator with correct totals', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 50 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const report = service.generateReport(entries, 'year', startDate, endDate);

            if (report.totalRequests === 0) return; // Skip if no valid entries

            // Sum of all creator costs should equal total cost
            const creatorCostSum = report.byCreator.reduce((sum, c) => sum + c.totalCost, 0);
            expect(creatorCostSum).toBeCloseTo(report.totalCost, 4);

            // Sum of all creator requests should equal total requests
            const creatorRequestSum = report.byCreator.reduce((sum, c) => sum + c.requestCount, 0);
            expect(creatorRequestSum).toBe(report.totalRequests);

            // Percentages should sum to 100 (approximately)
            if (report.totalCost > 0) {
              const percentageSum = report.byCreator.reduce((sum, c) => sum + c.percentageOfTotal, 0);
              expect(percentageSum).toBeCloseTo(100, 1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should aggregate by model with correct totals', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 50 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const report = service.generateReport(entries, 'year', startDate, endDate);

            if (report.totalRequests === 0) return; // Skip if no valid entries

            // Sum of all model costs should equal total cost
            const modelCostSum = report.byModel.reduce((sum, m) => sum + m.totalCost, 0);
            expect(modelCostSum).toBeCloseTo(report.totalCost, 4);

            // Sum of all model requests should equal total requests
            const modelRequestSum = report.byModel.reduce((sum, m) => sum + m.requestCount, 0);
            expect(modelRequestSum).toBe(report.totalRequests);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should aggregate by operation with correct totals', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 50 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const report = service.generateReport(entries, 'year', startDate, endDate);

            if (report.totalRequests === 0) return; // Skip if no valid entries

            // Sum of all operation costs should equal total cost
            const operationCostSum = report.byOperation.reduce((sum, o) => sum + o.totalCost, 0);
            expect(operationCostSum).toBeCloseTo(report.totalCost, 4);

            // Sum of all operation requests should equal total requests
            const operationRequestSum = report.byOperation.reduce((sum, o) => sum + o.requestCount, 0);
            expect(operationRequestSum).toBe(report.totalRequests);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should sort breakdowns by cost descending', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 5, maxLength: 50 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const report = service.generateReport(entries, 'year', startDate, endDate);

            // byCreator should be sorted by cost descending
            for (let i = 1; i < report.byCreator.length; i++) {
              expect(report.byCreator[i].totalCost).toBeLessThanOrEqual(report.byCreator[i - 1].totalCost);
            }

            // byModel should be sorted by cost descending
            for (let i = 1; i < report.byModel.length; i++) {
              expect(report.byModel[i].totalCost).toBeLessThanOrEqual(report.byModel[i - 1].totalCost);
            }

            // byOperation should be sorted by cost descending
            for (let i = 1; i < report.byOperation.length; i++) {
              expect(report.byOperation[i].totalCost).toBeLessThanOrEqual(report.byOperation[i - 1].totalCost);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should aggregate by day with correct totals', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 1, maxLength: 50 }),
          (entries) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const report = service.generateReport(entries, 'year', startDate, endDate);

            if (report.totalRequests === 0) return; // Skip if no valid entries

            // Sum of all daily costs should equal total cost
            const dailyCostSum = report.byDay.reduce((sum, d) => sum + d.totalCost, 0);
            expect(dailyCostSum).toBeCloseTo(report.totalCost, 4);

            // Sum of all daily requests should equal total requests
            const dailyRequestSum = report.byDay.reduce((sum, d) => sum + d.requestCount, 0);
            expect(dailyRequestSum).toBe(report.totalRequests);

            // Days should be sorted chronologically
            for (let i = 1; i < report.byDay.length; i++) {
              expect(report.byDay[i].date.getTime()).toBeGreaterThanOrEqual(report.byDay[i - 1].date.getTime());
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: huntaze-ai-azure-migration, Property 18: Cost optimization recommendations**
   * **Validates: Requirements 5.5**
   * 
   * Property: For any account with high costs, the system should generate
   * recommendations for model tier adjustments.
   */
  describe('Property 18: Cost optimization recommendations', () => {
    it('should generate tier downgrade recommendation for high premium usage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          (premiumCount) => {
            // Create entries with >50% premium tier
            const premiumEntries: CostEntry[] = Array(premiumCount).fill(null).map((_, i) => ({
              id: `cost_${i}`,
              timestamp: new Date('2024-01-15'),
              accountId: 'account-test',
              deployment: 'gpt-4-turbo-prod',
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              promptTokens: 100,
              completionTokens: 50,
              totalTokens: 150,
              cost: 0.10,
              success: true,
            }));

            const economyEntries: CostEntry[] = Array(Math.floor(premiumCount / 3)).fill(null).map((_, i) => ({
              id: `cost_economy_${i}`,
              timestamp: new Date('2024-01-15'),
              accountId: 'account-test',
              deployment: 'gpt-35-turbo-prod',
              model: 'gpt-3.5-turbo',
              tier: 'economy',
              operation: 'chat',
              promptTokens: 100,
              completionTokens: 50,
              totalTokens: 150,
              cost: 0.01,
              success: true,
            }));

            const entries = [...premiumEntries, ...economyEntries];
            const report = service.generateReport(entries, 'month', new Date('2024-01-01'), new Date('2024-01-31'));
            const recommendations = service.generateOptimizationRecommendations(entries, report);

            const tierRec = recommendations.find(r => r.type === 'tier_downgrade');
            expect(tierRec).toBeDefined();
            expect(tierRec!.potentialSavings).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should generate model switch recommendation for high GPT-4 usage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          (gpt4Count) => {
            // Create entries with >60% GPT-4 usage
            const gpt4Entries: CostEntry[] = Array(gpt4Count).fill(null).map((_, i) => ({
              id: `cost_${i}`,
              timestamp: new Date('2024-01-15'),
              accountId: 'account-test',
              deployment: 'gpt-4-turbo-prod',
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              promptTokens: 100,
              completionTokens: 50,
              totalTokens: 150,
              cost: 0.10,
              success: true,
            }));

            const gpt35Entries: CostEntry[] = Array(Math.floor(gpt4Count / 4)).fill(null).map((_, i) => ({
              id: `cost_35_${i}`,
              timestamp: new Date('2024-01-15'),
              accountId: 'account-test',
              deployment: 'gpt-35-turbo-prod',
              model: 'gpt-3.5-turbo',
              tier: 'economy',
              operation: 'chat',
              promptTokens: 100,
              completionTokens: 50,
              totalTokens: 150,
              cost: 0.001,
              success: true,
            }));

            const entries = [...gpt4Entries, ...gpt35Entries];
            const report = service.generateReport(entries, 'month', new Date('2024-01-01'), new Date('2024-01-31'));
            const recommendations = service.generateOptimizationRecommendations(entries, report);

            const modelRec = recommendations.find(r => r.type === 'model_switch');
            expect(modelRec).toBeDefined();
            expect(modelRec!.potentialSavings).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should sort recommendations by priority', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 10, maxLength: 50 }),
          (entries) => {
            const report = service.generateReport(entries, 'month', new Date('2024-01-01'), new Date('2024-12-31'));
            const recommendations = service.generateOptimizationRecommendations(entries, report);

            if (recommendations.length > 1) {
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              
              for (let i = 1; i < recommendations.length; i++) {
                expect(priorityOrder[recommendations[i].priority])
                  .toBeGreaterThanOrEqual(priorityOrder[recommendations[i - 1].priority]);
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should include potential savings in all recommendations', () => {
      fc.assert(
        fc.property(
          fc.array(costEntryArb, { minLength: 10, maxLength: 50 }),
          (entries) => {
            const report = service.generateReport(entries, 'month', new Date('2024-01-01'), new Date('2024-12-31'));
            const recommendations = service.generateOptimizationRecommendations(entries, report);

            for (const rec of recommendations) {
              expect(rec.potentialSavings).toBeGreaterThanOrEqual(0);
              expect(rec.potentialSavingsPercent).toBeGreaterThanOrEqual(0);
              expect(rec.title).toBeDefined();
              expect(rec.description).toBeDefined();
              expect(rec.recommendedAction).toBeDefined();
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property: Cost thresholds should trigger correct alert types
   */
  describe('Cost Threshold Properties', () => {
    it('should return correct alert type based on percentage', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 200, noNaN: true }),
          fc.constantFrom<'daily' | 'weekly' | 'monthly'>('daily', 'weekly', 'monthly'),
          (currentCost, thresholdType) => {
            const alert = service.checkThresholds(currentCost, thresholdType);
            const thresholds = service.getThresholds();
            const threshold = thresholds.find(t => t.type === thresholdType);

            if (!threshold) return;

            const percentUsed = (currentCost / threshold.limit) * 100;

            if (percentUsed >= 100) {
              expect(alert).not.toBeNull();
              expect(alert!.type).toBe('exceeded');
            } else if (percentUsed >= threshold.criticalPercent) {
              expect(alert).not.toBeNull();
              expect(alert!.type).toBe('critical');
            } else if (percentUsed >= threshold.warningPercent) {
              expect(alert).not.toBeNull();
              expect(alert!.type).toBe('warning');
            } else {
              expect(alert).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct percentage used', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 200, noNaN: true }),
          (currentCost) => {
            const alert = service.checkThresholds(currentCost, 'daily');
            const thresholds = service.getThresholds();
            const threshold = thresholds.find(t => t.type === 'daily');

            if (alert && threshold) {
              const expectedPercent = (currentCost / threshold.limit) * 100;
              expect(alert.percentUsed).toBeCloseTo(expectedPercent, 5);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Cost calculation should be consistent
   */
  describe('Cost Calculation Properties', () => {
    it('should calculate consistent costs for same inputs', () => {
      fc.assert(
        fc.property(
          deploymentArb,
          tokenCountArb,
          tokenCountArb,
          (deployment, promptTokens, completionTokens) => {
            const cost1 = calculateRequestCost(deployment, promptTokens, completionTokens);
            const cost2 = calculateRequestCost(deployment, promptTokens, completionTokens);

            expect(cost1).toBe(cost2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increase cost with more tokens', () => {
      fc.assert(
        fc.property(
          deploymentArb,
          tokenCountArb,
          tokenCountArb,
          fc.integer({ min: 1, max: 1000 }),
          (deployment, promptTokens, completionTokens, additionalTokens) => {
            const baseCost = calculateRequestCost(deployment, promptTokens, completionTokens);
            const higherCost = calculateRequestCost(deployment, promptTokens + additionalTokens, completionTokens);

            // Cost should increase or stay same (for unknown deployments)
            expect(higherCost).toBeGreaterThanOrEqual(baseCost);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
