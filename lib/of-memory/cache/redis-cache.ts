/**
 * OnlyFans AI Memory System - Redis Cache Manager
 * 
 * Redis-based caching with TTL management, key generation,
 * and cache invalidation for the memory system.
 */

import { Redis } from '@upstash/redis';
import type {
  MemoryContext,
  ConversationMessage,
  PersonalityProfile,
  FanPreferences,
  EmotionalState,
  MemoryConfig
} from '../types';
import type { ICacheManager } from '../interfaces';

/**
 * Redis cache manager implementation
 */
export class RedisCacheManager implements ICacheManager {
  private redis: Redis;
  private config: MemoryConfig['cache'];
  private keyPrefix: string = 'of:memory';

  constructor(config?: MemoryConfig['cache']) {
    // Initialize Redis client only if properly configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = Redis.fromEnv();
    } else if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('https')) {
      // Only use Redis URL if it's HTTPS (Upstash compatible)
      this.redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN || ''
      });
    } else {
      // Redis not configured or not compatible - disable caching
      console.warn('Redis not configured for OnlyFans memory cache - caching disabled');
      this.redis = null as any; // Will be handled by null checks in methods
    }

    this.config = config || {
      ttl: {
        messages: 3600, // 1 hour
        personality: 7200, // 2 hours
        preferences: 7200, // 2 hours
        engagement: 3600, // 1 hour
        emotion: 1800 // 30 minutes
      },
      maxMessagesCached: 50
    };
  }

  /**
   * Generate cache key
   */
  generateKey(fanId: string, creatorId: string, type: string): string {
    return `${this.keyPrefix}:${creatorId}:${fanId}:${type}`;
  }

  /**
   * Get cached memory context
   */
  async getMemoryContext(
    fanId: string,
    creatorId: string
  ): Promise<MemoryContext | null> {
    try {
      const key = this.generateKey(fanId, creatorId, 'context');
      const data = await this.redis.get<string>(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data as string) as MemoryContext;
    } catch (error) {
      console.error('[RedisCacheManager] Error getting memory context:', error);
      return null;
    }
  }

  /**
   * Set memory context in cache
   */
  async setMemoryContext(
    fanId: string,
    creatorId: string,
    context: MemoryContext,
    ttl: number
  ): Promise<void> {
    try {
      const key = this.generateKey(fanId, creatorId, 'context');
      await this.redis.setex(key, ttl, JSON.stringify(context));
    } catch (error) {
      console.error('[RedisCacheManager] Error setting memory context:', error);
    }
  }

  /**
   * Get cached messages
   */
  async getMessages(
    fanId: string,
    creatorId: string
  ): Promise<ConversationMessage[] | null> {
    try {
      const key = this.generateKey(fanId, creatorId, 'messages');
      const data = await this.redis.get<string>(key);
      
      if (!data) {
        return null;
      }

      const messages = JSON.parse(data as string) as ConversationMessage[];
      
      // Parse dates
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('[RedisCacheManager] Error getting messages:', error);
      return null;
    }
  }

  /**
   * Set messages in cache
   */
  async setMessages(
    fanId: string,
    creatorId: string,
    messages: ConversationMessage[],
    ttl: number
  ): Promise<void> {
    try {
      const key = this.generateKey(fanId, creatorId, 'messages');
      
      // Limit to max cached messages
      const limitedMessages = messages.slice(0, this.config.maxMessagesCached);
      
      await this.redis.setex(key, ttl, JSON.stringify(limitedMessages));
    } catch (error) {
      console.error('[RedisCacheManager] Error setting messages:', error);
    }
  }

  /**
   * Get cached personality profile
   */
  async getPersonalityProfile(
    fanId: string,
    creatorId: string
  ): Promise<PersonalityProfile | null> {
    try {
      const key = this.generateKey(fanId, creatorId, 'personality');
      const data = await this.redis.get<string>(key);
      
      if (!data) {
        return null;
      }

      const profile = JSON.parse(data as string) as PersonalityProfile;
      
      // Parse date
      return {
        ...profile,
        lastCalibrated: new Date(profile.lastCalibrated)
      };
    } catch (error) {
      console.error('[RedisCacheManager] Error getting personality profile:', error);
      return null;
    }
  }

  /**
   * Set personality profile in cache
   */
  async setPersonalityProfile(
    fanId: string,
    creatorId: string,
    profile: PersonalityProfile,
    ttl: number
  ): Promise<void> {
    try {
      const key = this.generateKey(fanId, creatorId, 'personality');
      await this.redis.setex(key, ttl, JSON.stringify(profile));
    } catch (error) {
      console.error('[RedisCacheManager] Error setting personality profile:', error);
    }
  }

  /**
   * Get cached preferences
   */
  async getPreferences(
    fanId: string,
    creatorId: string
  ): Promise<FanPreferences | null> {
    try {
      const key = this.generateKey(fanId, creatorId, 'preferences');
      const data = await this.redis.get<string>(key);
      
      if (!data) {
        return null;
      }

      const preferences = JSON.parse(data as string) as FanPreferences;
      
      // Parse date
      return {
        ...preferences,
        lastUpdated: new Date(preferences.lastUpdated)
      };
    } catch (error) {
      console.error('[RedisCacheManager] Error getting preferences:', error);
      return null;
    }
  }

  /**
   * Set preferences in cache
   */
  async setPreferences(
    fanId: string,
    creatorId: string,
    preferences: FanPreferences,
    ttl: number
  ): Promise<void> {
    try {
      const key = this.generateKey(fanId, creatorId, 'preferences');
      await this.redis.setex(key, ttl, JSON.stringify(preferences));
    } catch (error) {
      console.error('[RedisCacheManager] Error setting preferences:', error);
    }
  }

  /**
   * Get cached engagement score
   */
  async getEngagementScore(
    fanId: string,
    creatorId: string
  ): Promise<number | null> {
    try {
      const key = this.generateKey(fanId, creatorId, 'engagement');
      const score = await this.redis.get<number>(key);
      return score !== null ? Number(score) : null;
    } catch (error) {
      console.error('[RedisCacheManager] Error getting engagement score:', error);
      return null;
    }
  }

  /**
   * Set engagement score in cache
   */
  async setEngagementScore(
    fanId: string,
    creatorId: string,
    score: number,
    ttl: number
  ): Promise<void> {
    try {
      const key = this.generateKey(fanId, creatorId, 'engagement');
      await this.redis.setex(key, ttl, score);
    } catch (error) {
      console.error('[RedisCacheManager] Error setting engagement score:', error);
    }
  }

  /**
   * Get cached emotional state
   */
  async getEmotionalState(
    fanId: string,
    creatorId: string
  ): Promise<EmotionalState | null> {
    try {
      const key = this.generateKey(fanId, creatorId, 'emotion');
      const data = await this.redis.get<string>(key);
      
      if (!data) {
        return null;
      }

      const state = JSON.parse(data as string) as EmotionalState;
      
      // Parse dates
      return {
        ...state,
        sentimentHistory: state.sentimentHistory.map(point => ({
          ...point,
          timestamp: new Date(point.timestamp)
        })),
        lastPositiveInteraction: state.lastPositiveInteraction 
          ? new Date(state.lastPositiveInteraction) 
          : null,
        lastNegativeInteraction: state.lastNegativeInteraction 
          ? new Date(state.lastNegativeInteraction) 
          : null
      };
    } catch (error) {
      console.error('[RedisCacheManager] Error getting emotional state:', error);
      return null;
    }
  }

  /**
   * Set emotional state in cache
   */
  async setEmotionalState(
    fanId: string,
    creatorId: string,
    state: EmotionalState,
    ttl: number
  ): Promise<void> {
    try {
      const key = this.generateKey(fanId, creatorId, 'emotion');
      await this.redis.setex(key, ttl, JSON.stringify(state));
    } catch (error) {
      console.error('[RedisCacheManager] Error setting emotional state:', error);
    }
  }

  /**
   * Invalidate all cache for a fan
   */
  async invalidateFanCache(fanId: string, creatorId: string): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}:${creatorId}:${fanId}:*`;
      
      // Get all keys matching pattern
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        // Delete all keys
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('[RedisCacheManager] Error invalidating fan cache:', error);
    }
  }

  /**
   * Invalidate specific cache key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('[RedisCacheManager] Error invalidating key:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
  }> {
    try {
      const pattern = `${this.keyPrefix}:*`;
      const keys = await this.redis.keys(pattern);
      
      return {
        totalKeys: keys.length,
        memoryUsage: 'N/A' // Redis doesn't expose this easily via Upstash
      };
    } catch (error) {
      console.error('[RedisCacheManager] Error getting stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'Error'
      };
    }
  }

  /**
   * Clear all memory cache (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      console.log(`[RedisCacheManager] Cleared ${keys.length} keys`);
    } catch (error) {
      console.error('[RedisCacheManager] Error clearing cache:', error);
    }
  }

  /**
   * Test Redis connection
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('[RedisCacheManager] Ping failed:', error);
      return false;
    }
  }
}

// Create singleton instance
let cacheInstance: RedisCacheManager | null = null;

/**
 * Get or create the cache manager instance
 */
export function getCacheManager(config?: MemoryConfig['cache']): RedisCacheManager {
  if (!cacheInstance) {
    cacheInstance = new RedisCacheManager(config);
  }
  return cacheInstance;
}

// Export default instance
export const memoryCache = getCacheManager();
