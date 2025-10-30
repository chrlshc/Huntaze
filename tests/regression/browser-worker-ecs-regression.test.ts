/**
 * Regression Tests for Browser Worker ECS Integration
 * Ensures that changes don't break existing functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BrowserWorkerClient, sendOfMessage } from '@/src/lib/workers/of-browser-worker';

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

describe('Browser Worker ECS Regression Tests', () => {
  let client: BrowserWorkerClient;

  beforeEach(() => {
    client = new BrowserWorkerClient();
    vi.clearAllMocks();
    
    // Set up standard environment
    process.env.ECS_CLUSTER_ARN = 'arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate';
    process.env.ECS_TASK_DEFINITION = 'HuntazeOfStackBrowserWorkerTaskCED33274:25';
    process.env.ECS_SUBNETS = 'subnet-123,subnet-456';
    process.env.ECS_SECURITY_GROUPS = 'sg-123,sg-456';
    process.env.DYNAMODB_TABLE_MESSAGES = 'HuntazeOfMessages';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing API interface for runBrowserTask', async () => {
      // Mock successful response
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
      });
      
      mockGetItemCommand.mockResolvedValueOnce({
        Item: { result: { S: JSON.stringify({ success: true }) } }
      });
      
      mockPutMetricDataCommand.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'test message' }
      };

      const result = await client.runBrowserTask(request);

      // Verify response structure hasn't changed
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.duration).toBe('number');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('should maintain existing API interface for sendOfMessage', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
      });
      
      mockGetItemCommand.mockResolvedValueOnce({
        Item: { result: { S: JSON.stringify({ success: true, messageId: 'msg-123' }) } }
      });
      
      mockPutMetricDataCommand.mockResolvedValue({});

      const result = await sendOfMessage('user-123', {
        content: { text: 'Hello' },
        conversationId: 'conv-456'
      });

      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('messageId');
      } else {
        expect(result).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling Regression', () => {
    it('should handle AWS SDK errors gracefully (regression for SDK v3 migration)', async () => {
      // Test various AWS SDK error scenarios
      const awsErrors = [
        { name: 'ThrottlingException', message: 'Rate exceeded' },
        { name: 'ServiceUnavailableException', message: 'Service unavailable' },
        { name: 'InvalidParameterValueException', message: 'Invalid parameter' },
        { name: 'ResourceNotFoundException', message: 'Resource not found' }
      ];

      for (const awsError of awsErrors) {
        const error = new Error(awsError.message);
        error.name = awsError.name;
        
        mockRunTaskCommand.mockRejectedValueOnce(error);
        mockPutMetricDataCommand.mockResolvedValue({});

        const request = {
          action: 'send' as const,
          userId: 'user-123',
          data: { content: 'test' }
        };

        const result = await client.runBrowserTask(request);

        expect(result.success).toBe(false);
        expect(result.error).toBe(awsError.message);
        expect(result.duration).toBeGreaterThan(0);
      }
    });

    it('should handle network timeouts consistently', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      
      mockRunTaskCommand.mockRejectedValueOnce(timeoutError);
      mockPutMetricDataCommand.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'test' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });
  });

  describe('Environment Configuration Regression', () => {
    it('should handle missing environment variables consistently', () => {
      // Test with completely clean environment
      const originalEnv = process.env;
      process.env = {};

      const newClient = new BrowserWorkerClient();

      // Should use default values
      expect((newClient as any).clusterArn).toBe('arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate');
      expect((newClient as any).taskDefinition).toBe('HuntazeOfStackBrowserWorkerTaskCED33274:25');
      expect((newClient as any).subnets).toEqual([]);
      expect((newClient as any).securityGroups).toEqual([]);

      process.env = originalEnv;
    });

    it('should parse comma-separated values correctly (regression for config parsing)', () => {
      process.env.ECS_SUBNETS = 'subnet-1,subnet-2,subnet-3,';
      process.env.ECS_SECURITY_GROUPS = ',sg-1,sg-2,';

      const newClient = new BrowserWorkerClient();

      // Should filter out empty strings
      expect((newClient as any).subnets).toEqual(['subnet-1', 'subnet-2', 'subnet-3']);
      expect((newClient as any).securityGroups).toEqual(['sg-1', 'sg-2']);
    });
  });

  describe('Task ID Generation Regression', () => {
    it('should generate unique task IDs consistently', async () => {
      const taskIds = new Set<string>();
      
      // Mock to capture task IDs
      mockRunTaskCommand.mockImplementation((command) => {
        const taskId = command.overrides.containerOverrides[0].environment
          .find((env: any) => env.name === 'TASK_ID')?.value;
        
        taskIds.add(taskId);
        
        return Promise.resolve({
          tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
        });
      });

      mockGetItemCommand.mockResolvedValue({
        Item: { result: { S: JSON.stringify({ success: true }) } }
      });
      
      mockPutMetricDataCommand.mockResolvedValue({});

      // Generate multiple task IDs
      const promises = Array.from({ length: 10 }, (_, i) => 
        client.runBrowserTask({
          action: 'send',
          userId: `user-${i}`,
          data: { content: 'test' }
        })
      );

      await Promise.all(promises);

      // All task IDs should be unique
      expect(taskIds.size).toBe(10);
      
      // All task IDs should match expected format
      taskIds.forEach(taskId => {
        expect(taskId).toMatch(/^task-\d+-[a-z0-9]+$/);
      });
    });
  });

  describe('Metrics Publishing Regression', () => {
    it('should publish metrics with correct namespace and format', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
      });
      
      mockGetItemCommand.mockResolvedValueOnce({
        Item: { result: { S: JSON.stringify({ success: true }) } }
      });
      
      mockPutMetricDataCommand.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'test' }
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

    it('should handle metrics publishing failures without affecting main flow', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
      });
      
      mockGetItemCommand.mockResolvedValueOnce({
        Item: { result: { S: JSON.stringify({ success: true }) } }
      });
      
      // Metrics publishing fails
      mockPutMetricDataCommand.mockRejectedValue(new Error('CloudWatch error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'test' }
      };

      const result = await client.runBrowserTask(request);

      // Main operation should still succeed
      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to publish metric:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('DynamoDB Polling Regression', () => {
    it('should handle polling timeout correctly', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
      });
      
      // Always return no result to trigger timeout
      mockGetItemCommand.mockResolvedValue({ Item: undefined });
      mockPutMetricDataCommand.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'test' }
      };

      const startTime = Date.now();
      const result = await client.runBrowserTask(request);
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Timeout waiting for task:/);
      
      // Should timeout in reasonable time (not hang indefinitely)
      expect(endTime - startTime).toBeLessThan(65000); // 60s timeout + buffer
    });

    it('should handle malformed DynamoDB responses', async () => {
      mockRunTaskCommand.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123456789012:task/test' }]
      });
      
      // Return malformed result
      mockGetItemCommand.mockResolvedValueOnce({
        Item: { result: { S: 'invalid json' } }
      });
      
      mockPutMetricDataCommand.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'user-123',
        data: { content: 'test' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({}); // Should default to empty object for invalid JSON
    });
  });
});