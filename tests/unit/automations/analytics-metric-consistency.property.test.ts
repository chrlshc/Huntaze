/**
 * Property Test: Analytics Metric Consistency
 * 
 * **Feature: huntaze-ai-features-coming-soon, Property 11: Analytics Metric Consistency**
 * **Validates: Requirements 9.1**
 * 
 * Property: For any set of execution records, the calculated metrics must be internally consistent:
 * - totalExecutions equals sum of success, failed, and partial counts
 * - successRate is between 0 and 100
 * - successRate equals (successCount / totalExecutions) * 100
 * - All counts are non-negative
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateMetricsFromData,
  validateMetricsConsistency
} from '../../../lib/automations/automation-analytics.service';
import type { ExecutionStatus } from '../../../lib/automations/types';

// ============================================
// Generators
// ============================================

const executionStatusArb = fc.constantFrom<ExecutionStatus>('success', 'failed', 'partial');

const executionRecordArb = fc.record({
  status: executionStatusArb,
  stepsExecuted: fc.integer({ min: 0, max: 100 })
});

const executionListArb = fc.array(executionRecordArb, { minLength: 0, maxLength: 50 });

// ============================================
// Property Tests
// ============================================

describe('Property 11: Analytics Metric Consistency', () => {
  it('total executions equals sum of status counts', () => {
    fc.assert(
      fc.property(executionListArb, (executions) => {
        const metrics = calculateMetricsFromData(executions);
        
        const sumOfCounts = metrics.successCount + metrics.failedCount + metrics.partialCount;
        
        expect(metrics.totalExecutions).toBe(sumOfCounts);
      }),
      { numRuns: 100 }
    );
  });

  it('success rate is between 0 and 100', () => {
    fc.assert(
      fc.property(executionListArb, (executions) => {
        const metrics = calculateMetricsFromData(executions);
        
        expect(metrics.successRate).toBeGreaterThanOrEqual(0);
        expect(metrics.successRate).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('success rate matches calculation from counts', () => {
    fc.assert(
      fc.property(executionListArb, (executions) => {
        const metrics = calculateMetricsFromData(executions);
        
        if (metrics.totalExecutions === 0) {
          expect(metrics.successRate).toBe(0);
        } else {
          const expectedRate = (metrics.successCount / metrics.totalExecutions) * 100;
          expect(metrics.successRate).toBeCloseTo(expectedRate, 5);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all counts are non-negative', () => {
    fc.assert(
      fc.property(executionListArb, (executions) => {
        const metrics = calculateMetricsFromData(executions);
        
        expect(metrics.totalExecutions).toBeGreaterThanOrEqual(0);
        expect(metrics.successCount).toBeGreaterThanOrEqual(0);
        expect(metrics.failedCount).toBeGreaterThanOrEqual(0);
        expect(metrics.partialCount).toBeGreaterThanOrEqual(0);
        expect(metrics.averageStepsExecuted).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('validateMetricsConsistency returns true for valid metrics', () => {
    fc.assert(
      fc.property(executionListArb, (executions) => {
        const metrics = calculateMetricsFromData(executions);
        
        expect(validateMetricsConsistency(metrics)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('empty executions produce zero metrics', () => {
    const metrics = calculateMetricsFromData([]);
    
    expect(metrics.totalExecutions).toBe(0);
    expect(metrics.successCount).toBe(0);
    expect(metrics.failedCount).toBe(0);
    expect(metrics.partialCount).toBe(0);
    expect(metrics.successRate).toBe(0);
    expect(metrics.averageStepsExecuted).toBe(0);
  });
});
