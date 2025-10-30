/**
 * Browser Worker Client Unit Tests
 * Tests the ECS Fargate integration for OnlyFans browser automation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserWorkerClient, sendOfMessage, browserWorkerPool } from '../../src/lib/workers/of-browser-worker';

// Mock AWS SDK clients
const mockRunTaskCommand = vi.fn();
const mockGetItemCommand = vi.fn();
const mockPutMetricDataCommand = vi.fn();

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => ({
    send: mockRunTaskCommand
  })),
  RunTaskCommand: vi.fn()
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({
    send: mockGetItemCommand
  })),
  GetItemCommand: vi.fn()
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => ({
    send: mockPutMetricDataCommand
  })),
  PutMetricDataCommand: vi.fn()
}));

describe('BrowserWorkerClient', () => {
  let client: BrowserWorkerClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.AWS_REGION = 'us-east-1';
    process.env.ECS_CLUSTER_ARN = 'arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate';
    process.env.ECS_TASK_DEFINITION = 'HuntazeOfStackBrowserWorkerTaskCED33274:25';
    process.env.ECS_SUBNETS = 'subnet-123,subnet-456';
    process.env.ECS_SECURITY_GROUPS = 'sg-123,sg-456';
    process.env.DYNAMODB_TABLE_MESSAGES = 'HuntazeOfMessages';
    
    client = new BrowserWorkerClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runBrowserTask', () => {
    it('should successfully run a browser task', async () => {
      // Mock successful ECS task start
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/test-task' }]
      });

      // Mock successful DynamoDB result
      mockGetItemCommand.mockResolvedValueOnce({
        Item: {
          result: { S: JSON.stringify({ success: true, messageId: 'msg-123' }) }
        }
      });

      // Mock CloudWatch metrics
      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Hello world' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, messageId: 'msg-123' });
      expect(result.duration).toBeGreaterThan(0);
      expect(mockRunTaskCommand).toHaveBeenCalledTimes(1);
      expect(mockPutMetricDataCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Namespace: 'Huntaze/OnlyFans/BrowserWorker',
          MetricData: expect.arrayContaining([
            expect.objectContaining({ MetricName: 'BrowserTaskSuccess' }),
            expect.objectContaining({ MetricName: 'TaskDuration' })
          ])
        })
      );
    });

    it('should handle ECS task start failure', async () => {
      mockRunTaskCommand.mockRejectedValueOnce(new Error('ECS task failed'));
      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Hello world' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ECS task failed');
      expect(result.duration).toBeGreaterThan(0);
      expect(mockPutMetricDataCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          MetricData: expect.arrayContaining([
            expect.objectContaining({ MetricName: 'BrowserTaskError' })
          ])
        })
      );
    });

    it('should handle missing network configuration', async () => {
      // Clear network config
      process.env.ECS_SUBNETS = '';
      process.env.ECS_SECURITY_GROUPS = '';
      
      const newClient = new BrowserWorkerClient();
      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Hello world' }
      };

      const result = await newClient.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ECS network configuration missing');
    });

    it('should handle task timeout', async () => {
      // Mock successful ECS task start
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/test-task' }]
      });

      // Mock DynamoDB returning no result (timeout scenario)
      mockGetItemCommand.mockResolvedValue({ Item: undefined });
      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Hello world' }
      };

      // Use a very short timeout for testing
      const originalTimeout = 60000;
      vi.spyOn(client as any, 'waitForResult').mockRejectedValueOnce(
        new Error('Timeout waiting for task: task-123')
      );

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout waiting for task');
    });

    it('should handle different action types', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/test-task' }]
      });

      mockGetItemCommand.mockResolvedValueOnce({
        Item: {
          result: { S: JSON.stringify({ success: true, loginStatus: 'authenticated' }) }
        }
      });

      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const loginRequest = {
        action: 'login' as const,
        userId: 'user-123',
        data: { credentials: 'encrypted-data' }
      };

      const result = await client.runBrowserTask(loginRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, loginStatus: 'authenticated' });
    });

    it('should handle ECS task with no tasks returned', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({ tasks: [] });
      mockPutMetricDataCommand.mockResolvedValueOnce({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'Hello world' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to start ECS task');
    });
  });

  describe('waitForResult', () => {
    it('should poll DynamoDB until result is available', async () => {
      const client = new BrowserWorkerClient();
      
      // First call returns no result, second call returns result
      mockGetItemCommand
        .mockResolvedValueOnce({ Item: undefined })
        .mockResolvedValueOnce({
          Item: {
            result: { S: JSON.stringify({ success: true, messageId: 'msg-456' }) }
          }
        });

      const result = await (client as any).waitForResult('task-123', 2000);

      expect(result).toEqual({ success: true, messageId: 'msg-456' });
      expect(mockGetItemCommand).toHaveBeenCalledTimes(2);
    });

    it('should timeout if result is not available', async () => {
      const client = new BrowserWorkerClient();
      
      // Always return no result
      mockGetItemCommand.mockResolvedValue({ Item: undefined });

      await expect((client as any).waitForResult('task-123', 100))
        .rejects.toThrow('Timeout waiting for task: task-123');
    });
  });

  describe('publishMetric', () => {
    it('should handle CloudWatch metric publishing errors gracefully', async () => {
      const client = new BrowserWorkerClient();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockPutMetricDataCommand.mockRejectedValueOnce(new Error('CloudWatch error'));

      // Should not throw
      await expect((client as any).publishMetric('TestMetric', 1, 100))
        .resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to publish metric:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});

describe('sendOfMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    process.env.AWS_REGION = 'us-east-1';
    process.env.ECS_SUBNETS = 'subnet-123';
    process.env.ECS_SECURITY_GROUPS = 'sg-123';
  });

  it('should send OnlyFans message successfully', async () => {
    mockRunTaskCommand.mockResolvedValueOnce({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/test-task' }]
    });

    mockGetItemCommand.mockResolvedValueOnce({
      Item: {
        result: { S: JSON.stringify({ success: true, messageId: 'msg-789' }) }
      }
    });

    mockPutMetricDataCommand.mockResolvedValueOnce({});

    const message = {
      content: { text: 'Hello from Huntaze!' },
      conversationId: 'conv-123'
    };

    const result = await sendOfMessage('account-123', message);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-789');
    expect(result.error).toBeUndefined();
  });

  it('should handle message sending failure', async () => {
    mockRunTaskCommand.mockRejectedValueOnce(new Error('Network error'));
    mockPutMetricDataCommand.mockResolvedValueOnce({});

    const message = {
      content: { text: 'Hello from Huntaze!' },
      conversationId: 'conv-123'
    };

    const result = await sendOfMessage('account-123', message);

    expect(result.success).toBe(false);
    expect(result.messageId).toBeUndefined();
    expect(result.error).toBe('Network error');
  });

  it('should handle message with missing content', async () => {
    mockRunTaskCommand.mockResolvedValueOnce({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/test-task' }]
    });

    mockGetItemCommand.mockResolvedValueOnce({
      Item: {
        result: { S: JSON.stringify({ success: true, messageId: 'msg-empty' }) }
      }
    });

    mockPutMetricDataCommand.mockResolvedValueOnce({});

    const message = {
      conversationId: 'conv-123'
      // No content
    };

    const result = await sendOfMessage('account-123', message);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-empty');
  });
});

describe('browserWorkerPool', () => {
  it('should provide closeAll method', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await browserWorkerPool.closeAll();
    
    expect(consoleSpy).toHaveBeenCalledWith('Browser worker pool cleanup (no-op for ECS)');
    consoleSpy.mockRestore();
  });
});

describe('Environment Configuration', () => {
  it('should use default values when environment variables are not set', () => {
    // Clear environment variables
    delete process.env.AWS_REGION;
    delete process.env.ECS_CLUSTER_ARN;
    delete process.env.ECS_TASK_DEFINITION;
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