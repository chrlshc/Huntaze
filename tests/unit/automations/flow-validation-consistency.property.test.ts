/**
 * Property Test: Flow Validation Consistency
 * **Feature: huntaze-ai-features-coming-soon, Property 2: Flow Validation Consistency**
 * **Validates: Requirements 1.2**
 * 
 * For any automation flow, the validation function should consistently return
 * the same result (valid/invalid) for the same input.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateAutomationFlow } from '../../../lib/automations/automation.service';
import type { AutomationStep } from '../../../lib/automations/types';

// ============================================
// Arbitraries (Generators)
// ============================================

const triggerTypeArb = fc.constantFrom(
  'new_subscriber',
  'message_received',
  'purchase_completed',
  'subscription_expiring'
);

const actionTypeArb = fc.constantFrom('send_message', 'create_offer', 'add_tag', 'wait');

const stepIdArb = fc.uuid();

// Generate valid send_message config
const sendMessageConfigArb = fc.record({
  template: fc.string({ minLength: 1 }),
  placeholders: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
});

// Generate valid create_offer config
const createOfferConfigArb = fc.record({
  discountType: fc.constantFrom('percentage', 'fixed', 'bogo'),
  discountValue: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
  validDays: fc.integer({ min: 1, max: 365 }),
});

// Generate valid add_tag config
const addTagConfigArb = fc.record({
  tagName: fc.string({ minLength: 1 }),
});

// Generate valid wait config
const waitConfigArb = fc.record({
  duration: fc.integer({ min: 1, max: 1000 }),
  unit: fc.constantFrom('seconds', 'minutes', 'hours', 'days'),
});

// Generate a valid trigger step
const triggerStepArb: fc.Arbitrary<AutomationStep> = fc.record({
  id: stepIdArb,
  type: fc.constant('trigger' as const),
  name: triggerTypeArb,
  config: fc.record({
    conditions: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
  }),
}).map(s => ({ ...s, config: s.config as Record<string, unknown> }));

// Generate a valid action step based on action type
const actionStepArb: fc.Arbitrary<AutomationStep> = fc.oneof(
  // send_message action
  fc.record({
    id: stepIdArb,
    type: fc.constant('action' as const),
    name: fc.constant('send_message'),
    config: sendMessageConfigArb,
  }),
  // create_offer action
  fc.record({
    id: stepIdArb,
    type: fc.constant('action' as const),
    name: fc.constant('create_offer'),
    config: createOfferConfigArb,
  }),
  // add_tag action
  fc.record({
    id: stepIdArb,
    type: fc.constant('action' as const),
    name: fc.constant('add_tag'),
    config: addTagConfigArb,
  }),
  // wait action
  fc.record({
    id: stepIdArb,
    type: fc.constant('action' as const),
    name: fc.constant('wait'),
    config: waitConfigArb,
  })
).map(s => ({ ...s, config: s.config as Record<string, unknown> }));

// Generate a valid automation flow (trigger + actions)
const validAutomationFlowArb = fc.tuple(
  triggerStepArb,
  fc.array(actionStepArb, { minLength: 0, maxLength: 5 })
).map(([trigger, actions]) => [trigger, ...actions]);

// Generate an invalid flow (missing trigger)
const invalidFlowNoTriggerArb = fc.array(actionStepArb, { minLength: 1, maxLength: 5 });

// Generate an invalid flow (invalid action type)
const invalidActionStepArb: fc.Arbitrary<AutomationStep> = fc.record({
  id: stepIdArb,
  type: fc.constant('action' as const),
  name: fc.string({ minLength: 1 }).filter(s => !['send_message', 'create_offer', 'add_tag', 'wait'].includes(s)),
  config: fc.dictionary(fc.string(), fc.string()),
}).map(s => ({ ...s, config: s.config as Record<string, unknown> }));

// ============================================
// Property Tests
// ============================================

describe('Flow Validation Consistency', () => {
  /**
   * Property 2: Flow Validation Consistency
   * For any automation flow, the validation function should consistently return
   * the same result (valid/invalid) for the same input.
   */
  it('should return consistent validation results for the same input (100 iterations)', () => {
    fc.assert(
      fc.property(validAutomationFlowArb, (steps) => {
        // Call validation multiple times with the same input
        const result1 = validateAutomationFlow(steps);
        const result2 = validateAutomationFlow(steps);
        const result3 = validateAutomationFlow(steps);

        // All results should be identical
        expect(result1.valid).toBe(result2.valid);
        expect(result2.valid).toBe(result3.valid);
        expect(result1.errors.length).toBe(result2.errors.length);
        expect(result2.errors.length).toBe(result3.errors.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate valid flows as valid (100 iterations)', () => {
    fc.assert(
      fc.property(validAutomationFlowArb, (steps) => {
        const result = validateAutomationFlow(steps);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject flows without triggers (100 iterations)', () => {
    fc.assert(
      fc.property(invalidFlowNoTriggerArb, (steps) => {
        const result = validateAutomationFlow(steps);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('trigger'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject empty flows', () => {
    const result = validateAutomationFlow([]);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('at least one step'))).toBe(true);
  });

  it('should reject flows with invalid action types (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.tuple(triggerStepArb, invalidActionStepArb),
        ([trigger, invalidAction]) => {
          const steps = [trigger, invalidAction];
          const result = validateAutomationFlow(steps);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.message.includes('Invalid action type'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate send_message action requires template', () => {
    const steps: AutomationStep[] = [
      { id: 'trigger-1', type: 'trigger', name: 'new_subscriber', config: {} },
      { id: 'action-1', type: 'action', name: 'send_message', config: {} }, // Missing template
    ];
    const result = validateAutomationFlow(steps);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('template'))).toBe(true);
  });

  it('should validate create_offer action requires discountType and discountValue', () => {
    const steps: AutomationStep[] = [
      { id: 'trigger-1', type: 'trigger', name: 'new_subscriber', config: {} },
      { id: 'action-1', type: 'action', name: 'create_offer', config: {} }, // Missing required fields
    ];
    const result = validateAutomationFlow(steps);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('discountType'))).toBe(true);
  });

  it('should validate wait action requires duration and unit', () => {
    const steps: AutomationStep[] = [
      { id: 'trigger-1', type: 'trigger', name: 'new_subscriber', config: {} },
      { id: 'action-1', type: 'action', name: 'wait', config: {} }, // Missing required fields
    ];
    const result = validateAutomationFlow(steps);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('duration'))).toBe(true);
  });
});
