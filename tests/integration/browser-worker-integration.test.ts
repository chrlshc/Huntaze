/**
 * Browser Worker Integration Tests
 * Tests the full ECS Fargate + DynamoDB + CloudWatch integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserWorkerClient } from '../../src/lib/workers/of-browser-worker';

// Mock AWS SDK with more realistic responses
const mockECSClient = {
  send: vi.fn()
};

const mockDynamoDBClient = {
  send: vi.fn()
};

const mockCloudWatchClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => mockECSClient),
  RunTaskCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => mockDynamoDBClient),
  GetItemCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  PutMetricDataCommand: vi.fn((params) => params)
}));

describe('Browser Worker Integration Tests', () => {
  let client: BrowserWorkerClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up realistic environment
    process.env.AWS_REGION = 'us-east-1';
    process.env.ECS_CLUSTER_ARN = 'arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate';
    process.env.ECS_TASK_DEFINITION = 'HuntazeOfStackBrowserWorkerTaskCED33274:25';
    process.env.ECS_SUBNETS = 'subnet-0123456789abcdef0,subnet-0987654321fedcba0';
    process.env.ECS_SECURITY_GROUPS = 'sg-0123456789abcdef0';
    process.env.DYNAMODB_TABLE_MESSAGES = 'HuntazeOfMessages';
    
    client = new BrowserWorkerClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Message Sending', () => {
    it('should complete full message sending workflow', async () => {
      // Mock ECS task creation
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/huntaze-of-fargate/abc123def456',
          lastStatus: 'PENDING',
          createdAt: new Date(),
          taskDefinitionArn: 'arn:aws:ecs:us-east-1:317805897534:task-definition/HuntazeOfStackBrowserWorkerTaskCED33274:25'
        }]
      });

      // Mock DynamoDB polling - first empty, then result
      mockDynamoDBClient.send
        .mockResolvedValueOnce({ Item: undefined }) // First poll - no result
        .mockResolvedValueOnce({ Item: undefined }) // Second poll - no result
        .mockResolvedValueOnce({
          Item: {
            taskId: { S: 'task-123' },
            result: { 
              S: JSON.stringify({
                success: true,
                messageId: 'of_msg_789abc123def',
                timestamp: '2025-10-28T10:30:00Z',
                conversationId: 'conv_456def789ghi',
                status: 'delivered'
              })
            },
            createdAt: { S: '2025-10-28T10:29:45Z' },
            updatedAt: { S: '2025-10-28T10:30:00Z' }
          }
        });

      // Mock CloudWatch metrics
      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: {
          content: 'Hey! Check out my new content 🔥',
          conversationId: 'conv_456def789ghi',
          fanId: 'of_fan_subscriber456'
        }
      };

      const result = await client.runBrowserTask(request);

      // Verify successful execution
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: true,
        messageId: 'of_msg_789abc123def',
        timestamp: '2025-10-28T10:30:00Z',
        conversationId: 'conv_456def789ghi',
        status: 'delivered'
      });
      expect(result.duration).toBeGreaterThan(0);

      // Verify ECS task was created with correct parameters
      expect(mockECSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          cluster: 'arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate',
          taskDefinition: 'HuntazeOfStackBrowserWorkerTaskCED33274:25',
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              subnets: ['subnet-0123456789abcdef0', 'subnet-0987654321fedcba0'],
              securityGroups: ['sg-0123456789abcdef0'],
              assignPublicIp: 'ENABLED'
            }
          },
          overrides: {
            containerOverrides: [{
              name: 'of-browser-worker',
              environment: expect.arrayContaining([
                { name: 'ACTION', value: 'send' },
                { name: 'USER_ID', value: 'of_user_creator123' },
                { name: 'CONTENT_TEXT', value: 'Hey! Check out my new content 🔥' }
              ])
            }]
          }
        })
      );

      // Verify DynamoDB polling
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(3);
      expect(mockDynamoDBClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'HuntazeOfMessages',
          Key: { taskId: { S: expect.stringMatching(/^task-\d+-[a-z0-9]+$/) } }
        })
      );

      // Verify CloudWatch metrics
      expect(mockCloudWatchClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Namespace: 'Huntaze/OnlyFans/BrowserWorker',
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'BrowserTaskSuccess',
              Value: 1,
              Unit: 'Count'
            }),
            expect.objectContaining({
              MetricName: 'TaskDuration',
              Unit: 'Milliseconds'
            })
          ])
        })
      );
    });

    it('should handle OnlyFans rate limiting scenario', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/huntaze-of-fargate/rate-limit-task'
        }]
      });

      mockDynamoDBClient.send.mockResolvedValueOnce({
        Item: {
          result: { 
            S: JSON.stringify({
              success: false,
              error: 'RATE_LIMITED',
              retryAfter: 300,
              message: 'OnlyFans rate limit exceeded. Retry after 5 minutes.'
            })
          }
        }
      });

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Message content' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: false,
        error: 'RATE_LIMITED',
        retryAfter: 300,
        message: 'OnlyFans rate limit exceeded. Retry after 5 minutes.'
      });
    });

    it('should handle authentication failure scenario', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/huntaze-of-fargate/auth-fail-task'
        }]
      });

      mockDynamoDBClient.send.mockResolvedValueOnce({
        Item: {
          result: { 
            S: JSON.stringify({
              success: false,
              error: 'AUTHENTICATION_FAILED',
              message: 'OnlyFans session expired. Please re-authenticate.',
              requiresReauth: true
            })
          }
        }
      });

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Message content' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data?.requiresReauth).toBe(true);
      expect(result.data?.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('Login Workflow Integration', () => {
    it('should complete full login workflow', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/huntaze-of-fargate/login-task'
        }]
      });

      mockDynamoDBClient.send.mockResolvedValueOnce({
        Item: {
          result: { 
            S: JSON.stringify({
              success: true,
              loginStatus: 'authenticated',
              sessionData: {
                cookies: 'encrypted_cookie_data',
                csrfToken: 'csrf_token_123',
                userId: 'of_user_creator123'
              },
              expiresAt: '2025-10-29T10:30:00Z'
            })
          }
        }
      });

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'login' as const,
        userId: 'of_user_creator123',
        data: {
          credentials: {
            username: 'creator@example.com',
            password: 'encrypted_password',
            twoFactorCode: '123456'
          }
        }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data?.loginStatus).toBe('authenticated');
      expect(result.data?.sessionData).toBeDefined();
    });
  });

  describe('Sync Workflow Integration', () => {
    it('should complete full sync workflow', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{
          taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/huntaze-of-fargate/sync-task'
        }]
      });

      mockDynamoDBClient.send.mockResolvedValueOnce({
        Item: {
          result: { 
            S: JSON.stringify({
              success: true,
              syncData: {
                newMessages: 15,
                newSubscribers: 3,
                totalEarnings: 1250.50,
                lastSyncAt: '2025-10-28T10:30:00Z'
              },
              conversations: [
                {
                  id: 'conv_1',
                  fanId: 'fan_123',
                  lastMessage: 'Thanks for the content!',
                  unreadCount: 2
                },
                {
                  id: 'conv_2',
                  fanId: 'fan_456',
                  lastMessage: 'When is your next stream?',
                  unreadCount: 1
                }
              ]
            })
          }
        }
      });

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'sync' as const,
        userId: 'of_user_creator123',
        data: {
          syncType: 'full',
          lastSyncTimestamp: '2025-10-28T09:00:00Z'
        }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.data?.syncData?.newMessages).toBe(15);
      expect(result.data?.conversations).toHaveLength(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle ECS service unavailable', async () => {
      mockECSClient.send.mockRejectedValueOnce(
        new Error('ServiceUnavailableException: ECS service is temporarily unavailable')
      );

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Test message' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ServiceUnavailableException');

      // Verify error metric was published
      expect(mockCloudWatchClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'BrowserTaskError',
              Value: 1
            })
          ])
        })
      );
    });

    it('should handle DynamoDB throttling', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/test' }]
      });

      mockDynamoDBClient.send.mockRejectedValue(
        new Error('ProvisionedThroughputExceededException: Request rate is too high')
      );

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Test message' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ProvisionedThroughputExceededException');
    });

    it('should handle task execution timeout', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/timeout-task' }]
      });

      // Mock DynamoDB to never return a result (simulating timeout)
      mockDynamoDBClient.send.mockResolvedValue({ Item: undefined });
      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Test message' }
      };

      // Mock the waitForResult method to timeout quickly
      const originalWaitForResult = (client as any).waitForResult;
      vi.spyOn(client as any, 'waitForResult').mockRejectedValueOnce(
        new Error('Timeout waiting for task: task-timeout-123')
      );

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout waiting for task');
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track task duration accurately', async () => {
      const startTime = Date.now();
      
      mockECSClient.send.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/perf-task' }]
          }), 100)
        )
      );

      mockDynamoDBClient.send.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            Item: {
              result: { S: JSON.stringify({ success: true, messageId: 'perf-msg' }) }
            }
          }), 50)
        )
      );

      mockCloudWatchClient.send.mockResolvedValue({});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Performance test message' }
      };

      const result = await client.runBrowserTask(request);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(140); // At least 150ms (100 + 50)
      expect(result.duration).toBeLessThan(1000); // But reasonable

      // Verify duration was reported to CloudWatch
      expect(mockCloudWatchClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'TaskDuration',
              Value: expect.any(Number),
              Unit: 'Milliseconds'
            })
          ])
        })
      );
    });

    it('should handle CloudWatch metrics failure gracefully', async () => {
      mockECSClient.send.mockResolvedValueOnce({
        tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:317805897534:task/metrics-fail' }]
      });

      mockDynamoDBClient.send.mockResolvedValueOnce({
        Item: {
          result: { S: JSON.stringify({ success: true, messageId: 'metrics-msg' }) }
        }
      });

      // CloudWatch fails but task should still succeed
      mockCloudWatchClient.send.mockRejectedValue(
        new Error('CloudWatch API temporarily unavailable')
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = {
        action: 'send' as const,
        userId: 'of_user_creator123',
        data: { content: 'Metrics failure test' }
      };

      const result = await client.runBrowserTask(request);

      // Task should still succeed even if metrics fail
      expect(result.success).toBe(true);
      expect(result.data?.messageId).toBe('metrics-msg');

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to publish metric:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});