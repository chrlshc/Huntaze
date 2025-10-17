import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const SQS_QUEUES = {
  AI_PROCESSING: process.env.SQS_AI_QUEUE || 'huntaze-ai-processing',
  NOTIFICATIONS: process.env.SQS_NOTIFICATIONS_QUEUE || 'huntaze-notifications',
  ANALYTICS: process.env.SQS_ANALYTICS_QUEUE || 'huntaze-analytics',
  WEBHOOKS: process.env.SQS_WEBHOOKS_QUEUE || 'huntaze-webhooks',
  EMAIL: process.env.SQS_EMAIL_QUEUE || 'huntaze-email',
} as const;

export const sqsHelpers = {
  // Get queue URL
  async getQueueUrl(queueName: string) {
    const command = new GetQueueUrlCommand({
      QueueName: queueName,
    });
    const response = await sqsClient.send(command);
    return response.QueueUrl;
  },

  // Send message to queue
  async sendMessage(queueName: string, messageBody: any, attributes?: Record<string, any>) {
    const queueUrl = await this.getQueueUrl(queueName);
    
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: attributes ? this.formatMessageAttributes(attributes) : undefined,
    });
    
    return await sqsClient.send(command);
  },

  // Send message with delay
  async sendDelayedMessage(queueName: string, messageBody: any, delaySeconds: number) {
    const queueUrl = await this.getQueueUrl(queueName);
    
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
      DelaySeconds: delaySeconds,
    });
    
    return await sqsClient.send(command);
  },

  // Receive messages from queue
  async receiveMessages(queueName: string, maxMessages = 10) {
    const queueUrl = await this.getQueueUrl(queueName);
    
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20, // Long polling
      MessageAttributeNames: ['All'],
    });
    
    const response = await sqsClient.send(command);
    
    return (response.Messages || []).map(message => ({
      messageId: message.MessageId,
      receiptHandle: message.ReceiptHandle,
      body: JSON.parse(message.Body || '{}'),
      attributes: message.MessageAttributes,
    }));
  },

  // Delete message from queue
  async deleteMessage(queueName: string, receiptHandle: string) {
    const queueUrl = await this.getQueueUrl(queueName);
    
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });
    
    return await sqsClient.send(command);
  },

  // Format message attributes for SQS
  formatMessageAttributes(attributes: Record<string, any>) {
    const formatted: Record<string, any> = {};
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'string') {
        formatted[key] = {
          DataType: 'String',
          StringValue: value,
        };
      } else if (typeof value === 'number') {
        formatted[key] = {
          DataType: 'Number',
          StringValue: value.toString(),
        };
      }
    });
    
    return formatted;
  },
};

// Queue message types
export interface AIProcessingMessage {
  type:
    | 'generate_response'
    | 'analyze_content'
    | 'optimize_strategy'
    | 'optimize_content'
    | 'publish_content'
    | 'analyze_media';
  payload: any;
  userId: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationMessage {
  type: 'email' | 'push' | 'in_app';
  recipient: string;
  subject: string;
  content: string;
  metadata?: any;
}

export interface AnalyticsMessage {
  type: 'track_event' | 'update_metrics' | 'generate_report';
  event: string;
  userId: string;
  properties: any;
  timestamp: number;
}

export { sqsClient };
