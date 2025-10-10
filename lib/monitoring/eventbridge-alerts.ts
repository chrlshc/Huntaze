import { CloudWatchClient, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';

interface AlarmConfig {
  AlarmName: string;
  MetricName: string;
  Namespace: string;
  Statistic: 'Average' | 'Sum' | 'SampleCount' | 'Minimum' | 'Maximum';
  Threshold: number;
  ComparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  EvaluationPeriods: number;
  Period: number;
  AlarmActions: string[];
}

export class EventBridgeAlerting {
  private client: CloudWatchClient;

  constructor(region = process.env.AWS_REGION || 'us-west-1') {
    this.client = new CloudWatchClient({ region });
  }

  async setupDefaultAlerts(actionArn: string) {
    const alarms: AlarmConfig[] = [
      {
        AlarmName: 'Huntaze-EventBridge-FailedInvocations',
        MetricName: 'FailedInvocations',
        Namespace: 'AWS/Events',
        Statistic: 'Sum',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        Period: 300,
        AlarmActions: [actionArn],
      },
      {
        AlarmName: 'Huntaze-EventBridge-HighLatency',
        MetricName: 'IngestionToInvocationSuccessLatency',
        Namespace: 'AWS/Events',
        Statistic: 'Average',
        Threshold: 30000,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        Period: 300,
        AlarmActions: [actionArn],
      },
      {
        AlarmName: 'Huntaze-EventBridge-HighRetryRate',
        MetricName: 'RetryInvocationAttempts',
        Namespace: 'AWS/Events',
        Statistic: 'Sum',
        Threshold: 20,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        Period: 300,
        AlarmActions: [actionArn],
      },
    ];

    await Promise.all(alarms.map((alarm) => this.createAlarm(alarm)));
  }

  private async createAlarm(config: AlarmConfig) {
    try {
      await this.client.send(new PutMetricAlarmCommand(config));
    } catch (error) {
      console.error('Failed to configure CloudWatch alarm', {
        alarm: config.AlarmName,
        error,
      });
    }
  }
}
