/**
 * Server-side CloudWatch initialization
 * This runs once when the Next.js server starts
 */

import { initializeCloudWatch } from './cloudwatch';

let initialized = false;

export async function initCloudWatchServer() {
  if (initialized) {
    return;
  }

  // Only initialize in production or when AWS credentials are available
  if (process.env.NODE_ENV === 'production' || process.env.AWS_ACCESS_KEY_ID) {
    try {
      await initializeCloudWatch();
      initialized = true;
      console.log('✓ CloudWatch monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize CloudWatch:', error);
      // Don't throw - allow app to continue without monitoring
    }
  }
}

// Auto-initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initCloudWatchServer();
}
