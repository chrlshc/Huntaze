import { createClient, RedisClientType } from 'redis';

export class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://huntaze-sbpts4.serverless.usw1.cache.amazonaws.com:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready to accept commands');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  // Common cache operations
  async get(key: string): Promise<string | null> {
    return await this.getClient().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.getClient().setEx(key, ttlSeconds, value);
    } else {
      await this.getClient().set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.getClient().exists(key);
    return result === 1;
  }

  // Hash operations
  async hGet(key: string, field: string): Promise<string | null> {
    return await this.getClient().hGet(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.getClient().hSet(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.getClient().hGetAll(key);
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    return await this.getClient().lPush(key, values);
  }

  async rPop(key: string): Promise<string | null> {
    return await this.getClient().rPop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.getClient().lRange(key, start, stop);
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return await this.getClient().sAdd(key, members);
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.getClient().sMembers(key);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    const result = await this.getClient().sIsMember(key, member);
    return result === 1;
  }

  // Increment operations
  async incr(key: string): Promise<number> {
    return await this.getClient().incr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return await this.getClient().incrBy(key, increment);
  }

  // TTL operations
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.getClient().expire(key, seconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.getClient().ttl(key);
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    return await this.getClient().keys(pattern);
  }

  // Pipeline for batch operations
  async pipeline(operations: Array<() => Promise<any>>): Promise<any[]> {
    const multi = this.getClient().multi();
    
    for (const op of operations) {
      await op();
    }
    
    return await multi.exec();
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    return await this.getClient().publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client!.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(channel, (message) => {
      callback(message);
    });
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redisManager = RedisManager.getInstance();

// Helper functions for common patterns
export const CacheHelpers = {
  /**
   * Get or set cache with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await redisManager.get(key);
    
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // If parse fails, treat as cache miss
      }
    }
    
    const value = await factory();
    await redisManager.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  },

  /**
   * Cache with tags for invalidation
   */
  async setWithTags(
    key: string,
    value: any,
    tags: string[],
    ttlSeconds?: number
  ): Promise<void> {
    // Store the value
    await redisManager.set(key, JSON.stringify(value), ttlSeconds);
    
    // Store tags
    for (const tag of tags) {
      await redisManager.sAdd(`tag:${tag}`, key);
      if (ttlSeconds) {
        await redisManager.expire(`tag:${tag}`, ttlSeconds);
      }
    }
  },

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<void> {
    const keys = await redisManager.sMembers(`tag:${tag}`);
    
    if (keys.length > 0) {
      const multi = redisManager.getClient().multi();
      
      for (const key of keys) {
        multi.del(key);
      }
      
      multi.del(`tag:${tag}`);
      await multi.exec();
    }
  },

  /**
   * Rate limiting helper
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `rate_limit:${identifier}`;
    const current = await redisManager.incr(key);
    
    if (current === 1) {
      await redisManager.expire(key, windowSeconds);
    }
    
    const ttl = await redisManager.ttl(key);
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetIn: ttl > 0 ? ttl : windowSeconds
    };
  }
};