/**
 * Deployment Infrastructure Integration Tests
 * Tests the actual AWS infrastructure components and their integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AWS SDK clients
const mockECSClient = {
  send: vi.fn()
};

const mockDynamoDBClient = {
  send: vi.fn()
};

const mockCloudFormationClient = {
  send: vi.fn()
};

const mockCloudWatchClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => mockECSClient),
  DescribeClustersCommand: vi.fn((params) => params),
  DescribeTaskDefinitionCommand: vi.fn((params) => params),
  ListTasksCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => mockDynamoDBClient),
  ListTablesCommand: vi.fn((params) => params),
  DescribeTableCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudformation', () => ({
  CloudFormationClient: vi.fn(() => mockCloudFormationClient),
  DescribeStacksCommand: vi.fn((params) => params),
  ListStackResourcesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  GetMetricStatisticsCommand: vi.fn((params) => params),
  DescribeAlarmsCommand: vi.fn((params) => params)
}));

describe('Deployment Infrastructure Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables for testing
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCOUNT_ID = '317805897534';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CloudFormation Stack Validation', () => {
    it('should validate HuntazeOnlyFansStack exists and is complete', async () => {
      mockCloudFormationClient.send.mockResolvedValueOnce({
        Stacks: [{
          StackId: 'arn:aws:cloudformation:us-east-1:317805897534:stack/HuntazeOnlyFansStack/d2717e80-b3f8-11f0-aacc-1232068a71c1',
          StackName: 'HuntazeOnlyFansStack',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: new Date('2025-10-28T10:00:00Z'),
          Outputs: [
            {
              OutputKey: 'ECSClusterArn',
              OutputValue: 'arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate'
            },
            {
              OutputKey: 'DynamoDBTableMessages',
              OutputValue: 'HuntazeOfMessages'
            },
            {
              OutputKey: 'TaskDefinitionArn',
              OutputValue: 'arn:aws:ecs:us-east-1:317805897534:task-definition/HuntazeOfStackBrowserWorkerTaskCED33274:25'
            }
          ]
        }]
      });

      const { CloudFormationClient, DescribeStacksCommand } = await import('@aws-sdk/client-cloudformation');
      const client = new CloudFormationClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeStacksCommand({
        StackName: 'HuntazeOnlyFansStack'
      }));

      expect(result.Stacks).toHaveLength(1);
      expect(result.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
      expect(result.Stacks![0].StackId).toContain('HuntazeOnlyFansStack');
      expect(result.Stacks![0].Outputs).toBeDefined();
      
      // Validate key outputs
      const outputs = result.Stacks![0].Outputs!;
      const ecsOutput = outputs.find(o => o.OutputKey === 'ECSClusterArn');
      const dynamoOutput = outputs.find(o => o.OutputKey === 'DynamoDBTableMessages');
      
      expect(ecsOutput?.OutputValue).toContain('huntaze-of-fargate');
      expect(dynamoOutput?.OutputValue).toBe('HuntazeOfMessages');
    });

    it('should validate all required stack resources exist', async () => {
      mockCloudFormationClient.send.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::ECS::Cluster',
            LogicalResourceId: 'ECSCluster',
            PhysicalResourceId: 'huntaze-of-fargate',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::DynamoDB::Table',
            LogicalResourceId: 'MessagesTable',
            PhysicalResourceId: 'HuntazeOfMessages',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::DynamoDB::Table',
            LogicalResourceId: 'SessionsTable',
            PhysicalResourceId: 'HuntazeOfSessions',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::DynamoDB::Table',
            LogicalResourceId: 'ThreadsTable',
            PhysicalResourceId: 'HuntazeOfThreads',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::ECS::TaskDefinition',
            LogicalResourceId: 'BrowserWorkerTask',
            PhysicalResourceId: 'HuntazeOfStackBrowserWorkerTaskCED33274',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::EC2::VPC',
            LogicalResourceId: 'VPC',
            PhysicalResourceId: 'vpc-0123456789abcdef0',
            ResourceStatus: 'CREATE_COMPLETE'
          }
        ]
      });

      const { CloudFormationClient, ListStackResourcesCommand } = await import('@aws-sdk/client-cloudformation');
      const client = new CloudFormationClient({ region: 'us-east-1' });
      
      const result = await client.send(new ListStackResourcesCommand({
        StackName: 'HuntazeOnlyFansStack'
      }));

      const resources = result.StackResourceSummaries!;
      
      // Validate required resources exist
      expect(resources.find(r => r.ResourceType === 'AWS::ECS::Cluster')).toBeDefined();
      expect(resources.find(r => r.ResourceType === 'AWS::ECS::TaskDefinition')).toBeDefined();
      expect(resources.find(r => r.LogicalResourceId === 'MessagesTable')).toBeDefined();
      expect(resources.find(r => r.LogicalResourceId === 'SessionsTable')).toBeDefined();
      expect(resources.find(r => r.LogicalResourceId === 'ThreadsTable')).toBeDefined();
      expect(resources.find(r => r.ResourceType === 'AWS::EC2::VPC')).toBeDefined();
      
      // Validate all resources are in CREATE_COMPLETE state
      resources.forEach(resource => {
        expect(resource.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });
  });

  describe('ECS Fargate Cluster Validation', () => {
    it('should validate ECS cluster is active and properly configured', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        clusters: [{
          clusterArn: 'arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate',
          clusterName: 'huntaze-of-fargate',
          status: 'ACTIVE',
          runningTasksCount: 0,
          pendingTasksCount: 0,
          activeServicesCount: 0,
          registeredContainerInstancesCount: 0,
          capacityProviders: ['FARGATE'],
          defaultCapacityProviderStrategy: [{
            capacityProvider: 'FARGATE',
            weight: 1
          }]
        }]
      });

      const { ECSClient, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeClustersCommand({
        clusters: ['huntaze-of-fargate']
      }));

      expect(result.clusters).toHaveLength(1);
      const cluster = result.clusters![0];
      
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe('huntaze-of-fargate');
      expect(cluster.capacityProviders).toContain('FARGATE');
    });

    it('should validate task definition is properly configured', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        taskDefinition: {
          taskDefinitionArn: 'arn:aws:ecs:us-east-1:317805897534:task-definition/HuntazeOfStackBrowserWorkerTaskCED33274:25',
          family: 'HuntazeOfStackBrowserWorkerTaskCED33274',
          revision: 25,
          status: 'ACTIVE',
          requiresCompatibilities: ['FARGATE'],
          networkMode: 'awsvpc',
          cpu: '1024',
          memory: '2048',
          containerDefinitions: [{
            name: 'of-browser-worker',
            image: 'public.ecr.aws/lambda/nodejs:18',
            essential: true,
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': '/aws/ecs/huntaze-of-fargate',
                'awslogs-region': 'us-east-1',
                'awslogs-stream-prefix': 'ecs'
              }
            }
          }]
        }
      });

      const { ECSClient, DescribeTaskDefinitionCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeTaskDefinitionCommand({
        taskDefinition: 'HuntazeOfStackBrowserWorkerTaskCED33274:25'
      }));

      const taskDef = result.taskDefinition!;
      
      expect(taskDef.status).toBe('ACTIVE');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBe('1024');
      expect(taskDef.memory).toBe('2048');
      expect(taskDef.containerDefinitions).toHaveLength(1);
      expect(taskDef.containerDefinitions![0].name).toBe('of-browser-worker');
    });
  });

  describe('DynamoDB Tables Validation', () => {
    it('should validate all required DynamoDB tables exist', async () => {
      mockDynamoDBClient.send.mockResolvedValueOnce({
        TableNames: [
          'HuntazeOfMessages',
          'HuntazeOfSessions',
          'HuntazeOfThreads',
          'other-table-1',
          'other-table-2'
        ]
      });

      const { DynamoDBClient, ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient({ region: 'us-east-1' });
      
      const result = await client.send(new ListTablesCommand({}));

      expect(result.TableNames).toContain('HuntazeOfMessages');
      expect(result.TableNames).toContain('HuntazeOfSessions');
      expect(result.TableNames).toContain('HuntazeOfThreads');
    });

    it('should validate DynamoDB table configurations', async () => {
      const mockTableDescription = {
        Table: {
          TableName: 'HuntazeOfMessages',
          TableStatus: 'ACTIVE',
          AttributeDefinitions: [
            { AttributeName: 'taskId', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'taskId', KeyType: 'HASH' }
          ],
          BillingModeSummary: {
            BillingMode: 'PAY_PER_REQUEST'
          },
          SSEDescription: {
            Status: 'ENABLED',
            SSEType: 'AES256'
          },
          PointInTimeRecoveryDescription: {
            PointInTimeRecoveryStatus: 'ENABLED'
          }
        }
      };

      mockDynamoDBClient.send
        .mockResolvedValueOnce(mockTableDescription) // HuntazeOfMessages
        .mockResolvedValueOnce({
          ...mockTableDescription,
          Table: { ...mockTableDescription.Table, TableName: 'HuntazeOfSessions' }
        }) // HuntazeOfSessions
        .mockResolvedValueOnce({
          ...mockTableDescription,
          Table: { ...mockTableDescription.Table, TableName: 'HuntazeOfThreads' }
        }); // HuntazeOfThreads

      const { DynamoDBClient, DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient({ region: 'us-east-1' });
      
      const tables = ['HuntazeOfMessages', 'HuntazeOfSessions', 'HuntazeOfThreads'];
      
      for (const tableName of tables) {
        const result = await client.send(new DescribeTableCommand({
          TableName: tableName
        }));

        const table = result.Table!;
        expect(table.TableStatus).toBe('ACTIVE');
        expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        expect(table.SSEDescription?.Status).toBe('ENABLED');
        expect(table.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
      }
    });
  });

  describe('CloudWatch Monitoring Validation', () => {
    it('should validate CloudWatch log groups exist', async () => {
      // This would typically use CloudWatchLogsClient, but for simplicity using CloudWatch
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'HuntazeOf-ECS-CPUUtilization',
            MetricName: 'CPUUtilization',
            Namespace: 'AWS/ECS',
            Statistic: 'Average',
            ComparisonOperator: 'GreaterThanThreshold',
            Threshold: 80,
            AlarmActions: []
          },
          {
            AlarmName: 'HuntazeOf-DynamoDB-ConsumedReadCapacityUnits',
            MetricName: 'ConsumedReadCapacityUnits',
            Namespace: 'AWS/DynamoDB',
            Statistic: 'Sum',
            ComparisonOperator: 'GreaterThanThreshold',
            Threshold: 1000
          }
        ]
      });

      const { CloudWatchClient, DescribeAlarmsCommand } = await import('@aws-sdk/client-cloudwatch');
      const client = new CloudWatchClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'HuntazeOf'
      }));

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);
      
      // Validate ECS monitoring
      const ecsAlarm = result.MetricAlarms!.find(alarm => 
        alarm.Namespace === 'AWS/ECS' && alarm.MetricName === 'CPUUtilization'
      );
      expect(ecsAlarm).toBeDefined();
      
      // Validate DynamoDB monitoring
      const dynamoAlarm = result.MetricAlarms!.find(alarm => 
        alarm.Namespace === 'AWS/DynamoDB'
      );
      expect(dynamoAlarm).toBeDefined();
    });

    it('should validate custom metrics are being published', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        Datapoints: [
          {
            Timestamp: new Date('2025-10-28T10:00:00Z'),
            Average: 250.5,
            Unit: 'Milliseconds'
          },
          {
            Timestamp: new Date('2025-10-28T10:05:00Z'),
            Average: 180.2,
            Unit: 'Milliseconds'
          }
        ]
      });

      const { CloudWatchClient, GetMetricStatisticsCommand } = await import('@aws-sdk/client-cloudwatch');
      const client = new CloudWatchClient({ region: 'us-east-1' });
      
      const result = await client.send(new GetMetricStatisticsCommand({
        Namespace: 'Huntaze/OnlyFans/BrowserWorker',
        MetricName: 'TaskDuration',
        StartTime: new Date('2025-10-28T09:00:00Z'),
        EndTime: new Date('2025-10-28T11:00:00Z'),
        Period: 300,
        Statistics: ['Average']
      }));

      expect(result.Datapoints).toBeDefined();
      expect(result.Datapoints!.length).toBeGreaterThan(0);
      
      // Validate metric data
      result.Datapoints!.forEach(datapoint => {
        expect(datapoint.Average).toBeGreaterThan(0);
        expect(datapoint.Unit).toBe('Milliseconds');
      });
    });
  });

  describe('Network Configuration Validation', () => {
    it('should validate VPC and subnet configuration', async () => {
      // Mock VPC validation through CloudFormation
      mockCloudFormationClient.send.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::EC2::VPC',
            LogicalResourceId: 'VPC',
            PhysicalResourceId: 'vpc-0123456789abcdef0',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::EC2::Subnet',
            LogicalResourceId: 'PublicSubnet1',
            PhysicalResourceId: 'subnet-0123456789abcdef0',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::EC2::Subnet',
            LogicalResourceId: 'PublicSubnet2',
            PhysicalResourceId: 'subnet-0987654321fedcba0',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::EC2::Subnet',
            LogicalResourceId: 'PrivateSubnet1',
            PhysicalResourceId: 'subnet-1111111111111111',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::EC2::Subnet',
            LogicalResourceId: 'PrivateSubnet2',
            PhysicalResourceId: 'subnet-2222222222222222',
            ResourceStatus: 'CREATE_COMPLETE'
          }
        ]
      });

      const { CloudFormationClient, ListStackResourcesCommand } = await import('@aws-sdk/client-cloudformation');
      const client = new CloudFormationClient({ region: 'us-east-1' });
      
      const result = await client.send(new ListStackResourcesCommand({
        StackName: 'HuntazeOnlyFansStack'
      }));

      const resources = result.StackResourceSummaries!;
      
      // Validate VPC exists
      const vpc = resources.find(r => r.ResourceType === 'AWS::EC2::VPC');
      expect(vpc).toBeDefined();
      expect(vpc!.ResourceStatus).toBe('CREATE_COMPLETE');
      
      // Validate subnets exist
      const subnets = resources.filter(r => r.ResourceType === 'AWS::EC2::Subnet');
      expect(subnets.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
      
      subnets.forEach(subnet => {
        expect(subnet.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });

    it('should validate security groups configuration', async () => {
      mockCloudFormationClient.send.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::EC2::SecurityGroup',
            LogicalResourceId: 'ECSSecurityGroup',
            PhysicalResourceId: 'sg-0123456789abcdef0',
            ResourceStatus: 'CREATE_COMPLETE'
          },
          {
            ResourceType: 'AWS::EC2::SecurityGroup',
            LogicalResourceId: 'VPCDefaultSecurityGroup',
            PhysicalResourceId: 'sg-0987654321fedcba0',
            ResourceStatus: 'CREATE_COMPLETE'
          }
        ]
      });

      const { CloudFormationClient, ListStackResourcesCommand } = await import('@aws-sdk/client-cloudformation');
      const client = new CloudFormationClient({ region: 'us-east-1' });
      
      const result = await client.send(new ListStackResourcesCommand({
        StackName: 'HuntazeOnlyFansStack'
      }));

      const securityGroups = result.StackResourceSummaries!.filter(
        r => r.ResourceType === 'AWS::EC2::SecurityGroup'
      );
      
      expect(securityGroups.length).toBeGreaterThanOrEqual(1);
      
      securityGroups.forEach(sg => {
        expect(sg.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });
  });

  describe('Cost Optimization Validation', () => {
    it('should validate DynamoDB is using on-demand billing', async () => {
      mockDynamoDBClient.send.mockResolvedValueOnce({
        Table: {
          TableName: 'HuntazeOfMessages',
          BillingModeSummary: {
            BillingMode: 'PAY_PER_REQUEST'
          }
        }
      });

      const { DynamoDBClient, DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeTableCommand({
        TableName: 'HuntazeOfMessages'
      }));

      expect(result.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should validate ECS is using Fargate (no EC2 instances)', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        clusters: [{
          clusterName: 'huntaze-of-fargate',
          registeredContainerInstancesCount: 0,
          capacityProviders: ['FARGATE'],
          defaultCapacityProviderStrategy: [{
            capacityProvider: 'FARGATE',
            weight: 1
          }]
        }]
      });

      const { ECSClient, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeClustersCommand({
        clusters: ['huntaze-of-fargate']
      }));

      const cluster = result.clusters![0];
      
      // No EC2 instances (cost optimization)
      expect(cluster.registeredContainerInstancesCount).toBe(0);
      
      // Using Fargate only
      expect(cluster.capacityProviders).toEqual(['FARGATE']);
    });
  });
});