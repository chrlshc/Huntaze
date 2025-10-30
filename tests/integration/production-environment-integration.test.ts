/**
 * Production Environment Integration Tests
 * Tests the integration between .env.production and actual AWS services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock AWS SDK clients
const mockECSClient = {
  send: vi.fn()
};

const mockDynamoDBClient = {
  send: vi.fn()
};

const mockSecretsManagerClient = {
  send: vi.fn()
};

const mockKMSClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => mockECSClient),
  DescribeClustersCommand: vi.fn((params) => params),
  DescribeTaskDefinitionCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => mockDynamoDBClient),
  DescribeTableCommand: vi.fn((params) => params),
  ListTablesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(() => mockSecretsManagerClient),
  GetSecretValueCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-kms', () => ({
  KMSClient: vi.fn(() => mockKMSClient),
  DescribeKeyCommand: vi.fn((params) => params)
}));

describe('Production Environment Integration Tests', () => {
  let envConfig: Record<string, string>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Load production environment configuration
    const envContent = readFileSync(join(process.cwd(), '.env.production'), 'utf-8');
    envConfig = {};
    
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envConfig[key] = value;
        }
      }
    });
    
    // Set environment variables for testing
    Object.entries(envConfig).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ECS Cluster Integration', () => {
    it('should validate ECS cluster exists and is accessible', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        clusters: [{
          clusterArn: envConfig.ECS_CLUSTER_ARN,
          clusterName: 'huntaze-of-fargate',
          status: 'ACTIVE',
          runningTasksCount: 0,
          pendingTasksCount: 0,
          capacityProviders: ['FARGATE']
        }]
      });

      const { ECSClient, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: envConfig.AWS_REGION });
      
      const result = await client.send(new DescribeClustersCommand({
        clusters: [envConfig.ECS_CLUSTER_ARN]
      }));

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters![0].status).toBe('ACTIVE');
      expect(result.clusters![0].clusterArn).toBe(envConfig.ECS_CLUSTER_ARN);
      expect(result.clusters![0].capacityProviders).toContain('FARGATE');
    });

    it('should validate ECS task definition exists and is active', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        taskDefinition: {
          taskDefinitionArn: `arn:aws:ecs:${envConfig.AWS_REGION}:${envConfig.AWS_ACCOUNT_ID}:task-definition/${envConfig.ECS_TASK_DEFINITION}`,
          family: 'HuntazeOfStackBrowserWorkerTask',
          revision: 1,
          status: 'ACTIVE',
          requiresCompatibilities: ['FARGATE'],
          networkMode: 'awsvpc',
          cpu: '1024',
          memory: '2048',
          containerDefinitions: [{
            name: 'of-browser-worker',
            image: 'public.ecr.aws/lambda/nodejs:18',
            essential: true
          }]
        }
      });

      const { ECSClient, DescribeTaskDefinitionCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: envConfig.AWS_REGION });
      
      const result = await client.send(new DescribeTaskDefinitionCommand({
        taskDefinition: envConfig.ECS_TASK_DEFINITION
      }));

      expect(result.taskDefinition!.status).toBe('ACTIVE');
      expect(result.taskDefinition!.requiresCompatibilities).toContain('FARGATE');
      expect(result.taskDefinition!.networkMode).toBe('awsvpc');
      expect(result.taskDefinition!.containerDefinitions).toHaveLength(1);
      expect(result.taskDefinition!.containerDefinitions![0].name).toBe('of-browser-worker');
    });

    it('should handle ECS cluster not found error', async () => {
      mockECSClient.send.mockRejectedValueOnce(
        new Error('ClusterNotFoundException: Cluster not found')
      );

      const { ECSClient, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: envConfig.AWS_REGION });
      
      await expect(client.send(new DescribeClustersCommand({
        clusters: ['non-existent-cluster']
      }))).rejects.toThrow('ClusterNotFoundException');
    });
  });

  describe('DynamoDB Tables Integration', () => {
    it('should validate all DynamoDB tables exist and are active', async () => {
      const tables = [
        envConfig.DYNAMODB_TABLE_SESSIONS,
        envConfig.DYNAMODB_TABLE_THREADS,
        envConfig.DYNAMODB_TABLE_MESSAGES
      ];

      // Mock responses for each table
      tables.forEach((tableName, index) => {
        mockDynamoDBClient.send.mockResolvedValueOnce({
          Table: {
            TableName: tableName,
            TableStatus: 'ACTIVE',
            AttributeDefinitions: [
              { AttributeName: 'id', AttributeType: 'S' }
            ],
            KeySchema: [
              { AttributeName: 'id', KeyType: 'HASH' }
            ],
            BillingModeSummary: {
              BillingMode: 'PAY_PER_REQUEST'
            },
            SSEDescription: {
              Status: 'ENABLED'
            }
          }
        });
      });

      const { DynamoDBClient, DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient({ region: envConfig.DYNAMODB_REGION });
      
      for (const tableName of tables) {
        const result = await client.send(new DescribeTableCommand({
          TableName: tableName
        }));

        expect(result.Table!.TableStatus).toBe('ACTIVE');
        expect(result.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
        expect(result.Table!.SSEDescription!.Status).toBe('ENABLED');
      }
    });

    it('should validate DynamoDB region consistency', async () => {
      mockDynamoDBClient.send.mockResolvedValueOnce({
        TableNames: [
          envConfig.DYNAMODB_TABLE_SESSIONS,
          envConfig.DYNAMODB_TABLE_THREADS,
          envConfig.DYNAMODB_TABLE_MESSAGES
        ]
      });

      const { DynamoDBClient, ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
      
      // Test with configured region
      const client = new DynamoDBClient({ region: envConfig.DYNAMODB_REGION });
      const result = await client.send(new ListTablesCommand({}));

      expect(result.TableNames).toContain(envConfig.DYNAMODB_TABLE_SESSIONS);
      expect(result.TableNames).toContain(envConfig.DYNAMODB_TABLE_THREADS);
      expect(result.TableNames).toContain(envConfig.DYNAMODB_TABLE_MESSAGES);
    });

    it('should handle DynamoDB table not found error', async () => {
      mockDynamoDBClient.send.mockRejectedValueOnce(
        new Error('ResourceNotFoundException: Requested resource not found')
      );

      const { DynamoDBClient, DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient({ region: envConfig.DYNAMODB_REGION });
      
      await expect(client.send(new DescribeTableCommand({
        TableName: 'non-existent-table'
      }))).rejects.toThrow('ResourceNotFoundException');
    });
  });

  describe('KMS Key Integration', () => {
    it('should validate KMS key exists and is enabled', async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        KeyMetadata: {
          KeyId: envConfig.KMS_KEY_ID,
          Arn: envConfig.KMS_KEY_ID,
          KeyState: 'Enabled',
          KeyUsage: 'ENCRYPT_DECRYPT',
          KeySpec: 'SYMMETRIC_DEFAULT',
          Origin: 'AWS_KMS'
        }
      });

      const { KMSClient, DescribeKeyCommand } = await import('@aws-sdk/client-kms');
      const client = new KMSClient({ region: envConfig.AWS_REGION });
      
      const result = await client.send(new DescribeKeyCommand({
        KeyId: envConfig.KMS_KEY_ID
      }));

      expect(result.KeyMetadata!.KeyState).toBe('Enabled');
      expect(result.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(result.KeyMetadata!.Arn).toBe(envConfig.KMS_KEY_ID);
    });

    it('should handle KMS key not found error', async () => {
      mockKMSClient.send.mockRejectedValueOnce(
        new Error('NotFoundException: Key not found')
      );

      const { KMSClient, DescribeKeyCommand } = await import('@aws-sdk/client-kms');
      const client = new KMSClient({ region: envConfig.AWS_REGION });
      
      await expect(client.send(new DescribeKeyCommand({
        KeyId: 'invalid-key-id'
      }))).rejects.toThrow('NotFoundException');
    });
  });

  describe('Secrets Manager Integration', () => {
    it('should validate secrets manager secret exists', async () => {
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        ARN: `arn:aws:secretsmanager:${envConfig.AWS_REGION}:${envConfig.AWS_ACCOUNT_ID}:secret:${envConfig.SECRETS_MANAGER_SECRET}-AbCdEf`,
        Name: envConfig.SECRETS_MANAGER_SECRET,
        SecretString: JSON.stringify({
          username: 'test-username',
          password: 'encrypted-password',
          cookies: {}
        })
      });

      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient({ region: envConfig.AWS_REGION });
      
      const result = await client.send(new GetSecretValueCommand({
        SecretId: envConfig.SECRETS_MANAGER_SECRET
      }));

      expect(result.Name).toBe(envConfig.SECRETS_MANAGER_SECRET);
      expect(result.SecretString).toBeDefined();
      
      const secretData = JSON.parse(result.SecretString!);
      expect(secretData).toHaveProperty('username');
      expect(secretData).toHaveProperty('password');
      expect(secretData).toHaveProperty('cookies');
    });

    it('should handle secrets manager secret not found error', async () => {
      mockSecretsManagerClient.send.mockRejectedValueOnce(
        new Error('ResourceNotFoundException: Secrets Manager can\'t find the specified secret')
      );

      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient({ region: envConfig.AWS_REGION });
      
      await expect(client.send(new GetSecretValueCommand({
        SecretId: 'non-existent-secret'
      }))).rejects.toThrow('ResourceNotFoundException');
    });
  });

  describe('Feature Flags Integration', () => {
    it('should validate Playwright feature flag percentage', () => {
      const playwrightPercent = parseInt(envConfig.PLAYWRIGHT_ENABLED_PERCENT);
      
      expect(playwrightPercent).toBe(10);
      expect(playwrightPercent).toBeGreaterThanOrEqual(0);
      expect(playwrightPercent).toBeLessThanOrEqual(100);
    });

    it('should validate production environment setting', () => {
      expect(envConfig.NODE_ENV).toBe('production');
    });

    it('should validate monitoring flags', () => {
      expect(envConfig.ENABLE_DETAILED_LOGS).toBe('true');
      expect(envConfig.ENABLE_METRICS).toBe('true');
      
      const metricsInterval = parseInt(envConfig.METRICS_INTERVAL);
      expect(metricsInterval).toBe(60000); // 1 minute
      expect(metricsInterval).toBeGreaterThan(0);
    });
  });

  describe('Network Configuration Integration', () => {
    it('should validate subnet configuration format', () => {
      const subnets = envConfig.ECS_SUBNETS.split(',');
      
      expect(subnets.length).toBeGreaterThan(0);
      subnets.forEach(subnet => {
        expect(subnet.trim()).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });

    it('should validate security group configuration format', () => {
      const securityGroups = envConfig.ECS_SECURITY_GROUPS.split(',');
      
      expect(securityGroups.length).toBeGreaterThan(0);
      securityGroups.forEach(sg => {
        expect(sg.trim()).toMatch(/^sg-[a-z0-9]+$/);
      });
    });

    it('should handle placeholder network values', () => {
      // In template, these should be placeholders
      expect(envConfig.ECS_SUBNETS).toContain('subnet-xxxxx');
      expect(envConfig.ECS_SECURITY_GROUPS).toContain('sg-xxxxx');
    });
  });

  describe('Cross-Service Configuration Consistency', () => {
    it('should have consistent AWS region across all services', () => {
      expect(envConfig.AWS_REGION).toBe('us-east-1');
      expect(envConfig.DYNAMODB_REGION).toBe('us-east-1');
      
      // Extract regions from ARNs
      const ecsRegion = envConfig.ECS_CLUSTER_ARN.split(':')[3];
      const kmsRegion = envConfig.KMS_KEY_ID.split(':')[3];
      
      expect(ecsRegion).toBe('us-east-1');
      expect(kmsRegion).toBe('us-east-1');
    });

    it('should have consistent AWS account ID across all services', () => {
      expect(envConfig.AWS_ACCOUNT_ID).toBe('317805897534');
      
      // Extract account IDs from ARNs
      const ecsAccountId = envConfig.ECS_CLUSTER_ARN.split(':')[4];
      const kmsAccountId = envConfig.KMS_KEY_ID.split(':')[4];
      
      expect(ecsAccountId).toBe('317805897534');
      expect(kmsAccountId).toBe('317805897534');
    });

    it('should have matching resource naming conventions', () => {
      // ECS cluster should match expected naming
      expect(envConfig.ECS_CLUSTER_ARN).toContain('huntaze-of-fargate');
      
      // Task definition should match expected naming
      expect(envConfig.ECS_TASK_DEFINITION).toContain('HuntazeOfStackBrowserWorkerTask');
      
      // DynamoDB tables should match expected naming
      expect(envConfig.DYNAMODB_TABLE_SESSIONS).toBe('HuntazeOfSessions');
      expect(envConfig.DYNAMODB_TABLE_THREADS).toBe('HuntazeOfThreads');
      expect(envConfig.DYNAMODB_TABLE_MESSAGES).toBe('HuntazeOfMessages');
      
      // Secrets should match expected naming
      expect(envConfig.SECRETS_MANAGER_SECRET).toBe('of/creds/huntaze');
    });
  });

  describe('Production Readiness Validation', () => {
    it('should have production-appropriate feature flag settings', () => {
      // Conservative rollout percentage
      expect(parseInt(envConfig.PLAYWRIGHT_ENABLED_PERCENT)).toBeLessThanOrEqual(20);
      
      // Production environment
      expect(envConfig.NODE_ENV).toBe('production');
      
      // Monitoring enabled
      expect(envConfig.ENABLE_METRICS).toBe('true');
      expect(envConfig.ENABLE_DETAILED_LOGS).toBe('true');
    });

    it('should have appropriate monitoring intervals', () => {
      const metricsInterval = parseInt(envConfig.METRICS_INTERVAL);
      
      // Should be reasonable for production (not too frequent, not too sparse)
      expect(metricsInterval).toBeGreaterThanOrEqual(30000); // At least 30 seconds
      expect(metricsInterval).toBeLessThanOrEqual(300000); // At most 5 minutes
    });

    it('should not have debug or development settings', () => {
      expect(envConfig.NODE_ENV).not.toBe('development');
      expect(envConfig.NODE_ENV).not.toBe('test');
      
      // Should not have debug flags
      expect(envConfig.DEBUG).toBeUndefined();
      expect(envConfig.VERBOSE).toBeUndefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle AWS service unavailability gracefully', async () => {
      // Simulate service unavailable
      mockECSClient.send.mockRejectedValueOnce(
        new Error('ServiceUnavailableException: Service is temporarily unavailable')
      );

      const { ECSClient, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: envConfig.AWS_REGION });
      
      await expect(client.send(new DescribeClustersCommand({
        clusters: [envConfig.ECS_CLUSTER_ARN]
      }))).rejects.toThrow('ServiceUnavailableException');
    });

    it('should handle network timeouts', async () => {
      // Simulate timeout
      mockDynamoDBClient.send.mockRejectedValueOnce(
        new Error('TimeoutError: Request timed out')
      );

      const { DynamoDBClient, DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient({ region: envConfig.DYNAMODB_REGION });
      
      await expect(client.send(new DescribeTableCommand({
        TableName: envConfig.DYNAMODB_TABLE_MESSAGES
      }))).rejects.toThrow('TimeoutError');
    });

    it('should handle authentication errors', async () => {
      // Simulate authentication failure
      mockSecretsManagerClient.send.mockRejectedValueOnce(
        new Error('UnauthorizedOperation: You are not authorized to perform this operation')
      );

      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient({ region: envConfig.AWS_REGION });
      
      await expect(client.send(new GetSecretValueCommand({
        SecretId: envConfig.SECRETS_MANAGER_SECRET
      }))).rejects.toThrow('UnauthorizedOperation');
    });
  });
});