/**
 * Property Test: Action Execution Resilience
 * 
 * **Feature: huntaze-ai-features-coming-soon, Property 4: Action Execution Resilience**
 * **Validates: Requirements 3.5**
 * 
 * Property: For any automation flow with failing actions, the engine SHALL
 * continue executing subsequent steps and report partial success.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  AutomationEngine,
  resetAutomationEngine,
  registerActionHandler
} from '../../../lib/automations/automation-engine';
import {
  AutomationFlow,
  TriggerContext,
  ActionStep,
  ActionType
} from '../../../lib/automations/types';
import { resetEventSystem } from '../../../lib/automations/event-system';

// ============================================
// Arbitraries
// ============================================

const actionTypeArbitrary = fc.constantFrom<ActionType>(
  'send_message',
  'create_offer',
  'add_tag',
  'wait'
);

function generateActionConfig(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'send_message':
      return { template: 'Hello {{fanUsername}}!', placeholders: {} };
    case 'create_offer':
      return { discountType: 'percentage', discountValue: 10, validDays: 7 };
    case 'add_tag':
      return { tagName: 'vip' };
    case 'wait':
      return { duration: 1, unit: 'seconds' };
    default:
      return {};
  }
}

const actionStepArbitrary = fc.tuple(
  fc.uuid(),
  actionTypeArbitrary
).map(([id, type]) => ({
  id: `step_${id.slice(0, 8)}`,
  type: 'action' as const,
  name: type,
  config: generateActionConfig(type)
}));

const triggerContextArbitrary = fc.record({
  type: fc.constant('new_subscriber' as const),
  userId: fc.integer({ min: 1, max: 10000 }),
  fanId: fc.uuid(),
  data: fc.record({
    fanUsername: fc.string({ minLength: 1, maxLength: 20 })
  }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
});

function createAutomation(steps: ActionStep[]): AutomationFlow {
  return {
    id: `auto_${Date.now()}`,
    userId: 1,
    name: 'Test Automation',
    description: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      { id: 'trigger', type: 'trigger', name: 'new_subscriber', config: {} },
      ...steps
    ]
  };
}

// ============================================
// Property Tests
// ============================================

describe('Property 4: Action Execution Resilience', () => {
  beforeEach(() => {
    resetEventSystem();
    resetAutomationEngine();
    vi.clearAllMocks();
  });

  /**
   * Property: Engine continues executing steps after a failure
   */
  it('should continue executing steps after a failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(actionStepArbitrary, { minLength: 2, maxLength: 5 }),
        triggerContextArbitrary,
        fc.integer({ min: 0, max: 4 }),
        async (steps, trigger, failIndex) => {
          const actualFailIndex = failIndex % steps.length;
          const executedSteps: string[] = [];

          const engine = new AutomationEngine({
            maxRetries: 1,
            retryDelayMs: 1,
            onStepComplete: (result) => {
              executedSteps.push(result.stepId);
            }
          });

          // Register handlers that fail at specific index
          for (const actionType of ['send_message', 'create_offer', 'add_tag', 'wait'] as ActionType[]) {
            registerActionHandler(actionType, async (step) => {
              const stepIndex = steps.findIndex(s => s.id === step.id);
              
              if (stepIndex === actualFailIndex) {
                return {
                  stepId: step.id,
                  success: false,
                  error: 'Simulated failure',
                  duration: 1
                };
              }
              
              return {
                stepId: step.id,
                success: true,
                duration: 1
              };
            });
          }

          const automation = createAutomation(steps);
          const result = await engine.executeFlow(automation, trigger);

          // Property: All steps should be executed regardless of failures
          expect(executedSteps.length).toBe(steps.length);
          
          // Property: Steps executed should match step IDs
          for (const step of steps) {
            expect(executedSteps).toContain(step.id);
          }

          // Property: Status should be 'partial' when some steps fail, 'failed' when all fail
          // Since only one step fails (at actualFailIndex), status should be 'partial' if there are other steps
          const successfulSteps = steps.length - 1; // One step fails
          if (successfulSteps > 0) {
            expect(result.status).toBe('partial');
          } else {
            expect(result.status).toBe('failed');
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: All steps failing results in 'failed' status
   */
  it('should report failed status when all steps fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(actionStepArbitrary, { minLength: 1, maxLength: 5 }),
        triggerContextArbitrary,
        async (steps, trigger) => {
          const engine = new AutomationEngine({
            maxRetries: 1,
            retryDelayMs: 1
          });

          // Register handlers that always fail
          for (const actionType of ['send_message', 'create_offer', 'add_tag', 'wait'] as ActionType[]) {
            registerActionHandler(actionType, async (step) => ({
              stepId: step.id,
              success: false,
              error: 'Always fails',
              duration: 1
            }));
          }

          const automation = createAutomation(steps);
          const result = await engine.executeFlow(automation, trigger);

          // Property: Status should be 'failed' when all steps fail
          expect(result.status).toBe('failed');
          
          // Property: All steps should still be executed
          expect(result.stepsExecuted).toBe(steps.length);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: All steps succeeding results in 'success' status
   */
  it('should report success status when all steps succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(actionStepArbitrary, { minLength: 1, maxLength: 5 }),
        triggerContextArbitrary,
        async (steps, trigger) => {
          const engine = new AutomationEngine({
            maxRetries: 1,
            retryDelayMs: 1
          });

          // Register handlers that always succeed
          for (const actionType of ['send_message', 'create_offer', 'add_tag', 'wait'] as ActionType[]) {
            registerActionHandler(actionType, async (step) => ({
              stepId: step.id,
              success: true,
              duration: 1
            }));
          }

          const automation = createAutomation(steps);
          const result = await engine.executeFlow(automation, trigger);

          // Property: Status should be 'success' when all steps succeed
          expect(result.status).toBe('success');
          
          // Property: All steps should be executed
          expect(result.stepsExecuted).toBe(steps.length);
          
          // Property: No error should be present
          expect(result.error).toBeUndefined();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Retry count matches configuration
   */
  it('should retry failed steps according to config', async () => {
    await fc.assert(
      fc.asyncProperty(
        actionStepArbitrary,
        triggerContextArbitrary,
        fc.integer({ min: 1, max: 5 }),
        async (step, trigger, maxRetries) => {
          let attemptCount = 0;

          const engine = new AutomationEngine({
            maxRetries,
            retryDelayMs: 1
          });

          // Register handler that counts attempts
          registerActionHandler(step.name as ActionType, async (s) => {
            attemptCount++;
            return {
              stepId: s.id,
              success: false,
              error: 'Always fails',
              duration: 1
            };
          });

          const automation = createAutomation([step]);
          await engine.executeFlow(automation, trigger);

          // Property: Should retry exactly maxRetries times
          expect(attemptCount).toBe(maxRetries);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Retries stop on success
   */
  it('should stop retrying on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        actionStepArbitrary,
        triggerContextArbitrary,
        fc.integer({ min: 1, max: 3 }),
        async (step, trigger, succeedOnAttempt) => {
          let attemptCount = 0;
          const maxRetries = 5;

          const engine = new AutomationEngine({
            maxRetries,
            retryDelayMs: 1
          });

          // Register handler that succeeds on specific attempt
          registerActionHandler(step.name as ActionType, async (s) => {
            attemptCount++;
            if (attemptCount >= succeedOnAttempt) {
              return {
                stepId: s.id,
                success: true,
                duration: 1
              };
            }
            return {
              stepId: s.id,
              success: false,
              error: 'Not yet',
              duration: 1
            };
          });

          const automation = createAutomation([step]);
          const result = await engine.executeFlow(automation, trigger);

          // Property: Should stop retrying after success
          expect(attemptCount).toBe(succeedOnAttempt);
          
          // Property: Result should be success
          expect(result.status).toBe('success');

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Execution order is preserved
   */
  it('should preserve execution order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(actionStepArbitrary, { minLength: 2, maxLength: 10 }),
        triggerContextArbitrary,
        async (steps, trigger) => {
          const executionOrder: string[] = [];

          const engine = new AutomationEngine({
            maxRetries: 1,
            retryDelayMs: 1,
            onStepComplete: (result) => {
              executionOrder.push(result.stepId);
            }
          });

          // Register handlers that track order
          for (const actionType of ['send_message', 'create_offer', 'add_tag', 'wait'] as ActionType[]) {
            registerActionHandler(actionType, async (step) => ({
              stepId: step.id,
              success: true,
              duration: 1
            }));
          }

          const automation = createAutomation(steps);
          await engine.executeFlow(automation, trigger);

          // Property: Execution order should match step order
          expect(executionOrder).toEqual(steps.map(s => s.id));

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
