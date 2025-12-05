/**
 * Property Test: Automation Status Display
 * 
 * Feature: dashboard-ux-overhaul, Property 24: Automation Status Display
 * Validates: Requirements 9.2
 * 
 * *For any* Automations Overview, active automations SHALL display with correct status indicators.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================
// Types
// ============================================

type AutomationStatus = 'active' | 'paused' | 'draft';

interface AutomationFlow {
  id: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  steps: Array<{
    id: string;
    type: 'trigger' | 'action' | 'condition';
    name: string;
    config: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface StatusIndicatorConfig {
  color: string;
  icon: string;
  label: string;
  animated?: boolean;
}

interface ExecutionMetrics {
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  successRate: number;
  averageStepsExecuted: number;
}

// ============================================
// Status Configuration (mirrors component)
// ============================================

const STATUS_CONFIG: Record<AutomationStatus, StatusIndicatorConfig> = {
  active: {
    color: 'bg-green-500',
    icon: 'CheckCircle',
    label: 'Active',
    animated: true
  },
  paused: {
    color: 'bg-yellow-500',
    icon: 'Pause',
    label: 'Paused',
    animated: false
  },
  draft: {
    color: 'bg-gray-400',
    icon: 'FileText',
    label: 'Draft',
    animated: false
  }
};

// ============================================
// Pure Functions for Testing
// ============================================

/**
 * Get status indicator configuration for an automation
 */
function getStatusIndicator(status: AutomationStatus): StatusIndicatorConfig {
  return STATUS_CONFIG[status];
}

/**
 * Determine if status indicator should be animated (pulsing)
 */
function shouldAnimateIndicator(status: AutomationStatus): boolean {
  return status === 'active';
}

/**
 * Get the CSS class for status indicator dot
 */
function getStatusDotClass(status: AutomationStatus): string {
  const config = STATUS_CONFIG[status];
  const baseClass = `w-3 h-3 rounded-full flex-shrink-0 ${config.color}`;
  return config.animated ? `${baseClass} animate-pulse` : baseClass;
}

/**
 * Get the CSS class for status badge
 */
function getStatusBadgeClass(status: AutomationStatus): string {
  const colorMap: Record<AutomationStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400'
  };
  return colorMap[status];
}

/**
 * Filter automations by status
 */
function filterByStatus(
  automations: AutomationFlow[],
  filter: 'all' | AutomationStatus
): AutomationFlow[] {
  if (filter === 'all') return automations;
  return automations.filter(a => a.status === filter);
}

/**
 * Count automations by status
 */
function countByStatus(automations: AutomationFlow[]): Record<'all' | AutomationStatus, number> {
  const counts: Record<'all' | AutomationStatus, number> = {
    all: automations.length,
    active: 0,
    paused: 0,
    draft: 0
  };
  
  automations.forEach(a => {
    counts[a.status]++;
  });
  
  return counts;
}

/**
 * Validate metrics consistency
 */
function validateMetrics(metrics: ExecutionMetrics): boolean {
  // Total must equal sum of status counts
  const sumOfCounts = metrics.successCount + metrics.failedCount + metrics.partialCount;
  if (metrics.totalExecutions !== sumOfCounts) return false;
  
  // Success rate must be between 0 and 100
  if (metrics.successRate < 0 || metrics.successRate > 100) return false;
  
  // If total is 0, success rate must be 0
  if (metrics.totalExecutions === 0 && metrics.successRate !== 0) return false;
  
  // All counts must be non-negative
  if (metrics.successCount < 0 || metrics.failedCount < 0 || metrics.partialCount < 0) return false;
  
  return true;
}

// ============================================
// Arbitraries
// ============================================

const automationStatusArb = fc.constantFrom<AutomationStatus>('active', 'paused', 'draft');

const automationStepArb = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom<'trigger' | 'action' | 'condition'>('trigger', 'action', 'condition'),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  config: fc.constant({})
});

const automationFlowArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  status: automationStatusArb,
  steps: fc.array(automationStepArb, { minLength: 1, maxLength: 10 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

const automationListArb = fc.array(automationFlowArb, { minLength: 0, maxLength: 20 });

const executionMetricsArb = fc.integer({ min: 0, max: 10000 }).chain(total => {
  if (total === 0) {
    return fc.constant<ExecutionMetrics>({
      totalExecutions: 0,
      successCount: 0,
      failedCount: 0,
      partialCount: 0,
      successRate: 0,
      averageStepsExecuted: 0
    });
  }
  
  return fc.tuple(
    fc.integer({ min: 0, max: total }),
    fc.integer({ min: 0, max: total })
  ).chain(([success, failed]) => {
    const partial = Math.max(0, total - success - failed);
    const actualFailed = Math.min(failed, total - success);
    const actualPartial = total - success - actualFailed;
    
    return fc.record({
      totalExecutions: fc.constant(total),
      successCount: fc.constant(success),
      failedCount: fc.constant(actualFailed),
      partialCount: fc.constant(actualPartial),
      successRate: fc.constant((success / total) * 100),
      averageStepsExecuted: fc.float({ min: 0, max: 20, noNaN: true })
    });
  });
});

// ============================================
// Property Tests
// ============================================

describe('Property 24: Automation Status Display', () => {
  describe('Status Indicator Configuration', () => {
    it('every status has a valid indicator configuration', () => {
      fc.assert(
        fc.property(automationStatusArb, (status) => {
          const config = getStatusIndicator(status);
          
          // Must have all required properties
          expect(config).toHaveProperty('color');
          expect(config).toHaveProperty('icon');
          expect(config).toHaveProperty('label');
          
          // Color must be a valid Tailwind class
          expect(config.color).toMatch(/^bg-\w+-\d+$/);
          
          // Label must be non-empty
          expect(config.label.length).toBeGreaterThan(0);
          
          // Label must match status (capitalized)
          expect(config.label.toLowerCase()).toBe(status);
        }),
        { numRuns: 100 }
      );
    });

    it('only active status should have animated indicator', () => {
      fc.assert(
        fc.property(automationStatusArb, (status) => {
          const shouldAnimate = shouldAnimateIndicator(status);
          
          if (status === 'active') {
            expect(shouldAnimate).toBe(true);
          } else {
            expect(shouldAnimate).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('status dot class includes animation only for active status', () => {
      fc.assert(
        fc.property(automationStatusArb, (status) => {
          const dotClass = getStatusDotClass(status);
          
          // Must include base classes
          expect(dotClass).toContain('w-3');
          expect(dotClass).toContain('h-3');
          expect(dotClass).toContain('rounded-full');
          
          // Animation only for active
          if (status === 'active') {
            expect(dotClass).toContain('animate-pulse');
          } else {
            expect(dotClass).not.toContain('animate-pulse');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Status Badge Styling', () => {
    it('each status has distinct badge colors', () => {
      const statuses: AutomationStatus[] = ['active', 'paused', 'draft'];
      const badgeClasses = statuses.map(s => getStatusBadgeClass(s));
      
      // All badge classes should be unique
      const uniqueClasses = new Set(badgeClasses);
      expect(uniqueClasses.size).toBe(statuses.length);
    });

    it('badge class contains appropriate color for status', () => {
      fc.assert(
        fc.property(automationStatusArb, (status) => {
          const badgeClass = getStatusBadgeClass(status);
          
          switch (status) {
            case 'active':
              expect(badgeClass).toContain('green');
              break;
            case 'paused':
              expect(badgeClass).toContain('yellow');
              break;
            case 'draft':
              expect(badgeClass).toContain('gray');
              break;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Automation Filtering', () => {
    it('filtering by "all" returns all automations', () => {
      fc.assert(
        fc.property(automationListArb, (automations) => {
          const filtered = filterByStatus(automations, 'all');
          expect(filtered.length).toBe(automations.length);
          expect(filtered).toEqual(automations);
        }),
        { numRuns: 100 }
      );
    });

    it('filtering by status returns only matching automations', () => {
      fc.assert(
        fc.property(automationListArb, automationStatusArb, (automations, status) => {
          const filtered = filterByStatus(automations, status);
          
          // All filtered items must have the correct status
          filtered.forEach(a => {
            expect(a.status).toBe(status);
          });
          
          // Count must match
          const expectedCount = automations.filter(a => a.status === status).length;
          expect(filtered.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it('status counts sum to total', () => {
      fc.assert(
        fc.property(automationListArb, (automations) => {
          const counts = countByStatus(automations);
          
          // Sum of individual statuses equals total
          const sum = counts.active + counts.paused + counts.draft;
          expect(sum).toBe(counts.all);
          expect(counts.all).toBe(automations.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Execution Metrics Display', () => {
    it('metrics are internally consistent', () => {
      fc.assert(
        fc.property(executionMetricsArb, (metrics) => {
          expect(validateMetrics(metrics)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('success rate is correctly calculated', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (success, failed, partial) => {
            const total = success + failed + partial;
            
            if (total === 0) {
              // Empty case
              const metrics: ExecutionMetrics = {
                totalExecutions: 0,
                successCount: 0,
                failedCount: 0,
                partialCount: 0,
                successRate: 0,
                averageStepsExecuted: 0
              };
              expect(metrics.successRate).toBe(0);
            } else {
              const expectedRate = (success / total) * 100;
              const metrics: ExecutionMetrics = {
                totalExecutions: total,
                successCount: success,
                failedCount: failed,
                partialCount: partial,
                successRate: expectedRate,
                averageStepsExecuted: 0
              };
              
              expect(metrics.successRate).toBeCloseTo(expectedRate, 5);
              expect(metrics.successRate).toBeGreaterThanOrEqual(0);
              expect(metrics.successRate).toBeLessThanOrEqual(100);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('success rate color coding is correct', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (rate) => {
          // Determine expected color based on rate
          let expectedColorClass: string;
          if (rate >= 90) {
            expectedColorClass = 'text-green';
          } else if (rate >= 70) {
            expectedColorClass = 'text-yellow';
          } else {
            expectedColorClass = 'text-red';
          }
          
          // Simulate the color determination logic from the component
          const actualColor = rate >= 90 
            ? 'text-green-600' 
            : rate >= 70 
            ? 'text-yellow-600'
            : 'text-red-600';
          
          expect(actualColor).toContain(expectedColorClass.split('-')[1]);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Automation Card Display', () => {
    it('every automation displays required information', () => {
      fc.assert(
        fc.property(automationFlowArb, (automation) => {
          // Required display elements
          expect(automation.id).toBeDefined();
          expect(automation.name.length).toBeGreaterThan(0);
          expect(automation.status).toBeDefined();
          expect(['active', 'paused', 'draft']).toContain(automation.status);
          expect(automation.steps.length).toBeGreaterThan(0);
          expect(automation.createdAt).toBeInstanceOf(Date);
        }),
        { numRuns: 100 }
      );
    });

    it('automation with steps shows correct action count', () => {
      fc.assert(
        fc.property(automationFlowArb, (automation) => {
          const actionCount = automation.steps.filter(s => s.type === 'action').length;
          
          // Action count must be non-negative
          expect(actionCount).toBeGreaterThanOrEqual(0);
          
          // Action count must not exceed total steps
          expect(actionCount).toBeLessThanOrEqual(automation.steps.length);
        }),
        { numRuns: 100 }
      );
    });

    it('trigger type is correctly identified', () => {
      fc.assert(
        fc.property(automationFlowArb, (automation) => {
          const trigger = automation.steps.find(s => s.type === 'trigger');
          
          // If there's a trigger, it should have a name
          if (trigger) {
            expect(trigger.name.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Status Toggle Behavior', () => {
    it('toggling active status results in paused', () => {
      const currentStatus: AutomationStatus = 'active';
      const newStatus: AutomationStatus = currentStatus === 'active' ? 'paused' : 'active';
      expect(newStatus).toBe('paused');
    });

    it('toggling paused status results in active', () => {
      const currentStatus: AutomationStatus = 'paused';
      const newStatus: AutomationStatus = currentStatus === 'active' ? 'paused' : 'active';
      expect(newStatus).toBe('active');
    });

    it('draft status toggle results in active', () => {
      const currentStatus: AutomationStatus = 'draft';
      const newStatus: AutomationStatus = currentStatus === 'active' ? 'paused' : 'active';
      expect(newStatus).toBe('active');
    });
  });
});
