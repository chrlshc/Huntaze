// OnlyFans Message Queue System
// Handles DM sending and mass message campaigns with rate limiting

import { DEFAULT_RATE_LIMITS } from '@/lib/types/onlyfans';

export interface QueueMessage {
  id: string;
  type: 'dm' | 'campaign';
  userId: string;
  data: DmMessage | CampaignMessage;
  priority: number; // 1-10, higher = more priority
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

export interface DmMessage {
  conversationId: string;
  content: {
    text: string;
    media?: string[];
  };
}

export interface CampaignMessage {
  campaignId: string;
  recipientId: string;
  platformUserId: string;
  content: {
    text: string;
    media?: string[];
  };
}

export interface QueueWorkerConfig {
  concurrency: number;
  pollInterval: number;
  rateLimits: typeof DEFAULT_RATE_LIMITS;
}

// Simple in-memory queue (replace with Redis/SQS in production)
class OfMessageQueue {
  private queue: Map<string, QueueMessage> = new Map();
  private processing: Set<string> = new Set();
  private userRateLimits: Map<string, { dm: number; campaign: number; resetAt: Date }> = new Map();

  // Add message to queue
  async enqueue(message: Omit<QueueMessage, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueMessage: QueueMessage = {
      ...message,
      id,
      attempts: 0,
      createdAt: new Date()
    };

    this.queue.set(id, queueMessage);
    
    console.log(`Message ${id} enqueued for ${message.scheduledFor}`);
    return id;
  }

  // Get next messages to process
  async dequeue(limit: number = 10): Promise<QueueMessage[]> {
    const now = new Date();
    const messages: QueueMessage[] = [];

    // Sort by priority and scheduled time
    const sortedMessages = Array.from(this.queue.values())
      .filter(msg => 
        !this.processing.has(msg.id) && 
        msg.scheduledFor <= now &&
        msg.attempts < msg.maxAttempts
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      });

    // Apply rate limits per user
    for (const msg of sortedMessages) {
      if (messages.length >= limit) break;
      
      if (this.canSendMessage(msg)) {
        messages.push(msg);
        this.processing.add(msg.id);
        this.updateRateLimit(msg);
      }
    }

    return messages;
  }

  // Mark message as completed
  async complete(messageId: string): Promise<void> {
    this.queue.delete(messageId);
    this.processing.delete(messageId);
  }

  // Mark message as failed
  async fail(messageId: string, error: string): Promise<void> {
    const message = this.queue.get(messageId);
    if (!message) return;

    message.attempts++;
    message.lastAttemptAt = new Date();
    message.error = error;
    
    // Calculate backoff delay
    const backoffDelay = Math.min(
      1000 * Math.pow(2, message.attempts), // Exponential backoff
      300000 // Max 5 minutes
    );
    
    message.scheduledFor = new Date(Date.now() + backoffDelay);
    this.processing.delete(messageId);

    if (message.attempts >= message.maxAttempts) {
      console.error(`Message ${messageId} failed permanently: ${error}`);
      this.queue.delete(messageId);
      // TODO: Store in dead letter queue
    }
  }

  // Check if message can be sent based on rate limits
  private canSendMessage(message: QueueMessage): boolean {
    const now = new Date();
    const userLimits = this.userRateLimits.get(message.userId);
    
    if (!userLimits || userLimits.resetAt < now) {
      // Reset limits
      this.userRateLimits.set(message.userId, {
        dm: 0,
        campaign: 0,
        resetAt: new Date(now.getTime() + 60000) // 1 minute window
      });
      return true;
    }

    const limits = DEFAULT_RATE_LIMITS;
    
    if (message.type === 'dm') {
      return userLimits.dm < limits.dm.messagesPerMinute;
    } else {
      return userLimits.campaign < limits.campaign.batchSize;
    }
  }

  // Update rate limit counters
  private updateRateLimit(message: QueueMessage): void {
    const userLimits = this.userRateLimits.get(message.userId);
    if (!userLimits) return;

    if (message.type === 'dm') {
      userLimits.dm++;
    } else {
      userLimits.campaign++;
    }
  }

  // Get queue statistics
  getStats() {
    const now = new Date();
    const pending = Array.from(this.queue.values()).filter(m => m.scheduledFor > now);
    const ready = Array.from(this.queue.values()).filter(m => m.scheduledFor <= now && !this.processing.has(m.id));
    const processing = this.processing.size;
    const failed = Array.from(this.queue.values()).filter(m => m.attempts > 0);

    return {
      total: this.queue.size,
      pending: pending.length,
      ready: ready.length,
      processing,
      failed: failed.length
    };
  }
}

// Export singleton
export const ofQueue = new OfMessageQueue();

// Queue helpers
export async function queueDmMessage(
  userId: string,
  conversationId: string,
  content: { text: string; media?: string[] }
): Promise<string> {
  const delay = Math.random() * 
    (DEFAULT_RATE_LIMITS.dm.delayBetweenMessages.max - DEFAULT_RATE_LIMITS.dm.delayBetweenMessages.min) +
    DEFAULT_RATE_LIMITS.dm.delayBetweenMessages.min;

  return ofQueue.enqueue({
    type: 'dm',
    userId,
    data: { conversationId, content },
    priority: 5,
    maxAttempts: 3,
    scheduledFor: new Date(Date.now() + delay)
  });
}

export async function queueCampaignMessages(
  userId: string,
  campaignId: string,
  recipients: Array<{ id: string; platformUserId: string }>,
  content: { text: string; media?: string[] }
): Promise<string[]> {
  const messageIds: string[] = [];
  
  for (let i = 0; i < recipients.length; i++) {
    const batchIndex = Math.floor(i / DEFAULT_RATE_LIMITS.campaign.batchSize);
    const batchDelay = batchIndex * (
      Math.random() * 
      (DEFAULT_RATE_LIMITS.campaign.pauseBetweenBatches.max - DEFAULT_RATE_LIMITS.campaign.pauseBetweenBatches.min) +
      DEFAULT_RATE_LIMITS.campaign.pauseBetweenBatches.min
    );
    
    const messageId = await ofQueue.enqueue({
      type: 'campaign',
      userId,
      data: {
        campaignId,
        recipientId: recipients[i].id,
        platformUserId: recipients[i].platformUserId,
        content
      },
      priority: 3, // Lower priority than DMs
      maxAttempts: 3,
      scheduledFor: new Date(Date.now() + batchDelay)
    });
    
    messageIds.push(messageId);
  }
  
  return messageIds;
}