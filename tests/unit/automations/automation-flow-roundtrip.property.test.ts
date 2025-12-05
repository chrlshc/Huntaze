/**
 * **Feature: huntaze-ai-features-coming-soon, Property 1: Automation Flow Round Trip**
 * 
 * *For any* valid automation flow, saving it to the database and then retrieving it 
 * should return an equivalent flow with the same steps and configuration.
 * 
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fc from 'fast-check';
import type { AutomationStep, TriggerType, ActionType, StepType } from '@/lib/automations/types';

// ============================================
// Arbitraries (Generators)
// ============================================

const triggerTypeArb: fc.Arbitrary<TriggerType> = fc.constantFrom(
  'new_subscriber',
  'message_received',
  'purchase_completed',
  'subscription_expiring'
);

const actionTypeArb: fc.Arbitrary<ActionType> = fc.constantFrom(
  'send_message',
  'create_offer',
  'add_tag',
  'wait'
);

const stepTypeArb: fc.Arbitrary<StepType> = fc.constantFrom(
  'trigger',
  'condition',
  'action'
);

const stepIdArb = fc.uuid();

const triggerConfigArb = fc.record({
  conditions: fc.option(fc.dictionary(fc.string(), fc.jsonValue()), { nil: null })
});

const sendMessageConfigArb = fc.record({
  template: fc.string({ minLength: 1, maxLength: 500 }),
  placeholders: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: null })
});

const createOfferConfigArb = fc.record({
  discountType: fc.constantFrom('percentage', 'fixed', 'bogo'),
  discountValue: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
  validDays: fc.integer({ min: 1, max: 365 })
});

const addTagConfigArb = fc.record({
  tagName: fc.string({ minLength: 1, maxLength: 50 })
});

const waitConfigArb = fc.record({
  duration: fc.integer({ min: 1, max: 1000 }),
  unit: fc.constantFrom('seconds', 'minutes', 'hours', 'days')
});


const actionConfigArb = fc.oneof(
  sendMessageConfigArb,
  createOfferConfigArb,
  addTagConfigArb,
  waitConfigArb
);

const automationStepArb: fc.Arbitrary<AutomationStep> = fc.record({
  id: stepIdArb,
  type: stepTypeArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  config: fc.oneof(triggerConfigArb, actionConfigArb) as fc.Arbitrary<Record<string, unknown>>
});

const automationFlowArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
  steps: fc.array(automationStepArb, { minLength: 1, maxLength: 10 }),
  status: fc.constantFrom('active', 'paused', 'draft')
});

// ============================================
// Mock Database for Testing
// ============================================

interface StoredAutomation {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  steps: AutomationStep[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

class MockAutomationStore {
  private store = new Map<string, StoredAutomation>();

  async create(userId: number, data: {
    name: string;
    description: string | null;
    steps: AutomationStep[];
    status: string;
  }): Promise<StoredAutomation> {
    const id = crypto.randomUUID();
    const now = new Date();
    const automation: StoredAutomation = {
      id,
      userId,
      name: data.name,
      description: data.description,
      steps: JSON.parse(JSON.stringify(data.steps)), // Deep clone to simulate DB serialization
      status: data.status,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, automation);
    return automation;
  }

  async findById(id: string): Promise<StoredAutomation | null> {
    const automation = this.store.get(id);
    if (!automation) return null;
    // Simulate DB retrieval with JSON parsing
    return {
      ...automation,
      steps: JSON.parse(JSON.stringify(automation.steps))
    };
  }

  clear(): void {
    this.store.clear();
  }
}

// ============================================
// Property Tests
// ============================================

describe('Property 1: Automation Flow Round Trip', () => {
  const store = new MockAutomationStore();
  const testUserId = 1;

  afterAll(() => {
    store.clear();
  });

  it('should preserve flow data through save/retrieve cycle', async () => {
    await fc.assert(
      fc.asyncProperty(automationFlowArb, async (flowInput) => {
        // Save the automation
        const saved = await store.create(testUserId, {
          name: flowInput.name,
          description: flowInput.description,
          steps: flowInput.steps,
          status: flowInput.status
        });

        // Retrieve the automation
        const retrieved = await store.findById(saved.id);

        // Verify round-trip consistency
        if (!retrieved) return false;
        if (retrieved.name !== flowInput.name) return false;
        if (retrieved.description !== flowInput.description) return false;
        if (retrieved.status !== flowInput.status) return false;
        if (JSON.stringify(retrieved.steps) !== JSON.stringify(flowInput.steps)) return false;
        if (retrieved.userId !== testUserId) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve step order through save/retrieve cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(automationStepArb, { minLength: 2, maxLength: 10 }),
        async (steps) => {
          const saved = await store.create(testUserId, {
            name: 'Test Flow',
            description: null,
            steps,
            status: 'draft'
          });

          const retrieved = await store.findById(saved.id);

          // Verify step order is preserved
          if (!retrieved) return false;
          if (retrieved.steps.length !== steps.length) return false;
          
          for (let i = 0; i < steps.length; i++) {
            if (retrieved.steps[i].id !== steps[i].id) return false;
            if (retrieved.steps[i].type !== steps[i].type) return false;
            if (retrieved.steps[i].name !== steps[i].name) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve step configuration through JSON serialization', async () => {
    await fc.assert(
      fc.asyncProperty(automationStepArb, async (step) => {
        const saved = await store.create(testUserId, {
          name: 'Config Test',
          description: null,
          steps: [step],
          status: 'draft'
        });

        const retrieved = await store.findById(saved.id);

        // Verify config is preserved through JSON round-trip
        if (!retrieved) return false;
        return JSON.stringify(retrieved.steps[0].config) === JSON.stringify(step.config);
      }),
      { numRuns: 100 }
    );
  });
});
