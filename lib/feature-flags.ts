/**
 * Feature Flag System for Onboarding
 * 
 * Provides progressive rollout capabilities with:
 * - Percentage-based rollout
 * - Market filtering
 * - User whitelisting
 * - Consistent hashing for stable user experience
 */

import { createRedisClient } from '@/lib/smart-onboarding/config/redis';
import crypto from 'crypto';

export interface OnboardingFlags {
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  markets: string[]; // ['FR', 'US'] or ['*'] for all
  userWhitelist: string[]; // User IDs that always get the feature
  createdAt?: Date;
  updatedAt?: Date;
}

const FEATURE_FLAG_KEY = 'feature:onboarding:config';
const CACHE_TTL = 300; // 5 minutes

// In-memory cache to reduce Redis calls
let cachedFlags: OnboardingFlags | null = null;
let cacheTimestamp: number = 0;

/**
 * Get feature flags from Redis or environment variables
 */
export async function getFlags(): Promise<OnboardingFlags> {
  // Check in-memory cache first
  const now = Date.now();
  if (cachedFlags && (now - cacheTimestamp) < CACHE_TTL * 1000) {
    return cachedFlags;
  }

  try {
    const redis = createRedisClient();
    const flagsJson = await redis.get(FEATURE_FLAG_KEY);

    if (flagsJson) {
      const flags = JSON.parse(flagsJson) as OnboardingFlags;
      cachedFlags = flags;
      cacheTimestamp = now;
      return flags;
    }
  } catch (error) {
    console.warn('[Feature Flags] Redis error, falling back to env vars:', error);
  }

  // Fallback to environment variables
  const flags: OnboardingFlags = {
    enabled: process.env.ONBOARDING_ENABLED === 'true',
    rolloutPercentage: parseInt(process.env.ONBOARDING_ROLLOUT_PERCENTAGE || '0', 10),
    markets: process.env.ONBOARDING_MARKETS?.split(',').map(m => m.trim()) || ['*'],
    userWhitelist: process.env.ONBOARDING_USER_WHITELIST?.split(',').map(u => u.trim()) || [],
  };

  cachedFlags = flags;
  cacheTimestamp = now;
  return flags;
}

/**
 * Update feature flags in Redis
 */
export async function updateFlags(flags: Partial<OnboardingFlags>): Promise<void> {
  const currentFlags = await getFlags();
  const updatedFlags: OnboardingFlags = {
    ...currentFlags,
    ...flags,
    updatedAt: new Date(),
  };

  try {
    const redis = createRedisClient();
    await redis.set(FEATURE_FLAG_KEY, JSON.stringify(updatedFlags));
    
    // Clear cache
    cachedFlags = null;
    cacheTimestamp = 0;
    
    console.log('[Feature Flags] Updated:', updatedFlags);
  } catch (error) {
    console.error('[Feature Flags] Failed to update flags:', error);
    throw error;
  }
}

/**
 * Check if onboarding is enabled for a specific user
 * Uses consistent hashing to ensure same user always gets same result
 */
export async function isOnboardingEnabled(
  userId: string,
  market?: string
): Promise<boolean> {
  const flags = await getFlags();

  // Feature disabled globally
  if (!flags.enabled) {
    return false;
  }

  // User is whitelisted
  if (flags.userWhitelist.includes(userId)) {
    return true;
  }

  // Check market filtering
  if (market && !flags.markets.includes('*') && !flags.markets.includes(market)) {
    return false;
  }

  // Check rollout percentage using consistent hashing
  const userHash = hashUserId(userId);
  const isInRollout = (userHash % 100) < flags.rolloutPercentage;

  return isInRollout;
}

/**
 * Hash user ID to a number between 0-99
 * Uses MD5 for consistent hashing
 */
function hashUserId(userId: string): number {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  // Take first 8 characters and convert to number
  const hashNumber = parseInt(hash.substring(0, 8), 16);
  return hashNumber % 100;
}

/**
 * Get rollout status for a user (for debugging)
 */
export async function getRolloutStatus(
  userId: string,
  market?: string
): Promise<{
  enabled: boolean;
  reason: string;
  flags: OnboardingFlags;
  userHash: number;
}> {
  const flags = await getFlags();
  const userHash = hashUserId(userId);

  if (!flags.enabled) {
    return {
      enabled: false,
      reason: 'Feature disabled globally',
      flags,
      userHash,
    };
  }

  if (flags.userWhitelist.includes(userId)) {
    return {
      enabled: true,
      reason: 'User is whitelisted',
      flags,
      userHash,
    };
  }

  if (market && !flags.markets.includes('*') && !flags.markets.includes(market)) {
    return {
      enabled: false,
      reason: `Market ${market} not in allowed markets`,
      flags,
      userHash,
    };
  }

  const isInRollout = (userHash % 100) < flags.rolloutPercentage;
  return {
    enabled: isInRollout,
    reason: isInRollout
      ? `User hash ${userHash} < rollout ${flags.rolloutPercentage}%`
      : `User hash ${userHash} >= rollout ${flags.rolloutPercentage}%`,
    flags,
    userHash,
  };
}

/**
 * Clear feature flag cache (useful for testing)
 */
export function clearFlagCache(): void {
  cachedFlags = null;
  cacheTimestamp = 0;
}
