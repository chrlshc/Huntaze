/**
 * AWS Services - Main Export
 */

// CloudWatch Monitoring
export {
  CloudWatchMonitoring,
  getCloudWatchMonitoring,
  initializeCloudWatch,
  type CustomMetric,
  type AlarmConfig,
  type DashboardConfig,
  type DashboardWidget,
  type PerformanceEvent,
} from './cloudwatch';

// Infrastructure Setup
export {
  setupAWSInfrastructure,
  createPerformanceDashboard,
  createPerformanceAlarms,
} from './setup-infrastructure';

// Client-side Metrics
export {
  sendMetric,
  sendMetricsBatch,
  type ClientMetric,
} from './metrics-client';

// Server Initialization
export { initCloudWatchServer } from './init-cloudwatch-server';

// Asset Optimization
export {
  getAssetOptimizer,
  type ImageInput,
  type OptimizedImage,
  type ImageSize,
  type ImageMetadata,
  type S3UploadOptions,
  type S3Object,
  type ImageTransformations,
  type AssetMetadata,
  type AssetSize,
} from './asset-optimizer';
