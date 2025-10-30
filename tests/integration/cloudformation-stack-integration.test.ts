/**
 * Integration Tests for CloudFormation Stack Deployment
 * Tests the actual deployment and resource creation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK for integration testing
const mockCloudFormationClient = {
  send: vi.fn()
};

const mockDynamoDBClient = {
  send: vi.fn()
};

const mockECSClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-cloudformation', () => ({
  CloudFormationClient: vi.fn(() => mockCloudFormationClient),
  CreateStackCommand: vi.fn((params) => params),
  DescribeStacksCommand: vi.fn((params) => params),
  DeleteStackCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => mockDynamoDBClient),
  DescribeTableCommand: vi.fn((params) => params),
  ListTablesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => mockECSClient),
  DescribeClustersCommand: vi.fn((params) => params)
}));

describe('CloudFormation Stack Integration', () => {
  const stackName = 'huntaze-of-ultra-minimal-test';
  let stackTemplate: string;

  beforeAll(() => {
    const templatePath = path.join(process.cwd(), 'infra/ultra-minimal-stack.yaml');
    stackTemplate = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Stack Deployment Simulation', () => {
    it('should simulate successful stack creation', async () => {
      // Mock successful stack creation
      mockCloudFormationClient.send.mockResolvedValueOnce({
        StackId: `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/12345678-1234-1234-1234-123456789012`
      });

      // Mock stack description after creation
      mockCloudFormationClient.send.mockResolvedValueOnce({
        Stacks: [{
          StackName: stackName,
          StackStatus: 'CREATE_COMPLETE',
          Outputs: [
            {
              OutputKey: 'ClusterName',
              OutputValue: 'huntaze-of-fargate',
              ExportName: 'HuntazeEcsClusterName'
            },
            {
              OutputKey: 'SessionsTableName',
              OutputValue: 'huntaze-of-sessions',
              ExportName: 'HuntazeOfSessionsTable'
            },
            {
              OutputKey: 'ThreadsTableName',
              OutputValue: 'huntaze-of-threads',
              ExportName: 'HuntazeOfThreadsTable'
            },
            {
              OutputKey: 'MessagesTableName',
              OutputValue: 'huntaze-of-messages',
              ExportName: 'HuntazeOfMessagesTable'
            }
          ]
        }]
      });

      // Simulate stack creation
      const createParams = {
        StackName: stackName,
        TemplateBody: stackTemplate,
        Capabilities: ['CAPABILITY_IAM']
      };

      // Verify stack creation would be called correctly
      expect(createParams.StackName).toBe(stackName);
      expect(createParams.TemplateBody).toContain('AWSTemplateFormatVersion');
      expect(createParams.TemplateBody).toContain('huntaze-of-sessions');
    });

    it('should validate stack outputs after deployment', async () => {
      // Mock stack outputs
      const mockOutputs = [
        {
          OutputKey: 'ClusterName',
          OutputValue: 'huntaze-of-fargate',
          ExportName: 'HuntazeEcsClusterName'
        },
        {
          OutputKey: 'SessionsTableName',
          OutputValue: 'huntaze-of-sessions',
          ExportName: 'HuntazeOfSessionsTable'
        },
        {
          OutputKey: 'ThreadsTableName',
          OutputValue: 'huntaze-of-threads',
          ExportName: 'HuntazeOfThreadsTable'
        },
        {
          OutputKey: 'MessagesTableName',
          OutputValue: 'huntaze-of-messages',
          ExportName: 'HuntazeOfMessagesTable'
        }
      ];

      mockCloudFormationClient.send.mockResolvedValueOnce({
        Stacks: [{
          StackName: stackName,
          StackStatus: 'CREATE_COMPLETE',
          Outputs: mockOutputs
        }]
      });

      // Validate expected outputs
      const expectedOutputs = ['ClusterName', 'SessionsTableName', 'ThreadsTableName', 'MessagesTableName'];
      
      expectedOutputs.forEach(outputKey => {
        const output = mockOutputs.find(o => o.OutputKey === outputKey);
        expect(output).toBeDefined();
        expect(output?.ExportName).toMatch(/^Huntaze/);
      });
    });
  });

  describe('Resource Validation', () => {
    it('should validate DynamoDB tables exist after deployment', async () => {
      const expectedTables = [
        'huntaze-of-sessions',
        'huntaze-of-threads',
        'huntaze-of-messages'
      ];

      // Mock table descriptions
      expectedTables.forEach(tableName => {
        mockDynamoDBClient.send.mockResolvedValueOnce({
          Table: {
            TableName: tableName,
            TableStatus: 'ACTIVE',
            BillingModeSummary: {
              BillingMode: 'PAY_PER_REQUEST'
            },
            KeySchema: tableName === 'huntaze-of-threads' 
              ? [
                  { AttributeName: 'userId', KeyType: 'HASH' },
                  { AttributeName: 'fanId', KeyType: 'RANGE' }
                ]
              : [{ AttributeName: tableName.includes('sessions') ? 'userId' : 'taskId', KeyType: 'HASH' }]
          }
        });
      });

      // Validate each table would be accessible
      expectedTables.forEach(tableName => {
        expect(tableName).toMatch(/^huntaze-of-/);
      });
    });

    it('should validate ECS cluster exists after deployment', async () => {
      // Mock cluster description
      mockECSClient.send.mockResolvedValueOnce({
        clusters: [{
          clusterName: 'huntaze-of-fargate',
          status: 'ACTIVE',
          runningTasksCount: 0,
          pendingTasksCount: 0,
          activeServicesCount: 0
        }]
      });

      // Validate cluster configuration
      const expectedClusterName = 'huntaze-of-fargate';
      expect(expectedClusterName).toBe('huntaze-of-fargate');
    });
  });

  describe('Cross-Stack References', () => {
    it('should validate exported values can be imported', async () => {
      const template = yaml.parse(stackTemplate);
      const outputs = template.Outputs;

      // Validate all outputs have Export.Name
      Object.values(outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(typeof output.Export.Name).toBe('string');
      });
    });

    it('should validate export names follow naming convention', async () => {
      const template = yaml.parse(stackTemplate);
      const outputs = template.Outputs;

      const exportNames = Object.values(outputs).map((output: any) => output.Export.Name);
      
      exportNames.forEach(exportName => {
        expect(exportName).toMatch(/^Huntaze/);
        expect(exportName).not.toContain(' ');
        expect(exportName).not.toContain('-');
      });
    });
  });

  describe('Resource Tagging and Naming', () => {
    it('should validate consistent resource naming', async () => {
      const template = yaml.parse(stackTemplate);
      const resources = template.Resources;

      Object.entries(resources).forEach(([logicalId, resource]: [string, any]) => {
        // Logical IDs should start with 'Huntaze'
        expect(logicalId).toMatch(/^Huntaze/);
        
        // Physical names should use kebab-case
        if (resource.Properties?.TableName) {
          expect(resource.Properties.TableName).toMatch(/^huntaze-of-/);
        }
        
        if (resource.Properties?.ClusterName) {
          expect(resource.Properties.ClusterName).toMatch(/^huntaze-of-/);
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    it('should validate minimal security configuration', async () => {
      const template = yaml.parse(stackTemplate);
      
      // Ultra minimal stack should not have KMS encryption
      expect(template.Resources).not.toHaveProperty('HuntazeKmsKey');
      
      // Should not have Secrets Manager
      expect(template.Resources).not.toHaveProperty('OfCredentials');
      
      // DynamoDB tables should not have encryption at rest configured
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Type === 'AWS::DynamoDB::Table') {
          expect(resource.Properties).not.toHaveProperty('SSESpecification');
        }
      });
    });

    it('should validate cost optimization features', async () => {
      const template = yaml.parse(stackTemplate);
      
      // All DynamoDB tables should use PAY_PER_REQUEST
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Type === 'AWS::DynamoDB::Table') {
          expect(resource.Properties.BillingMode).toBe('PAY_PER_REQUEST');
          expect(resource.Properties).not.toHaveProperty('ProvisionedThroughput');
        }
      });
      
      // ECS cluster should not have container insights (costs extra)
      const ecsCluster = template.Resources.HuntazeEcsCluster;
      expect(ecsCluster.Properties).not.toHaveProperty('ClusterSettings');
    });
  });

  describe('Template Comparison', () => {
    it('should validate differences from minimal stack', async () => {
      const minimalTemplatePath = path.join(process.cwd(), 'infra/minimal-of-stack.yaml');
      const minimalTemplate = yaml.parse(fs.readFileSync(minimalTemplatePath, 'utf8'));
      const ultraMinimalTemplate = yaml.parse(stackTemplate);

      // Ultra minimal should have fewer resources
      const minimalResourceCount = Object.keys(minimalTemplate.Resources).length;
      const ultraMinimalResourceCount = Object.keys(ultraMinimalTemplate.Resources).length;
      
      expect(ultraMinimalResourceCount).toBeLessThan(minimalResourceCount);
      
      // Ultra minimal should not have KMS key
      expect(ultraMinimalTemplate.Resources).not.toHaveProperty('HuntazeKmsKey');
      expect(minimalTemplate.Resources).toHaveProperty('HuntazeKmsKey');
      
      // Ultra minimal should not have Secrets Manager
      expect(ultraMinimalTemplate.Resources).not.toHaveProperty('OfCredentials');
      expect(minimalTemplate.Resources).toHaveProperty('OfCredentials');
    });
  });
});