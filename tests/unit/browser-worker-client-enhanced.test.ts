/**
 * Enhanced Tests for Browser Worker Client
 * Tests the ECS Fargate integration and AWS SDK interactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BrowserWorkerClient, sendOfMessage, browserWorkerPool } from '@/src/lib/workers/of-browser-worker';

// Mock AWS SDK clients
const mockRunTaskCommand = vi.fn();
const mockGetItemCommand = vi.fn();
const mockPutMetricDataCommand = vi.fn();

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => ({
    send: mockRunTaskCommand
  })),
  RunTaskCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({
    send: mockGetItemCommand
  })),
  GetItemCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => ({
    send: mockPutMetricDataCommand
  })),
  PutMetricDataCommand: vi.fn((params) => params)
}));

describe('BrowserWorkerClient', () => {
  let client: BrowserWorkerClient;
  
  beforeEach(() => {
    client = new BrowserWorkerClient();
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.ECS_CLUSTER_ARN = 'arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster';
    process.env.ECS_TASK_DEFINITION = 'test-task-def:1';
    process.env.ECS_SUBNETS = 'subnet-123,subnet-456';
    process.env.ECS_SECURITY_GROUPS = 'sg-123,sg-456';
    process.env.DYNAMODB_TABLE_MESSAGES = 'test-messages-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runBrowserTask', () => {
    it('should successfully run a browser task', async () => {
      // Mock successful ECS task start
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
        }]
      });

      // Mock successful DynamoDB result retrieval
      mockGetItemCommand.mockResolvedValueOnce({
        Item: {
          result: { S: JSON.stringify({ success: true, messageId: 'msg-123' }) }
        }
      });

      // Mock successful CloudWatch metrics
      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Test message', conversationId: 'conv-456' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, messageId: 'msg-123' });
      expect(result.duration).toBeGreaterThan(0);
      
      // Verify ECS task was started with correct parameters
      expect(mockRunTaskCommand).toHaveBeenCalledWith({
        cluster: 'arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster',
        taskDefinition: 'test-task-def:1',
        launchType: 'FARGATE',
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: ['subnet-123', 'subnet-456'],
            securityGroups: ['sg-123', 'sg-456'],
            assignPublicIp: 'ENABLED'
          }
        },
        overrides: {
          containerOverrides: [{
            name: 'of-browser-worker',
            environment: [
              { name: 'TASK_ID', value: expect.stringMatching(/^task-\d+-[a-z0-9]+$/) },
              { name: 'ACTION', value: 'send' },
              { name: 'USER_ID', value: 'user-123' },
              { name: 'CONTENT_TEXT', value: 'Test message' }
            ]
          }]
        }
      });
    });

    it('should handle ECS task start failure', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [] // No tasks returned
      });

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Test message' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to start ECS task');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle missing network configuration', async () => {
      // Clear network configuration
      process.env.ECS_SUBNETS = '';
      process.env.ECS_SECURITY_GROUPS = '';
      
      const newClient = new BrowserWorkerClient();
      
      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Test message' }
      };

      const result = await newClient.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ECS network configuration missing');
    });

    it('should handle DynamoDB timeout', async () => {
      // Mock successful ECS task start
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
        }]
      });

      // Mock DynamoDB returning no result (timeout scenario)
      mockGetItemCommand.mockResolvedValue({
        Item: undefined
      });

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Test message' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Timeout waiting for task:/);
    });

    it('should handle different action types', async () => {
      const actions = ['send', 'login', 'sync'] as const;
      
      for (const action of actions) {
        mockRunTaskCommand.mockResolvedValueOnce({
          tasks: [{
            taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
          }]
        });

        mockGetItemCommand.mockResolvedValueOnce({
          Item: {
            result: { S: JSON.stringify({ success: true }) }
          }
        });

        const request = {
          action,
          userId: 'user-123',
          data: { content: 'Test content' }
        };

        const result = await client.runBrowserTask(request);
        expect(result.success).toBe(true);
      }
    });

    it('should publish metrics on success and failure', async () => {
      // Test success case
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
        }]
      });

      mockGetItemCommand.mockResolvedValueOnce({
        Item: {
          result: { S: JSON.stringify({ success: true }) }
        }
      });

      mockPutMetricDataCommand.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Test message' }
      };

      await client.runBrowserTask(request);

      expect(mockPutMetricDataCommand).toHaveBeenCalledWith({
        Namespace: 'Huntaze/OnlyFans/BrowserWorker',
        MetricData: [
          {
            MetricName: 'BrowserTaskSuccess',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date)
          },
          {
            MetricName: 'TaskDuration',
            Value: expect.any(Number),
            Unit: 'Milliseconds',
            Timestamp: expect.any(Date)
          }
        ]
      });
    });

    it('should handle CloudWatch metrics failure gracefully', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
        }]
      });

      mockGetItemCommand.mockResolvedValueOnce({
        Item: {
          result: { S: JSON.stringify({ success: true }) }
        }
      });

      // Mock CloudWatch failure
      mockPutMetricDataCommand.mockRejectedValue(new Error('CloudWatch error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Test message' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true); // Should still succeed despite metrics failure
      expect(consoleSpy).toHaveBeenCalledWith('Failed to publish metric:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('waitForResult', () => {
    it('should poll DynamoDB until result is available', async () => {
      // First call returns no result, second call returns result
      mockGetItemCommand
        .mockResolvedValueOnce({ Item: undefined })
        .mockResolvedValueOnce({
          Item: {
            result: { S: JSON.stringify({ success: true, data: 'test' }) }
          }
        });

      const result = await (client as any).waitForResult('test-task-id', 5000);

      expect(result).toEqual({ success: true, data: 'test' });
      expect(mockGetItemCommand).toHaveBeenCalledTimes(2);
    });
  });
});

describe('sendOfMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ECS_SUBNETS = 'subnet-123';
    process.env.ECS_SECURITY_GROUPS = 'sg-123';
  });

  it('should send message successfully', async () => {
    mockRunTaskCommand.mockResolvedValueOnce({
      tasks: [{
        taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
      }]
    });

    mockGetItemCommand.mockResolvedValueOnce({
      Item: {
        result: { S: JSON.stringify({ success: true, messageId: 'msg-456' }) }
      }
    });

    mockPutMetricDataCommand.mockResolvedValue({});

    const result = await sendOfMessage('user-123', {
      content: { text: 'Hello world' },
      conversationId: 'conv-789'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-456');
    expect(result.error).toBeUndefined();
  });

  it('should handle message send failure', async () => {
    mockRunTaskCommand.mockRejectedValueOnce(new Error('ECS error'));
    mockPutMetricDataCommand.mockResolvedValue({});

    const result = await sendOfMessage('user-123', {
      content: { text: 'Hello world' },
      conversationId: 'conv-789'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('ECS error');
    expect(result.messageId).toBeUndefined();
  });

  it('should handle missing content gracefully', async () => {
    mockRunTaskCommand.mockResolvedValueOnce({
      tasks: [{
        taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test-task'
      }]
    });

    mockGetItemCommand.mockResolvedValueOnce({
      Item: {
        result: { S: JSON.stringify({ success: true }) }
      }
    });

    mockPutMetricDataCommand.mockResolvedValue({});

    const result = await sendOfMessage('user-123', {
      conversationId: 'conv-789'
    });

    expect(result.success).toBe(true);
  });
});

describe('browserWorkerPool', () => {
  it('should have closeAll method', () => {
    expect(browserWorkerPool).toHaveProperty('closeAll');
    expect(typeof browserWorkerPool.closeAll).toBe('function');
  });

  it('should handle closeAll gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await browserWorkerPool.closeAll();
    
    expect(consoleSpy).toHaveBeenCalledWith('Browser worker pool cleanup (no-op for ECS)');
    consoleSpy.mockRestore();
  });
});

describe('Environment Configuration', () => {
  it('should use default values when environment variables are missing', () => {
    // Clear environment variables
    delete process.env.ECS_CLUSTER_ARN;
    delete process.env.ECS_TASK_DEFINITION;
    delete process.env.AWS_REGION;
    delete process.env.DYNAMODB_TABLE_MESSAGES;

    const client = new BrowserWorkerClient();

    // Access private properties for testing
    expect((client as any).clusterArn).toBe('arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate');
    expect((client as any).taskDefinition).toBe('HuntazeOfStackBrowserWorkerTaskCED33274:25');
  });

  it('should parse subnet and security group lists correctly', () => {
    process.env.ECS_SUBNETS = 'subnet-1,subnet-2,subnet-3';
    process.env.ECS_SECURITY_GROUPS = 'sg-1,sg-2';

    const client = new BrowserWorkerClient();

    expect((client as any).subnets).toEqual(['subnet-1', 'subnet-2', 'subnet-3']);
    expect((client as any).securityGroups).toEqual(['sg-1', 'sg-2']);
  });

  it('should handle empty subnet and security group strings', () => {
    process.env.ECS_SUBNETS = '';
    process.env.ECS_SECURITY_GROUPS = '';

    const client = new BrowserWorkerClient();

    expect((client as any).subnets).toEqual([]);
    expect((client as any).securityGroups).toEqual([]);
  });
});