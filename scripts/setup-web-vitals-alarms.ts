/**
 * Setup CloudWatch Alarms for Web Vitals
 * 
 * Creates CloudWatch alarms for Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * 
 * Requirements: 2.4, 9.1, 9.2
 * Property 9: Performance alerts
 * Property 40: Dashboard creation
 */

import {
  CloudWatchClient,
  PutMetricAlarmCommand,
  PutDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, CreateTopicCommand } from '@aws-sdk/client-sns';

const cloudWatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const sns = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface AlarmConfig {
  metricName: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold';
  unit: string;
  description: string;
}

const WEB_VITALS_ALARMS: AlarmConfig[] = [
  {
    metricName: 'LCP',
    threshold: 2500,
    comparisonOperator: 'GreaterThanThreshold',
    unit: 'Milliseconds',
    description: 'Largest Contentful Paint exceeds 2.5 seconds',
  },
  {
    metricName: 'FID',
    threshold: 100,
    comparisonOperator: 'GreaterThanThreshold',
    unit: 'Milliseconds',
    description: 'First Input Delay exceeds 100ms',
  },
  {
    metricName: 'CLS',
    threshold: 0.1,
    comparisonOperator: 'GreaterThanThreshold',
    unit: 'None',
    description: 'Cumulative Layout Shift exceeds 0.1',
  },
  {
    metricName: 'FCP',
    threshold: 1800,
    comparisonOperator: 'GreaterThanThreshold',
    unit: 'Milliseconds',
    description: 'First Contentful Paint exceeds 1.8 seconds',
  },
  {
    metricName: 'TTFB',
    threshold: 800,
    comparisonOperator: 'GreaterThanThreshold',
    unit: 'Milliseconds',
    description: 'Time to First Byte exceeds 800ms',
  },
];

async function createSNSTopic(): Promise<string> {
  console.log('Creating SNS topic for Web Vitals alerts...');
  
  try {
    const response = await sns.send(
      new CreateTopicCommand({
        Name: 'huntaze-web-vitals-alerts',
        Tags: [
          { Key: 'Application', Value: 'Huntaze' },
          { Key: 'Purpose', Value: 'WebVitalsAlerts' },
        ],
      })
    );
    
    const topicArn = response.TopicArn!;
    console.log('✅ SNS topic created:', topicArn);
    return topicArn;
  } catch (error: any) {
    if (error.name === 'TopicAlreadyExists') {
      // Topic already exists, construct ARN
      const accountId = process.env.AWS_ACCOUNT_ID;
      const region = process.env.AWS_REGION || 'us-east-1';
      const topicArn = `arn:aws:sns:${region}:${accountId}:huntaze-web-vitals-alerts`;
      console.log('ℹ️  SNS topic already exists:', topicArn);
      return topicArn;
    }
    throw error;
  }
}

async function createAlarm(config: AlarmConfig, snsTopicArn: string) {
  console.log(`Creating alarm for ${config.metricName}...`);
  
  try {
    await cloudWatch.send(
      new PutMetricAlarmCommand({
        AlarmName: `Huntaze-WebVitals-${config.metricName}`,
        AlarmDescription: config.description,
        MetricName: config.metricName,
        Namespace: 'Huntaze/WebVitals',
        Statistic: 'Average',
        Period: 300, // 5 minutes
        EvaluationPeriods: 2,
        Threshold: config.threshold,
        ComparisonOperator: config.comparisonOperator,
        Unit: config.unit as any,
        ActionsEnabled: true,
        AlarmActions: [snsTopicArn],
        TreatMissingData: 'notBreaching',
        Tags: [
          { Key: 'Application', Value: 'Huntaze' },
          { Key: 'Metric', Value: config.metricName },
        ],
      })
    );
    
    console.log(`✅ Alarm created for ${config.metricName}`);
  } catch (error) {
    console.error(`❌ Failed to create alarm for ${config.metricName}:`, error);
    throw error;
  }
}

async function createWebVitalsDashboard() {
  console.log('Creating Web Vitals dashboard...');
  
  const dashboardBody = {
    widgets: [
      {
        type: 'metric',
        properties: {
          metrics: [
            ['Huntaze/WebVitals', 'LCP', { stat: 'Average', label: 'LCP (avg)' }],
            ['...', { stat: 'p95', label: 'LCP (p95)' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Largest Contentful Paint (LCP)',
          period: 300,
          yAxis: {
            left: {
              label: 'Milliseconds',
              showUnits: false,
            },
          },
          annotations: {
            horizontal: [
              {
                value: 2500,
                label: 'Good threshold',
                fill: 'above',
                color: '#d62728',
              },
            ],
          },
        },
      },
      {
        type: 'metric',
        properties: {
          metrics: [
            ['Huntaze/WebVitals', 'FID', { stat: 'Average', label: 'FID (avg)' }],
            ['...', { stat: 'p95', label: 'FID (p95)' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'First Input Delay (FID)',
          period: 300,
          yAxis: {
            left: {
              label: 'Milliseconds',
              showUnits: false,
            },
          },
          annotations: {
            horizontal: [
              {
                value: 100,
                label: 'Good threshold',
                fill: 'above',
                color: '#d62728',
              },
            ],
          },
        },
      },
      {
        type: 'metric',
        properties: {
          metrics: [
            ['Huntaze/WebVitals', 'CLS', { stat: 'Average', label: 'CLS (avg)' }],
            ['...', { stat: 'p95', label: 'CLS (p95)' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Cumulative Layout Shift (CLS)',
          period: 300,
          yAxis: {
            left: {
              label: 'Score',
              showUnits: false,
            },
          },
          annotations: {
            horizontal: [
              {
                value: 0.1,
                label: 'Good threshold',
                fill: 'above',
                color: '#d62728',
              },
            ],
          },
        },
      },
      {
        type: 'metric',
        properties: {
          metrics: [
            ['Huntaze/WebVitals', 'FCP', { stat: 'Average', label: 'FCP (avg)' }],
            ['Huntaze/WebVitals', 'TTFB', { stat: 'Average', label: 'TTFB (avg)' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'First Contentful Paint & Time to First Byte',
          period: 300,
          yAxis: {
            left: {
              label: 'Milliseconds',
              showUnits: false,
            },
          },
        },
      },
      {
        type: 'metric',
        properties: {
          metrics: [
            ['Huntaze/WebVitals', 'LCP', { stat: 'SampleCount', label: 'Page Views' }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'Page Views',
          period: 300,
          yAxis: {
            left: {
              label: 'Count',
              showUnits: false,
            },
          },
        },
      },
      {
        type: 'metric',
        properties: {
          metrics: [
            ['Huntaze/WebVitals', 'LCP', { stat: 'Average' }],
            ['...', { stat: 'Average', dimensions: { Connection: '4g' } }],
            ['...', { stat: 'Average', dimensions: { Connection: '3g' } }],
          ],
          view: 'timeSeries',
          stacked: false,
          region: process.env.AWS_REGION || 'us-east-1',
          title: 'LCP by Connection Type',
          period: 300,
        },
      },
    ],
  };
  
  try {
    await cloudWatch.send(
      new PutDashboardCommand({
        DashboardName: 'Huntaze-WebVitals',
        DashboardBody: JSON.stringify(dashboardBody),
      })
    );
    
    console.log('✅ Web Vitals dashboard created');
  } catch (error) {
    console.error('❌ Failed to create dashboard:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Setting up Web Vitals monitoring...\n');
  
  try {
    // Create SNS topic for alerts
    const snsTopicArn = await createSNSTopic();
    console.log();
    
    // Create alarms for each Web Vital
    for (const config of WEB_VITALS_ALARMS) {
      await createAlarm(config, snsTopicArn);
    }
    console.log();
    
    // Create dashboard
    await createWebVitalsDashboard();
    console.log();
    
    console.log('✅ Web Vitals monitoring setup complete!');
    console.log('\nNext steps:');
    console.log('1. Subscribe to SNS topic for email alerts:');
    console.log(`   aws sns subscribe --topic-arn ${snsTopicArn} --protocol email --notification-endpoint your-email@example.com`);
    console.log('2. View dashboard in CloudWatch console');
    console.log('3. Deploy application with Web Vitals tracking enabled');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as setupWebVitalsAlarms };
