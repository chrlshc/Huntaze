/**
 * Redis Client with Build-time Fallback
 * 
 * Provides a Redis client that gracefully handles connection failures
 * during build time when Redis is not available.
 */

import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
let connectionAttempted = false;
let connectionError: Error | null = null;

/**
 * Get Redis client with graceful fallback
 * Returns null if connection fails (e.g., during build)
 */
export function getRedisClient(): Redis | null {
  // Return cached client if already connected
  if (redisClient) {
    return redisClient;
  }

  // Don't retry if we already failed
  if (connectionAttempted && connectionError) {
    console.warn('[Redis] Using fallback - connection previously failed:', connectionError.message);
    return null;
  }

  // Check if Redis URL is configured
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('[Redis] No Redis credentials found - using fallback mode');
    connectionAttempted = true;
    return null;
  }

  try {
    // Attempt to create Redis client
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

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
  return getRedisClient() !== null;
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
