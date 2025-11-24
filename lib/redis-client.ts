/**
 * Redis Client with Build-time Fallback
 * 
 * Provides a Redis client that gracefully handles connection failures
 * during build time when Redis is not available.
 * 
 * Supports both AWS ElastiCache (ioredis) and Upstash Redis
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let connectionAttempted = false;
let connectionError: Error | null = null;

/**
 * Get Redis client with graceful fallback
 * Returns null if connection fails (e.g., during build)
 */
export function getRedisClient(): Redis | null {
  // CRITICAL: Force disable Redis if explicitly requested
  // This prevents build-time timeouts that corrupt the build artifact
  if (process.env.DISABLE_REDIS_CACHE === 'true' || process.env.DISABLE_REDIS_CACHE === '1') {
    console.log('[Redis] Explicitly disabled via DISABLE_REDIS_CACHE');
    return null;
  }

  // Return cached client if already connected
  if (redisClient) {
    return redisClient;
  }

  // Don't retry if we already failed
  if (connectionAttempted && connectionError) {
    console.warn('[Redis] Using fallback - connection previously failed:', connectionError.message);
    return null;
  }

  // Check for AWS ElastiCache configuration (preferred)
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;

  // Fallback to Upstash if ElastiCache not configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisHost && !upstashUrl) {
    console.warn('[Redis] No Redis configuration found - using fallback mode');
    connectionAttempted = true;
    return null;
  }

  try {
    if (redisHost) {
      // AWS ElastiCache configuration
      console.log('[Redis] Connecting to AWS ElastiCache:', redisHost);
      redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('[Redis] Max retry attempts reached');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      // Handle connection errors
      redisClient.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        connectionError = err;
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });
    } else if (upstashUrl && upstashToken) {
      // Upstash configuration (fallback)
      console.log('[Redis] Using Upstash Redis');
      redisClient = new Redis(upstashUrl);
    }

    console.log('[Redis] Client initialized successfully');
    connectionAttempted = true;
    return redisClient;
  } catch (error) {
    connectionError = error as Error;
    connectionAttempted = true;
    console.error('[Redis] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  const client = getRedisClient();
  return client !== null && client.status === 'ready';
}

/**
 * Safe Redis operation with fallback
 */
export async function safeRedisOperation<T>(
  operation: (client: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  const client = getRedisClient();
  
  if (!client) {
    console.warn('[Redis] Operation skipped - using fallback value');
    return fallback;
  }

  try {
    return await operation(client);
  } catch (error) {
    console.error('[Redis] Operation failed:', error);
    return fallback;
  }
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    connectionAttempted = false;
  }
}
