/**
 * OnlyFans Rate Limiter Service
 * 
 * High-level service for sending OnlyFans messages with automatic rate limiting.
 * Integrates with AWS SQS + Lambda for 10 messages/minute rate limiting.
 * 
 * Features:
 * - Payload validation with Zod
 * - Feature flag support (RATE_LIMITER_ENABLED)
 * - Integration with IntelligentQueueManager
 * - Fallback to database on SQS failure
 * - CloudWatch metrics
 * - Structured logging
 * 
 * @module onlyfans-rate-limiter-service
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { IntelligentQueueManager } from './intelligent-queue-manager';
import { CloudWatchMetricsService } from './cloudwatch-metrics.service';
import RATE_LIMITER_CONFIG, { getRateLimiterStatus } from '../config/rate-limiter.config';

// ============================================================================
// Types & Schemas
// ============================================================================

/**
 * OnlyFans message payload schema
 */
export const OnlyFansMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  metadata: z.record(z.any()).optional(),
});

export type OnlyFansMessage = z.infer<typeof OnlyFansMessageSchema>;

/**
 * Send result
 */
export interface SendResult {
  success: boolean;
  messageId: string;
  queuedAt: Date;
  sqsMessageId?: string;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Queue status
 */
export interface QueueStatus {
  healthy: boolean;
  messagesQueued: number;
  messagesProcessing: number;
  messagesFailed: number;
  averageLatency: number;
  lastError?: string;
}

// ============================================================================
// Service Class
// ============================================================================

export class OnlyFansRateLimiterService {
  private readonly queueManager: IntelligentQueueManager;
  private readonly prisma: PrismaClient;
  private readonly metrics: CloudWatchMetricsService;
  private readonly enabled: boolean;
  private readonly logger: Console;

  constructor(
    queueManager: IntelligentQueueManager,
    prisma: PrismaClient,
    metrics: CloudWatchMetricsService,
    logger: Console = console
  ) {
    this.queueManager = queueManager;
    this.prisma = prisma;
    this.metrics = metrics;
    this.logger = logger;
    this.enabled = RATE_LIMITER_CONFIG.FEATURES.ENABLED;

    // Log initialization
    const status = getRateLimiterStatus();
    this.logger.info('[OnlyFansRateLimiter] Service initialized', {
      enabled: this.enabled,
      configured: status.configured,
      active: status.active,
      queueUrl: status.queueUrl,
    });
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Send a single OnlyFans message
   * 
   * @param userId - User ID sending the message
   * @param message - Message payload
   * @returns Send result with messageId and status
   */
  async sendMessage(userId: string, message: OnlyFansMessage): Promise<SendResult> {
    const startTime = Date.now();
    const messageId = this.generateMessageId();

    try {
      // 1. Validate payload
      this.validateMessage(message);

      // 2. Check if rate limiter is enabled
      if (!this.enabled) {
        this.logger.warn('[OnlyFansRateLimiter] Rate limiter disabled, bypassing queue', {
          messageId,
          userId,
        });

        return {
          success: false,
          messageId,
          queuedAt: new Date(),
          error: 'Rate limiter is disabled',
        };
      }

      // 3. Send to SQS via IntelligentQueueManager
      const queueResult = await this.sendToQueue(userId, messageId, message);

      // 4. Track metrics
      const latency = Date.now() - startTime;
      await this.trackMetrics('MessagesQueued', 1, { priority: message.priority });
      await this.trackMetrics('QueueLatency', latency);

      // 5. Log success
      this.logger.info('[OnlyFansRateLimiter] Message queued successfully', {
        messageId,
        userId,
        recipientId: message.recipientId,
        priority: message.priority,
        sqsMessageId: queueResult.sqsMessageId,
        latency,
      });

      return {
        success: true,
        messageId,
        queuedAt: new Date(),
        sqsMessageId: queueResult.sqsMessageId,
      };
    } catch (error) {
      // Handle errors with fallback
      return await this.handleSendError(userId, messageId, message, error, startTime);
    }
  }

  /**
   * Send multiple messages in batch
   * 
   * @param userId - User ID sending the messages
   * @param messages - Array of message payloads
   * @returns Array of send results
   */
  async sendBatch(userId: string, messages: OnlyFansMessage[]): Promise<SendResult[]> {
    this.logger.info('[OnlyFansRateLimiter] Sending batch', {
      userId,
      count: messages.length,
    });

    // Send all messages in parallel
    const results = await Promise.allSettled(
      messages.map((message) => this.sendMessage(userId, message))
    );

    // Map results
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          messageId: this.generateMessageId(),
          queuedAt: new Date(),
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Get queue status and health
   * 
   * @returns Queue status with metrics
   */
  async getQueueStatus(): Promise<QueueStatus> {
    try {
      // Get stats from database
      const stats = await this.prisma.onlyFansMessage.groupBy({
        by: ['status'],
        _count: true,
      });

      const queued = stats.find((s) => s.status === 'queued')?._count || 0;
      const processing = stats.find((s) => s.status === 'processing')?._count || 0;
      const failed = stats.find((s) => s.status === 'failed')?._count || 0;

      // Calculate average latency (last 100 messages)
      const recentMessages = await this.prisma.onlyFansMessage.findMany({
        where: { sentAt: { not: null } },
        orderBy: { sentAt: 'desc' },
        take: 100,
        select: { queuedAt: true, sentAt: true },
      });

      const avgLatency = recentMessages.length > 0
        ? recentMessages.reduce((sum, msg) => {
            const latency = msg.sentAt!.getTime() - msg.queuedAt.getTime();
            return sum + latency;
          }, 0) / recentMessages.length
        : 0;

      return {
        healthy: true,
        messagesQueued: queued,
        messagesProcessing: processing,
        messagesFailed: failed,
        averageLatency: Math.round(avgLatency),
      };
    } catch (error) {
      this.logger.error('[OnlyFansRateLimiter] Failed to get queue status', { error });
      return {
        healthy: false,
        messagesQueued: 0,
        messagesProcessing: 0,
        messagesFailed: 0,
        averageLatency: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Validate message payload
   */
  private validateMessage(message: OnlyFansMessage): void {
    try {
      OnlyFansMessageSchema.parse(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        throw new Error(`Message validation failed: ${issues}`);
      }
      throw error;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${uuidv4()}`;
  }

  /**
   * Send message to SQS queue
   */
  private async sendToQueue(
    userId: string,
    messageId: string,
    message: OnlyFansMessage
  ): Promise<{ sqsMessageId?: string }> {
    // Map to QueuedMessage format
    const queuedMessage = {
      id: messageId,
      userId,
      recipientId: message.recipientId,
      content: message.content,
      messageType: 'custom' as const,
      priority: message.priority || 'medium',
      scheduledFor: new Date(),
      attempts: 0,
      maxRetries: RATE_LIMITER_CONFIG.RETRY.MAX_ATTEMPTS,
      metadata: {
        ...message.metadata,
        source: 'onlyfans-rate-limiter',
        originalTimestamp: new Date(),
        mediaUrls: message.mediaUrls,
      },
    };

    // Send to rate limiter queue
    const result = await this.queueManager.sendToRateLimiterQueue(queuedMessage);

    // Save to database
    await this.prisma.onlyFansMessage.create({
      data: {
        id: messageId,
        userId,
        recipientId: message.recipientId,
        content: message.content,
        mediaUrls: message.mediaUrls || [],
        priority: message.priority || 'medium',
        status: 'queued',
        sqsMessageId: result.messageId,
        metadata: message.metadata || {},
        queuedAt: new Date(),
      },
    });

    return { sqsMessageId: result.messageId };
  }

  /**
   * Handle send error with fallback
   */
  private async handleSendError(
    userId: string,
    messageId: string,
    message: OnlyFansMessage,
    error: unknown,
    startTime: number
  ): Promise<SendResult> {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    this.logger.error('[OnlyFansRateLimiter] Failed to send message', {
      messageId,
      userId,
      error: errorMessage,
      latency,
    });

    // Track failure metric
    await this.trackMetrics('MessagesFailed', 1, { priority: message.priority });

    // Fallback: Save to database for later retry
    if (RATE_LIMITER_CONFIG.FEATURES.FALLBACK_TO_DB) {
      try {
        await this.saveToDatabaseFallback(userId, messageId, message, errorMessage);
        
        this.logger.info('[OnlyFansRateLimiter] Message saved to database fallback', {
          messageId,
        });

        return {
          success: false,
          messageId,
          queuedAt: new Date(),
          error: errorMessage,
          fallbackUsed: true,
        };
      } catch (fallbackError) {
        this.logger.error('[OnlyFansRateLimiter] Fallback also failed', {
          messageId,
          fallbackError,
        });
      }
    }

    return {
      success: false,
      messageId,
      queuedAt: new Date(),
      error: errorMessage,
    };
  }

  /**
   * Save message to database as fallback
   */
  private async saveToDatabaseFallback(
    userId: string,
    messageId: string,
    message: OnlyFansMessage,
    error: string
  ): Promise<void> {
    await this.prisma.onlyFansMessage.create({
      data: {
        id: messageId,
        userId,
        recipientId: message.recipientId,
        content: message.content,
        mediaUrls: message.mediaUrls || [],
        priority: message.priority || 'medium',
        status: 'failed',
        lastError: error,
        metadata: message.metadata || {},
        queuedAt: new Date(),
      },
    });
  }

  /**
   * Track CloudWatch metrics
   */
  private async trackMetrics(
    metricName: string,
    value: number,
    dimensions?: Record<string, string>
  ): Promise<void> {
    if (!RATE_LIMITER_CONFIG.FEATURES.METRICS_ENABLED) {
      return;
    }

    try {
      await this.metrics.putMetric(metricName, value, dimensions);
    } catch (error) {
      // Don't fail the operation if metrics fail
      this.logger.warn('[OnlyFansRateLimiter] Failed to track metric', {
        metricName,
        error,
      });
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create OnlyFansRateLimiterService instance
 */
export function createOnlyFansRateLimiterService(
  queueManager: IntelligentQueueManager,
  prisma: PrismaClient,
  metrics: CloudWatchMetricsService
): OnlyFansRateLimiterService {
  return new OnlyFansRateLimiterService(queueManager, prisma, metrics);
}
