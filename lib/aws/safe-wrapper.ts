/**
 * Safe AWS Wrapper
 * Provides no-op implementations when AWS is not configured
 * Prevents errors in development/production when AWS services are unavailable
 */

import { isAWSAvailable, isFeatureAvailable } from './config';

/**
 * Safe CloudWatch wrapper
 * Returns no-op functions if CloudWatch is not configured
 */
export function safeCloudWatch() {
  if (!isFeatureAvailable('cloudWatch')) {
    return {
      logMetric: async () => {},
      logWebVital: async () => {},
      logAPIRequest: async () => {},
      logError: async () => {},
      createAlarm: async () => {},
      createDashboard: async () => {},
    };
  }
  
  // Only import if configured
  try {
    const { getCloudWatchMonitoring } = require('./cloudwatch');
    return getCloudWatchMonitoring();
  } catch (error) {
    console.warn('[AWS] CloudWatch not available:', error);
    return {
      logMetric: async () => {},
      logWebVital: async () => {},
      logAPIRequest: async () => {},
      logError: async () => {},
      createAlarm: async () => {},
      createDashboard: async () => {},
    };
  }
}

/**
 * Safe S3/Asset Optimizer wrapper
 * Returns no-op functions if S3 is not configured
 */
export function safeAssetOptimizer() {
  if (!isFeatureAvailable('s3')) {
    return {
      optimizeImage: async (input: any) => {
        // Return original image without optimization
        return {
          url: input.url || '',
          formats: {},
          sizes: {},
          metadata: {},
        };
      },
      uploadToS3: async () => ({ url: '', key: '' }),
      getCloudFrontUrl: (key: string) => key,
      invalidateCache: async () => {},
    };
  }
  
  try {
    const { getAssetOptimizer } = require('./asset-optimizer');
    return getAssetOptimizer();
  } catch (error) {
    console.warn('[AWS] Asset Optimizer not available:', error);
    return {
      optimizeImage: async (input: any) => ({
        url: input.url || '',
        formats: {},
        sizes: {},
        metadata: {},
      }),
      uploadToS3: async () => ({ url: '', key: '' }),
      getCloudFrontUrl: (key: string) => key,
      invalidateCache: async () => {},
    };
  }
}

/**
 * Safe metrics client wrapper
 * Returns no-op functions if CloudWatch is not configured
 */
export function safeMetricsClient() {
  if (!isFeatureAvailable('cloudWatch')) {
    return {
      sendMetric: async () => {},
      sendMetricsBatch: async () => {},
    };
  }
  
  try {
    const metricsClient = require('./metrics-client');
    return {
      sendMetric: metricsClient.sendMetric,
      sendMetricsBatch: metricsClient.sendMetricsBatch,
    };
  } catch (error) {
    console.warn('[AWS] Metrics client not available:', error);
    return {
      sendMetric: async () => {},
      sendMetricsBatch: async () => {},
    };
  }
}

/**
 * Check if AWS is properly configured
 * Logs helpful message if not
 */
export function checkAWSConfiguration(): boolean {
  const isConfigured = isAWSAvailable();
  
  if (!isConfigured && process.env.NODE_ENV === 'development') {
    console.info(
      '[AWS] AWS services not configured. ' +
      'Application will run with reduced functionality. ' +
      'To enable AWS features, configure AWS credentials in .env'
    );
  }
  
  return isConfigured;
}
