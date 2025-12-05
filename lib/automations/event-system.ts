/**
 * Event System for Automations
 * Implements pub/sub pattern for trigger events
 * 
 * @module lib/automations/event-system
 */

import { TriggerType, TriggerContext } from './types';

// ============================================
// Types
// ============================================

export type EventHandler = (context: TriggerContext) => Promise<void>;

export interface EventSubscription {
  id: string;
  type: TriggerType;
  handler: EventHandler;
  createdAt: Date;
}

export interface EmitResult {
  type: TriggerType;
  handlersInvoked: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ handlerId: string; error: string }>;
}

// ============================================
// Event System Class
// ============================================

export class EventSystem {
  private subscribers: Map<TriggerType, Map<string, EventHandler>>;
  private subscriptionCounter: number;

  constructor() {
    this.subscribers = new Map();
    this.subscriptionCounter = 0;
    
    // Initialize maps for all trigger types
    const triggerTypes: TriggerType[] = [
      'new_subscriber',
      'message_received',
      'purchase_completed',
      'subscription_expiring'
    ];
    
    for (const type of triggerTypes) {
      this.subscribers.set(type, new Map());
    }
  }

  /**
   * Subscribe to a trigger type
   * @param type - The trigger type to subscribe to
   * @param handler - The handler function to call when the trigger fires
   * @returns Subscription ID for unsubscribing
   */
  subscribe(type: TriggerType, handler: EventHandler): string {
    const handlers = this.subscribers.get(type);
    if (!handlers) {
      throw new Error(`Unknown trigger type: ${type}`);
    }

    const subscriptionId = `sub_${++this.subscriptionCounter}_${Date.now()}`;
    handlers.set(subscriptionId, handler);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from a trigger type
   * @param type - The trigger type to unsubscribe from
   * @param subscriptionId - The subscription ID returned from subscribe()
   * @returns true if unsubscribed successfully, false if subscription not found
   */
  unsubscribe(type: TriggerType, subscriptionId: string): boolean {
    const handlers = this.subscribers.get(type);
    if (!handlers) {
      return false;
    }

    return handlers.delete(subscriptionId);
  }

  /**
   * Unsubscribe a handler by reference
   * @param type - The trigger type to unsubscribe from
   * @param handler - The handler function to remove
   * @returns true if unsubscribed successfully, false if handler not found
   */
  unsubscribeByHandler(type: TriggerType, handler: EventHandler): boolean {
    const handlers = this.subscribers.get(type);
    if (!handlers) {
      return false;
    }

    for (const [id, h] of handlers.entries()) {
      if (h === handler) {
        handlers.delete(id);
        return true;
      }
    }

    return false;
  }

  /**
   * Emit a trigger event to all subscribers
   * @param context - The trigger context with event data
   * @returns Result of the emission including success/failure counts
   */
  async emit(context: TriggerContext): Promise<EmitResult> {
    const handlers = this.subscribers.get(context.type);
    
    const result: EmitResult = {
      type: context.type,
      handlersInvoked: 0,
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    if (!handlers || handlers.size === 0) {
      return result;
    }

    result.handlersInvoked = handlers.size;

    // Execute all handlers concurrently
    const promises = Array.from(handlers.entries()).map(async ([id, handler]) => {
      try {
        await handler(context);
        return { id, success: true, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { id, success: false, error: errorMessage };
      }
    });

    const results = await Promise.all(promises);

    for (const r of results) {
      if (r.success) {
        result.successCount++;
      } else {
        result.failedCount++;
        if (r.error) {
          result.errors.push({ handlerId: r.id, error: r.error });
        }
      }
    }

    return result;
  }

  /**
   * Get the number of subscribers for a trigger type
   * @param type - The trigger type
   * @returns Number of subscribers
   */
  getSubscriberCount(type: TriggerType): number {
    const handlers = this.subscribers.get(type);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all subscription IDs for a trigger type
   * @param type - The trigger type
   * @returns Array of subscription IDs
   */
  getSubscriptionIds(type: TriggerType): string[] {
    const handlers = this.subscribers.get(type);
    return handlers ? Array.from(handlers.keys()) : [];
  }

  /**
   * Check if a trigger type has any subscribers
   * @param type - The trigger type
   * @returns true if there are subscribers
   */
  hasSubscribers(type: TriggerType): boolean {
    return this.getSubscriberCount(type) > 0;
  }

  /**
   * Clear all subscribers for a trigger type
   * @param type - The trigger type
   */
  clearSubscribers(type: TriggerType): void {
    const handlers = this.subscribers.get(type);
    if (handlers) {
      handlers.clear();
    }
  }

  /**
   * Clear all subscribers for all trigger types
   */
  clearAllSubscribers(): void {
    for (const handlers of this.subscribers.values()) {
      handlers.clear();
    }
  }

  /**
   * Get statistics about the event system
   */
  getStats(): Record<TriggerType, number> {
    const stats: Record<string, number> = {};
    for (const [type, handlers] of this.subscribers.entries()) {
      stats[type] = handlers.size;
    }
    return stats as Record<TriggerType, number>;
  }
}

// ============================================
// Singleton Instance
// ============================================

let eventSystemInstance: EventSystem | null = null;

/**
 * Get the singleton EventSystem instance
 */
export function getEventSystem(): EventSystem {
  if (!eventSystemInstance) {
    eventSystemInstance = new EventSystem();
  }
  return eventSystemInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetEventSystem(): void {
  if (eventSystemInstance) {
    eventSystemInstance.clearAllSubscribers();
  }
  eventSystemInstance = null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a TriggerContext object
 */
export function createTriggerContext(
  type: TriggerType,
  userId: number,
  fanId: string,
  data: Record<string, unknown> = {}
): TriggerContext {
  return {
    type,
    userId,
    fanId,
    data,
    timestamp: new Date()
  };
}

/**
 * Validate a TriggerContext object
 */
export function isValidTriggerContext(context: unknown): context is TriggerContext {
  if (!context || typeof context !== 'object') {
    return false;
  }

  const ctx = context as Record<string, unknown>;
  
  const validTypes: TriggerType[] = [
    'new_subscriber',
    'message_received',
    'purchase_completed',
    'subscription_expiring'
  ];

  return (
    typeof ctx.type === 'string' &&
    validTypes.includes(ctx.type as TriggerType) &&
    typeof ctx.userId === 'number' &&
    typeof ctx.fanId === 'string' &&
    typeof ctx.data === 'object' &&
    ctx.data !== null &&
    ctx.timestamp instanceof Date
  );
}
