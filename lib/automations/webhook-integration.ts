/**
 * Webhook Integration for Automations
 * Integrates OnlyFans webhooks with the automation event system
 * 
 * Requirements: 2.5
 * @module lib/automations/webhook-integration
 */

import { getEventSystem } from './event-system';
import {
  buildNewSubscriberContext,
  buildMessageReceivedContext,
  buildPurchaseCompletedContext,
  buildSubscriptionExpiringContext
} from './trigger-handlers';
import { TriggerContext } from './types';

// ============================================
// Types
// ============================================

export type WebhookEventType =
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.expired'
  | 'subscription.expiring'
  | 'message.received'
  | 'purchase.completed'
  | 'tip.received';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookProcessResult {
  processed: boolean;
  triggerEmitted: boolean;
  triggerType?: string;
  error?: string;
}

// ============================================
// Webhook Event Mappers
// ============================================

/**
 * Maps webhook events to trigger contexts
 */
export function mapWebhookToTrigger(
  userId: number,
  payload: WebhookPayload
): TriggerContext | null {
  const { event, data } = payload;

  switch (event) {
    case 'subscription.created':
    case 'subscription.renewed':
      return buildNewSubscriberContext(userId, String(data.fanId || ''), {
        fanUsername: String(data.fanUsername || ''),
        subscriptionTier: String(data.tier || 'standard'),
        subscriptionPrice: Number(data.price || 0)
      });

    case 'message.received':
      return buildMessageReceivedContext(userId, String(data.fanId || ''), {
        messageId: String(data.messageId || ''),
        messageText: String(data.text || ''),
        hasMedia: Boolean(data.hasMedia)
      });

    case 'purchase.completed':
    case 'tip.received':
      return buildPurchaseCompletedContext(userId, String(data.fanId || ''), {
        purchaseId: String(data.purchaseId || data.tipId || ''),
        purchaseType: event === 'tip.received' ? 'tip' : (data.type as 'ppv' | 'subscription' | 'custom') || 'ppv',
        amount: Number(data.amount || 0),
        contentId: String(data.contentId || '')
      });

    case 'subscription.expiring':
      return buildSubscriptionExpiringContext(userId, String(data.fanId || ''), {
        expirationDate: data.expirationDate ? new Date(String(data.expirationDate)) : new Date(),
        daysUntilExpiration: Number(data.daysUntilExpiration || 0),
        subscriptionTier: String(data.tier || 'standard')
      });

    case 'subscription.expired':
      // Expired subscriptions don't trigger automations
      return null;

    default:
      return null;
  }
}

// ============================================
// Webhook Processor
// ============================================

/**
 * Process an incoming webhook and emit appropriate triggers
 */
export async function processWebhook(
  userId: number,
  payload: WebhookPayload
): Promise<WebhookProcessResult> {
  try {
    // Map webhook to trigger context
    const triggerContext = mapWebhookToTrigger(userId, payload);

    if (!triggerContext) {
      return {
        processed: true,
        triggerEmitted: false
      };
    }

    // Emit the trigger
    const eventSystem = getEventSystem();
    const result = await eventSystem.emit(triggerContext);

    return {
      processed: true,
      triggerEmitted: true,
      triggerType: triggerContext.type
    };
  } catch (error) {
    return {
      processed: false,
      triggerEmitted: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ============================================
// Webhook Signature Verification
// ============================================

import crypto from 'crypto';

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ============================================
// Manual Trigger Emitters
// ============================================

/**
 * Manually emit a new_subscriber trigger
 * Useful for testing or manual triggering
 */
export async function emitNewSubscriber(
  userId: number,
  fanId: string,
  data: {
    fanUsername?: string;
    subscriptionTier?: string;
    subscriptionPrice?: number;
  } = {}
): Promise<void> {
  const context = buildNewSubscriberContext(userId, fanId, data);
  const eventSystem = getEventSystem();
  await eventSystem.emit(context);
}

/**
 * Manually emit a message_received trigger
 */
export async function emitMessageReceived(
  userId: number,
  fanId: string,
  data: {
    messageId?: string;
    messageText?: string;
    hasMedia?: boolean;
  } = {}
): Promise<void> {
  const context = buildMessageReceivedContext(userId, fanId, data);
  const eventSystem = getEventSystem();
  await eventSystem.emit(context);
}

/**
 * Manually emit a purchase_completed trigger
 */
export async function emitPurchaseCompleted(
  userId: number,
  fanId: string,
  data: {
    purchaseId?: string;
    purchaseType?: 'ppv' | 'tip' | 'subscription' | 'custom';
    amount?: number;
    contentId?: string;
  } = {}
): Promise<void> {
  const context = buildPurchaseCompletedContext(userId, fanId, data);
  const eventSystem = getEventSystem();
  await eventSystem.emit(context);
}

/**
 * Manually emit a subscription_expiring trigger
 */
export async function emitSubscriptionExpiring(
  userId: number,
  fanId: string,
  data: {
    expirationDate?: Date;
    daysUntilExpiration?: number;
    subscriptionTier?: string;
  } = {}
): Promise<void> {
  const context = buildSubscriptionExpiringContext(userId, fanId, data);
  const eventSystem = getEventSystem();
  await eventSystem.emit(context);
}
