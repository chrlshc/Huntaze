/**
 * Tests for AWS Infrastructure Audit Validation
 * Validates that AWS infrastructure matches documented architecture
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock AWS SDK clients
const mockDynamoDBClient = {
  send: vi.fn()
};

const mockSQSClient = {
  send: vi.fn()
};

const mockSNSClient = {
  send: vi.fn()
};

const mockECSClient = {
  send: vi.fn()
};

const mockRDSClient = {
  send: vi.fn()
};

const mockElastiCacheClient = {
  send: vi.fn()
};

const mockS3Client = {
  send: vi.fn()
};

const mockCloudWatchClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => mockDynamoDBClient),
  ListTablesCommand: vi.fn((params) => params),
  DescribeTableCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => mockSQSClient),
  ListQueuesCommand: vi.fn((params) => params),
  GetQueueAttributesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => mockSNSClient),
  ListTopicsCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => mockECSClient),
  ListClustersCommand: vi.fn((params) => params),
  ListServicesCommand: vi.fn((params) => params),
  DescribeServicesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-rds', () => ({
  RDSClient: vi.fn(() => mockRDSClient),
  DescribeDBInstancesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-elasticache', () => ({
  ElastiCacheClient: vi.fn(() => mockElastiCacheClient),
  DescribeCacheClustersCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => mockS3Client),
  ListBucketsCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  DescribeAlarmsCommand: vi.fn((params) => params)
}));

// Expected infrastructure based on audit
const EXPECTED_INFRASTRUCTURE = {
  dynamodb: {
    existing: [
      'HuntazeByoIpStack-AgentsTable78E0948F-18NTJYM8XGNAB',
      'HuntazeByoIpStack-CreatorLimits9110B110-AXGTWK4NL8PY',
      'HuntazeByoIpStack-JobsTable1970BC16-LS781Y2EHH3P',
      'HuntazeMediaVault-production',
      'HuntazeOfMessages',
      'HuntazeOfSessions',
      'HuntazeOfThreads',
      'NotificationMetrics-production',
      'ai_session_artifacts',
      'ai_session_messages',
      'ai_sessions',
      'huntaze-analytics-events',
      'huntaze-oauth-tokens',
      'huntaze-of-aggregates',
      'huntaze-of-messages',
      'huntaze-of-sessions',
      'huntaze-of-threads',
      'huntaze-posts',
      'huntaze-pubkeys',
      'huntaze-stripe-events',
      'huntaze-users'
    ],
    missing: [
      'huntaze-ai-costs-production',
      'huntaze-cost-alerts-production'
    ]
  },
  sqs: {
    existing: [
      'HuntazeOfSendQueue.fifo',
      'huntaze-ai-processing-dlq',
      'huntaze-analytics',
      'huntaze-analytics-dlq',
      'huntaze-email',
      'huntaze-email-dlq',
      'huntaze-enrichment-production',
      'huntaze-notifications-production',
      'huntaze-webhooks',
      'huntaze-webhooks-dlq',
      'onlyfans-send.fifo',
      'publisher-instagram-production',
      'publisher-reddit-production',
      'publisher-tiktok-dlq-production',
      'ai-team-eventbridge-dlq',
      'autogen-send-dlq.fifo',
      'monthly-billing-dlq-production',
      'OAuthRefreshStack-OAuthRefreshDLQprod397A8CBB-CW8uajPk4646'
    ],
    missing: [
      'huntaze-hybrid-workflows',
      'huntaze-rate-limiter-queue'
    ]
  },
  sns: {
    existing: [
      'Huntaze-Milestone-production',
      'Huntaze-NewFan-production',
      'Huntaze-NewMessage-production',
      'Huntaze-NewTip-production',
      'HuntazeAgentAlerts',
      'alerts',
      'huntaze-auth-alerts',
      'huntaze-moderation-alerts-production',
      'huntaze-production-alerts',
      'ses-bounces',
      'ses-complaints'
    ],
    missing: [
      'huntaze-cost-alerts'
    ]
  },
  ecs: {
    clusters: ['ai-team', 'huntaze-cluster', 'huntaze-of-fargate'],
    services: {
      'huntaze-cluster': ['onlyfans-scraper']
    }
  },
  rds: {
    instances: ['huntaze-postgres-production']
  },
  elasticache: {
    clusters: ['huntaze-redis-production']
  },
  s3: {
    buckets: [
      'aws-sam-cli-managed-default-samclisourcebucket-qusvkqzketix',
      'cdk-hnb659fds-assets-317805897534-us-east-1',
      'cdk-ofq1abcde-assets-317805897534-us-east-1',
      'huntaze-of-traces-317805897534-us-east-1',
      'huntaze-playwright-artifacts-317805897534-us-east-1',
      'huntazeofcistack-ofpipelineartifactsbucket2e105862-yvpqdiogwdmu',
      'huntazeofcistack-ofsourcebuckete857dca2-sit7ku08virm'
    ]
  }
};

interface InfrastructureAudit {
  accountId: string;
  region: string;
  timestamp: Date;
  services: {
    dynamodb: { tables: string[]; missing: string[] };
    sqs: { queues: string[]; missing: string[] };
    sns: { topics: string[]; missing: string[] };
    ecs: { clusters: string[]; services: Record<string, string[]> };
    rds: { instances: string[] };
    elasticache: { clusters: string[] };
    s3: { buckets: string[] };
  };
  completeness: number;
  missingResources: string[];
}

// Mock implementation of AWS Infrastructure Auditor
class AWSInfrastructureAuditor {
  constructor(
    private dynamoDBClient = mockDynamoDBClient,
    private sqsClient = mockSQSClient,
    private snsClient = mockSNSClient,
    private ecsClient = mockECSClient,
    private rdsClient = mockRDSClient,
    private elastiCacheClient = mockElastiCacheClient,
    private s3Client = mockS3Client,
    private cloudWatchClient = mockCloudWatchClient
  ) {}

  async auditInfrastructure(accountId: string, region: string): Promise<InfrastructureAudit> {
    const [
      dynamoTables,
      sqsQueues,
      snsTopics,
      ecsClusters,
      rdsInstances,
      elastiCacheClusters,
      s3Buckets
    ] = await Promise.all([
      this.listDynamoDBTables(),
      this.listSQSQueues(),
      this.listSNSTopics(),
      this.listECSClusters(),
      this.listRDSInstances(),
      this.listElastiCacheClusters(),
      this.listS3Buckets()
    ]);

    const missingDynamoTables = EXPECTED_INFRASTRUCTURE.dynamodb.missing.filter(
      table => !dynamoTables.includes(table)
    );

    const missingSQSQueues = EXPECTED_INFRASTRUCTURE.sqs.missing.filter(
      queue => !sqsQueues.includes(queue)
    );

    const missingSNSTopics = EXPECTED_INFRASTRUCTURE.sns.missing.filter(
      topic => !snsTopics.includes(topic)
    );

    const totalExpected = 
      EXPECTED_INFRASTRUCTURE.dynamodb.existing.length + 
      EXPECTED_INFRASTRUCTURE.dynamodb.missing.length +
      EXPECTED_INFRASTRUCTURE.sqs.existing.length +
      EXPECTED_INFRASTRUCTURE.sqs.missing.length +
      EXPECTED_INFRASTRUCTURE.sns.existing.length +
      EXPECTED_INFRASTRUCTURE.sns.missing.length;

    const totalDeployed = dynamoTables.length + sqsQueues.length + snsTopics.length;
    const completeness = Math.round((totalDeployed / totalExpected) * 100);

    const missingResources = [
      ...missingDynamoTables.map(t => `DynamoDB: ${t}`),
      ...missingSQSQueues.map(q => `SQS: ${q}`),
      ...missingSNSTopics.map(t => `SNS: ${t}`)
    ];

    return {
      accountId,
      region,
      timestamp: new Date(),
      services: {
        dynamodb: { tables: dynamoTables, missing: missingDynamoTables },
        sqs: { queues: sqsQueues, missing: missingSQSQueues },
        sns: { topics: snsTopics, missing: missingSNSTopics },
        ecs: { clusters: ecsClusters, services: {} },
        rds: { instances: rdsInstances },
        elasticache: { clusters: elastiCacheClusters },
        s3: { buckets: s3Buckets }
      },
      completeness,
      missingResources
    };
  }

  private async listDynamoDBTables(): Promise<string[]> {
    const response = await this.dynamoDBClient.send({});
    return response.TableNames || [];
  }

  private async listSQSQueues(): Promise<string[]> {
    const response = await this.sqsClient.send({});
    return response.QueueUrls?.map((url: string) => url.split('/').pop() || '') || [];
  }

  private async listSNSTopics(): Promise<string[]> {
    const response = await this.snsClient.send({});
    return response.Topics?.map((t: any) => t.TopicArn.split(':').pop() || '') || [];
  }

  private async listECSClusters(): Promise<string[]> {
    const response = await this.ecsClient.send({});
    return response.clusterArns?.map((arn: string) => arn.split('/').pop() || '') || [];
  }

  private async listRDSInstances(): Promise<string[]> {
    const response = await this.rdsClient.send({});
    return response.DBInstances?.map((db: any) => db.DBInstanceIdentifier) || [];
  }

  private async listElastiCacheClusters(): Promise<string[]> {
    const response = await this.elastiCacheClient.send({});
    return response.CacheClusters?.map((c: any) => c.CacheClusterId) || [];
  }

  private async listS3Buckets(): Promise<string[]> {
    const response = await this.s3Client.send({});
    return response.Buckets?.map((b: any) => b.Name) || [];
  }

  async validateHybridOrchestratorResources(): Promise<{
    complete: boolean;
    missing: string[];
    recommendations: string[];
  }> {
    const audit = await this.auditInfrastructure('317805897534', 'us-east-1');
    
    const hybridResources = [
      'huntaze-ai-costs-production',
      'huntaze-cost-alerts-production',
      'huntaze-hybrid-workflows',
      'huntaze-rate-limiter-queue',
      'huntaze-cost-alerts'
    ];

    const missing = audit.missingResources.filter(resource =>
      hybridResources.some(hr => resource.includes(hr))
    );

    const recommendations = [];
    if (missing.length > 0) {
      recommendations.push('Create missing DynamoDB tables for cost tracking');
      recommendations.push('Create missing SQS queues for workflow orchestration');
      recommendations.push('Create missing SNS topics for cost alerts');
    }

    return {
      complete: missing.length === 0,
      missing,
      recommendations
    };
  }

  async estimateMonthlyCost(): Promise<{
    service: string;
    usage: string;
    monthlyCost: number;
  }[]> {
    return [
      { service: 'RDS (db.t3.micro)', usage: '24/7', monthlyCost: 15 },
      { service: 'ElastiCache (cache.t3.micro)', usage: '24/7', monthlyCost: 12 },
      { service: 'DynamoDB (21 tables)', usage: 'On-Demand', monthlyCost: 7.5 },
      { service: 'SQS (22 queues)', usage: 'Variable', monthlyCost: 1.5 },
      { service: 'ECS Fargate', usage: '1 service active', monthlyCost: 15 },
      { service: 'S3 Storage', usage: '7 buckets', monthlyCost: 5 }
    ];
  }
}

describe('AWS Infrastructure Audit Validation', () => {
  let auditor: AWSInfrastructureAuditor;

  beforeEach(() => {
    auditor = new AWSInfrastructureAuditor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DynamoDB Tables Audit', () => {
    it('should identify all existing DynamoDB tables', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      const tables = await auditor['listDynamoDBTables']();

      expect(tables).toHaveLength(21);
      expect(tables).toContain('huntaze-users');
      expect(tables).toContain('huntaze-of-messages');
      expect(tables).toContain('ai_sessions');
      expect(mockDynamoDBClient.send).toHaveBeenCalled();
    });

    it('should identify missing DynamoDB tables for hybrid orchestrator', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      mockSQSClient.send.mockResolvedValue({ QueueUrls: [] });
      mockSNSClient.send.mockResolvedValue({ Topics: [] });
      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      expect(audit.services.dynamodb.missing).toContain('huntaze-ai-costs-production');
      expect(audit.services.dynamodb.missing).toContain('huntaze-cost-alerts-production');
      expect(audit.services.dynamodb.missing).toHaveLength(2);
    });

    it('should validate table count matches audit document', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      const tables = await auditor['listDynamoDBTables']();

      // According to audit: 21 tables exist
      expect(tables).toHaveLength(21);
    });
  });

  describe('SQS Queues Audit', () => {
    it('should identify all existing SQS queues', async () => {
      const queueUrls = EXPECTED_INFRASTRUCTURE.sqs.existing.map(
        q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
      );

      mockSQSClient.send.mockResolvedValue({ QueueUrls: queueUrls });

      const queues = await auditor['listSQSQueues']();

      expect(queues.length).toBeGreaterThanOrEqual(18);
      expect(queues).toContain('HuntazeOfSendQueue.fifo');
      expect(queues).toContain('huntaze-analytics');
      expect(queues).toContain('onlyfans-send.fifo');
    });

    it('should identify missing SQS queues for hybrid orchestrator', async () => {
      const queueUrls = EXPECTED_INFRASTRUCTURE.sqs.existing.map(
        q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
      );

      mockSQSClient.send.mockResolvedValue({ QueueUrls: queueUrls });
      mockDynamoDBClient.send.mockResolvedValue({ TableNames: [] });
      mockSNSClient.send.mockResolvedValue({ Topics: [] });
      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      expect(audit.services.sqs.missing).toContain('huntaze-hybrid-workflows');
      expect(audit.services.sqs.missing).toContain('huntaze-rate-limiter-queue');
      expect(audit.services.sqs.missing).toHaveLength(2);
    });

    it('should handle FIFO queues correctly', async () => {
      const queueUrls = [
        'https://sqs.us-east-1.amazonaws.com/317805897534/HuntazeOfSendQueue.fifo',
        'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
        'https://sqs.us-east-1.amazonaws.com/317805897534/autogen-send-dlq.fifo'
      ];

      mockSQSClient.send.mockResolvedValue({ QueueUrls: queueUrls });

      const queues = await auditor['listSQSQueues']();

      const fifoQueues = queues.filter(q => q.endsWith('.fifo'));
      expect(fifoQueues).toHaveLength(3);
    });
  });

  describe('SNS Topics Audit', () => {
    it('should identify all existing SNS topics', async () => {
      const topics = EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
        TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
      }));

      mockSNSClient.send.mockResolvedValue({ Topics: topics });

      const topicNames = await auditor['listSNSTopics']();

      expect(topicNames).toHaveLength(11);
      expect(topicNames).toContain('huntaze-production-alerts');
      expect(topicNames).toContain('HuntazeAgentAlerts');
      expect(topicNames).toContain('ses-bounces');
    });

    it('should identify missing SNS topic for cost alerts', async () => {
      const topics = EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
        TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
      }));

      mockSNSClient.send.mockResolvedValue({ Topics: topics });
      mockDynamoDBClient.send.mockResolvedValue({ TableNames: [] });
      mockSQSClient.send.mockResolvedValue({ QueueUrls: [] });
      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      expect(audit.services.sns.missing).toContain('huntaze-cost-alerts');
      expect(audit.services.sns.missing).toHaveLength(1);
    });
  });

  describe('ECS Clusters and Services Audit', () => {
    it('should identify all ECS clusters', async () => {
      const clusterArns = EXPECTED_INFRASTRUCTURE.ecs.clusters.map(
        name => `arn:aws:ecs:us-east-1:317805897534:cluster/${name}`
      );

      mockECSClient.send.mockResolvedValue({ clusterArns });

      const clusters = await auditor['listECSClusters']();

      expect(clusters).toHaveLength(3);
      expect(clusters).toContain('ai-team');
      expect(clusters).toContain('huntaze-cluster');
      expect(clusters).toContain('huntaze-of-fargate');
    });

    it('should validate expected ECS services', () => {
      const expectedServices = EXPECTED_INFRASTRUCTURE.ecs.services;

      expect(expectedServices['huntaze-cluster']).toContain('onlyfans-scraper');
      expect(expectedServices['huntaze-cluster']).toHaveLength(1);
    });
  });

  describe('RDS and ElastiCache Audit', () => {
    it('should identify RDS PostgreSQL instance', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [
          { DBInstanceIdentifier: 'huntaze-postgres-production' }
        ]
      });

      const instances = await auditor['listRDSInstances']();

      expect(instances).toContain('huntaze-postgres-production');
      expect(instances).toHaveLength(1);
    });

    it('should identify ElastiCache Redis cluster', async () => {
      mockElastiCacheClient.send.mockResolvedValue({
        CacheClusters: [
          { CacheClusterId: 'huntaze-redis-production' }
        ]
      });

      const clusters = await auditor['listElastiCacheClusters']();

      expect(clusters).toContain('huntaze-redis-production');
      expect(clusters).toHaveLength(1);
    });
  });

  describe('S3 Buckets Audit', () => {
    it('should identify all S3 buckets', async () => {
      const buckets = EXPECTED_INFRASTRUCTURE.s3.buckets.map(name => ({ Name: name }));

      mockS3Client.send.mockResolvedValue({ Buckets: buckets });

      const bucketNames = await auditor['listS3Buckets']();

      expect(bucketNames).toHaveLength(7);
      expect(bucketNames).toContain('huntaze-of-traces-317805897534-us-east-1');
      expect(bucketNames).toContain('huntaze-playwright-artifacts-317805897534-us-east-1');
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should calculate infrastructure completeness percentage', async () => {
      // Mock all existing resources
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      const sqsUrls = EXPECTED_INFRASTRUCTURE.sqs.existing.map(
        q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
      );
      mockSQSClient.send.mockResolvedValue({ QueueUrls: sqsUrls });

      const snsTopics = EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
        TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
      }));
      mockSNSClient.send.mockResolvedValue({ Topics: snsTopics });

      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      // According to audit document: ~80% complete
      expect(audit.completeness).toBeGreaterThan(75);
      expect(audit.completeness).toBeLessThan(85);
    });

    it('should list all missing resources', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      mockSQSClient.send.mockResolvedValue({
        QueueUrls: EXPECTED_INFRASTRUCTURE.sqs.existing.map(
          q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
        )
      });

      mockSNSClient.send.mockResolvedValue({
        Topics: EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
          TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
        }))
      });

      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      expect(audit.missingResources).toHaveLength(5);
      expect(audit.missingResources).toContain('DynamoDB: huntaze-ai-costs-production');
      expect(audit.missingResources).toContain('DynamoDB: huntaze-cost-alerts-production');
      expect(audit.missingResources).toContain('SQS: huntaze-hybrid-workflows');
      expect(audit.missingResources).toContain('SQS: huntaze-rate-limiter-queue');
      expect(audit.missingResources).toContain('SNS: huntaze-cost-alerts');
    });
  });

  describe('Hybrid Orchestrator Resources Validation', () => {
    it('should validate hybrid orchestrator resources are complete', async () => {
      // Mock all resources including hybrid orchestrator ones
      const allDynamoTables = [
        ...EXPECTED_INFRASTRUCTURE.dynamodb.existing,
        ...EXPECTED_INFRASTRUCTURE.dynamodb.missing
      ];

      mockDynamoDBClient.send.mockResolvedValue({ TableNames: allDynamoTables });

      const allSQSQueues = [
        ...EXPECTED_INFRASTRUCTURE.sqs.existing,
        ...EXPECTED_INFRASTRUCTURE.sqs.missing
      ].map(q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`);

      mockSQSClient.send.mockResolvedValue({ QueueUrls: allSQSQueues });

      const allSNSTopics = [
        ...EXPECTED_INFRASTRUCTURE.sns.existing,
        ...EXPECTED_INFRASTRUCTURE.sns.missing
      ].map(name => ({ TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}` }));

      mockSNSClient.send.mockResolvedValue({ Topics: allSNSTopics });

      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const validation = await auditor.validateHybridOrchestratorResources();

      expect(validation.complete).toBe(true);
      expect(validation.missing).toHaveLength(0);
      expect(validation.recommendations).toHaveLength(0);
    });

    it('should identify incomplete hybrid orchestrator setup', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      mockSQSClient.send.mockResolvedValue({
        QueueUrls: EXPECTED_INFRASTRUCTURE.sqs.existing.map(
          q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
        )
      });

      mockSNSClient.send.mockResolvedValue({
        Topics: EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
          TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
        }))
      });

      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const validation = await auditor.validateHybridOrchestratorResources();

      expect(validation.complete).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
      expect(validation.recommendations).toContain('Create missing DynamoDB tables for cost tracking');
      expect(validation.recommendations).toContain('Create missing SQS queues for workflow orchestration');
      expect(validation.recommendations).toContain('Create missing SNS topics for cost alerts');
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate monthly AWS costs', async () => {
      const costs = await auditor.estimateMonthlyCost();

      expect(costs).toHaveLength(6);

      const totalCost = costs.reduce((sum, item) => sum + item.monthlyCost, 0);

      // According to audit: ~$48-64/month
      expect(totalCost).toBeGreaterThan(45);
      expect(totalCost).toBeLessThan(70);
    });

    it('should include all major services in cost estimation', async () => {
      const costs = await auditor.estimateMonthlyCost();

      const services = costs.map(c => c.service);

      expect(services).toContain('RDS (db.t3.micro)');
      expect(services).toContain('ElastiCache (cache.t3.micro)');
      expect(services).toContain('DynamoDB (21 tables)');
      expect(services).toContain('SQS (22 queues)');
      expect(services).toContain('ECS Fargate');
      expect(services).toContain('S3 Storage');
    });

    it('should provide cost breakdown by service', async () => {
      const costs = await auditor.estimateMonthlyCost();

      costs.forEach(item => {
        expect(item).toHaveProperty('service');
        expect(item).toHaveProperty('usage');
        expect(item).toHaveProperty('monthlyCost');
        expect(typeof item.monthlyCost).toBe('number');
        expect(item.monthlyCost).toBeGreaterThan(0);
      });
    });
  });

  describe('Audit Report Generation', () => {
    it('should generate complete audit report', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      mockSQSClient.send.mockResolvedValue({
        QueueUrls: EXPECTED_INFRASTRUCTURE.sqs.existing.map(
          q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
        )
      });

      mockSNSClient.send.mockResolvedValue({
        Topics: EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
          TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
        }))
      });

      const clusterArns = EXPECTED_INFRASTRUCTURE.ecs.clusters.map(
        name => `arn:aws:ecs:us-east-1:317805897534:cluster/${name}`
      );
      mockECSClient.send.mockResolvedValue({ clusterArns });

      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{ DBInstanceIdentifier: 'huntaze-postgres-production' }]
      });

      mockElastiCacheClient.send.mockResolvedValue({
        CacheClusters: [{ CacheClusterId: 'huntaze-redis-production' }]
      });

      mockS3Client.send.mockResolvedValue({
        Buckets: EXPECTED_INFRASTRUCTURE.s3.buckets.map(name => ({ Name: name }))
      });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      expect(audit.accountId).toBe('317805897534');
      expect(audit.region).toBe('us-east-1');
      expect(audit.timestamp).toBeInstanceOf(Date);
      expect(audit.services).toHaveProperty('dynamodb');
      expect(audit.services).toHaveProperty('sqs');
      expect(audit.services).toHaveProperty('sns');
      expect(audit.services).toHaveProperty('ecs');
      expect(audit.services).toHaveProperty('rds');
      expect(audit.services).toHaveProperty('elasticache');
      expect(audit.services).toHaveProperty('s3');
    });

    it('should match audit document findings', async () => {
      mockDynamoDBClient.send.mockResolvedValue({
        TableNames: EXPECTED_INFRASTRUCTURE.dynamodb.existing
      });

      mockSQSClient.send.mockResolvedValue({
        QueueUrls: EXPECTED_INFRASTRUCTURE.sqs.existing.map(
          q => `https://sqs.us-east-1.amazonaws.com/317805897534/${q}`
        )
      });

      mockSNSClient.send.mockResolvedValue({
        Topics: EXPECTED_INFRASTRUCTURE.sns.existing.map(name => ({
          TopicArn: `arn:aws:sns:us-east-1:317805897534:${name}`
        }))
      });

      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      // Validate findings match the audit document
      expect(audit.services.dynamodb.tables).toHaveLength(21);
      expect(audit.services.sqs.queues.length).toBeGreaterThanOrEqual(18);
      expect(audit.services.sns.topics).toHaveLength(11);

      // Missing resources
      expect(audit.services.dynamodb.missing).toHaveLength(2);
      expect(audit.services.sqs.missing).toHaveLength(2);
      expect(audit.services.sns.missing).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle AWS API errors gracefully', async () => {
      mockDynamoDBClient.send.mockRejectedValue(new Error('AWS API Error'));
      mockSQSClient.send.mockResolvedValue({ QueueUrls: [] });
      mockSNSClient.send.mockResolvedValue({ Topics: [] });
      mockECSClient.send.mockResolvedValue({ clusterArns: [] });
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });
      mockElastiCacheClient.send.mockResolvedValue({ CacheClusters: [] });
      mockS3Client.send.mockResolvedValue({ Buckets: [] });

      await expect(
        auditor.auditInfrastructure('317805897534', 'us-east-1')
      ).rejects.toThrow('AWS API Error');
    });

    it('should handle missing permissions', async () => {
      const permissionError = new Error('Access Denied');
      permissionError.name = 'AccessDeniedException';

      mockDynamoDBClient.send.mockRejectedValue(permissionError);

      await expect(
        auditor['listDynamoDBTables']()
      ).rejects.toThrow('Access Denied');
    });

    it('should handle empty responses', async () => {
      mockDynamoDBClient.send.mockResolvedValue({});
      mockSQSClient.send.mockResolvedValue({});
      mockSNSClient.send.mockResolvedValue({});
      mockECSClient.send.mockResolvedValue({});
      mockRDSClient.send.mockResolvedValue({});
      mockElastiCacheClient.send.mockResolvedValue({});
      mockS3Client.send.mockResolvedValue({});

      const audit = await auditor.auditInfrastructure('317805897534', 'us-east-1');

      expect(audit.services.dynamodb.tables).toHaveLength(0);
      expect(audit.services.sqs.queues).toHaveLength(0);
      expect(audit.services.sns.topics).toHaveLength(0);
      expect(audit.completeness).toBe(0);
    });
  });
});
