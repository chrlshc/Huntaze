/**
 * Kill Switch System for Onboarding
 * 
 * Provides emergency shutdown capability with:
 * - Instant activation/deactivation
 * - Redis pub/sub for instant propagation
 * - Logging of all operations
 */

import { createRedisClient } from '@/lib/smart-onboarding/config/redis';

const KILL_SWITCH_KEY = 'onboarding:kill_switch';
const KILL_SWITCH_CHANNEL = 'onboarding:kill_switch:updates';
const CACHE_TTL = 10; // 10 seconds - short TTL for kill switch

// In-memory cache
let cachedKillSwitch: boolean | null = null;
let cacheTimestamp: number = 0;

/**
 * Check if kill switch is activated
 */
export async function checkKillSwitch(): Promise<boolean> {
  // Check in-memory cache first (short TTL)
  const now = Date.now();
  if (cachedKillSwitch !== null && (now - cacheTimestamp) < CACHE_TTL * 1000) {
    return cachedKillSwitch;
  }

  try {
    const redis = createRedisClient();
    const value = await redis.get(KILL_SWITCH_KEY);
    const isActive = value === 'true';
    
    cachedKillSwitch = isActive;
    cacheTimestamp = now;
    
    return isActive;
  } catch (error) {
    console.error('[Kill Switch] Error checking kill switch:', error);
    // Fail-safe: if we can't check, assume it's NOT active
    return false;
  }
}

/**
 * Activate kill switch (emergency shutdown)
 */
export async function activateKillSwitch(reason?: string): Promise<void> {
  try {
    const redis = createRedisClient();
    await redis.set(KILL_SWITCH_KEY, 'true');
    
    // Publish to channel for instant propagation
    await redis.publish(KILL_SWITCH_CHANNEL, JSON.stringify({
      active: true,
      reason,
      timestamp: new Date().toISOString(),
    }));
    
    // Clear cache
    cachedKillSwitch = true;
    cacheTimestamp = Date.now();
    
    console.error('[Kill Switch] ACTIVATED', {
      reason,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Kill Switch] Failed to activate:', error);
    throw error;
  }
}

/**
 * Deactivate kill switch (restore normal operation)
 */
export async function deactivateKillSwitch(reason?: string): Promise<void> {
  try {
    const redis = createRedisClient();
    await redis.set(KILL_SWITCH_KEY, 'false');
    
    // Publish to channel for instant propagation
    await redis.publish(KILL_SWITCH_CHANNEL, JSON.stringify({
      active: false,
      reason,
      timestamp: new Date().toISOString(),
    }));
    
    // Clear cache
    cachedKillSwitch = false;
    cacheTimestamp = Date.now();
    
    console.log('[Kill Switch] DEACTIVATED', {
      reason,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Kill Switch] Failed to deactivate:', error);
    throw error;
  }
}

/**
 * Get kill switch status with metadata
 */
export async function getKillSwitchStatus(): Promise<{
  active: boolean;
  lastChecked: Date;
  cacheAge: number;
}> {
  const active = await checkKillSwitch();
  const now = Date.now();
  
  return {
    active,
    lastChecked: new Date(cacheTimestamp),
    cacheAge: Math.floor((now - cacheTimestamp) / 1000),
  };
}

/**
 * Clear kill switch cache (useful for testing)
 */
export function clearKillSwitchCache(): void {
  cachedKillSwitch = null;
  cacheTimestamp = 0;
}

/**
 * Subscribe to kill switch updates (for real-time propagation)
 * This should be called once at application startup
 */
export async function subscribeToKillSwitchUpdates(): Promise<void> {
  try {
    const redis = createRedisClient();
    
    // Subscribe to updates
    await redis.subscribe(KILL_SWITCH_CHANNEL, (message) => {
      try {
        const update = JSON.parse(message);
        cachedKillSwitch = update.active;
        cacheTimestamp = Date.now();
        
        if (update.active) {
          console.error('[Kill Switch] Received activation signal', update);
        } else {
          console.log('[Kill Switch] Received deactivation signal', update);
        }
      } catch (error) {
        console.error('[Kill Switch] Error processing update:', error);
      }
    });
    
    console.log('[Kill Switch] Subscribed to updates');
  } catch (error) {
    console.error('[Kill Switch] Failed to subscribe to updates:', error);
  }
}
