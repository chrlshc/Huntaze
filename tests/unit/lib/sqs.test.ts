/**
 * SQS Module Unit Tests
 * 
 * Tests for the SQS integration module
 * Requirements: 1.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the AWS SDK before importing the module
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: class MockSQSClient {
      constructor() {}
      send(command: any) {
        return mockSend(command);
      }
    },
    SendMessageCommand: class MockSendMessageCommand {
      constructor(public params: any) {}
    },
  };
});

// Mock the logger
vi.mock('../../../lib/logger', () => ({
  makeReqLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Import after mocks are set up
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { enqueuePostContent, __resetSQSClient } from '../../../lib/sqs';

describe('SQS Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.AWS_SQS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue';
    process.env.AWS_REGION = 'us-east-1';

    // Reset SQS client and clear mocks
    __resetSQSClient();
    mockSend.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    __resetSQSClient();
  });

  describe('enqueuePostContent', () => {
    it('should successfully send a message to SQS', async () => {
      const taskId = 'task-123';
      const mockMessageId = 'msg-456';

      mockSend.mockResolvedValue({
        MessageId: mockMessageId,
        $metadata: {},
      });

      await enqueuePostContent(taskId);

      expect(mockSend).toHaveBeenCalledOnce();
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.params).toEqual({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
        MessageBody: JSON.stringify({
          type: 'POST_CONTENT',
          taskId: 'task-123',
        }),
      });
    });

    it('should throw error if AWS_SQS_QUEUE_URL is not set', async () => {
      delete process.env.AWS_SQS_QUEUE_URL;

      await expect(enqueuePostContent('task-123')).rejects.toThrow(
        'AWS_SQS_QUEUE_URL environment variable is not set'
      );

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle SQS send failures', async () => {
      const taskId = 'task-789';
      const errorMessage = 'Network error';

      mockSend.mockRejectedValue(new Error(errorMessage));

      await expect(enqueuePostContent(taskId)).rejects.toThrow(
        `Failed to enqueue task ${taskId}: ${errorMessage}`
      );

      expect(mockSend).toHaveBeenCalledOnce();
    });

    it('should format message body correctly as JSON', async () => {
      const taskId = 'task-abc-123';

      mockSend.mockResolvedValue({
        MessageId: 'msg-xyz',
        $metadata: {},
      });

      await enqueuePostContent(taskId);

      const sentCommand = mockSend.mock.calls[0][0];
      const messageBody = JSON.parse(sentCommand.params.MessageBody);

      expect(messageBody).toEqual({
        type: 'POST_CONTENT',
        taskId: 'task-abc-123',
      });
      expect(messageBody.type).toBe('POST_CONTENT');
      expect(messageBody.taskId).toBe(taskId);
    });

    it('should handle non-Error exceptions', async () => {
      const taskId = 'task-error';

      mockSend.mockRejectedValue('String error');

      await expect(enqueuePostContent(taskId)).rejects.toThrow(
        `Failed to enqueue task ${taskId}: Unknown error`
      );
    });

    it('should use correct queue URL from environment', async () => {
      const customQueueUrl = 'https://sqs.eu-west-1.amazonaws.com/999/custom-queue';
      process.env.AWS_SQS_QUEUE_URL = customQueueUrl;

      mockSend.mockResolvedValue({
        MessageId: 'msg-custom',
        $metadata: {},
      });

      await enqueuePostContent('task-custom');

      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.params.QueueUrl).toBe(customQueueUrl);
    });

    it('should handle empty taskId', async () => {
      const taskId = '';

      mockSend.mockResolvedValue({
        MessageId: 'msg-empty',
        $metadata: {},
      });

      await enqueuePostContent(taskId);

      const sentCommand = mockSend.mock.calls[0][0];
      const messageBody = JSON.parse(sentCommand.params.MessageBody);

      expect(messageBody.taskId).toBe('');
    });

    it('should handle special characters in taskId', async () => {
      const taskId = 'task-with-special-chars-!@#$%';

      mockSend.mockResolvedValue({
        MessageId: 'msg-special',
        $metadata: {},
      });

      await enqueuePostContent(taskId);

      const sentCommand = mockSend.mock.calls[0][0];
      const messageBody = JSON.parse(sentCommand.params.MessageBody);

      expect(messageBody.taskId).toBe(taskId);
    });
  });
});
