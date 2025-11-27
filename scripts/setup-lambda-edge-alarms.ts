#!/usr/bin/env tsx

/**
 * Setup CloudWatch Alarms for Lambda@Edge Functions
 * 
 * Creates alarms for:
 * - Lambda@Edge errors
 * - Lambda@Edge duration
 * - CloudFront error rates
 */

import { CloudWatchClient, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';

const REGION = 'us-east-1'; // Lambda@Edge metrics are in us-east-1
// Note: SNS topic should be in the same region as the alarms
// For now, we'll create alarms without SNS notifications
// You can add SNS topic ARN later if you create one in us-east-1
const SNS_TOPIC_ARN = ''; // Empty for now, add us-east-1 SNS topic ARN if available

const cloudwatch = new CloudWatchClient({ region: REGION });

interface AlarmConfig {
  AlarmName: string;
  AlarmDescription: string;
  MetricName: string;
  Namespace: string;
  Statistic: string;
  Period: number;
  EvaluationPeriods: number;
  Threshold: number;
  ComparisonOperator: string;
  Dimensions?: Array<{ Name: string; Value: string }>;
  TreatMissingData?: string;
}

const alarms: AlarmConfig[] = [
  // Lambda@Edge Viewer Request Alarms
  {
    AlarmName: 'Lambda-ViewerRequest-Errors',
    AlarmDescription: 'Alert when viewer-request function has errors',
    MetricName: 'Errors',
    Namespace: 'AWS/Lambda',
    Statistic: 'Sum',
    Period: 300, // 5 minutes
    EvaluationPeriods: 2,
    Threshold: 10,
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'FunctionName', Value: 'huntaze-viewer-request' }
    ],
    TreatMissingData: 'notBreaching'
  },
  {
    AlarmName: 'Lambda-ViewerRequest-Duration',
    AlarmDescription: 'Alert when viewer-request function is slow',
    MetricName: 'Duration',
    Namespace: 'AWS/Lambda',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 1000, // 1 second
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'FunctionName', Value: 'huntaze-viewer-request' }
    ],
    TreatMissingData: 'notBreaching'
  },
  {
    AlarmName: 'Lambda-ViewerRequest-Throttles',
    AlarmDescription: 'Alert when viewer-request function is throttled',
    MetricName: 'Throttles',
    Namespace: 'AWS/Lambda',
    Statistic: 'Sum',
    Period: 300,
    EvaluationPeriods: 1,
    Threshold: 5,
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'FunctionName', Value: 'huntaze-viewer-request' }
    ],
    TreatMissingData: 'notBreaching'
  },

  // Lambda@Edge Origin Response Alarms
  {
    AlarmName: 'Lambda-OriginResponse-Errors',
    AlarmDescription: 'Alert when origin-response function has errors',
    MetricName: 'Errors',
    Namespace: 'AWS/Lambda',
    Statistic: 'Sum',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 10,
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'FunctionName', Value: 'huntaze-origin-response' }
    ],
    TreatMissingData: 'notBreaching'
  },
  {
    AlarmName: 'Lambda-OriginResponse-Duration',
    AlarmDescription: 'Alert when origin-response function is slow',
    MetricName: 'Duration',
    Namespace: 'AWS/Lambda',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 5000, // 5 seconds
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'FunctionName', Value: 'huntaze-origin-response' }
    ],
    TreatMissingData: 'notBreaching'
  },

  // CloudFront Alarms
  {
    AlarmName: 'CloudFront-4xxErrorRate',
    AlarmDescription: 'Alert when CloudFront 4xx error rate is high',
    MetricName: '4xxErrorRate',
    Namespace: 'AWS/CloudFront',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 5, // 5%
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'DistributionId', Value: 'E21VMD5A9KDBOO' }
    ],
    TreatMissingData: 'notBreaching'
  },
  {
    AlarmName: 'CloudFront-5xxErrorRate',
    AlarmDescription: 'Alert when CloudFront 5xx error rate is high',
    MetricName: '5xxErrorRate',
    Namespace: 'AWS/CloudFront',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 1, // 1%
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'DistributionId', Value: 'E21VMD5A9KDBOO' }
    ],
    TreatMissingData: 'notBreaching'
  },
  {
    AlarmName: 'CloudFront-CacheHitRate-Low',
    AlarmDescription: 'Alert when CloudFront cache hit rate is low',
    MetricName: 'CacheHitRate',
    Namespace: 'AWS/CloudFront',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 3,
    Threshold: 50, // 50%
    ComparisonOperator: 'LessThanThreshold',
    Dimensions: [
      { Name: 'DistributionId', Value: 'E21VMD5A9KDBOO' }
    ],
    TreatMissingData: 'notBreaching'
  }
];

async function createAlarm(alarm: AlarmConfig): Promise<void> {
  try {
    const command: any = {
      ...alarm,
      ActionsEnabled: SNS_TOPIC_ARN ? true : false,
      Dimensions: alarm.Dimensions
    };
    
    // Only add AlarmActions if SNS topic is configured
    if (SNS_TOPIC_ARN) {
      command.AlarmActions = [SNS_TOPIC_ARN];
    }
    
    await cloudwatch.send(new PutMetricAlarmCommand(command));
    console.log(`✅ Created alarm: ${alarm.AlarmName}`);
  } catch (error: any) {
    console.error(`❌ Failed to create alarm ${alarm.AlarmName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Setting up CloudWatch Alarms for Lambda@Edge\n');
  
  console.log(`📊 Creating ${alarms.length} alarms...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const alarm of alarms) {
    try {
      await createAlarm(alarm);
      successCount++;
    } catch (error) {
      failCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}/${alarms.length}`);
  console.log(`   ❌ Failed: ${failCount}/${alarms.length}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some alarms failed to create. Check the errors above.');
    process.exit(1);
  }
  
  console.log('\n✅ All alarms created successfully!');
  console.log('\n📝 Next Steps:');
  console.log('1. Verify alarms in CloudWatch console');
  console.log('2. Test alarms by triggering conditions');
  console.log('3. Confirm SNS notifications are working');
  
  console.log('\n🔗 View alarms:');
  console.log('   https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:');
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
