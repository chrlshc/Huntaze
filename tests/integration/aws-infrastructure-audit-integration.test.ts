/**
 * Integration Tests for AWS Infrastructure Audit
 * Tests end-to-end infrastructure validation and resource creation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock AWS SDK for integration testing
const mockAWSClients = {
  dynamodb: { send: vi.fn() },
  sqs: { send: vi.fn() },
  sns: { send: vi.fn() },
  ecs: { send: vi.fn() },
  rds: { send: vi.fn() },
  elasticache: { send: vi.fn() },
  s3: { send: vi.fn() },
  cloudwatch: { send: vi.fn() }
};

interface ResourceCreationPlan {
  dynamodbTables: Array<{ name: string; keySchema: any; billingMode: string }>;
  sqsQueues: Array<{ name: string; attributes?: Record<string, string> }>;
  snsTopics: Array<{ name: string; attributes?: Record<string, string> }>;
  cloudwatchAlarms: Array<{ name: string; metric: string; threshold: number }>;
}

interface ResourceCreationResult {
  success: boolean;
  created: string[];
  failed: string[];
  errors: Array<{ resource: string; error: string }>;
}

class AWSResourceProvisioner {
  constructor(private clients = mockAWSClients) {}

  async createMissingResources(plan: ResourceCreationPlan): Promise<ResourceCreationResult> {
    const created: string[] = [];
    const failed: string[] = [];
    const errors: Array<{ resource: string; error: string }> = [];

    // Create DynamoDB tables
    for (const table of plan.dynamodbTables) {
      try {
        await this.createDynamoDBTable(table);
        created.push(`DynamoDB: ${table.name}`);
      } catch (error) {
        failed.push(`DynamoDB: ${table.name}`);
        errors.push({
          resource: table.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Create SQS queues
    for (const queue of plan.sqsQueues) {
      try {
        await this.createSQSQueue(queue);
        created.push(`SQS: ${queue.name}`);
      } catch (error) {
        failed.push(`SQS: ${queue.name}`);
        errors.push({
          resource: queue.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Create SNS topics
    for (const topic of plan.snsTopics) {
      try {
        await this.createSNSTopic(topic);
        created.push(`SNS: ${topic.name}`);
      } catch (error) {
        failed.push(`SNS: ${topic.name}`);
        errors.push({
          resource: topic.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Create CloudWatch alarms
    for (const alarm of plan.cloudwatchAlarms) {
      try {
        await this.createCloudWatchAlarm(alarm);
        created.push(`CloudWatch: ${alarm.name}`);
      } catch (error) {
        failed.push(`CloudWatch: ${alarm.name}`);
        errors.push({
          resource: alarm.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      success: failed.length === 0,
      created,
      failed,
      errors
    };
  }

  private async createDynamoDBTable(table: any): Promise<void> {
    await this.clients.dynamodb.send({
      TableName: table.name,
      KeySchema: table.keySchema,
      BillingMode: table.billingMode,
      AttributeDefinitions: table.keySchema.map((key: any) => ({
        AttributeName: key.AttributeName,
        AttributeType: 'S'
      }))
    });
  }

  private async createSQSQueue(queue: any): Promise<void> {
    await this.clients.sqs.send({
      QueueName: queue.name,
      Attributes: queue.attributes || {}
    });
  }

  private async createSNSTopic(topic: any): Promise<void> {
    await this.clients.sns.send({
      Name: topic.name,
      Attributes: topic.attributes || {}
    });
  }

  private async createCloudWatchAlarm(alarm: any): Promise<void> {
    await this.clients.cloudwatch.send({
      AlarmName: alarm.name,
      MetricName: alarm.metric,
      Threshold: alarm.threshold,
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 1,
      Period: 300,
      Statistic: 'Sum',
      Namespace: 'Huntaze/AI/Costs'
    });
  }

  generateHybridOrchestratorPlan(): ResourceCreationPlan {
    return {
      dynamodbTables: [
        {
          name: 'huntaze-ai-costs-production',
          keySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
          ],
          billingMode: 'PAY_PER_REQUEST'
        },
        {
          name: 'huntaze-cost-alerts-production',
          keySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          billingMode: 'PAY_PER_REQUEST'
        }
      ],
      sqsQueues: [
        {
          name: 'huntaze-hybrid-workflows',
          attributes: {
            MessageRetentionPeriod: '1209600', // 14 days
            VisibilityTimeout: '300'
          }
        },
        {
          name: 'huntaze-rate-limiter-queue',
          attributes: {
            MessageRetentionPeriod: '86400', // 1 day
            VisibilityTimeout: '60'
          }
        }
      ],
      snsTopics: [
        {
          name: 'huntaze-cost-alerts',
          attributes: {
            DisplayName: 'Huntaze Cost Alerts'
          }
        }
      ],
      cloudwatchAlarms: [
        {
          name: 'huntaze-daily-cost-high',
          metric: 'AIProviderCost',
          threshold: 50
        },
        {
          name: 'huntaze-hourly-cost-spike',
          metric: 'AIProviderCost',
          threshold: 10
        }
      ]
    };
  }
}

describe('AWS Infrastructure Audit Integration', () => {
  let provisioner: AWSResourceProvisioner;

  beforeEach(() => {
    provisioner = new AWSResourceProvisioner();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hybrid Orchestrator Resource Provisioning', () => {
    it('should create all missing hybrid orchestrator resources', async () => {
      // Mock successful resource creation
      mockAWSClients.dynamodb.send.mockResolvedValue({ TableDescription: { TableStatus: 'ACTIVE' } });
      mockAWSClients.sqs.send.mockResolvedValue({ QueueUrl: 'https://sqs.us-east-1.amazonaws.com/...' });
      mockAWSClients.sns.send.mockResolvedValue({ TopicArn: 'arn:aws:sns:us-east-1:...' });
      mockAWSClients.cloudwatch.send.mockResolvedValue({});

      const plan = provisioner.generateHybridOrchestratorPlan();
      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(result.created).toHaveLength(7); // 2 tables + 2 queues + 1 topic + 2 alarms
      expect(result.failed).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      // Verify DynamoDB tables were created
      expect(result.created).toContain('DynamoDB: huntaze-ai-costs-production');
      expect(result.created).toContain('DynamoDB: huntaze-cost-alerts-production');

      // Verify SQS queues were created
      expect(result.created).toContain('SQS: huntaze-hybrid-workflows');
      expect(result.created).toContain('SQS: huntaze-rate-limiter-queue');

      // Verify SNS topic was created
      expect(result.created).toContain('SNS: huntaze-cost-alerts');

      // Verify CloudWatch alarms were created
      expect(result.created).toContain('CloudWatch: huntaze-daily-cost-high');
      expect(result.created).toContain('CloudWatch: huntaze-hourly-cost-spike');
    });

    it('should handle partial failures gracefully', async () => {
      // Mock mixed success/failure
      mockAWSClients.dynamodb.send
        .mockResolvedValueOnce({ TableDescription: { TableStatus: 'ACTIVE' } })
        .mockRejectedValueOnce(new Error('Table already exists'));

      mockAWSClients.sqs.send.mockResolvedValue({ QueueUrl: 'https://...' });
      mockAWSClients.sns.send.mockResolvedValue({ TopicArn: 'arn:...' });
      mockAWSClients.cloudwatch.send.mockResolvedValue({});

      const plan = provisioner.generateHybridOrchestratorPlan();
      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(false);
      expect(result.created.length).toBeGreaterThan(0);
      expect(result.failed).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Table already exists');
    });
  });

  describe('DynamoDB Table Creation', () => {
    it('should create cost tracking table with correct schema', async () => {
      mockAWSClients.dynamodb.send.mockResolvedValue({
        TableDescription: { TableStatus: 'ACTIVE' }
      });

      const plan: ResourceCreationPlan = {
        dynamodbTables: [{
          name: 'huntaze-ai-costs-production',
          keySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
          ],
          billingMode: 'PAY_PER_REQUEST'
        }],
        sqsQueues: [],
        snsTopics: [],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.dynamodb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'huntaze-ai-costs-production',
          BillingMode: 'PAY_PER_REQUEST'
        })
      );
    });

    it('should create cost alerts table with correct schema', async () => {
      mockAWSClients.dynamodb.send.mockResolvedValue({
        TableDescription: { TableStatus: 'ACTIVE' }
      });

      const plan: ResourceCreationPlan = {
        dynamodbTables: [{
          name: 'huntaze-cost-alerts-production',
          keySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          billingMode: 'PAY_PER_REQUEST'
        }],
        sqsQueues: [],
        snsTopics: [],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.dynamodb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'huntaze-cost-alerts-production',
          BillingMode: 'PAY_PER_REQUEST'
        })
      );
    });
  });

  describe('SQS Queue Creation', () => {
    it('should create hybrid workflows queue', async () => {
      mockAWSClients.sqs.send.mockResolvedValue({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows'
      });

      const plan: ResourceCreationPlan = {
        dynamodbTables: [],
        sqsQueues: [{
          name: 'huntaze-hybrid-workflows',
          attributes: {
            MessageRetentionPeriod: '1209600',
            VisibilityTimeout: '300'
          }
        }],
        snsTopics: [],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.sqs.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueName: 'huntaze-hybrid-workflows'
        })
      );
    });

    it('should create rate limiter queue', async () => {
      mockAWSClients.sqs.send.mockResolvedValue({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue'
      });

      const plan: ResourceCreationPlan = {
        dynamodbTables: [],
        sqsQueues: [{
          name: 'huntaze-rate-limiter-queue',
          attributes: {
            MessageRetentionPeriod: '86400',
            VisibilityTimeout: '60'
          }
        }],
        snsTopics: [],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.sqs.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueName: 'huntaze-rate-limiter-queue'
        })
      );
    });
  });

  describe('SNS Topic Creation', () => {
    it('should create cost alerts topic', async () => {
      mockAWSClients.sns.send.mockResolvedValue({
        TopicArn: 'arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts'
      });

      const plan: ResourceCreationPlan = {
        dynamodbTables: [],
        sqsQueues: [],
        snsTopics: [{
          name: 'huntaze-cost-alerts',
          attributes: {
            DisplayName: 'Huntaze Cost Alerts'
          }
        }],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.sns.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Name: 'huntaze-cost-alerts'
        })
      );
    });
  });

  describe('CloudWatch Alarm Creation', () => {
    it('should create daily cost alarm', async () => {
      mockAWSClients.cloudwatch.send.mockResolvedValue({});

      const plan: ResourceCreationPlan = {
        dynamodbTables: [],
        sqsQueues: [],
        snsTopics: [],
        cloudwatchAlarms: [{
          name: 'huntaze-daily-cost-high',
          metric: 'AIProviderCost',
          threshold: 50
        }]
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.cloudwatch.send).toHaveBeenCalledWith(
        expect.objectContaining({
          AlarmName: 'huntaze-daily-cost-high',
          MetricName: 'AIProviderCost',
          Threshold: 50
        })
      );
    });

    it('should create hourly cost spike alarm', async () => {
      mockAWSClients.cloudwatch.send.mockResolvedValue({});

      const plan: ResourceCreationPlan = {
        dynamodbTables: [],
        sqsQueues: [],
        snsTopics: [],
        cloudwatchAlarms: [{
          name: 'huntaze-hourly-cost-spike',
          metric: 'AIProviderCost',
          threshold: 10
        }]
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(mockAWSClients.cloudwatch.send).toHaveBeenCalledWith(
        expect.objectContaining({
          AlarmName: 'huntaze-hourly-cost-spike',
          Threshold: 10
        })
      );
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should continue creating resources after individual failures', async () => {
      mockAWSClients.dynamodb.send
        .mockRejectedValueOnce(new Error('DynamoDB error'))
        .mockResolvedValueOnce({ TableDescription: { TableStatus: 'ACTIVE' } });

      mockAWSClients.sqs.send.mockResolvedValue({ QueueUrl: 'https://...' });
      mockAWSClients.sns.send.mockResolvedValue({ TopicArn: 'arn:...' });
      mockAWSClients.cloudwatch.send.mockResolvedValue({});

      const plan = provisioner.generateHybridOrchestratorPlan();
      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(false);
      expect(result.created.length).toBeGreaterThan(0);
      expect(result.failed).toHaveLength(1);
      expect(result.errors[0].error).toBe('DynamoDB error');
    });

    it('should handle AWS throttling errors', async () => {
      const throttleError = new Error('Rate exceeded');
      throttleError.name = 'ThrottlingException';

      mockAWSClients.dynamodb.send.mockRejectedValue(throttleError);

      const plan: ResourceCreationPlan = {
        dynamodbTables: [{
          name: 'test-table',
          keySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
          billingMode: 'PAY_PER_REQUEST'
        }],
        sqsQueues: [],
        snsTopics: [],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Rate exceeded');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Access Denied');
      permissionError.name = 'AccessDeniedException';

      mockAWSClients.sqs.send.mockRejectedValue(permissionError);

      const plan: ResourceCreationPlan = {
        dynamodbTables: [],
        sqsQueues: [{
          name: 'test-queue',
          attributes: {}
        }],
        snsTopics: [],
        cloudwatchAlarms: []
      };

      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Access Denied');
    });
  });

  describe('Resource Validation After Creation', () => {
    it('should verify all resources were created successfully', async () => {
      mockAWSClients.dynamodb.send.mockResolvedValue({
        TableDescription: { TableStatus: 'ACTIVE' }
      });
      mockAWSClients.sqs.send.mockResolvedValue({ QueueUrl: 'https://...' });
      mockAWSClients.sns.send.mockResolvedValue({ TopicArn: 'arn:...' });
      mockAWSClients.cloudwatch.send.mockResolvedValue({});

      const plan = provisioner.generateHybridOrchestratorPlan();
      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(true);
      expect(result.created).toHaveLength(7);

      // Verify each resource type
      const dynamoResources = result.created.filter(r => r.startsWith('DynamoDB:'));
      const sqsResources = result.created.filter(r => r.startsWith('SQS:'));
      const snsResources = result.created.filter(r => r.startsWith('SNS:'));
      const cwResources = result.created.filter(r => r.startsWith('CloudWatch:'));

      expect(dynamoResources).toHaveLength(2);
      expect(sqsResources).toHaveLength(2);
      expect(snsResources).toHaveLength(1);
      expect(cwResources).toHaveLength(2);
    });
  });

  describe('Idempotency', () => {
    it('should handle already existing resources gracefully', async () => {
      const existsError = new Error('Resource already exists');
      existsError.name = 'ResourceInUseException';

      mockAWSClients.dynamodb.send.mockRejectedValue(existsError);
      mockAWSClients.sqs.send.mockRejectedValue(existsError);
      mockAWSClients.sns.send.mockRejectedValue(existsError);
      mockAWSClients.cloudwatch.send.mockRejectedValue(existsError);

      const plan = provisioner.generateHybridOrchestratorPlan();
      const result = await provisioner.createMissingResources(plan);

      expect(result.success).toBe(false);
      expect(result.failed).toHaveLength(7);
      expect(result.errors.every(e => e.error.includes('already exists'))).toBe(true);
    });
  });
});
