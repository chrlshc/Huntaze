/**
 * CloudWatch Monitoring Service
 * Handles metrics collection, logging, and alarm configuration
 */

import {
  CloudWatchClient,
  PutMetricDataCommand,
  PutDashboardCommand,
  PutMetricAlarmCommand,
  type MetricDatum,
  type StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  type InputLogEvent,
} from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, CreateTopicCommand, SubscribeCommand } from '@aws-sdk/client-sns';

// Types
export interface CustomMetric {
  namespace: string;
  metricName: string;
  value: number;
  unit: StandardUnit;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface AlarmConfig {
  name: string;
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number;
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum' | 'SampleCount';
  actions?: string[];
  dimensions?: Record<string, string>;
}

export interface DashboardConfig {
  name: string;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  type: 'metric' | 'log' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: any;
}

export interface PerformanceEvent {
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: Record<string, any>;
  timestamp?: Date;
}

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LOG_GROUP_NAME = '/huntaze/performance';
const METRIC_NAMESPACE = 'Huntaze/Performance';

// Clients
let cloudWatchClient: CloudWatchClient | null = null;
let cloudWatchLogsClient: CloudWatchLogsClient | null = null;
let snsClient: SNSClient | null = null;

// Initialize clients
function getCloudWatchClient(): CloudWatchClient {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
  }
  return cloudWatchClient;
}

function getCloudWatchLogsClient(): CloudWatchLogsClient {
  if (!cloudWatchLogsClient) {
    cloudWatchLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
  }
  return cloudWatchLogsClient;
}

function getSNSClient(): SNSClient {
  if (!snsClient) {
    snsClient = new SNSClient({ region: AWS_REGION });
  }
  return snsClient;
}

/**
 * CloudWatch Monitoring Service
 */
export class CloudWatchMonitoring {
  private logStreamName: string;
  private sequenceToken?: string;

  constructor(logStreamName?: string) {
    this.logStreamName = logStreamName || `stream-${Date.now()}`;
  }

  /**
   * Initialize CloudWatch resources
   */
  async initialize(): Promise<void> {
    try {
      // Create log group if it doesn't exist
      await this.createLogGroup();
      
      // Create log stream
      await this.createLogStream();
    } catch (error) {
      console.error('Failed to initialize CloudWatch:', error);
      // Don't throw - allow app to continue without monitoring
    }
  }

  /**
   * Create CloudWatch log group
   */
  private async createLogGroup(): Promise<void> {
    try {
      const client = getCloudWatchLogsClient();
      await client.send(
        new CreateLogGroupCommand({
          logGroupName: LOG_GROUP_NAME,
        })
      );
    } catch (error: any) {
      // Ignore if log group already exists
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  /**
   * Create CloudWatch log stream
   */
  private async createLogStream(): Promise<void> {
    try {
      const client = getCloudWatchLogsClient();
      await client.send(
        new CreateLogStreamCommand({
          logGroupName: LOG_GROUP_NAME,
          logStreamName: this.logStreamName,
        })
      );
    } catch (error: any) {
      // Ignore if log stream already exists
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  /**
   * Send custom metric to CloudWatch
   */
  async putMetric(metric: CustomMetric): Promise<void> {
    try {
      const client = getCloudWatchClient();
      
      const metricData: MetricDatum = {
        MetricName: metric.metricName,
        Value: metric.value,
        Unit: metric.unit,
        Timestamp: metric.timestamp || new Date(),
      };

      if (metric.dimensions) {
        metricData.Dimensions = Object.entries(metric.dimensions).map(([name, value]) => ({
          Name: name,
          Value: value,
        }));
      }

      await client.send(
        new PutMetricDataCommand({
          Namespace: metric.namespace || METRIC_NAMESPACE,
          MetricData: [metricData],
        })
      );
    } catch (error) {
      console.error('Failed to put metric:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Create CloudWatch dashboard
   */
  async createDashboard(config: DashboardConfig): Promise<string> {
    const client = getCloudWatchClient();
    
    const dashboardBody = {
      widgets: config.widgets.map((widget) => ({
        type: widget.type,
        x: widget.x,
        y: widget.y,
        width: widget.width,
        height: widget.height,
        properties: widget.properties,
      })),
    };

    await client.send(
      new PutDashboardCommand({
        DashboardName: config.name,
        DashboardBody: JSON.stringify(dashboardBody),
      })
    );

    return config.name;
  }

  /**
   * Configure CloudWatch alarm
   */
  async setAlarm(alarm: AlarmConfig): Promise<void> {
    const client = getCloudWatchClient();
    
    const dimensions = alarm.dimensions
      ? Object.entries(alarm.dimensions).map(([name, value]) => ({
          Name: name,
          Value: value,
        }))
      : undefined;

    await client.send(
      new PutMetricAlarmCommand({
        AlarmName: alarm.name,
        MetricName: alarm.metricName,
        Namespace: alarm.namespace,
        Statistic: alarm.statistic,
        Period: alarm.period,
        EvaluationPeriods: alarm.evaluationPeriods,
        Threshold: alarm.threshold,
        ComparisonOperator: alarm.comparisonOperator,
        Dimensions: dimensions,
        AlarmActions: alarm.actions,
      })
    );
  }

  /**
   * Log event to CloudWatch Logs
   */
  async logEvent(event: PerformanceEvent): Promise<void> {
    try {
      const client = getCloudWatchLogsClient();
      
      const logEvent: InputLogEvent = {
        message: JSON.stringify({
          level: event.level,
          message: event.message,
          context: event.context,
          timestamp: event.timestamp || new Date(),
        }),
        timestamp: (event.timestamp || new Date()).getTime(),
      };

      const command = new PutLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
        sequenceToken: this.sequenceToken,
      });

      const response = await client.send(command);
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error('Failed to log event:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Create SNS topic for alerts
   */
  async createAlertTopic(topicName: string, email?: string): Promise<string> {
    const client = getSNSClient();
    
    // Create topic
    const createResponse = await client.send(
      new CreateTopicCommand({
        Name: topicName,
      })
    );

    const topicArn = createResponse.TopicArn!;

    // Subscribe email if provided
    if (email) {
      await client.send(
        new SubscribeCommand({
          TopicArn: topicArn,
          Protocol: 'email',
          Endpoint: email,
        })
      );
    }

    return topicArn;
  }
}

// Singleton instance
let monitoringInstance: CloudWatchMonitoring | null = null;

/**
 * Get CloudWatch monitoring instance
 */
export function getCloudWatchMonitoring(): CloudWatchMonitoring {
  if (!monitoringInstance) {
    monitoringInstance = new CloudWatchMonitoring();
  }
  return monitoringInstance;
}

/**
 * Initialize CloudWatch monitoring on app startup
 */
export async function initializeCloudWatch(): Promise<void> {
  const monitoring = getCloudWatchMonitoring();
  await monitoring.initialize();
}
