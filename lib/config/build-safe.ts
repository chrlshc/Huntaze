/**
 * Build-Safe Configuration
 * 
 * Provides safe defaults and lazy initialization for services
 * that require runtime environment variables
 */

// Flag to check if we're in build mode
export const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Get OpenAI API key safely
 */
export function getOpenAIKey(): string | undefined {
  if (isBuildTime) {
    return 'build-time-placeholder';
  }
  return process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
}

/**
 * Get Redis URL safely
 */
export function getRedisURL(): string | undefined {
  if (isBuildTime) {
    return undefined;
  }
  return process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
}

/**
 * Check if service is available
 */
export function isServiceAvailable(service: 'openai' | 'redis' | 'stripe'): boolean {
  if (isBuildTime) {
    return false;
  }
  
  switch (service) {
    case 'openai':
      return !!(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);
    case 'redis':
      return !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL);
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY;
    default:
      return false;
  }
}

/**
 * Safe environment variable getter
 */
export function getEnvSafe(key: string, defaultValue: string = ''): string {
  if (isBuildTime) {
    return defaultValue || 'build-placeholder';
  }
  return process.env[key] || defaultValue;
}
