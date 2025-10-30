/**
 * Intelligent Queue Manager - OnlyFans Message Queuing
 * 
 * Système de queuing intelligent avec:
 * - Priorités dynamiques (welcome > follow_up > promotional)
 * - Retry automatique avec exponential backoff
 * - Dead letter queue pour messages échoués
 * - Monitoring et métriques temps réel
 * - Integration SQS + Redis + PostgreSQL
 * 
 * @module intelligent-queue-manager
 */

import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { getEnhancedRateLimiter } from './enhanced-rate-limiter';

export interface QueuedMessage {
  id: string;
  userId: string;
  recipientId: string;
  content: string;
  messageType: 'welcome' | 'follow_up' | 'promotional' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledFor: Date;
  attempts: number;
  maxRetries: number;
  lastError?: string;
  metadata: {
    workflowId?: string;
    traceId?: string;
    source: string;
    originalTimestamp: Date;
  };
}

export interface QueueStats {
  totalMessages: number;
  pendingMessages: number;
  processingMessages: number;
  failedMessages: number;
  completedMessages: number;
  averageProcessingTime: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  messageTypeBreakdown: {
    welcome: number;
    follow_up: number;
    promotional: number;
    custom: number;
  };
}

export interface ProcessingResult {
  success: boolean;
  messageId: string;
  processingTime: number;
  error?: string;
  retryAfter?: number;
  finalAttempt: boolean;
}

export class IntelligentQueueManager {
  private readonly sqsClient: SQSClient;
  private readonly redis: Redis;
  private readonly prisma: PrismaClient;
  private readonly cloudWatch: CloudWatchClient;
  
  // Configuration des queues SQS
  private readonly QUEUES = {
    HIGH_PRIORITY: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
    MEDIUM_PRIORITY: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
    LOW_PRIORITY: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
    DLQ: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-dlq-production',
    RETRY: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-dlq-production',
    RATE_LIMITER: process.env.SQS_RATE_LIMITER_QUEUE || 
      'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue'
  };

  // Configuration des priorités par type de message
  private readonly MESSAGE_PRIORITIES = {
    welcome: 'high',
    follow_up: 'medium', 
    promotional: 'low',
    custom: 'medium'
  } as const;

  // Configuration des retry avec exponential backoff
  private readonly RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 30000,    // 30 secondes
    maxDelayMs: 900000,    // 15 minutes (limite SQS)
    backoffMultiplier: 2,
    jitterFactor: 0.1      // 10% de jitter
  };

  // Limites de processing par priorité
  private readonly PROCESSING_LIMITS = {
    critical: { concurrency: 10, batchSize: 1 },
    high: { concurrency: 8, batchSize: 2 },
    medium: { concurrency: 5, batchSize: 5 },
    low: { concurrency: 3, batchSize: 10 }
  };

  constructor(
    redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379',
    region: string = 'us-east-1'
  ) {
    this.sqsClient = new SQSClient({ region });
    this.redis = new Redis(redisUrl);
    this.prisma = new PrismaClient();
    this.cloudWatch = new CloudWatchClient({ region });
  }

  /**
   * Ajoute un message à la queue avec priorité intelligente
   */
  async enqueueMessage(message: Omit<QueuedMessage, 'id' | 'attempts'>): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedMessage: QueuedMessage = {
      ...message,
      id: messageId,
      attempts: 0,
      priority: this.determinePriority(message.messageType, message.priority)
    };

    try {
      // 1. Persister en base pour tracking
      await this.persistMessage(queuedMessage);
      
      // 2. Déterminer la queue appropriée
      const queueUrl = this.selectQueue(queuedMessage.priority);
      
      // 3. Calculer le délai basé sur le rate limiting
      const rateLimiter = await getEnhancedRateLimiter();
      const rateLimitCheck = await rateLimiter.checkOnlyFansLimits(message.userId, message.recipientId);
      
      let delaySeconds = 0;
      if (!rateLimitCheck.allowed && rateLimitCheck.retryAfter) {
        delaySeconds = Math.min(rateLimitCheck.retryAfter, 900); // Max 15 min SQS delay
      }

      // 4. Envoyer à SQS avec priorité et délai
      const sqsResult = await this.sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(queuedMessage),
        MessageGroupId: this.getMessageGroupId(queuedMessage),
        MessageDeduplicationId: messageId,
        DelaySeconds: delaySeconds,
        MessageAttributes: {
          Priority: {
            DataType: 'String',
            StringValue: queuedMessage.priority
          },
          MessageType: {
            DataType: 'String',
            StringValue: queuedMessage.messageType
          },
          UserId: {
            DataType: 'String',
            StringValue: queuedMessage.userId
          }
        }
      }));

      // 5. Mettre à jour le statut en base
      await this.updateMessageStatus(messageId, 'queued', {
        sqsMessageId: sqsResult.MessageId,
        queueUrl,
        delaySeconds
      });

      // 6. Envoyer métriques
      await this.sendQueueMetrics('message_enqueued', queuedMessage);

      console.log(`[IntelligentQueueManager] Enqueued message ${messageId} with priority ${queuedMessage.priority}, delay ${delaySeconds}s`);
      
      return messageId;

    } catch (error) {
      console.error(`[IntelligentQueueManager] Failed to enqueue message:`, error);
      
      // Marquer comme failed en base
      await this.updateMessageStatus(messageId, 'failed', { error: error.message });
      
      throw error;
    }
  }

  /**
   * Traite les messages de la queue avec priorité
   */
  async processMessages(priority: 'critical' | 'high' | 'medium' | 'low' = 'high'): Promise<ProcessingResult[]> {
    const config = this.PROCESSING_LIMITS[priority];
    const queueUrl = this.selectQueue(priority);
    
    try {
      // Recevoir des messages de SQS
      const receiveResult = await this.sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: config.batchSize,
        WaitTimeSeconds: 10, // Long polling
        MessageAttributeNames: ['All'],
        VisibilityTimeout: 300 // 5 minutes pour processing
      }));

      if (!receiveResult.Messages || receiveResult.Messages.length === 0) {
        return [];
      }

      const results: ProcessingResult[] = [];
      
      // Traiter chaque message
      for (const sqsMessage of receiveResult.Messages) {
        const startTime = Date.now();
        
        try {
          const queuedMessage: QueuedMessage = JSON.parse(sqsMessage.Body || '{}');
          
          // Vérifier le rate limiting avant processing
          const rateLimiter = await getEnhancedRateLimiter();
          const rateLimitCheck = await rateLimiter.enforceMessageLimits(
            queuedMessage.userId, 
            queuedMessage.recipientId
          );

          if (!rateLimitCheck.allowed) {
            // Rate limited - remettre en queue avec délai
            await this.requeueWithDelay(sqsMessage, queuedMessage, rateLimitCheck.retryAfter || 60);
            
            results.push({
              success: false,
              messageId: queuedMessage.id,
              processingTime: Date.now() - startTime,
              error: 'rate_limited',
              retryAfter: rateLimitCheck.retryAfter,
              finalAttempt: false
            });
            continue;
          }

          // Traiter le message
          const processingResult = await this.processMessage(queuedMessage);
          
          if (processingResult.success) {
            // Succès - supprimer de SQS
            await this.sqsClient.send(new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: sqsMessage.ReceiptHandle
            }));
            
            await this.updateMessageStatus(queuedMessage.id, 'sent');
            
            results.push({
              success: true,
              messageId: queuedMessage.id,
              processingTime: Date.now() - startTime,
              finalAttempt: true
            });
            
          } else {
            // Échec - retry ou DLQ
            const shouldRetry = queuedMessage.attempts < queuedMessage.maxRetries;
            
            if (shouldRetry) {
              await this.retryMessage(sqsMessage, queuedMessage, processingResult.error);
            } else {
              await this.moveToDeadLetterQueue(sqsMessage, queuedMessage, processingResult.error);
            }
            
            results.push({
              success: false,
              messageId: queuedMessage.id,
              processingTime: Date.now() - startTime,
              error: processingResult.error,
              finalAttempt: !shouldRetry
            });
          }

        } catch (error) {
          console.error(`[IntelligentQueueManager] Error processing message:`, error);
          
          results.push({
            success: false,
            messageId: 'unknown',
            processingTime: Date.now() - startTime,
            error: error.message,
            finalAttempt: true
          });
        }
      }

      // Envoyer métriques de batch
      await this.sendBatchMetrics(priority, results);
      
      return results;

    } catch (error) {
      console.error(`[IntelligentQueueManager] Error processing messages from ${priority} queue:`, error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de la queue
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      // Obtenir les stats depuis la base
      const [
        totalMessages,
        pendingMessages,
        processingMessages,
        failedMessages,
        completedMessages
      ] = await Promise.all([
        this.prisma.onlyFansMessage.count(),
        this.prisma.onlyFansMessage.count({ where: { status: 'queued' } }),
        this.prisma.onlyFansMessage.count({ where: { status: 'processing' } }),
        this.prisma.onlyFansMessage.count({ where: { status: 'failed' } }),
        this.prisma.onlyFansMessage.count({ where: { status: 'sent' } })
      ]);

      // Calculer le temps de processing moyen
      const avgProcessingTime = await this.getAverageProcessingTime();

      // Obtenir les breakdowns depuis Redis
      const [priorityBreakdown, messageTypeBreakdown] = await Promise.all([
        this.getPriorityBreakdown(),
        this.getMessageTypeBreakdown()
      ]);

      return {
        totalMessages,
        pendingMessages,
        processingMessages,
        failedMessages,
        completedMessages,
        averageProcessingTime: avgProcessingTime,
        priorityBreakdown,
        messageTypeBreakdown
      };

    } catch (error) {
      console.error('[IntelligentQueueManager] Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Purge les messages expirés et nettoie les queues
   */
  async cleanupExpiredMessages(): Promise<{ purged: number; errors: number }> {
    let purged = 0;
    let errors = 0;

    try {
      // Trouver les messages expirés (plus de 24h en queue)
      const expiredMessages = await this.prisma.onlyFansMessage.findMany({
        where: {
          status: 'queued',
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
          }
        }
      });

      for (const message of expiredMessages) {
        try {
          await this.prisma.onlyFansMessage.update({
            where: { id: message.id },
            data: { 
              status: 'expired',
              lastError: 'Message expired after 24 hours in queue'
            }
          });
          purged++;
        } catch (error) {
          console.error(`[IntelligentQueueManager] Error purging message ${message.id}:`, error);
          errors++;
        }
      }

      // Nettoyer les clés Redis expirées
      const redisKeys = await this.redis.keys('queue:*');
      for (const key of redisKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // Pas de TTL défini
          await this.redis.expire(key, 3600); // 1 heure par défaut
        }
      }

      console.log(`[IntelligentQueueManager] Cleanup completed: ${purged} purged, ${errors} errors`);
      
      return { purged, errors };

    } catch (error) {
      console.error('[IntelligentQueueManager] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Détermine la priorité d'un message
   */
  private determinePriority(
    messageType: QueuedMessage['messageType'], 
    requestedPriority: QueuedMessage['priority']
  ): QueuedMessage['priority'] {
    // La priorité par type de message prend le dessus
    const typePriority = this.MESSAGE_PRIORITIES[messageType];
    
    // Mais on peut upgrader si demandé explicitement
    if (requestedPriority === 'critical') {
      return 'critical';
    }
    
    if (requestedPriority === 'high' && typePriority !== 'low') {
      return 'high';
    }
    
    return typePriority as QueuedMessage['priority'];
  }

  /**
   * Sélectionne la queue SQS appropriée
   */
  private selectQueue(priority: QueuedMessage['priority']): string {
    // Pour l'instant, toutes les priorités utilisent la même queue FIFO
    // Dans une implémentation plus avancée, on pourrait avoir des queues séparées
    return this.QUEUES.HIGH_PRIORITY;
  }

  /**
   * Génère un MessageGroupId pour SQS FIFO
   */
  private getMessageGroupId(message: QueuedMessage): string {
    // Grouper par utilisateur pour maintenir l'ordre par user
    return `user_${message.userId}`;
  }

  /**
   * Persiste un message en base
   */
  private async persistMessage(message: QueuedMessage): Promise<void> {
    await this.prisma.onlyFansMessage.create({
      data: {
        workflowId: message.metadata.workflowId || message.id,
        userId: message.userId,
        recipientId: message.recipientId,
        content: message.content,
        attempts: message.attempts,
        maxRetries: message.maxRetries,
        scheduledFor: message.scheduledFor,
        status: 'pending'
      }
    });
  }

  /**
   * Met à jour le statut d'un message
   */
  private async updateMessageStatus(
    messageId: string, 
    status: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.prisma.onlyFansMessage.updateMany({
      where: { workflowId: messageId },
      data: {
        status,
        lastError: metadata?.error,
        sqsMessageId: metadata?.sqsMessageId,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Traite un message individuel
   */
  private async processMessage(message: QueuedMessage): Promise<{ success: boolean; error?: string }> {
    try {
      // Simuler le traitement du message
      // Dans une vraie implémentation, ceci appellerait l'OnlyFansGateway
      
      console.log(`[IntelligentQueueManager] Processing message ${message.id} for ${message.recipientId}`);
      
      // Simuler un délai de processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simuler un taux de succès de 90%
      if (Math.random() < 0.9) {
        return { success: true };
      } else {
        return { success: false, error: 'simulated_onlyfans_error' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remet un message en queue avec délai
   */
  private async requeueWithDelay(
    sqsMessage: any, 
    queuedMessage: QueuedMessage, 
    delaySeconds: number
  ): Promise<void> {
    // Changer la visibilité pour remettre en queue plus tard
    await this.sqsClient.send(new ChangeMessageVisibilityCommand({
      QueueUrl: this.selectQueue(queuedMessage.priority),
      ReceiptHandle: sqsMessage.ReceiptHandle,
      VisibilityTimeout: Math.min(delaySeconds, 43200) // Max 12 heures
    }));
    
    await this.updateMessageStatus(queuedMessage.id, 'rate_limited', {
      retryAfter: delaySeconds
    });
  }

  /**
   * Retry un message avec exponential backoff
   */
  private async retryMessage(
    sqsMessage: any, 
    queuedMessage: QueuedMessage, 
    error?: string
  ): Promise<void> {
    const attempt = queuedMessage.attempts + 1;
    const delay = Math.min(
      this.RETRY_CONFIG.baseDelayMs * Math.pow(this.RETRY_CONFIG.backoffMultiplier, attempt - 1),
      this.RETRY_CONFIG.maxDelayMs
    );
    
    // Ajouter du jitter
    const jitter = delay * this.RETRY_CONFIG.jitterFactor * Math.random();
    const finalDelay = Math.floor(delay + jitter);
    
    // Changer la visibilité pour retry plus tard
    await this.sqsClient.send(new ChangeMessageVisibilityCommand({
      QueueUrl: this.selectQueue(queuedMessage.priority),
      ReceiptHandle: sqsMessage.ReceiptHandle,
      VisibilityTimeout: Math.floor(finalDelay / 1000)
    }));
    
    await this.updateMessageStatus(queuedMessage.id, 'retrying', {
      error,
      attempt,
      retryAfter: Math.floor(finalDelay / 1000)
    });
    
    console.log(`[IntelligentQueueManager] Retrying message ${queuedMessage.id} in ${finalDelay}ms (attempt ${attempt})`);
  }

  /**
   * Déplace un message vers la Dead Letter Queue
   */
  private async moveToDeadLetterQueue(
    sqsMessage: any, 
    queuedMessage: QueuedMessage, 
    error?: string
  ): Promise<void> {
    // Supprimer de la queue principale
    await this.sqsClient.send(new DeleteMessageCommand({
      QueueUrl: this.selectQueue(queuedMessage.priority),
      ReceiptHandle: sqsMessage.ReceiptHandle
    }));
    
    // Ajouter à la DLQ
    await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: this.QUEUES.DLQ,
      MessageBody: JSON.stringify({
        ...queuedMessage,
        dlqTimestamp: new Date().toISOString(),
        finalError: error
      })
    }));
    
    await this.updateMessageStatus(queuedMessage.id, 'failed', { error });
    
    console.log(`[IntelligentQueueManager] Moved message ${queuedMessage.id} to DLQ after ${queuedMessage.attempts} attempts`);
  }

  /**
   * Envoie des métriques à CloudWatch
   */
  private async sendQueueMetrics(metricName: string, message: QueuedMessage): Promise<void> {
    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/QueueManager',
        MetricData: [{
          MetricName: metricName,
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Priority', Value: message.priority },
            { Name: 'MessageType', Value: message.messageType },
            { Name: 'UserId', Value: message.userId }
          ]
        }]
      }));
    } catch (error) {
      console.error('[IntelligentQueueManager] Failed to send metrics:', error);
    }
  }

  /**
   * Envoie des métriques de batch
   */
  private async sendBatchMetrics(priority: string, results: ProcessingResult[]): Promise<void> {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/QueueManager',
        MetricData: [
          {
            MetricName: 'BatchProcessed',
            Value: results.length,
            Unit: 'Count',
            Dimensions: [{ Name: 'Priority', Value: priority }]
          },
          {
            MetricName: 'BatchSuccessful',
            Value: successful,
            Unit: 'Count',
            Dimensions: [{ Name: 'Priority', Value: priority }]
          },
          {
            MetricName: 'BatchFailed',
            Value: failed,
            Unit: 'Count',
            Dimensions: [{ Name: 'Priority', Value: priority }]
          },
          {
            MetricName: 'AvgProcessingTime',
            Value: avgProcessingTime,
            Unit: 'Milliseconds',
            Dimensions: [{ Name: 'Priority', Value: priority }]
          }
        ]
      }));
    } catch (error) {
      console.error('[IntelligentQueueManager] Failed to send batch metrics:', error);
    }
  }

  // Méthodes utilitaires pour les stats
  private async getAverageProcessingTime(): Promise<number> {
    // Simplification - dans une vraie implémentation, ceci calculerait depuis les métriques
    return 150; // ms
  }

  private async getPriorityBreakdown(): Promise<QueueStats['priorityBreakdown']> {
    // Simplification - dans une vraie implémentation, ceci interrogerait Redis
    return {
      critical: 5,
      high: 25,
      medium: 45,
      low: 25
    };
  }

  private async getMessageTypeBreakdown(): Promise<QueueStats['messageTypeBreakdown']> {
    // Simplification - dans une vraie implémentation, ceci interrogerait Redis
    return {
      welcome: 30,
      follow_up: 40,
      promotional: 20,
      custom: 10
    };
  }

  /**
   * Send message to rate limiter queue
   * 
   * Sends a message to the dedicated rate limiter queue for OnlyFans messages.
   * The Lambda function will handle rate limiting (10 msg/min) automatically.
   * 
   * @param message - Queued message to send
   * @returns Result with messageId and success status
   */
  async sendToRateLimiterQueue(
    message: QueuedMessage
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      // Map QueuedMessage to RateLimiterPayload format expected by Lambda
      const rateLimiterPayload = {
        messageId: message.id,
        userId: message.userId,
        recipientId: message.recipientId,
        content: message.content,
        mediaUrls: message.metadata?.mediaUrls || [],
        timestamp: new Date().toISOString(),
        metadata: {
          source: message.metadata?.source || 'huntaze-app',
          workflowId: message.metadata?.workflowId,
          traceId: message.metadata?.traceId,
          priority: message.priority,
        },
      };

      // Send to SQS rate limiter queue
      const result = await this.sqsClient.send(new SendMessageCommand({
        QueueUrl: this.QUEUES.RATE_LIMITER,
        MessageBody: JSON.stringify(rateLimiterPayload),
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: message.userId,
          },
          priority: {
            DataType: 'String',
            StringValue: message.priority,
          },
          messageType: {
            DataType: 'String',
            StringValue: message.messageType,
          },
        },
      }));

      console.log('[IntelligentQueueManager] Message sent to rate limiter queue', {
        messageId: message.id,
        sqsMessageId: result.MessageId,
        queueUrl: this.QUEUES.RATE_LIMITER,
      });

      return {
        messageId: result.MessageId || message.id,
        success: true,
      };
    } catch (error) {
      console.error('[IntelligentQueueManager] Failed to send to rate limiter queue', {
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.redis.quit();
    await this.prisma.$disconnect();
  }
}

/**
 * Singleton instance
 */
let queueManagerInstance: IntelligentQueueManager | null = null;

export async function getIntelligentQueueManager(): Promise<IntelligentQueueManager> {
  if (!queueManagerInstance) {
    queueManagerInstance = new IntelligentQueueManager();
  }
  return queueManagerInstance;
}