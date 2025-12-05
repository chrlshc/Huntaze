/**
 * Trigger Handlers for Automations
 * Handlers for each trigger event type
 * 
 * @module lib/automations/trigger-handlers
 */

import { TriggerType, TriggerContext, AutomationFlow } from './types';
import { EventSystem, getEventSystem, EventHandler } from './event-system';
import { AutomationService } from './automation.service';

// ============================================
// Types
// ============================================

export interface TriggerHandlerConfig {
  automationService: AutomationService;
  onExecute?: (automationId: string, context: TriggerContext) => Promise<void>;
}

export interface TriggerHandlerResult {
  automationId: string;
  triggered: boolean;
  error?: string;
}

// ============================================
// Trigger Handler Factory
// ============================================

/**
 * Creates a handler for a specific trigger type that executes matching automations
 */
export function createTriggerHandler(
  triggerType: TriggerType,
  config: TriggerHandlerConfig
): EventHandler {
  return async (context: TriggerContext): Promise<void> => {
    // Only process if the context type matches
    if (context.type !== triggerType) {
      return;
    }

    try {
      // Get all active automations for this user
      const automations = await config.automationService.listFlows(
        context.userId,
        'active'
      );

      // Filter automations that have this trigger type
      const matchingAutomations = automations.filter(automation => {
        const triggerStep = automation.steps.find(
          step => step.type === 'trigger' && step.name === triggerType
        );
        return triggerStep !== undefined;
      });

      // Execute each matching automation
      for (const automation of matchingAutomations) {
        if (config.onExecute) {
          await config.onExecute(automation.id, context);
        }
      }
    } catch (error) {
      console.error(`Error in trigger handler for ${triggerType}:`, error);
      throw error;
    }
  };
}

// ============================================
// Specific Trigger Handlers
// ============================================

/**
 * Handler for new_subscriber trigger
 * Fired when a new fan subscribes to the creator
 */
export function createNewSubscriberHandler(config: TriggerHandlerConfig): EventHandler {
  return createTriggerHandler('new_subscriber', config);
}

/**
 * Handler for message_received trigger
 * Fired when a fan sends a message to the creator
 */
export function createMessageReceivedHandler(config: TriggerHandlerConfig): EventHandler {
  return createTriggerHandler('message_received', config);
}

/**
 * Handler for purchase_completed trigger
 * Fired when a fan completes a purchase
 */
export function createPurchaseCompletedHandler(config: TriggerHandlerConfig): EventHandler {
  return createTriggerHandler('purchase_completed', config);
}

/**
 * Handler for subscription_expiring trigger
 * Fired when a fan's subscription is about to expire
 */
export function createSubscriptionExpiringHandler(config: TriggerHandlerConfig): EventHandler {
  return createTriggerHandler('subscription_expiring', config);
}

// ============================================
// Trigger Handler Manager
// ============================================

export class TriggerHandlerManager {
  private eventSystem: EventSystem;
  private config: TriggerHandlerConfig;
  private subscriptionIds: Map<TriggerType, string>;
  private initialized: boolean;

  constructor(config: TriggerHandlerConfig, eventSystem?: EventSystem) {
    this.eventSystem = eventSystem || getEventSystem();
    this.config = config;
    this.subscriptionIds = new Map();
    this.initialized = false;
  }

  /**
   * Initialize all trigger handlers
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    const handlers: Array<{ type: TriggerType; handler: EventHandler }> = [
      { type: 'new_subscriber', handler: createNewSubscriberHandler(this.config) },
      { type: 'message_received', handler: createMessageReceivedHandler(this.config) },
      { type: 'purchase_completed', handler: createPurchaseCompletedHandler(this.config) },
      { type: 'subscription_expiring', handler: createSubscriptionExpiringHandler(this.config) }
    ];

    for (const { type, handler } of handlers) {
      const subscriptionId = this.eventSystem.subscribe(type, handler);
      this.subscriptionIds.set(type, subscriptionId);
    }

    this.initialized = true;
  }

  /**
   * Cleanup all trigger handlers
   */
  cleanup(): void {
    for (const [type, subscriptionId] of this.subscriptionIds.entries()) {
      this.eventSystem.unsubscribe(type, subscriptionId);
    }
    this.subscriptionIds.clear();
    this.initialized = false;
  }

  /**
   * Check if handlers are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get subscription ID for a trigger type
   */
  getSubscriptionId(type: TriggerType): string | undefined {
    return this.subscriptionIds.get(type);
  }
}

// ============================================
// Context Builders
// ============================================

/**
 * Build context for new_subscriber trigger
 */
export function buildNewSubscriberContext(
  userId: number,
  fanId: string,
  data: {
    fanUsername?: string;
    subscriptionTier?: string;
    subscriptionPrice?: number;
  }
): TriggerContext {
  return {
    type: 'new_subscriber',
    userId,
    fanId,
    data: {
      fanUsername: data.fanUsername || '',
      subscriptionTier: data.subscriptionTier || 'standard',
      subscriptionPrice: data.subscriptionPrice || 0,
      ...data
    },
    timestamp: new Date()
  };
}

/**
 * Build context for message_received trigger
 */
export function buildMessageReceivedContext(
  userId: number,
  fanId: string,
  data: {
    messageId?: string;
    messageText?: string;
    hasMedia?: boolean;
  }
): TriggerContext {
  return {
    type: 'message_received',
    userId,
    fanId,
    data: {
      messageId: data.messageId || '',
      messageText: data.messageText || '',
      hasMedia: data.hasMedia || false,
      ...data
    },
    timestamp: new Date()
  };
}

/**
 * Build context for purchase_completed trigger
 */
export function buildPurchaseCompletedContext(
  userId: number,
  fanId: string,
  data: {
    purchaseId?: string;
    purchaseType?: 'ppv' | 'tip' | 'subscription' | 'custom';
    amount?: number;
    contentId?: string;
  }
): TriggerContext {
  return {
    type: 'purchase_completed',
    userId,
    fanId,
    data: {
      purchaseId: data.purchaseId || '',
      purchaseType: data.purchaseType || 'ppv',
      amount: data.amount || 0,
      contentId: data.contentId || '',
      ...data
    },
    timestamp: new Date()
  };
}

/**
 * Build context for subscription_expiring trigger
 */
export function buildSubscriptionExpiringContext(
  userId: number,
  fanId: string,
  data: {
    expirationDate?: Date;
    daysUntilExpiration?: number;
    subscriptionTier?: string;
  }
): TriggerContext {
  return {
    type: 'subscription_expiring',
    userId,
    fanId,
    data: {
      expirationDate: data.expirationDate || new Date(),
      daysUntilExpiration: data.daysUntilExpiration || 0,
      subscriptionTier: data.subscriptionTier || 'standard',
      ...data
    },
    timestamp: new Date()
  };
}
