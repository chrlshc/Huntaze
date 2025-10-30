/**
 * Tests for AWS SQS Integration
 * Tests SQS message queuing, processing, and error handling for hybrid workflows
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock AWS SDK clients
const mockSQSClient = {
  sendMessage: vi.fn(),
  receiveMessage: vi.fn(),
  deleteMessage: vi.fn(),
  changeMessageVisibility: vi.fn(),
  getQueueAttributes: vi.fn(),
  purgeQueue: vi.fn()
};

const mockCloudWatchClient = {
  putMetricData: vi.fn()
};

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => mockSQSClient),
  SendMessageCommand: vi.fn((params) => params),
  ReceiveMessageCommand: vi.fn((params) => params),
  DeleteMessageCommand: vi.fn((params) => params),
  ChangeMessageVisibilityCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  PutMetricDataCommand: vi.fn((params) => params)
}));

// Types for SQS integration
interface SQSMessagePayload {
  workflowId: string;
  recipientId: string;
  content: string;
  attempts: number;
  maxRetries: number;
  scheduledFor: string;
  lastError?: string;
}

interface SQSProcessingResult {
  processed: number;
  failed: number;
  errors: string[];
  metrics: {
    totalMessages: number;
    avgProcessingTime: number;
    successRate: number;
  };
}

// Mock implementation of SQSMessageProcessor
class SQSMessageProcessor {
  private readonly queueUrl = 'huntaze-hybrid-messages-production';
  private readonly dlqUrl = 'huntaze-dlq-production';
  private readonly maxRetries = 3;
  private readonly visibilityTimeout = 300; // 5 minutes

  constructor(
    private sqsClient = mockSQSClient,
    private cloudWatch = mockCloudWatchClient
  ) {}

  async sendMessage(payload: SQSMessagePayload, delaySeconds: number = 0): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
        DelaySeconds: delaySeconds,
        MessageAttributes: {
          workflowId: {
            DataType: 'String',
            StringValue: payload.workflowId
          },
          recipientId: {
            DataType: 'String',
            StringValue: payload.recipientId
          },
          attempts: {
            DataType: 'Number',
            StringValue: payload.attempts.toString()
          }
        }
      });

      await this.trackMetric('MessagesSent', 1);

      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      await this.trackMetric('MessageSendErrors', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async processMessages(maxMessages: number = 10): Promise<SQSProcessingResult> {
    const startTime = Date.now();
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    let totalMessages = 0;

    try {
      const result = await this.sqsClient.receiveMessage({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 20,
        MessageAttributeNames: ['All'],
        AttributeNames: ['ApproximateReceiveCount']
      });

      if (!result.Messages || result.Messages.length === 0) {
        return this.createProcessingResult(0, 0, [], startTime, 0);
      }

      totalMessages = result.Messages.length;

      for (const message of result.Messages) {
        try {
          const payload: SQSMessagePayload = JSON.parse(message.Body || '{}');
          const receiveCount = parseInt(message.Attributes?.ApproximateReceiveCount || '1');

          // Simulate message processing
          const processingResult = await this.processMessage(payload);

          if (processingResult.success) {
            // Delete message on success
            await this.sqsClient.deleteMessage({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle
            });
            processed++;
            await this.trackMetric('MessagesProcessed', 1);
          } else {
            // Handle failure
            payload.attempts = receiveCount;
            payload.lastError = processingResult.error;

            if (payload.attempts >= this.maxRetries) {
              // Move to DLQ
              await this.moveToDeadLetterQueue(payload, message.ReceiptHandle!);
              failed++;
              errors.push(`Max retries exceeded for ${payload.workflowId}: ${payload.lastError}`);
            } else {
              // Retry with backoff
              const backoffDelay = Math.min(300 * Math.pow(2, payload.attempts), 900); // Max 15 minutes
              await this.sqsClient.changeMessageVisibility({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle,
                VisibilityTimeout: backoffDelay
              });
            }
          }
        } catch (error) {
          errors.push(`Failed to process message: ${error instanceof Error ? error.message : String(error)}`);
          failed++;
        }
      }

      return this.createProcessingResult(processed, failed, errors, startTime, totalMessages);
    } catch (error) {
      errors.push(`SQS processing error: ${error instanceof Error ? error.message : String(error)}`);
      return this.createProcessingResult(processed, failed, errors, startTime, totalMessages);
    }
  }

  private async processMessage(payload: SQSMessagePayload): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Simulate message processing logic
    // In real implementation, this would call OnlyFansGateway
    
    // Simulate random failures for testing
    if (payload.recipientId.includes('fail')) {
      return {
        success: false,
        error: 'Simulated processing failure'
      };
    }

    if (payload.content.includes('timeout')) {
      return {
        success: false,
        error: 'Processing timeout'
      };
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 10));

    return { success: true };
  }

  private async moveToDeadLetterQueue(payload: SQSMessagePayload, receiptHandle: string): Promise<void> {
    try {
      // Send to DLQ
      await this.sqsClient.sendMessage({
        QueueUrl: this.dlqUrl,
        MessageBody: JSON.stringify({
          ...payload,
          dlqTimestamp: new Date().toISOString(),
          originalQueue: this.queueUrl
        })
      });

      // Delete from original queue
      await this.sqsClient.deleteMessage({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle
      });

      await this.trackMetric('MessagesSentToDLQ', 1);
    } catch (error) {
      await this.trackMetric('DLQErrors', 1);
      throw error;
    }
  }

  private createProcessingResult(
    processed: number,
    failed: number,
    errors: string[],
    startTime: number,
    totalMessages: number
  ): SQSProcessingResult {
    const processingTime = Date.now() - startTime;
    const avgProcessingTime = totalMessages > 0 ? processingTime / totalMessages : 0;
    const successRate = totalMessages > 0 ? processed / totalMessages : 0;

    return {
      processed,
      failed,
      errors,
      metrics: {
        totalMessages,
        avgProcessingTime,
        successRate
      }
    };
  }

  private async trackMetric(metricName: string, value: number): Promise<void> {
    try {
      await this.cloudWatch.putMetricData({
        Namespace: 'Huntaze/SQS',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: 'Count',
            Timestamp: new Date()
          }
        ]
      });
    } catch (error) {
      // Ignore CloudWatch errors to not affect SQS processing
      console.warn('Failed to track metric:', error);
    }
  }

  async getQueueMetrics(): Promise<{
    approximateNumberOfMessages: number;
    approximateNumberOfMessagesNotVisible: number;
    approximateAgeOfOldestMessage: number;
  }> {
    const result = await this.sqsClient.getQueueAttributes({
      QueueUrl: this.queueUrl,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateAgeOfOldestMessage'
      ]
    });

    return {
      approximateNumberOfMessages: parseInt(result.Attributes?.ApproximateNumberOfMessages || '0'),
      approximateNumberOfMessagesNotVisible: parseInt(result.Attributes?.ApproximateNumberOfMessagesNotVisible || '0'),
      approximateAgeOfOldestMessage: parseInt(result.Attributes?.ApproximateAgeOfOldestMessage || '0')
    };
  }

  async purgeQueue(): Promise<void> {
    await this.sqsClient.purgeQueue({
      QueueUrl: this.queueUrl
    });
  }
}

describe('SQSMessageProcessor', () => {
  let processor: SQSMessageProcessor;

  beforeEach(() => {
    processor = new SQSMessageProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Message Sending', () => {
    it('should send message to SQS with correct structure', async () => {
      mockSQSClient.sendMessage.mockResolvedValue({
        MessageId: 'test-message-123'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const payload: SQSMessagePayload = {
        workflowId: 'workflow-123',
        recipientId: 'recipient-456',
        content: 'Test message content',
        attempts: 0,
        maxRetries: 3,
        scheduledFor: new Date().toISOString()
      };

      const result = await processor.sendMessage(payload, 45);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-123');

      expect(mockSQSClient.sendMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        MessageBody: JSON.stringify(payload),
        DelaySeconds: 45,
        MessageAttributes: {
          workflowId: {
            DataType: 'String',
            StringValue: 'workflow-123'
          },
          recipientId: {
            DataType: 'String',
            StringValue: 'recipient-456'
          },
          attempts: {
            DataType: 'Number',
            StringValue: '0'
          }
        }
      });

      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/SQS',
        MetricData: [
          {
            MetricName: 'MessagesSent',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date)
          }
        ]
      });
    });

    it('should handle SQS send failures', async () => {
      mockSQSClient.sendMessage.mockRejectedValue(new Error('SQS service unavailable'));
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const payload: SQSMessagePayload = {
        workflowId: 'workflow-fail',
        recipientId: 'recipient-fail',
        content: 'Failing message',
        attempts: 0,
        maxRetries: 3,
        scheduledFor: new Date().toISOString()
      };

      const result = await processor.sendMessage(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SQS service unavailable');

      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/SQS',
        MetricData: [
          {
            MetricName: 'MessageSendErrors',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date)
          }
        ]
      });
    });
  });

  describe('Message Processing', () => {
    it('should process successful messages', async () => {
      const mockMessages = [
        {
          MessageId: 'msg-1',
          ReceiptHandle: 'receipt-1',
          Body: JSON.stringify({
            workflowId: 'workflow-1',
            recipientId: 'recipient-success',
            content: 'Success message',
            attempts: 0,
            maxRetries: 3,
            scheduledFor: new Date().toISOString()
          }),
          Attributes: {
            ApproximateReceiveCount: '1'
          }
        }
      ];

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: mockMessages
      });
      mockSQSClient.deleteMessage.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await processor.processMessages();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.successRate).toBe(1);

      expect(mockSQSClient.deleteMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        ReceiptHandle: 'receipt-1'
      });
    });

    it('should retry failed messages with exponential backoff', async () => {
      const mockMessage = {
        MessageId: 'msg-fail',
        ReceiptHandle: 'receipt-fail',
        Body: JSON.stringify({
          workflowId: 'workflow-fail',
          recipientId: 'recipient-fail',
          content: 'Failing message',
          attempts: 0,
          maxRetries: 3,
          scheduledFor: new Date().toISOString()
        }),
        Attributes: {
          ApproximateReceiveCount: '2' // Second attempt
        }
      };

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: [mockMessage]
      });
      mockSQSClient.changeMessageVisibility.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await processor.processMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0); // Not failed yet, just retrying
      expect(result.errors).toHaveLength(0);

      // Should use exponential backoff: 300 * 2^2 = 1200 seconds
      expect(mockSQSClient.changeMessageVisibility).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        ReceiptHandle: 'receipt-fail',
        VisibilityTimeout: 1200
      });
    });

    it('should move messages to DLQ after max retries', async () => {
      const mockMessage = {
        MessageId: 'msg-max-retry',
        ReceiptHandle: 'receipt-max-retry',
        Body: JSON.stringify({
          workflowId: 'workflow-max-retry',
          recipientId: 'recipient-fail',
          content: 'Max retry message',
          attempts: 0,
          maxRetries: 3,
          scheduledFor: new Date().toISOString()
        }),
        Attributes: {
          ApproximateReceiveCount: '4' // Exceeds max retries
        }
      };

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: [mockMessage]
      });
      mockSQSClient.sendMessage.mockResolvedValue({ MessageId: 'dlq-msg-123' });
      mockSQSClient.deleteMessage.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await processor.processMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Max retries exceeded for workflow-max-retry');

      // Should send to DLQ
      expect(mockSQSClient.sendMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-dlq-production',
        MessageBody: expect.stringContaining('"dlqTimestamp"')
      });

      // Should delete from original queue
      expect(mockSQSClient.deleteMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        ReceiptHandle: 'receipt-max-retry'
      });
    });

    it('should handle empty queue gracefully', async () => {
      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: []
      });

      const result = await processor.processMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.totalMessages).toBe(0);
    });

    it('should handle malformed message bodies', async () => {
      const mockMessage = {
        MessageId: 'msg-malformed',
        ReceiptHandle: 'receipt-malformed',
        Body: 'invalid-json',
        Attributes: {
          ApproximateReceiveCount: '1'
        }
      };

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: [mockMessage]
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await processor.processMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to process message');
    });

    it('should calculate processing metrics correctly', async () => {
      const mockMessages = [
        {
          MessageId: 'msg-1',
          ReceiptHandle: 'receipt-1',
          Body: JSON.stringify({
            workflowId: 'workflow-1',
            recipientId: 'recipient-success',
            content: 'Success message 1',
            attempts: 0,
            maxRetries: 3,
            scheduledFor: new Date().toISOString()
          }),
          Attributes: { ApproximateReceiveCount: '1' }
        },
        {
          MessageId: 'msg-2',
          ReceiptHandle: 'receipt-2',
          Body: JSON.stringify({
            workflowId: 'workflow-2',
            recipientId: 'recipient-fail',
            content: 'Failing message',
            attempts: 0,
            maxRetries: 3,
            scheduledFor: new Date().toISOString()
          }),
          Attributes: { ApproximateReceiveCount: '4' }
        }
      ];

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: mockMessages
      });
      mockSQSClient.deleteMessage.mockResolvedValue({});
      mockSQSClient.sendMessage.mockResolvedValue({ MessageId: 'dlq-msg' });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await processor.processMessages();

      expect(result.metrics.totalMessages).toBe(2);
      expect(result.metrics.successRate).toBe(0.5); // 1 success out of 2
      expect(result.metrics.avgProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Queue Management', () => {
    it('should retrieve queue metrics', async () => {
      mockSQSClient.getQueueAttributes.mockResolvedValue({
        Attributes: {
          ApproximateNumberOfMessages: '15',
          ApproximateNumberOfMessagesNotVisible: '3',
          ApproximateAgeOfOldestMessage: '300'
        }
      });

      const metrics = await processor.getQueueMetrics();

      expect(metrics.approximateNumberOfMessages).toBe(15);
      expect(metrics.approximateNumberOfMessagesNotVisible).toBe(3);
      expect(metrics.approximateAgeOfOldestMessage).toBe(300);

      expect(mockSQSClient.getQueueAttributes).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateAgeOfOldestMessage'
        ]
      });
    });

    it('should purge queue', async () => {
      mockSQSClient.purgeQueue.mockResolvedValue({});

      await processor.purgeQueue();

      expect(mockSQSClient.purgeQueue).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production'
      });
    });

    it('should handle queue operation errors', async () => {
      mockSQSClient.getQueueAttributes.mockRejectedValue(new Error('Queue not found'));

      await expect(processor.getQueueMetrics()).rejects.toThrow('Queue not found');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high message volume efficiently', async () => {
      const mockMessages = Array.from({ length: 10 }, (_, i) => ({
        MessageId: `msg-${i}`,
        ReceiptHandle: `receipt-${i}`,
        Body: JSON.stringify({
          workflowId: `workflow-${i}`,
          recipientId: 'recipient-success',
          content: `Message ${i}`,
          attempts: 0,
          maxRetries: 3,
          scheduledFor: new Date().toISOString()
        }),
        Attributes: { ApproximateReceiveCount: '1' }
      }));

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: mockMessages
      });
      mockSQSClient.deleteMessage.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const startTime = Date.now();
      const result = await processor.processMessages(10);
      const duration = Date.now() - startTime;

      expect(result.processed).toBe(10);
      expect(result.failed).toBe(0);
      expect(duration).toBeLessThan(1000); // Should process quickly

      expect(mockSQSClient.deleteMessage).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent processing safely', async () => {
      const mockMessage = {
        MessageId: 'msg-concurrent',
        ReceiptHandle: 'receipt-concurrent',
        Body: JSON.stringify({
          workflowId: 'workflow-concurrent',
          recipientId: 'recipient-success',
          content: 'Concurrent message',
          attempts: 0,
          maxRetries: 3,
          scheduledFor: new Date().toISOString()
        }),
        Attributes: { ApproximateReceiveCount: '1' }
      };

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: [mockMessage]
      });
      mockSQSClient.deleteMessage.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      // Process same message concurrently
      const promises = Array.from({ length: 3 }, () => processor.processMessages(1));
      const results = await Promise.all(promises);

      // Should handle concurrent processing without errors
      results.forEach(result => {
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});