/**
 * AWS CloudWatch Monitoring Service
 * 
 * Implements comprehensive monitoring for the Beta Launch UI System:
 * - Application error logging to CloudWatch Logs
 * - Custom metrics for API response times
 * - Alarms for error rate, latency, and cache hit ratio
 * - SNS notifications for critical alerts
 * - CloudWatch dashboard with key metrics
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */

import {
  CloudWatchClient,
  PutMetricDataCommand,
  PutMetricAlarmCommand,
  PutDashboardCommand,
  DescribeAlarmsCommand,
  type MetricDatum,
  type PutMetricAlarmCommandInput,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  PublishCommand,
} from '@aws-sdk/client-sns';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const APP_NAME = 'huntaze-beta';
const LOG_GROUP_NAME = `/aws/nextjs/${APP_NAME}`;
const NAMESPACE = 'Huntaze/Beta';

// Clients
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

// Types
export interface ErrorLogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  route?: string;
  method?: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit: 'Milliseconds' | 'Count' | 'Percent' | 'None';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface AlarmConfig {
  name: string;
  description: string;
  metricName: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number;
  statistic: 'Average' | 'Sum' | 'SampleCount' | 'Minimum' | 'Maximum';
  treatMissingData?: 'breaching' | 'notBreaching' | 'ignore' | 'missing';
}

/**
 * CloudWatch Monitoring Service
 */
export class CloudWatchService {
  private static instance: CloudWatchService;
  private logStreamName: string;
  private snsTopicArn?: string;
  private initialized = false;

  private constructor() {
    this.logStreamName = `${ENVIRONMENT}-${Date.now()}`;
  }

  static getInstance(): CloudWatchService {
    if (!CloudWatchService.instance) {
      CloudWatchService.instance = new CloudWatchService();
    }
    return CloudWatchService.instance;
  }

  /**
   * Initialize CloudWatch monitoring
   * Creates log groups, SNS topics, and sets up alarms
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 1. Create log group if it doesn't exist
      await this.createLogGroup();

      // 2. Create log stream
      await this.createLogStream();

      // 3. Create SNS topic for alerts
      this.snsTopicArn = await this.createSNSTopic();

      // 4. Set up default alarms
      await this.setupDefaultAlarms();

      // 5. Create CloudWatch dashboard
      await this.createDashboard();

      this.initialized = true;
      console.log('✅ CloudWatch monitoring initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CloudWatch monitoring:', error);
      // Don't throw - allow app to continue without monitoring
    }
  }

  /**
   * Create CloudWatch Log Group
   * Requirement 20.1: Configure CloudWatch Logs for Next.js application errors
   */
  private async createLogGroup(): Promise<void> {
    try {
      // Check if log group exists
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: LOG_GROUP_NAME,
      });
      const response = await logsClient.send(describeCommand);
      
      if (response.logGroups?.some(lg => lg.logGroupName === LOG_GROUP_NAME)) {
        console.log(`Log group ${LOG_GROUP_NAME} already exists`);
        return;
      }

      // Create log group
      const createCommand = new CreateLogGroupCommand({
        logGroupName: LOG_GROUP_NAME,
      });
      await logsClient.send(createCommand);
      console.log(`Created log group: ${LOG_GROUP_NAME}`);
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  /**
   * Create CloudWatch Log Stream
   */
  private async createLogStream(): Promise<void> {
    try {
      const command = new CreateLogStreamCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: this.logStreamName,
      });
      await logsClient.send(command);
      console.log(`Created log stream: ${this.logStreamName}`);
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  /**
   * Log error to CloudWatch Logs
   * Requirement 20.2: Log error details to CloudWatch Logs
   */
  async logError(entry: ErrorLogEntry): Promise<void> {
    try {
      const logEvent = {
        timestamp: entry.timestamp.getTime(),
        message: JSON.stringify({
          level: entry.level,
          message: entry.message,
          error: entry.error ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
          } : undefined,
          context: this.sanitizeContext(entry.context),
          userId: entry.userId,
          requestId: entry.requestId,
          route: entry.route,
          method: entry.method,
          environment: ENVIRONMENT,
          timestamp: entry.timestamp.toISOString(),
        }),
      };

      const command = new PutLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
      });

      await logsClient.send(command);
    } catch (error) {
      // Fallback to console if CloudWatch fails
      console.error('Failed to log to CloudWatch:', error);
      console.error('Original error:', entry);
    }
  }

  /**
   * Put custom metric to CloudWatch
   * Requirement 20.1: Create custom metrics for API response times
   */
  async putMetric(metric: MetricData): Promise<void> {
    try {
      const metricDatum: MetricDatum = {
        MetricName: metric.name,
        Value: metric.value,
        Unit: metric.unit,
        Timestamp: metric.timestamp || new Date(),
        Dimensions: metric.dimensions
          ? Object.entries(metric.dimensions).map(([Name, Value]) => ({
              Name,
              Value,
            }))
          : [
              { Name: 'Environment', Value: ENVIRONMENT },
            ],
      };

      const command = new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [metricDatum],
      });

      await cloudWatchClient.send(command);
    } catch (error) {
      console.error('Failed to put metric to CloudWatch:', error);
    }
  }

  /**
   * Put multiple metrics in batch
   */
  async putMetrics(metrics: MetricData[]): Promise<void> {
    try {
      const metricData: MetricDatum[] = metrics.map(metric => ({
        MetricName: metric.name,
        Value: metric.value,
        Unit: metric.unit,
        Timestamp: metric.timestamp || new Date(),
        Dimensions: metric.dimensions
          ? Object.entries(metric.dimensions).map(([Name, Value]) => ({
              Name,
              Value,
            }))
          : [
              { Name: 'Environment', Value: ENVIRONMENT },
            ],
      }));

      const command = new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: metricData,
      });

      await cloudWatchClient.send(command);
    } catch (error) {
      console.error('Failed to put metrics to CloudWatch:', error);
    }
  }

  /**
   * Create SNS topic for critical alerts
   * Requirement 20.4: Configure SNS topic for critical alerts
   */
  private async createSNSTopic(): Promise<string> {
    try {
      const topicName = `${APP_NAME}-critical-alerts-${ENVIRONMENT}`;
      const command = new CreateTopicCommand({
        Name: topicName,
        Tags: [
          { Key: 'Environment', Value: ENVIRONMENT },
          { Key: 'Application', Value: APP_NAME },
        ],
      });

      const response = await snsClient.send(command);
      console.log(`Created SNS topic: ${topicName}`);
      
      // Subscribe email if configured
      if (process.env.ALERT_EMAIL) {
        await this.subscribeToTopic(response.TopicArn!, process.env.ALERT_EMAIL);
      }

      return response.TopicArn!;
    } catch (error) {
      console.error('Failed to create SNS topic:', error);
      throw error;
    }
  }

  /**
   * Subscribe email to SNS topic
   */
  private async subscribeToTopic(topicArn: string, email: string): Promise<void> {
    try {
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'email',
        Endpoint: email,
      });

      await snsClient.send(command);
      console.log(`Subscribed ${email} to SNS topic`);
    } catch (error) {
      console.error('Failed to subscribe to SNS topic:', error);
    }
  }

  /**
   * Set up default CloudWatch alarms
   * Requirement 20.3: Set up alarms for error rate, latency, cache hit ratio
   */
  private async setupDefaultAlarms(): Promise<void> {
    if (!this.snsTopicArn) {
      console.warn('SNS topic not configured, skipping alarm setup');
      return;
    }

    const alarms: AlarmConfig[] = [
      // Error rate > 1% (Warning)
      {
        name: `${APP_NAME}-high-error-rate-warning-${ENVIRONMENT}`,
        description: 'Error rate exceeds 1% threshold',
        metricName: 'ErrorRate',
        threshold: 1,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300, // 5 minutes
        statistic: 'Average',
        treatMissingData: 'notBreaching',
      },
      // Error rate > 5% (Critical)
      {
        name: `${APP_NAME}-high-error-rate-critical-${ENVIRONMENT}`,
        description: 'Error rate exceeds 5% threshold (CRITICAL)',
        metricName: 'ErrorRate',
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 300,
        statistic: 'Average',
        treatMissingData: 'notBreaching',
      },
      // API latency > 1s (Warning)
      {
        name: `${APP_NAME}-high-latency-warning-${ENVIRONMENT}`,
        description: 'API response time exceeds 1 second',
        metricName: 'APILatency',
        threshold: 1000,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Average',
        treatMissingData: 'notBreaching',
      },
      // API latency > 2s (Critical)
      {
        name: `${APP_NAME}-high-latency-critical-${ENVIRONMENT}`,
        description: 'API response time exceeds 2 seconds (CRITICAL)',
        metricName: 'APILatency',
        threshold: 2000,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 300,
        statistic: 'Average',
        treatMissingData: 'notBreaching',
      },
      // Cache hit ratio < 80%
      {
        name: `${APP_NAME}-low-cache-hit-ratio-${ENVIRONMENT}`,
        description: 'Cache hit ratio below 80%',
        metricName: 'CacheHitRatio',
        threshold: 80,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Average',
        treatMissingData: 'notBreaching',
      },
    ];

    for (const alarm of alarms) {
      await this.createAlarm(alarm);
    }
  }

  /**
   * Create CloudWatch alarm
   */
  private async createAlarm(config: AlarmConfig): Promise<void> {
    try {
      const input: PutMetricAlarmCommandInput = {
        AlarmName: config.name,
        AlarmDescription: config.description,
        MetricName: config.metricName,
        Namespace: NAMESPACE,
        Statistic: config.statistic,
        Period: config.period,
        EvaluationPeriods: config.evaluationPeriods,
        Threshold: config.threshold,
        ComparisonOperator: config.comparisonOperator,
        TreatMissingData: config.treatMissingData || 'notBreaching',
        AlarmActions: this.snsTopicArn ? [this.snsTopicArn] : [],
        Dimensions: [
          { Name: 'Environment', Value: ENVIRONMENT },
        ],
      };

      const command = new PutMetricAlarmCommand(input);
      await cloudWatchClient.send(command);
      console.log(`Created alarm: ${config.name}`);
    } catch (error) {
      console.error(`Failed to create alarm ${config.name}:`, error);
    }
  }

  /**
   * Create CloudWatch dashboard
   * Requirement 20.5: Create CloudWatch dashboard with key metrics
   */
  private async createDashboard(): Promise<void> {
    try {
      const dashboardBody = {
        widgets: [
          // Error Rate
          {
            type: 'metric',
            properties: {
              metrics: [
                [NAMESPACE, 'ErrorRate', { stat: 'Average', label: 'Error Rate (%)' }],
              ],
              period: 300,
              stat: 'Average',
              region: AWS_REGION,
              title: 'Error Rate',
              yAxis: {
                left: {
                  min: 0,
                  max: 10,
                },
              },
            },
          },
          // API Latency
          {
            type: 'metric',
            properties: {
              metrics: [
                [NAMESPACE, 'APILatency', { stat: 'Average', label: 'Average' }],
                ['.', '.', { stat: 'p95', label: 'p95' }],
                ['.', '.', { stat: 'p99', label: 'p99' }],
              ],
              period: 300,
              stat: 'Average',
              region: AWS_REGION,
              title: 'API Response Time (ms)',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
          // Cache Hit Ratio
          {
            type: 'metric',
            properties: {
              metrics: [
                [NAMESPACE, 'CacheHitRatio', { stat: 'Average', label: 'Cache Hit Ratio (%)' }],
              ],
              period: 300,
              stat: 'Average',
              region: AWS_REGION,
              title: 'Cache Hit Ratio',
              yAxis: {
                left: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
          // Request Count
          {
            type: 'metric',
            properties: {
              metrics: [
                [NAMESPACE, 'RequestCount', { stat: 'Sum', label: 'Total Requests' }],
              ],
              period: 300,
              stat: 'Sum',
              region: AWS_REGION,
              title: 'Request Count',
            },
          },
          // Database Query Time
          {
            type: 'metric',
            properties: {
              metrics: [
                [NAMESPACE, 'DatabaseQueryTime', { stat: 'Average', label: 'Average' }],
                ['.', '.', { stat: 'p95', label: 'p95' }],
              ],
              period: 300,
              stat: 'Average',
              region: AWS_REGION,
              title: 'Database Query Time (ms)',
            },
          },
          // Core Web Vitals
          {
            type: 'metric',
            properties: {
              metrics: [
                [NAMESPACE, 'FCP', { stat: 'Average', label: 'First Contentful Paint' }],
                ['.', 'LCP', { stat: 'Average', label: 'Largest Contentful Paint' }],
                ['.', 'FID', { stat: 'Average', label: 'First Input Delay' }],
              ],
              period: 300,
              stat: 'Average',
              region: AWS_REGION,
              title: 'Core Web Vitals (ms)',
            },
          },
        ],
      };

      const command = new PutDashboardCommand({
        DashboardName: `${APP_NAME}-${ENVIRONMENT}`,
        DashboardBody: JSON.stringify(dashboardBody),
      });

      await cloudWatchClient.send(command);
      console.log(`Created dashboard: ${APP_NAME}-${ENVIRONMENT}`);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  }

  /**
   * Get alarm status
   */
  async getAlarmStatus(): Promise<any[]> {
    try {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `${APP_NAME}-`,
      });

      const response = await cloudWatchClient.send(command);
      return response.MetricAlarms || [];
    } catch (error) {
      console.error('Failed to get alarm status:', error);
      return [];
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    if (!this.snsTopicArn) {
      throw new Error('SNS topic not configured');
    }

    try {
      const command = new PublishCommand({
        TopicArn: this.snsTopicArn,
        Subject: `[TEST] ${APP_NAME} Monitoring Alert`,
        Message: `This is a test notification from ${APP_NAME} CloudWatch monitoring.\n\nEnvironment: ${ENVIRONMENT}\nTimestamp: ${new Date().toISOString()}`,
      });

      await snsClient.send(command);
      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const cloudWatchService = CloudWatchService.getInstance();

// Helper functions for common operations

/**
 * Log error to CloudWatch
 */
export async function logError(
  message: string,
  error?: Error,
  context?: Record<string, any>
): Promise<void> {
  await cloudWatchService.logError({
    timestamp: new Date(),
    level: 'error',
    message,
    error,
    context,
  });
}

/**
 * Log warning to CloudWatch
 */
export async function logWarning(
  message: string,
  context?: Record<string, any>
): Promise<void> {
  await cloudWatchService.logError({
    timestamp: new Date(),
    level: 'warn',
    message,
    context,
  });
}

/**
 * Record API response time
 */
export async function recordAPILatency(
  route: string,
  method: string,
  latencyMs: number
): Promise<void> {
  await cloudWatchService.putMetric({
    name: 'APILatency',
    value: latencyMs,
    unit: 'Milliseconds',
    dimensions: {
      Route: route,
      Method: method,
      Environment: ENVIRONMENT,
    },
  });
}

/**
 * Record error rate
 */
export async function recordErrorRate(errorCount: number, totalCount: number): Promise<void> {
  const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
  
  await cloudWatchService.putMetric({
    name: 'ErrorRate',
    value: errorRate,
    unit: 'Percent',
  });
}

/**
 * Record cache hit ratio
 */
export async function recordCacheHitRatio(hits: number, total: number): Promise<void> {
  const hitRatio = total > 0 ? (hits / total) * 100 : 0;
  
  await cloudWatchService.putMetric({
    name: 'CacheHitRatio',
    value: hitRatio,
    unit: 'Percent',
  });
}

/**
 * Record database query time
 */
export async function recordDatabaseQueryTime(
  operation: string,
  durationMs: number
): Promise<void> {
  await cloudWatchService.putMetric({
    name: 'DatabaseQueryTime',
    value: durationMs,
    unit: 'Milliseconds',
    dimensions: {
      Operation: operation,
      Environment: ENVIRONMENT,
    },
  });
}

/**
 * Record Core Web Vitals
 */
export async function recordCoreWebVitals(
  fcp: number,
  lcp: number,
  fid: number,
  cls: number
): Promise<void> {
  await cloudWatchService.putMetrics([
    { name: 'FCP', value: fcp, unit: 'Milliseconds' },
    { name: 'LCP', value: lcp, unit: 'Milliseconds' },
    { name: 'FID', value: fid, unit: 'Milliseconds' },
    { name: 'CLS', value: cls, unit: 'None' },
  ]);
}
