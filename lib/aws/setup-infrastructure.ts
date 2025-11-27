/**
 * AWS Infrastructure Setup Script
 * Sets up CloudWatch dashboards, alarms, and SNS topics
 */

import { getCloudWatchMonitoring, type DashboardConfig, type AlarmConfig } from './cloudwatch';

// Alert thresholds from design document
const ALERT_THRESHOLDS = {
  // Performance
  pageLoadTime: 3000, // 3 seconds
  apiResponseTime: 2000, // 2 seconds
  lcp: 2500, // 2.5 seconds
  fid: 100, // 100ms
  cls: 0.1, // 0.1 score

  // Resources
  memoryUsage: 0.85, // 85% of available
  cpuUsage: 0.8, // 80% of available

  // Errors
  errorRate: 0.05, // 5% error rate
  cacheHitRate: 0.7, // 70% minimum

  // Availability
  uptime: 0.999, // 99.9% uptime
};

const METRIC_NAMESPACE = 'Huntaze/Performance';

/**
 * Create performance monitoring dashboard
 */
export async function createPerformanceDashboard(): Promise<string> {
  const monitoring = getCloudWatchMonitoring();

  const dashboardConfig: DashboardConfig = {
    name: 'Huntaze-Performance-Dashboard',
    widgets: [
      // Core Web Vitals
      {
        type: 'metric',
        x: 0,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [METRIC_NAMESPACE, 'LCP', { stat: 'Average' }],
            ['.', 'FID', { stat: 'Average' }],
            ['.', 'CLS', { stat: 'Average' }],
            ['.', 'TTFB', { stat: 'Average' }],
            ['.', 'FCP', { stat: 'Average' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Core Web Vitals',
          period: 300,
          yAxis: {
            left: {
              label: 'Milliseconds',
            },
          },
        },
      },
      // Page Load Times
      {
        type: 'metric',
        x: 12,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [METRIC_NAMESPACE, 'PageLoadTime', { stat: 'Average' }],
            ['...', { stat: 'p95' }],
            ['...', { stat: 'p99' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Page Load Times',
          period: 300,
          yAxis: {
            left: {
              label: 'Milliseconds',
            },
          },
        },
      },
      // API Response Times
      {
        type: 'metric',
        x: 0,
        y: 6,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [METRIC_NAMESPACE, 'APIResponseTime', { stat: 'Average' }],
            ['...', { stat: 'p95' }],
            ['...', { stat: 'p99' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'API Response Times',
          period: 300,
          yAxis: {
            left: {
              label: 'Milliseconds',
            },
          },
        },
      },
      // Cache Hit Rate
      {
        type: 'metric',
        x: 12,
        y: 6,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [METRIC_NAMESPACE, 'CacheHitRate', { stat: 'Average' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Cache Hit Rate',
          period: 300,
          yAxis: {
            left: {
              label: 'Percentage',
              min: 0,
              max: 100,
            },
          },
        },
      },
      // Error Rate
      {
        type: 'metric',
        x: 0,
        y: 12,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [METRIC_NAMESPACE, 'ErrorRate', { stat: 'Average' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Error Rate',
          period: 300,
          yAxis: {
            left: {
              label: 'Percentage',
              min: 0,
              max: 100,
            },
          },
        },
      },
      // Memory Usage
      {
        type: 'metric',
        x: 12,
        y: 12,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [METRIC_NAMESPACE, 'MemoryUsage', { stat: 'Average' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Memory Usage',
          period: 300,
          yAxis: {
            left: {
              label: 'Percentage',
              min: 0,
              max: 100,
            },
          },
        },
      },
    ],
  };

  return await monitoring.createDashboard(dashboardConfig);
}

/**
 * Create CloudWatch alarms for performance monitoring
 */
export async function createPerformanceAlarms(snsTopicArn: string): Promise<void> {
  const monitoring = getCloudWatchMonitoring();

  const alarms: AlarmConfig[] = [
    // LCP Alarm
    {
      name: 'Huntaze-High-LCP',
      metricName: 'LCP',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.lcp,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // FID Alarm
    {
      name: 'Huntaze-High-FID',
      metricName: 'FID',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.fid,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // CLS Alarm
    {
      name: 'Huntaze-High-CLS',
      metricName: 'CLS',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.cls,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // Page Load Time Alarm
    {
      name: 'Huntaze-Slow-Page-Load',
      metricName: 'PageLoadTime',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.pageLoadTime,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // API Response Time Alarm
    {
      name: 'Huntaze-Slow-API-Response',
      metricName: 'APIResponseTime',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.apiResponseTime,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // Error Rate Alarm
    {
      name: 'Huntaze-High-Error-Rate',
      metricName: 'ErrorRate',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.errorRate * 100, // Convert to percentage
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // Cache Hit Rate Alarm
    {
      name: 'Huntaze-Low-Cache-Hit-Rate',
      metricName: 'CacheHitRate',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.cacheHitRate * 100, // Convert to percentage
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 3,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
    // Memory Usage Alarm
    {
      name: 'Huntaze-High-Memory-Usage',
      metricName: 'MemoryUsage',
      namespace: METRIC_NAMESPACE,
      threshold: ALERT_THRESHOLDS.memoryUsage * 100, // Convert to percentage
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      actions: [snsTopicArn],
    },
  ];

  // Create all alarms
  for (const alarm of alarms) {
    await monitoring.setAlarm(alarm);
  }
}

/**
 * Setup complete AWS infrastructure
 */
export async function setupAWSInfrastructure(alertEmail?: string): Promise<void> {
  console.log('Setting up AWS infrastructure...');

  const monitoring = getCloudWatchMonitoring();

  // Initialize CloudWatch
  await monitoring.initialize();
  console.log('✓ CloudWatch initialized');

  // Create SNS topic for alerts
  const snsTopicArn = await monitoring.createAlertTopic(
    'Huntaze-Performance-Alerts',
    alertEmail
  );
  console.log('✓ SNS topic created:', snsTopicArn);

  // Create performance dashboard
  const dashboardName = await createPerformanceDashboard();
  console.log('✓ Performance dashboard created:', dashboardName);

  // Create alarms
  await createPerformanceAlarms(snsTopicArn);
  console.log('✓ CloudWatch alarms configured');

  console.log('\nAWS infrastructure setup complete!');
  console.log(`Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=${dashboardName}`);
  
  if (alertEmail) {
    console.log(`\nPlease check ${alertEmail} and confirm the SNS subscription.`);
  }
}
