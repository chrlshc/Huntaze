/**
 * OnlyFans Rate Limiter Service
 * 
 * Service pour envoyer des messages OnlyFans via SQS avec rate limiting automatique.
 * Utilise l'infrastructure AWS existante (Lambda + SQS + Redis) pour limiter à 10 messages/minute.
 */

import { SQSClient, SendMessageCommand, SendMessageBatchCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { metrics } from '@/lib/utils/metrics';

// Zod schema pour validation
const OnlyFansMessageSchema = z.object({
  messageId: z.string().uuid(),
  userId: z.string(),
  recipientId: z.string(),
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.number().min(1).max(10).optional().default(5),
});

export interface OnlyFansMessage {
  messageId: string;
  userId: string;
  recipientId: string;
  content: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  priority?: number;
}

export interface SendResult {
  messageId: string;
  status: 'queued' | 'failed';
  queuedAt?: Date;
  error?: string;
}

export interface QueueStatus {
  queueDepth: number;
  messagesInFlight: number;
  dlqCount: number;
  lastProcessedAt?: Date;
}

export class OnlyFansRateLimiterService {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private dlqUrl: string;
  private enabled: boolean;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second

  constructor() {
    // Configuration AWS
    const region = process.env.AWS_REGION || 'us-east-1';
    this.sqsClient = new SQSClient({ region });
    
    // Queue URLs
    this.queueUrl = process.env.SQS_RATE_LIMITER_QUEUE_URL || '';
    this.dlqUrl = process.env.SQS_RATE_LIMITER_DLQ_URL || '';
    
    // Feature flag
    this.enabled = process.env.RATE_LIMITER_ENABLED === 'true';

    // Validation
    if (this.enabled && !this.queueUrl) {
      logger.warn('OnlyFansRateLimiterService: SQS_RATE_LIMITER_QUEUE_URL not configured. Rate limiting disabled.');
      this.enabled = false;
    }

    logger.info('OnlyFansRateLimiterService initialized', {
      enabled: this.enabled,
      region,
      queueUrl: this.queueUrl ? '***' : 'not set',
    });
  }

  /**
   * Envoie un message OnlyFans via SQS avec rate limiting
   */
  async sendMessage(message: OnlyFansMessage): Promise<SendResult> {
    // Vérifier si le service est activé
    if (!this.enabled) {
      logger.warn('OnlyFansRateLimiterService: Rate limiter disabled, message not sent', {
        messageId: message.messageId,
      });
      return {
        messageId: message.messageId,
        status: 'failed',
        error: 'Rate limiter disabled',
      };
    }

    // Valider le message
    try {
      this.validateMessage(message);
    } catch (error) {
      logger.error('OnlyFansRateLimiterService: Message validation failed', {
        messageId: message.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        messageId: message.messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }

    // Envoyer à SQS avec retry
    return this.sendToSQSWithRetry(message);
  }

  /**
   * Envoie plusieurs messages en batch (max 10)
   */
  async sendBatch(messages: OnlyFansMessage[]): Promise<SendResult[]> {
    if (!this.enabled) {
      logger.warn('OnlyFansRateLimiterService: Rate limiter disabled, batch not sent');
      return messages.map(msg => ({
        messageId: msg.messageId,
        status: 'failed' as const,
        error: 'Rate limiter disabled',
      }));
    }

    // Valider la taille du batch
    if (messages.length === 0) {
      return [];
    }

    if (messages.length > 10) {
      throw new Error('Batch size cannot exceed 10 messages');
    }

    // Valider tous les messages
    const validationErrors: string[] = [];
    for (const message of messages) {
      try {
        this.validateMessage(message);
      } catch (error) {
        validationErrors.push(`Message ${message.messageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`Batch validation failed: ${validationErrors.join(', ')}`);
    }

    // Envoyer le batch
    try {
      const entries = messages.map((message, index) => ({
        Id: index.toString(),
        MessageBody: JSON.stringify(this.buildSQSPayload(message)),
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: message.userId,
          },
          messageType: {
            DataType: 'String',
            StringValue: 'onlyfans',
          },
          priority: {
            DataType: 'Number',
            StringValue: (message.priority || 5).toString(),
          },
        },
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: this.queueUrl,
        Entries: entries,
      });

      const response = await this.sqsClient.send(command);

      // Traiter les résultats
      const results: SendResult[] = [];
      
      // Succès
      if (response.Successful) {
        for (const success of response.Successful) {
          const index = parseInt(success.Id!);
          results[index] = {
            messageId: messages[index].messageId,
            status: 'queued',
            queuedAt: new Date(),
          };
          
          logger.info('OnlyFansRateLimiterService: Message queued (batch)', {
            messageId: messages[index].messageId,
            sqsMessageId: success.MessageId,
          });

          // Métrique
          metrics.onlyFansMessageQueued(messages[index].userId);
        }
      }

      // Échecs
      if (response.Failed) {
        for (const failure of response.Failed) {
          const index = parseInt(failure.Id!);
          results[index] = {
            messageId: messages[index].messageId,
            status: 'failed',
            error: failure.Message,
          };
          
          logger.error('OnlyFansRateLimiterService: Message failed (batch)', {
            messageId: messages[index].messageId,
            error: failure.Message,
            code: failure.Code,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('OnlyFansRateLimiterService: Batch send failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageCount: messages.length,
      });

      // Retourner tous les messages comme failed
      return messages.map(msg => ({
        messageId: msg.messageId,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Batch send failed',
      }));
    }
  }

  /**
   * Récupère l'état de la queue SQS
   */
  async getQueueStatus(): Promise<QueueStatus> {
    if (!this.enabled) {
      return {
        queueDepth: 0,
        messagesInFlight: 0,
        dlqCount: 0,
      };
    }

    try {
      // Récupérer les attributs de la queue principale
      const queueCommand = new GetQueueAttributesCommand({
        QueueUrl: this.queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
        ],
      });

      const queueResponse = await this.sqsClient.send(queueCommand);

      const queueDepth = parseInt(queueResponse.Attributes?.ApproximateNumberOfMessages || '0');
      const messagesInFlight = parseInt(queueResponse.Attributes?.ApproximateNumberOfMessagesNotVisible || '0');

      // Récupérer les attributs de la DLQ si configurée
      let dlqCount = 0;
      if (this.dlqUrl) {
        try {
          const dlqCommand = new GetQueueAttributesCommand({
            QueueUrl: this.dlqUrl,
            AttributeNames: ['ApproximateNumberOfMessages'],
          });

          const dlqResponse = await this.sqsClient.send(dlqCommand);
          dlqCount = parseInt(dlqResponse.Attributes?.ApproximateNumberOfMessages || '0');
        } catch (error) {
          logger.warn('OnlyFansRateLimiterService: Failed to get DLQ status', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const status: QueueStatus = {
        queueDepth,
        messagesInFlight,
        dlqCount,
        lastProcessedAt: new Date(),
      };

      logger.info('OnlyFansRateLimiterService: Queue status retrieved', status);

      return status;
    } catch (error) {
      logger.error('OnlyFansRateLimiterService: Failed to get queue status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error(`Failed to get queue status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Valide un message OnlyFans
   */
  private validateMessage(message: OnlyFansMessage): void {
    try {
      OnlyFansMessageSchema.parse(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Message validation failed: ${errors}`);
      }
      throw error;
    }
  }

  /**
   * Génère un ID de message unique
   */
  generateMessageId(): string {
    return crypto.randomUUID();
  }

  /**
   * Envoie un message à SQS avec retry logic
   */
  private async sendToSQSWithRetry(message: OnlyFansMessage, attempt: number = 1): Promise<SendResult> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(this.buildSQSPayload(message)),
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: message.userId,
          },
          messageType: {
            DataType: 'String',
            StringValue: 'onlyfans',
          },
          priority: {
            DataType: 'Number',
            StringValue: (message.priority || 5).toString(),
          },
        },
      });

      const response = await this.sqsClient.send(command);

      logger.info('OnlyFansRateLimiterService: Message queued successfully', {
        messageId: message.messageId,
        sqsMessageId: response.MessageId,
        attempt,
      });

      // Métrique
      metrics.onlyFansMessageQueued(message.userId);

      return {
        messageId: message.messageId,
        status: 'queued',
        queuedAt: new Date(),
      };
    } catch (error) {
      logger.error('OnlyFansRateLimiterService: Failed to send message to SQS', {
        messageId: message.messageId,
        attempt,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Retry avec exponential backoff
      if (attempt < this.maxRetries) {
        const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
        logger.info('OnlyFansRateLimiterService: Retrying message send', {
          messageId: message.messageId,
          attempt: attempt + 1,
          delayMs: delay,
        });

        await this.sleep(delay);
        return this.sendToSQSWithRetry(message, attempt + 1);
      }

      // Tous les retries ont échoué
      logger.error('OnlyFansRateLimiterService: All retries exhausted', {
        messageId: message.messageId,
        attempts: this.maxRetries,
      });

      return {
        messageId: message.messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to send to SQS',
      };
    }
  }

  /**
   * Construit le payload SQS
   */
  private buildSQSPayload(message: OnlyFansMessage) {
    return {
      messageId: message.messageId,
      userId: message.userId,
      recipientId: message.recipientId,
      content: message.content,
      mediaUrls: message.mediaUrls || [],
      metadata: message.metadata || {},
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance with lazy initialization
let _instance: OnlyFansRateLimiterService | null = null;

export const onlyFansRateLimiterService = {
  get instance(): OnlyFansRateLimiterService {
    if (!_instance) {
      _instance = new OnlyFansRateLimiterService();
    }
    return _instance;
  },
  
  // Proxy methods for convenience
  async sendMessage(message: OnlyFansMessage): Promise<SendResult> {
    return this.instance.sendMessage(message);
  },
  
  async sendBatch(messages: OnlyFansMessage[]): Promise<SendResult[]> {
    return this.instance.sendBatch(messages);
  },
  
  async getQueueStatus(): Promise<QueueStatus> {
    return this.instance.getQueueStatus();
  },
  
  async getDLQCount(): Promise<number> {
    return this.instance.getDLQCount();
  },
};
