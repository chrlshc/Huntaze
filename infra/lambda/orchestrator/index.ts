/**
 * Lambda Orchestrator for OnlyFans Browser Workers
 * 
 * Receives SQS messages
 * → Launches ECS Fargate tasks with proper configuration
 * → Handles retry + error handling
 * → Publishes CloudWatch metrics
 */

import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import type { SQSEvent, SQSRecord } from 'aws-lambda';

const ecs = new ECSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface QueueMessage {
  userId: string;
  action: 'send' | 'login' | 'sync';
  data: {
    recipientId?: string;
    content?: string;
    campaignId?: string;
  };
}

interface ProcessResult {
  messageId: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
}

export const handler = async (event: SQSEvent) => {
  console.log('📨 Orchestrator triggered');
  console.log(`Processing ${event.Records.length} messages`);

  const results: ProcessResult[] = [];

  for (const record of event.Records) {
    try {
      const message: QueueMessage = JSON.parse(record.body);
      console.log(`🔄 Processing: ${message.action} for user ${message.userId}`);

      const result = await runEcsTask(message);
      results.push({
        messageId: record.messageId,
        status: 'success',
        result
      });

      // Delete from SQS on success
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: process.env.QUEUE_URL!,
          ReceiptHandle: record.receiptHandle
        })
      );

      // Publish success metric
      await publishMetric('TasksLaunched', 1);

    } catch (error) {
      console.error('❌ Error processing message:', error);
      results.push({
        messageId: record.messageId,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });

      // Publish error metric
      await publishMetric('TasksFailed', 1);

      // Message will be retried by SQS (visibility timeout)
    }
  }

  // Summary
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`✅ Processed: ${successCount} success, ${errorCount} errors`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      processed: results.length,
      success: successCount,
      errors: errorCount,
      results
    })
  };
};

async function runEcsTask(message: QueueMessage) {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Validate environment variables
    if (!process.env.ECS_CLUSTER) {
      throw new Error('ECS_CLUSTER environment variable not set');
    }
    if (!process.env.TASK_DEFINITION) {
      throw new Error('TASK_DEFINITION environment variable not set');
    }

    const subnets = (process.env.SUBNETS || '').split(',').filter(Boolean);
    const securityGroups = (process.env.SECURITY_GROUPS || '').split(',').filter(Boolean);

    if (subnets.length === 0 || securityGroups.length === 0) {
      throw new Error('SUBNETS or SECURITY_GROUPS not configured');
    }

    // Launch ECS task
    const response = await ecs.send(
      new RunTaskCommand({
        cluster: process.env.ECS_CLUSTER,
        taskDefinition: process.env.TASK_DEFINITION,
        launchType: 'FARGATE',
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets,
            securityGroups,
            assignPublicIp: 'ENABLED' // Required to access OnlyFans
          }
        },
        overrides: {
          containerOverrides: [
            {
              name: 'of-browser-worker',
              environment: [
                { name: 'TASK_ID', value: taskId },
                { name: 'ACTION', value: message.action },
                { name: 'USER_ID', value: message.userId },
                { name: 'CONTENT_TEXT', value: message.data.content || '' },
                { name: 'JOB_ID', value: taskId }
              ]
            }
          ]
        },
        tags: [
          { key: 'Action', value: message.action },
          { key: 'UserId', value: message.userId },
          { key: 'TaskId', value: taskId }
        ]
      })
    );

    if (!response.tasks || response.tasks.length === 0) {
      throw new Error('No tasks were launched');
    }

    const ecsTaskArn = response.tasks[0].taskArn;
    console.log(`✅ ECS task launched: ${taskId}`);
    console.log(`   ARN: ${ecsTaskArn}`);

    // Store task metadata in DynamoDB
    await dynamodb.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE_MESSAGES || 'HuntazeOfMessages',
        Item: {
          taskId: { S: taskId },
          userId: { S: message.userId },
          action: { S: message.action },
          ecsTaskArn: { S: ecsTaskArn || '' },
          status: { S: 'running' },
          createdAt: { N: String(Date.now()) },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) + 3600) } // TTL 1 hour
        }
      })
    );

    return {
      taskId,
      ecsTaskArn,
      action: message.action,
      userId: message.userId
    };

  } catch (error) {
    console.error('Failed to launch ECS task:', error);
    throw error;
  }
}

async function publishMetric(metricName: string, value: number): Promise<void> {
  try {
    await cloudwatch.send(
      new PutMetricDataCommand({
        Namespace: 'Huntaze/OnlyFans/Orchestrator',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: 'Count',
            Timestamp: new Date()
          }
        ]
      })
    );
  } catch (error) {
    console.error('Failed to publish metric:', error);
  }
}
