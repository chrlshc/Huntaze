/**
 * AWS Configuration and Feature Flags
 * Allows graceful degradation when AWS is not configured
 */

export const AWS_CONFIG = {
  // Check if AWS credentials are configured
  isConfigured: Boolean(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  ),
  
  // Individual service flags
  features: {
    cloudWatch: Boolean(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID),
    s3: Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION),
    sns: Boolean(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID),
  },
  
  // Configuration values
  region: process.env.AWS_REGION || 'us-east-1',
  s3Bucket: process.env.AWS_S3_BUCKET || '',
  cdnUrl: process.env.CDN_URL || '',
};

/**
 * Check if AWS services are available
 */
export function isAWSAvailable(): boolean {
  return AWS_CONFIG.isConfigured;
}

/**
 * Check if a specific AWS feature is available
 */
export function isFeatureAvailable(feature: keyof typeof AWS_CONFIG.features): boolean {
  return AWS_CONFIG.features[feature];
}

/**
 * Log AWS configuration status (for debugging)
 */
export function logAWSStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AWS Config]', {
      configured: AWS_CONFIG.isConfigured,
      features: AWS_CONFIG.features,
      region: AWS_CONFIG.region,
    });
  }
}
