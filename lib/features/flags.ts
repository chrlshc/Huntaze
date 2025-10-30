import crypto from 'crypto';

/**
 * Feature flags for Huntaze OnlyFans integration
 */
export const FEATURE_FLAGS = {
  // Playwright gradual rollout (percentage of users)
  PLAYWRIGHT_ENABLED_PERCENT: parseInt(process.env.PLAYWRIGHT_ENABLED_PERCENT || '10'),

  // Account types supported
  ACCOUNT_TYPES: {
    new: true,
    established: true,
    power: true,
    vip: true
  },

  // Rate limits by account type
  RATE_LIMITS: {
    new: { 
      daily: 100, 
      perMin: 5,
      description: 'New accounts (< 30 days)'
    },
    established: { 
      daily: 250, 
      perMin: 10,
      description: 'Established accounts (30-180 days)'
    },
    power: { 
      daily: 400, 
      perMin: 15,
      description: 'Power users (180+ days, high engagement)'
    },
    vip: { 
      daily: 600, 
      perMin: 20,
      description: 'VIP accounts (verified, high revenue)'
    }
  },

  // ECS configuration
  ECS: {
    maxConcurrentTasks: parseInt(process.env.ECS_MAX_CONCURRENT_TASKS || '10'),
    taskTimeout: parseInt(process.env.ECS_TASK_TIMEOUT || '60000'), // 60 seconds
    retryAttempts: parseInt(process.env.ECS_RETRY_ATTEMPTS || '3')
  },

  // Monitoring
  MONITORING: {
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === 'true',
    enableMetrics: process.env.ENABLE_METRICS !== 'false', // Default true
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000') // 1 minute
  }
} as const;

/**
 * Hash user ID to determine if Playwright should be enabled
 * Uses consistent hashing to ensure same user always gets same result
 */
function hashUserId(userId: string): number {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  return parseInt(hash.substring(0, 8), 16) % 100;
}

/**
 * Determine if Playwright should be used for this user
 * Based on feature flag percentage and consistent hashing
 */
export async function shouldUsePlaywright(userId: string): Promise<boolean> {
  const enabledPercent = FEATURE_FLAGS.PLAYWRIGHT_ENABLED_PERCENT;
  
  // If 100%, always use Playwright
  if (enabledPercent >= 100) {
    return true;
  }
  
  // If 0%, never use Playwright
  if (enabledPercent <= 0) {
    return false;
  }
  
  // Use consistent hashing to determine if user is in enabled percentage
  const userHash = hashUserId(userId);
  return userHash < enabledPercent;
}

/**
 * Get rate limit for account type
 */
export function getRateLimit(accountType: keyof typeof FEATURE_FLAGS.RATE_LIMITS) {
  return FEATURE_FLAGS.RATE_LIMITS[accountType] || FEATURE_FLAGS.RATE_LIMITS.established;
}

/**
 * Check if account type is supported
 */
export function isAccountTypeSupported(accountType: string): boolean {
  return accountType in FEATURE_FLAGS.ACCOUNT_TYPES && 
         FEATURE_FLAGS.ACCOUNT_TYPES[accountType as keyof typeof FEATURE_FLAGS.ACCOUNT_TYPES];
}

/**
 * Get current feature flag configuration
 */
export function getFeatureFlagConfig() {
  return {
    playwrightEnabled: FEATURE_FLAGS.PLAYWRIGHT_ENABLED_PERCENT,
    accountTypes: Object.keys(FEATURE_FLAGS.ACCOUNT_TYPES).filter(
      type => FEATURE_FLAGS.ACCOUNT_TYPES[type as keyof typeof FEATURE_FLAGS.ACCOUNT_TYPES]
    ),
    rateLimits: FEATURE_FLAGS.RATE_LIMITS,
    ecs: FEATURE_FLAGS.ECS,
    monitoring: FEATURE_FLAGS.MONITORING
  };
}
