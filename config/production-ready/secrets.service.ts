/**
 * AWS Secrets Manager Service - Production Ready 2025
 * 
 * Features:
 * - IAM Role only (NO static keys)
 * - Memory cache with TTL (5 min default)
 * - Preload critical secrets
 * - Health check
 * - Fallback on expired cache
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// NO ACCESS KEYS - IAM Role only
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // credentials automatically provided by IAM role
});

// Memory cache to avoid cold starts
const cache = new Map<string, { value: string; timestamp: number; ttl: number }>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

export async function getSecret(name: string, ttlMs: number = DEFAULT_TTL): Promise<string> {
  const now = Date.now();
  const cached = cache.get(name);
  
  // Return cached value if still valid
  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.value;
  }

  try {
    console.log(`Fetching secret: ${name}`);
    
    const response = await client.send(
      new GetSecretValueCommand({ 
        SecretId: name,
        VersionStage: 'AWSCURRENT', // Always get current version
      })
    );
    
    const value = response.SecretString;
    if (!value) {
      throw new Error(`Secret ${name} is empty`);
    }
    
    // Cache the secret
    cache.set(name, { 
      value, 
      timestamp: now, 
      ttl: ttlMs 
    });
    
    return value;
  } catch (error) {
    console.error(`Failed to get secret ${name}:`, error);
    
    // Return cached value if available (even if expired) as fallback
    if (cached) {
      console.warn(`Using expired cached value for ${name}`);
      return cached.value;
    }
    
    throw new Error(`Secret ${name} not found and no cached value available`);
  }
}

// Get JSON secret and parse it
export async function getSecretJSON<T = any>(name: string, ttlMs?: number): Promise<T> {
  const secretString = await getSecret(name, ttlMs);
  
  try {
    return JSON.parse(secretString) as T;
  } catch (error) {
    throw new Error(`Secret ${name} is not valid JSON`);
  }
}

// Preload critical secrets at startup
export async function preloadSecrets() {
  const criticalSecrets = [
    'huntaze/database/url',
    'huntaze/nextauth/secret',
    'huntaze/onlyfans/api-key',
  ];
  
  const promises = criticalSecrets.map(secret => 
    getSecret(secret).catch(error => {
      console.error(`Failed to preload secret ${secret}:`, error);
      return null;
    })
  );
  
  await Promise.all(promises);
  console.log('Critical secrets preloaded');
}

// Clear cache (useful for testing)
export function clearSecretCache() {
  cache.clear();
}

// Get cache stats
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}

// Specific secret getters for common use cases
export const secrets = {
  // Database
  getDatabaseUrl: () => getSecret('huntaze/database/url'),
  
  // Auth
  getNextAuthSecret: () => getSecret('huntaze/nextauth/secret'),
  
  // OnlyFans
  getOnlyFansApiKey: () => getSecret('huntaze/onlyfans/api-key'),
  getOnlyFansWebhookSecret: () => getSecret('huntaze/onlyfans/webhook-secret'),
  
  // AWS
  getS3BucketName: () => getSecret('huntaze/aws/s3-bucket'),
  getSQSQueueUrl: () => getSecret('huntaze/aws/sqs-queue-url'),
  
  // External APIs
  getOpenAIApiKey: () => getSecret('huntaze/openai/api-key'),
  getSentryDsn: () => getSecret('huntaze/sentry/dsn'),
  
  // Email
  getSendGridApiKey: () => getSecret('huntaze/sendgrid/api-key'),
  
  // Analytics
  getGoogleAnalyticsId: () => getSecret('huntaze/google/analytics-id'),
};

// Health check for secrets
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; details: any }> {
  try {
    // Test with a non-critical secret
    await getSecret('huntaze/health-check', 1000); // 1 second TTL
    
    return {
      status: 'ok',
      details: {
        cacheSize: cache.size,
        region: process.env.AWS_REGION,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheSize: cache.size,
      },
    };
  }
}
