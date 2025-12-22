/**
 * Idempotency Service
 * Content & Trends AI Engine - Phase 4
 * 
 * Redis-based idempotency checking to prevent duplicate webhook processing
 * with configurable TTL (24-48 hours)
 */

import {
  IdempotencyConfig,
  IdempotencyResult,
  IdempotencyRecord,
  DEFAULT_IDEMPOTENCY_CONFIG,
} from './types';
import { WebhookEventType } from '../apify/types';

// ============================================================================
// Redis Client Interface (for dependency injection)
// ============================================================================

export interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<number>;
}

// ============================================================================
// In-Memory Store (for testing/fallback)
// ============================================================================

class InMemoryStore implements RedisClientInterface {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiresAt = options?.EX 
      ? Date.now() + options.EX * 1000 
      : Date.now() + 86400000; // Default 24h
    this.store.set(key, { value, expiresAt });
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.set(key, value, { EX: seconds });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================================================
// Idempotency Service
// ============================================================================

export class IdempotencyService {
  private readonly config: Required<IdempotencyConfig>;
  private readonly redis: RedisClientInterface;

  constructor(
    config: IdempotencyConfig = {},
    redisClient?: RedisClientInterface
  ) {
    this.config = {
      ...DEFAULT_IDEMPOTENCY_CONFIG,
      ...config,
    };

    this.redis = redisClient ?? new InMemoryStore();
  }

  /**
   * Check if an event has already been processed
   * 
   * @param eventId - Unique event identifier
   * @returns Idempotency check result
   */
  async checkIdempotency(eventId: string): Promise<IdempotencyResult> {
    if (!this.config.enabled) {
      return {
        isDuplicate: false,
        eventId,
      };
    }

    const key = this.buildKey(eventId);
    const existing = await this.redis.get(key);

    if (existing) {
      try {
        const record: IdempotencyRecord = JSON.parse(existing);
        return {
          isDuplicate: true,
          eventId,
          firstSeenAt: new Date(record.firstSeenAt),
          processedAt: record.processedAt ? new Date(record.processedAt) : undefined,
        };
      } catch {
        // Corrupted record, treat as duplicate but log warning
        return {
          isDuplicate: true,
          eventId,
        };
      }
    }

    return {
      isDuplicate: false,
      eventId,
    };
  }

  /**
   * Mark an event as being processed (acquire lock)
   * 
   * @param eventId - Unique event identifier
   * @param eventType - Type of webhook event
   * @param actorRunId - Associated actor run ID
   * @returns True if lock acquired, false if already exists
   */
  async markAsProcessing(
    eventId: string,
    eventType: WebhookEventType,
    actorRunId: string
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return true;
    }

    const key = this.buildKey(eventId);
    const existing = await this.redis.exists(key);

    if (existing) {
      return false; // Already being processed
    }

    const record: IdempotencyRecord = {
      eventId,
      eventType,
      actorRunId,
      firstSeenAt: new Date(),
      status: 'pending',
      attempts: 1,
    };

    await this.redis.setex(key, this.config.ttlSeconds, JSON.stringify(record));
    return true;
  }

  /**
   * Mark an event as successfully processed
   * 
   * @param eventId - Unique event identifier
   */
  async markAsProcessed(eventId: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const key = this.buildKey(eventId);
    const existing = await this.redis.get(key);

    if (existing) {
      try {
        const record: IdempotencyRecord = JSON.parse(existing);
        record.status = 'processed';
        record.processedAt = new Date();
        await this.redis.setex(key, this.config.ttlSeconds, JSON.stringify(record));
      } catch {
        // If parsing fails, just update with minimal info
        const record: IdempotencyRecord = {
          eventId,
          eventType: 'ACTOR.RUN.SUCCEEDED',
          actorRunId: 'unknown',
          firstSeenAt: new Date(),
          processedAt: new Date(),
          status: 'processed',
          attempts: 1,
        };
        await this.redis.setex(key, this.config.ttlSeconds, JSON.stringify(record));
      }
    }
  }

  /**
   * Mark an event as failed (allows retry)
   * 
   * @param eventId - Unique event identifier
   * @param maxAttempts - Maximum retry attempts before permanent failure
   * @returns True if can retry, false if max attempts reached
   */
  async markAsFailed(eventId: string, maxAttempts: number = 3): Promise<boolean> {
    if (!this.config.enabled) {
      return true;
    }

    const key = this.buildKey(eventId);
    const existing = await this.redis.get(key);

    if (existing) {
      try {
        const record: IdempotencyRecord = JSON.parse(existing);
        record.attempts += 1;
        
        if (record.attempts >= maxAttempts) {
          record.status = 'failed';
          await this.redis.setex(key, this.config.ttlSeconds, JSON.stringify(record));
          return false; // No more retries
        }

        // Allow retry by removing the record
        await this.redis.del(key);
        return true;
      } catch {
        // If parsing fails, allow retry
        await this.redis.del(key);
        return true;
      }
    }

    return true;
  }

  /**
   * Get the idempotency record for an event
   * 
   * @param eventId - Unique event identifier
   * @returns Idempotency record or null
   */
  async getRecord(eventId: string): Promise<IdempotencyRecord | null> {
    const key = this.buildKey(eventId);
    const existing = await this.redis.get(key);

    if (!existing) {
      return null;
    }

    try {
      return JSON.parse(existing);
    } catch {
      return null;
    }
  }

  /**
   * Remove an idempotency record (for cleanup or testing)
   * 
   * @param eventId - Unique event identifier
   */
  async removeRecord(eventId: string): Promise<void> {
    const key = this.buildKey(eventId);
    await this.redis.del(key);
  }

  /**
   * Generate a unique event ID from webhook payload
   * 
   * @param actorRunId - Actor run ID
   * @param eventType - Event type
   * @param timestamp - Event timestamp
   * @returns Unique event ID
   */
  generateEventId(
    actorRunId: string,
    eventType: WebhookEventType,
    timestamp: string
  ): string {
    return `${actorRunId}:${eventType}:${timestamp}`;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildKey(eventId: string): string {
    return `${this.config.keyPrefix}${eventId}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an idempotency service instance
 */
export function createIdempotencyService(
  config?: IdempotencyConfig,
  redisClient?: RedisClientInterface
): IdempotencyService {
  return new IdempotencyService(config, redisClient);
}

/**
 * Create an in-memory idempotency service (for testing)
 */
export function createInMemoryIdempotencyService(
  config?: IdempotencyConfig
): IdempotencyService {
  return new IdempotencyService(config, new InMemoryStore());
}
