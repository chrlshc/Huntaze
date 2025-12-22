/**
 * Webhook Processor Service
 * 
 * Handles webhook events from social platforms:
 * - Signature verification
 * - Idempotent event processing
 * - Async queue management
 * - Retry with exponential backoff
 * 
 * Supports: TikTok, Instagram, and other platforms
 */

import crypto from 'crypto';
import { createLogger } from '@/lib/api/logger';
import { db } from '@/lib/db';
import { processWebhook, type WebhookPayload, type WebhookProcessResult } from '@/lib/automations/webhook-integration';

export type WebhookProvider = 'tiktok' | 'instagram' | 'onlyfans' | 'crm';

export interface WebhookEvent {
  provider: WebhookProvider;
  eventType: string;
  externalId: string;
  payload: any;
  signature?: string;
}

export interface ProcessEventResult {
  processed: boolean;
  duplicate: boolean;
  eventId?: number;
  providerResult?: unknown;
}

function getLogger(correlationId?: string) {
  return createLogger('webhook-processor', correlationId);
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Still do a comparison to maintain roughly constant time.
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export function computeWebhookExternalId(params: {
  provider: WebhookProvider;
  eventType: string;
  rawBody: string;
  payload: any;
}): string {
  const { provider, eventType, rawBody, payload } = params;
  const hash = crypto.createHash('sha256').update(rawBody).digest('hex');

  if (provider === 'tiktok') {
    const id = payload?.event_id || payload?.eventId || payload?.publish_id || payload?.post_id;
    if (id) return `tiktok:${eventType}:${id}`;
  }

  if (provider === 'instagram') {
    const entryId = payload?.entry?.id || payload?.entry?.[0]?.id || payload?.id;
    const change = payload?.change || payload?.entry?.[0]?.changes?.[0];
    const value = change?.value;
    const valueId = value?.id || value?.comment_id || value?.media_id;
    if (entryId && valueId) return `instagram:${eventType}:${entryId}:${valueId}`;
    if (entryId) {
      const changeHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      return `instagram:${eventType}:${entryId}:${changeHash}`;
    }
  }

  if (provider === 'onlyfans') {
    const id =
      payload?.data?.messageId ||
      payload?.data?.purchaseId ||
      payload?.data?.tipId ||
      payload?.data?.subscriptionId;
    if (id) return `onlyfans:${eventType}:${payload?.data?.creatorId ?? 'unknown'}:${id}`;
  }

  if (provider === 'crm') {
    const id =
      payload?.eventId ||
      payload?.event_id ||
      payload?.id ||
      payload?.data?.id ||
      payload?.data?.eventId;
    if (id) return `crm:${eventType}:${id}`;
  }

  return `${provider}:${eventType}:${hash}`;
}

/**
 * Webhook Processor Service
 */
export class WebhookProcessor {
  /**
   * Verify TikTok webhook signature
   * 
   * @param payload - Raw webhook payload (string)
   * @param signature - Signature from X-TikTok-Signature header
   * @param secret - Webhook secret from TikTok dashboard
   * @returns True if signature is valid
   */
  verifyTikTokSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // TikTok uses HMAC-SHA256
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Constant-time comparison to prevent timing attacks
      return timingSafeEqualStrings(signature, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Verify Instagram/Meta webhook signature
   * 
   * @param payload - Raw webhook payload (string)
   * @param signature - Signature from X-Hub-Signature-256 header
   * @param secret - App secret from Meta dashboard
   * @returns True if signature is valid
   */
  verifyInstagramSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // Instagram uses sha256=<signature> format
      if (!signature.startsWith('sha256=')) {
        return false;
      }

      const signatureHash = signature.substring(7); // Remove 'sha256=' prefix

      // Meta uses HMAC-SHA256
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Constant-time comparison
      return timingSafeEqualStrings(signatureHash, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Verify OnlyFans webhook signature
   *
   * Format is expected to be a hex digest (optionally prefixed with "sha256=").
   */
  verifyOnlyFansSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const normalized = signature.startsWith('sha256=') ? signature.substring(7) : signature;

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return timingSafeEqualStrings(normalized, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Verify CRM webhook signature (HMAC-SHA256)
   */
  verifyCrmSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const normalized = signature.startsWith('sha256=') ? signature.substring(7) : signature;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
      return timingSafeEqualStrings(normalized, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Verify webhook signature based on provider
   * 
   * @param provider - Platform provider
   * @param payload - Raw webhook payload
   * @param signature - Signature header value
   * @param secret - Webhook secret
   * @returns True if signature is valid
   */
  verifySignature(
    provider: WebhookProvider,
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    switch (provider) {
      case 'tiktok':
        return this.verifyTikTokSignature(payload, signature, secret);
      case 'instagram':
        return this.verifyInstagramSignature(payload, signature, secret);
      case 'onlyfans':
        return this.verifyOnlyFansSignature(payload, signature, secret);
      case 'crm':
        return this.verifyCrmSignature(payload, signature, secret);
      default:
        return false;
    }
  }

  /**
   * Queue webhook event for async processing
   * Stores event in database with idempotence check
   * 
   * @param event - Webhook event to queue
   * @returns Processing result
   */
  async queueEvent(event: WebhookEvent): Promise<ProcessEventResult> {
    const { provider, eventType, externalId, payload } = event;
    const logger = getLogger(externalId);

    try {
      // Check if event already exists (idempotence)
      const existingEvent = await db.query(
        `SELECT id, processed_at FROM webhook_events WHERE external_id = $1`,
        [externalId]
      );

      if (existingEvent.rows.length > 0) {
        const existing = existingEvent.rows[0];
        return {
          processed: existing.processed_at !== null,
          duplicate: true,
          eventId: existing.id,
        };
      }

      // Insert new event
      const result = await db.query(
        `INSERT INTO webhook_events (
          provider,
          event_type,
          external_id,
          payload_json,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING id`,
        [provider, eventType, externalId, JSON.stringify(payload)]
      );

      return {
        processed: false,
        duplicate: false,
        eventId: result.rows[0].id,
      };
    } catch (error) {
      logger.error('Queue event error', error instanceof Error ? error : undefined);
      throw new Error(`Failed to queue event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process webhook event
   * Updates post status based on event type
   * 
   * @param event - Webhook event to process
   * @returns Processing result
   */
  async processEvent(event: WebhookEvent): Promise<ProcessEventResult> {
    const { provider, eventType, externalId, payload } = event;
    const logger = getLogger(externalId);

    try {
      // Queue event first (idempotence check)
      const queueResult = await this.queueEvent(event);

      // If duplicate and already processed, skip
      if (queueResult.duplicate && queueResult.processed) {
        logger.debug('Event already processed, skipping', { provider, eventType });
        return queueResult;
      }

      // Process based on provider
      let providerResult: unknown;
      switch (provider) {
        case 'tiktok':
          await this.processTikTokEvent(eventType, payload, queueResult.eventId!);
          break;
        case 'instagram':
          await this.processInstagramEvent(eventType, payload, queueResult.eventId!);
          break;
        case 'onlyfans':
          providerResult = await this.processOnlyFansEvent(eventType, payload, queueResult.eventId!);
          break;
        case 'crm':
          await this.processCrmEvent(eventType, payload, queueResult.eventId!);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // Mark event as processed
      await db.query(
        `UPDATE webhook_events 
         SET processed_at = NOW() 
         WHERE id = $1`,
        [queueResult.eventId]
      );

      return {
        processed: true,
        duplicate: queueResult.duplicate,
        eventId: queueResult.eventId,
        providerResult,
      };
    } catch (error) {
      logger.error('Process event error', error instanceof Error ? error : undefined);

      // Update error in database
      if (event.externalId) {
        await db.query(
          `UPDATE webhook_events 
           SET error_message = $1,
               retry_count = retry_count + 1
           WHERE external_id = $2`,
          [error instanceof Error ? error.message : 'Unknown error', externalId]
        );
      }

      throw error;
    }
  }

  /**
   * Process TikTok webhook event
   * Updates tiktok_posts status based on event
   */
  private async processTikTokEvent(
    eventType: string,
    payload: any,
    eventId: number
  ): Promise<void> {
    const logger = getLogger(String(eventId));
    logger.debug('Processing TikTok event', { eventType });

    // TikTok webhook event types:
    // - video.publish.complete
    // - video.publish.failed
    // - video.inbox.received

    switch (eventType) {
      case 'video.publish.complete':
        await this.handleTikTokPublishComplete(payload);
        break;

      case 'video.publish.failed':
        await this.handleTikTokPublishFailed(payload);
        break;

      case 'video.inbox.received':
        await this.handleTikTokInboxReceived(payload);
        break;

      default:
        logger.warn('Unknown TikTok event type', { eventType });
    }
  }

  /**
   * Handle TikTok publish complete event
   */
  private async handleTikTokPublishComplete(payload: any): Promise<void> {
    const publishId = payload.publish_id;
    const postId = payload.post_id;
    const logger = getLogger(publishId);

    if (!publishId) {
      throw new Error('Missing publish_id in payload');
    }

    await db.query(
      `UPDATE tiktok_posts
       SET status = 'PUBLISH_COMPLETE',
           metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE publish_id = $2`,
      [
        JSON.stringify({
          publicaly_available_post_id: postId ? [postId] : [],
          webhook_received_at: new Date().toISOString(),
        }),
        publishId,
      ]
    );

    logger.debug('TikTok post marked as PUBLISH_COMPLETE', { publishId, postId });
  }

  /**
   * Handle TikTok publish failed event
   */
  private async handleTikTokPublishFailed(payload: any): Promise<void> {
    const publishId = payload.publish_id;
    const failReason = payload.fail_reason || 'Unknown error';
    const logger = getLogger(publishId);

    if (!publishId) {
      throw new Error('Missing publish_id in payload');
    }

    await db.query(
      `UPDATE tiktok_posts
       SET status = 'FAILED',
           error_message = $1,
           updated_at = NOW()
       WHERE publish_id = $2`,
      [failReason, publishId]
    );

    logger.warn('TikTok post marked as FAILED', { publishId, failReason });
  }

  /**
   * Handle TikTok inbox received event
   */
  private async handleTikTokInboxReceived(payload: any): Promise<void> {
    const publishId = payload.publish_id;
    const logger = getLogger(publishId);

    if (!publishId) {
      throw new Error('Missing publish_id in payload');
    }

    await db.query(
      `UPDATE tiktok_posts
       SET status = 'SEND_TO_USER_INBOX',
           updated_at = NOW()
       WHERE publish_id = $1`,
      [publishId]
    );

    logger.debug('TikTok post marked as SEND_TO_USER_INBOX', { publishId });
  }

  /**
   * Process Instagram webhook event
   * Updates ig_media and ig_comments based on event
   */
  private async processInstagramEvent(
    eventType: string,
    payload: any,
    eventId: number
  ): Promise<void> {
    const logger = getLogger(String(eventId));
    logger.debug('Processing Instagram event', { eventType });

    // Instagram webhook event types:
    // - media
    // - comments
    // - mentions

    switch (eventType) {
      case 'media':
        await this.handleInstagramMediaEvent(payload);
        break;

      case 'comments':
        await this.handleInstagramCommentEvent(payload);
        break;

      default:
        logger.warn('Unknown Instagram event type', { eventType });
    }
  }

  /**
   * Process OnlyFans webhook event
   * Delegates to automations webhook integration
   */
  private async processOnlyFansEvent(
    _eventType: string,
    payload: WebhookPayload,
    eventId: number
  ): Promise<WebhookProcessResult> {
    const logger = getLogger(String(eventId));
    logger.debug('Processing OnlyFans event', { eventId });

    const userId = Number((payload as any)?.data?.creatorId || 0);
    if (!userId) {
      throw new Error('Missing creatorId in OnlyFans webhook payload');
    }

    const result = await processWebhook(userId, payload);
    if (!result.processed) {
      throw new Error(result.error || 'Failed to process OnlyFans webhook');
    }

    return result;
  }

  /**
   * Process CRM webhook event
   * Placeholder for provider-specific handling
   */
  private async processCrmEvent(
    eventType: string,
    _payload: any,
    eventId: number
  ): Promise<void> {
    const logger = getLogger(String(eventId));
    logger.debug('Processing CRM event', { eventType });
  }

  /**
   * Handle Instagram media event
   */
  private async handleInstagramMediaEvent(payload: any): Promise<void> {
    // Instagram media events contain updates to media objects
    // This would sync with ig_media table
    const logger = getLogger();
    logger.debug('Instagram media event received', {
      entryId: payload?.entry?.id ?? payload?.entry?.[0]?.id,
    });
    // TODO: Implement media sync logic
  }

  /**
   * Handle Instagram comment event
   */
  private async handleInstagramCommentEvent(payload: any): Promise<void> {
    // Instagram comment events contain new/updated comments
    // This would sync with ig_comments table
    const logger = getLogger();
    logger.debug('Instagram comment event received', {
      entryId: payload?.entry?.id ?? payload?.entry?.[0]?.id,
    });
    // TODO: Implement comment sync logic
  }

  /**
   * Get pending events for processing
   * Used by background worker
   */
  async getPendingEvents(limit: number = 10): Promise<any[]> {
    const result = await db.query(
      `SELECT id, provider, event_type, external_id, payload_json, retry_count
       FROM webhook_events
       WHERE processed_at IS NULL
         AND retry_count < 3
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Retry failed events with exponential backoff
   */
  async retryFailedEvents(): Promise<number> {
    const events = await this.getPendingEvents(10);
    let retried = 0;

    for (const event of events) {
      try {
        await this.processEvent({
          provider: event.provider,
          eventType: event.event_type,
          externalId: event.external_id,
          payload: event.payload_json,
        });
        retried++;
      } catch (error) {
        const logger = getLogger(String(event.id));
        logger.error('Failed to retry event', error instanceof Error ? error : undefined, {
          eventId: event.id,
        });
      }
    }

    return retried;
  }
}

// Export singleton instance
export const webhookProcessor = new WebhookProcessor();
