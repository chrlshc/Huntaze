/**
 * Property Test: Trigger Event Emission
 * 
 * **Feature: huntaze-ai-features-coming-soon, Property 3: Trigger Event Emission**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * *For any* trigger type and context, emitting a trigger should result in 
 * all subscribed handlers being called with the correct context data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  EventSystem,
  resetEventSystem,
  createTriggerContext,
  isValidTriggerContext,
  EmitResult
} from '../../../lib/automations/event-system';
import { TriggerType, TriggerContext } from '../../../lib/automations/types';

// ============================================
// Arbitraries
// ============================================

const triggerTypeArbitrary = fc.constantFrom<TriggerType>(
  'new_subscriber',
  'message_received',
  'purchase_completed',
  'subscription_expiring'
);

const triggerContextArbitrary = fc.record({
  type: triggerTypeArbitrary,
  userId: fc.integer({ min: 1, max: 1000000 }),
  fanId: fc.uuid(),
  data: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    fc.oneof(
      fc.string({ maxLength: 100 }),
      fc.integer(),
      fc.boolean(),
      fc.constant(null)
    ),
    { minKeys: 0, maxKeys: 5 }
  ),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
});

const subscriberCountArbitrary = fc.integer({ min: 0, max: 10 });

// ============================================
// Tests
// ============================================

describe('Property 3: Trigger Event Emission', () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    resetEventSystem();
    eventSystem = new EventSystem();
  });

  /**
   * Property: All subscribed handlers are invoked
   * For any trigger context and any number of subscribers,
   * emitting the trigger should invoke all handlers exactly once.
   */
  it('should invoke all subscribed handlers exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        subscriberCountArbitrary,
        async (context, subscriberCount) => {
          const eventSystem = new EventSystem();
          const invocationCounts: number[] = [];

          // Subscribe handlers
          for (let i = 0; i < subscriberCount; i++) {
            invocationCounts.push(0);
            const index = i;
            eventSystem.subscribe(context.type, async () => {
              invocationCounts[index]++;
            });
          }

          // Emit the trigger
          const result = await eventSystem.emit(context);

          // Verify all handlers were invoked exactly once
          expect(result.handlersInvoked).toBe(subscriberCount);
          expect(result.successCount).toBe(subscriberCount);
          expect(result.failedCount).toBe(0);
          
          for (const count of invocationCounts) {
            expect(count).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Handlers receive correct context data
   * For any trigger context, all handlers should receive
   * the exact same context object that was emitted.
   */
  it('should pass correct context data to all handlers', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        subscriberCountArbitrary.filter(n => n > 0),
        async (context, subscriberCount) => {
          const eventSystem = new EventSystem();
          const receivedContexts: TriggerContext[] = [];

          // Subscribe handlers that capture the context
          for (let i = 0; i < subscriberCount; i++) {
            eventSystem.subscribe(context.type, async (ctx) => {
              receivedContexts.push(ctx);
            });
          }

          // Emit the trigger
          await eventSystem.emit(context);

          // Verify all handlers received the correct context
          expect(receivedContexts.length).toBe(subscriberCount);
          
          for (const received of receivedContexts) {
            expect(received.type).toBe(context.type);
            expect(received.userId).toBe(context.userId);
            expect(received.fanId).toBe(context.fanId);
            expect(received.data).toEqual(context.data);
            expect(received.timestamp).toEqual(context.timestamp);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Only handlers for the correct trigger type are invoked
   * For any trigger context, only handlers subscribed to that
   * specific trigger type should be invoked.
   */
  it('should only invoke handlers for the matching trigger type', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        async (context) => {
          const eventSystem = new EventSystem();
          const invocations: Record<TriggerType, number> = {
            'new_subscriber': 0,
            'message_received': 0,
            'purchase_completed': 0,
            'subscription_expiring': 0
          };

          // Subscribe to all trigger types
          const allTypes: TriggerType[] = [
            'new_subscriber',
            'message_received',
            'purchase_completed',
            'subscription_expiring'
          ];

          for (const type of allTypes) {
            eventSystem.subscribe(type, async () => {
              invocations[type]++;
            });
          }

          // Emit the trigger
          await eventSystem.emit(context);

          // Verify only the correct type was invoked
          for (const type of allTypes) {
            if (type === context.type) {
              expect(invocations[type]).toBe(1);
            } else {
              expect(invocations[type]).toBe(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Failed handlers don't prevent other handlers from executing
   * For any trigger context with multiple handlers where some fail,
   * all handlers should still be invoked.
   */
  it('should continue executing handlers even when some fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        async (context, totalHandlers, failingIndex) => {
          const eventSystem = new EventSystem();
          const actualFailingIndex = failingIndex % totalHandlers;
          const invocationCounts: number[] = [];

          // Subscribe handlers, one of which will fail
          for (let i = 0; i < totalHandlers; i++) {
            invocationCounts.push(0);
            const index = i;
            eventSystem.subscribe(context.type, async () => {
              invocationCounts[index]++;
              if (index === actualFailingIndex) {
                throw new Error('Simulated failure');
              }
            });
          }

          // Emit the trigger
          const result = await eventSystem.emit(context);

          // Verify all handlers were invoked
          expect(result.handlersInvoked).toBe(totalHandlers);
          expect(result.successCount).toBe(totalHandlers - 1);
          expect(result.failedCount).toBe(1);
          expect(result.errors.length).toBe(1);
          
          for (const count of invocationCounts) {
            expect(count).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Emit result accurately reflects execution
   * For any trigger context and handlers, the emit result
   * should accurately count successes and failures.
   */
  it('should return accurate emit results', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }),
        async (context, shouldSucceed) => {
          const eventSystem = new EventSystem();

          // Subscribe handlers based on shouldSucceed array
          for (const success of shouldSucceed) {
            eventSystem.subscribe(context.type, async () => {
              if (!success) {
                throw new Error('Handler failed');
              }
            });
          }

          // Emit the trigger
          const result = await eventSystem.emit(context);

          // Verify result accuracy
          const expectedSuccess = shouldSucceed.filter(s => s).length;
          const expectedFailed = shouldSucceed.filter(s => !s).length;

          expect(result.handlersInvoked).toBe(shouldSucceed.length);
          expect(result.successCount).toBe(expectedSuccess);
          expect(result.failedCount).toBe(expectedFailed);
          expect(result.errors.length).toBe(expectedFailed);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unsubscribed handlers are not invoked
   * For any trigger context, handlers that have been unsubscribed
   * should not be invoked when the trigger is emitted.
   */
  it('should not invoke unsubscribed handlers', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        async (context, totalHandlers, unsubscribeIndex) => {
          const eventSystem = new EventSystem();
          const actualUnsubIndex = unsubscribeIndex % totalHandlers;
          const invocationCounts: number[] = [];
          const subscriptionIds: string[] = [];

          // Subscribe handlers
          for (let i = 0; i < totalHandlers; i++) {
            invocationCounts.push(0);
            const index = i;
            const id = eventSystem.subscribe(context.type, async () => {
              invocationCounts[index]++;
            });
            subscriptionIds.push(id);
          }

          // Unsubscribe one handler
          eventSystem.unsubscribe(context.type, subscriptionIds[actualUnsubIndex]);

          // Emit the trigger
          const result = await eventSystem.emit(context);

          // Verify unsubscribed handler was not invoked
          expect(result.handlersInvoked).toBe(totalHandlers - 1);
          expect(invocationCounts[actualUnsubIndex]).toBe(0);
          
          // Verify other handlers were invoked
          for (let i = 0; i < totalHandlers; i++) {
            if (i !== actualUnsubIndex) {
              expect(invocationCounts[i]).toBe(1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: createTriggerContext produces valid contexts
   * For any valid inputs, createTriggerContext should produce
   * a valid TriggerContext object.
   */
  it('should create valid trigger contexts', () => {
    fc.assert(
      fc.property(
        triggerTypeArbitrary,
        fc.integer({ min: 1, max: 1000000 }),
        fc.uuid(),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
          fc.string({ maxLength: 50 }),
          { minKeys: 0, maxKeys: 5 }
        ),
        (type, userId, fanId, data) => {
          const context = createTriggerContext(type, userId, fanId, data);
          
          expect(isValidTriggerContext(context)).toBe(true);
          expect(context.type).toBe(type);
          expect(context.userId).toBe(userId);
          expect(context.fanId).toBe(fanId);
          expect(context.data).toEqual(data);
          expect(context.timestamp).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty emit returns zero counts
   * For any trigger type with no subscribers,
   * emit should return zero for all counts.
   */
  it('should return zero counts when no subscribers', async () => {
    await fc.assert(
      fc.asyncProperty(
        triggerContextArbitrary,
        async (context) => {
          const eventSystem = new EventSystem();
          
          // Emit without any subscribers
          const result = await eventSystem.emit(context);

          expect(result.handlersInvoked).toBe(0);
          expect(result.successCount).toBe(0);
          expect(result.failedCount).toBe(0);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
