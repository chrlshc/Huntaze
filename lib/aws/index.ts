/**
 * AWS Services - Main Export
 * 
 * IMPORTANT: All AWS services are optional and will gracefully degrade
 * if AWS credentials are not configured. The application will continue
 * to work without AWS features.
 */

// Configuration and Feature Flags
export {
  AWS_CONFIG,
  isAWSAvailable,
  isFeatureAvailable,
  logAWSStatus,
} from './config';

// Safe Wrappers (recommended for use)
export {
  safeCloudWatch,
  safeAssetOptimizer,
  safeMetricsClient,
  checkAWSConfiguration,
} from './safe-wrapper';

// Direct exports (only use if you know AWS is configured)
// These may throw errors if AWS is not properly set up
export type {
  CustomMetric,
  AlarmConfig,
  DashboardConfig,
  DashboardWidget,
  PerformanceEvent,
} from './cloudwatch';

export type {
  ImageInput,
  OptimizedImage,
  ImageSize,
  ImageMetadata,
  S3UploadOptions,
  S3Object,
  ImageTransformations,
  AssetMetadata,
  AssetSize,
} from './asset-optimizer';

export type { ClientMetric } from './metrics-client';

// Conditional exports - only available if AWS is configured
export function getCloudWatchMonitoring() {
  return safeCloudWatch();
}

export function getAssetOptimizer() {
  return safeAssetOptimizer();
}

export const { sendMetric, sendMetricsBatch } = safeMetricsClient();
