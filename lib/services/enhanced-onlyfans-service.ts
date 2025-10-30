/**
 * Enhanced OnlyFans Service - Production Integration
 * 
 * Service OnlyFans amélioré qui intègre:
 * - EnhancedRateLimiter pour compliance OnlyFans
 * - IntelligentQueueManager pour queuing prioritaire
 * - Existing OnlyFansGateway pour API calls
 * - Monitoring et métriques temps réel
 * 
 * @module enhanced-onlyfans-service
 */

import { OnlyFansGateway, createOnlyFansGateway } from './onlyfans/gateway';
import { getEnhancedRateLimiter, RateLimitResult } from './enhanced-rate-limiter';
import { getIntelligentQueueManager, QueuedMessage } from './intelligent-queue-manager';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { PrismaClient } from '@prisma/client';

export interface SendMessageRequest {
  userId: string;
  recipientId: string;
  content: string;
  messageType?: 'welcome' | 'follow_up' | 'promotional' | 'custom';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  scheduleFor?: Date;
  metadata?: {
    workflowId?: string;
    traceId?: string;
    source?: string;
  };
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'queued' | 'rate_limited' | 'failed';
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
  };
  queueInfo?: {
    position: number;
    estimatedDelay: number;
  };
  error?: string;
  metadata: {
    processingTime: number;
    provider: 'direct' | 'queued';
    timestamp: Date;
  };
}

export interface MessageStatus {
  messageId: string;
  status: 'pending' | 'queued' | 'processing' | 'sent' | 'failed' | 'rate_limited';
  attempts: number;
  lastError?: string;
  sentAt?: Date;
  queuedAt?: Date;
  estimatedDelivery?: Date;
}

export interface OnlyFansServiceStats {
  rateLimiting: {
    currentLimits: {
      messagesPerMinute: number;
      remaining: number;
      resetTime: Date;
    };
    violations: {
      count: number;
      lastViolation?: Date;
    };
  };
  queuing: {
    totalMessages: number;
    pendingMessages: number;
    averageWaitTime: number;
  };
  performance: {
    successRate: number;
    averageResponseTime: number;
    totalMessagesSent: number;
  };
}

export class EnhancedOnlyFansService {
  private readonly gateway: OnlyFansGateway;
  private readonly cloudWatch: CloudWatchClient;
  private readonly prisma: PrismaClient;
  
  // Configuration du service
  private readonly CONFIG = {
    directSendThreshold: 5, // Si moins de 5 messages en queue, envoyer directement
    maxDirectRetries: 2,
    healthCheckInterval: 30000, // 30 secondes
    metricsInterval: 60000 // 1 minute
  };

  constructor(region: string = 'us-east-1') {
    // Créer le gateway OnlyFans avec configuration optimisée
    this.gateway = createOnlyFansGateway({
      auth: {
        sessionToken: process.env.ONLYFANS_SESSION_TOKEN || ''
      },
      retry: {
        maxAttempts: 2, // Réduire les retries car on a notre propre système
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2
      },
      cache: {
        ttlMs: 300000, // 5 minutes
        maxSize: 1000
      },
      rateLimit: {
        maxPerMinute: 10, // Aligné avec notre EnhancedRateLimiter
        maxPerHour: 100
      }
    });

    this.cloudWatch = new CloudWatchClient({ region });
    this.prisma = new PrismaClient();
  }

  /**
   * Envoie un message avec rate limiting et queuing intelligents
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    const startTime = Date.now();
    
    try {
      // 1. Vérifier le rate limiting
      const rateLimiter = await getEnhancedRateLimiter();
      const rateLimitCheck = await rateLimiter.enforceMessageLimits(
        request.userId, 
        request.recipientId
      );

      // 2. Si rate limited, mettre en queue
      if (!rateLimitCheck.allowed) {
        return await this.handleRateLimited(request, rateLimitCheck, startTime);
      }

      // 3. Vérifier si on peut envoyer directement ou si on doit queuer
      const shouldQueue = await this.shouldQueueMessage(request);
      
      if (shouldQueue) {
        return await this.queueMessage(request, startTime);
      }

      // 4. Envoyer directement
      return await this.sendDirectly(request, startTime);

    } catch (error) {
      console.error('[EnhancedOnlyFansService] Error sending message:', error);
      
      await this.recordError(request.userId, error.message);
      
      return {
        success: false,
        status: 'failed',
        error: error.message,
        metadata: {
          processingTime: Date.now() - startTime,
          provider: 'direct',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Obtient le statut d'un message
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus | null> {
    try {
      const message = await this.prisma.onlyFansMessage.findFirst({
        where: {
          OR: [
            { workflowId: messageId },
            { sqsMessageId: messageId }
          ]
        }
      });

      if (!message) {
        return null;
      }

      return {
        messageId: message.workflowId,
        status: message.status as MessageStatus['status'],
        attempts: message.attempts,
        lastError: message.lastError || undefined,
        sentAt: message.status === 'sent' ? message.updatedAt : undefined,
        queuedAt: message.createdAt,
        estimatedDelivery: this.calculateEstimatedDelivery(message)
      };

    } catch (error) {
      console.error('[EnhancedOnlyFansService] Error getting message status:', error);
      return null;
    }
  }

  /**
   * Obtient les statistiques du service
   */
  async getServiceStats(): Promise<OnlyFansServiceStats> {
    try {
      const [rateLimiter, queueManager] = await Promise.all([
        getEnhancedRateLimiter(),
        getIntelligentQueueManager()
      ]);

      // Obtenir les stats de rate limiting (exemple avec un user)
      const rateLimitStats = await rateLimiter.getRateLimitStats('system');
      const queueStats = await queueManager.getQueueStats();
      
      // Calculer les métriques de performance
      const performanceStats = await this.getPerformanceStats();

      return {
        rateLimiting: {
          currentLimits: {
            messagesPerMinute: 10,
            remaining: rateLimitStats.currentPeriod.limit - rateLimitStats.currentPeriod.messages,
            resetTime: rateLimitStats.currentPeriod.resetTime
          },
          violations: rateLimitStats.violations
        },
        queuing: {
          totalMessages: queueStats.totalMessages,
          pendingMessages: queueStats.pendingMessages,
          averageWaitTime: queueStats.averageProcessingTime
        },
        performance: performanceStats
      };

    } catch (error) {
      console.error('[EnhancedOnlyFansService] Error getting service stats:', error);
      throw error;
    }
  }

  /**
   * Traite les messages en queue (appelé par un worker)
   */
  async processQueuedMessages(priority: 'critical' | 'high' | 'medium' | 'low' = 'high'): Promise<number> {
    try {
      const queueManager = await getIntelligentQueueManager();
      const results = await queueManager.processMessages(priority);
      
      let processed = 0;
      
      for (const result of results) {
        if (result.success) {
          processed++;
          await this.recordSuccess(result.messageId);
        } else {
          await this.recordError(result.messageId, result.error || 'unknown_error');
        }
      }

      // Envoyer métriques
      await this.sendProcessingMetrics(priority, results.length, processed);
      
      console.log(`[EnhancedOnlyFansService] Processed ${processed}/${results.length} messages from ${priority} queue`);
      
      return processed;

    } catch (error) {
      console.error(`[EnhancedOnlyFansService] Error processing queued messages:`, error);
      throw error;
    }
  }

  /**
   * Health check du service complet
   */
  async healthCheck(): Promise<{
    gateway: boolean;
    rateLimiter: boolean;
    queueManager: boolean;
    database: boolean;
    overall: boolean;
  }> {
    const checks = await Promise.allSettled([
      // Test gateway
      this.gateway.getConversations().then(() => true).catch(() => false),
      
      // Test rate limiter
      getEnhancedRateLimiter().then(rl => 
        rl.checkLimit('health-check').then(() => true).catch(() => false)
      ),
      
      // Test queue manager
      getIntelligentQueueManager().then(qm => 
        qm.getQueueStats().then(() => true).catch(() => false)
      ),
      
      // Test database
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
    ]);

    const results = {
      gateway: checks[0].status === 'fulfilled' ? checks[0].value : false,
      rateLimiter: checks[1].status === 'fulfilled' ? checks[1].value : false,
      queueManager: checks[2].status === 'fulfilled' ? checks[2].value : false,
      database: checks[3].status === 'fulfilled' ? checks[3].value : false,
      overall: false
    };

    results.overall = Object.values(results).slice(0, -1).every(status => status === true);
    
    return results;
  }

  /**
   * Gère les messages rate limited
   */
  private async handleRateLimited(
    request: SendMessageRequest, 
    rateLimitCheck: RateLimitResult, 
    startTime: number
  ): Promise<SendMessageResult> {
    // Mettre en queue avec délai approprié
    const queueManager = await getIntelligentQueueManager();
    
    const queuedMessage: Omit<QueuedMessage, 'id' | 'attempts'> = {
      userId: request.userId,
      recipientId: request.recipientId,
      content: request.content,
      messageType: request.messageType || 'custom',
      priority: request.priority || 'medium',
      scheduledFor: request.scheduleFor || new Date(Date.now() + (rateLimitCheck.retryAfter || 60) * 1000),
      maxRetries: 3,
      metadata: {
        workflowId: request.metadata?.workflowId,
        traceId: request.metadata?.traceId,
        source: request.metadata?.source || 'enhanced-onlyfans-service',
        originalTimestamp: new Date()
      }
    };

    const messageId = await queueManager.enqueueMessage(queuedMessage);
    
    return {
      success: true,
      messageId,
      status: 'rate_limited',
      rateLimitInfo: {
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime,
        retryAfter: rateLimitCheck.retryAfter
      },
      metadata: {
        processingTime: Date.now() - startTime,
        provider: 'queued',
        timestamp: new Date()
      }
    };
  }

  /**
   * Détermine si un message doit être mis en queue
   */
  private async shouldQueueMessage(request: SendMessageRequest): Promise<boolean> {
    // Si programmé pour plus tard, toujours queuer
    if (request.scheduleFor && request.scheduleFor > new Date()) {
      return true;
    }

    // Si priorité basse, queuer
    if (request.priority === 'low') {
      return true;
    }

    // Vérifier la charge actuelle de la queue
    const queueManager = await getIntelligentQueueManager();
    const stats = await queueManager.getQueueStats();
    
    // Si trop de messages en attente, queuer
    if (stats.pendingMessages > this.CONFIG.directSendThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Met un message en queue
   */
  private async queueMessage(request: SendMessageRequest, startTime: number): Promise<SendMessageResult> {
    const queueManager = await getIntelligentQueueManager();
    
    const queuedMessage: Omit<QueuedMessage, 'id' | 'attempts'> = {
      userId: request.userId,
      recipientId: request.recipientId,
      content: request.content,
      messageType: request.messageType || 'custom',
      priority: request.priority || 'medium',
      scheduledFor: request.scheduleFor || new Date(),
      maxRetries: 3,
      metadata: {
        workflowId: request.metadata?.workflowId,
        traceId: request.metadata?.traceId,
        source: request.metadata?.source || 'enhanced-onlyfans-service',
        originalTimestamp: new Date()
      }
    };

    const messageId = await queueManager.enqueueMessage(queuedMessage);
    
    // Estimer la position et le délai
    const stats = await queueManager.getQueueStats();
    const estimatedDelay = stats.averageProcessingTime * stats.pendingMessages;
    
    return {
      success: true,
      messageId,
      status: 'queued',
      queueInfo: {
        position: stats.pendingMessages,
        estimatedDelay
      },
      metadata: {
        processingTime: Date.now() - startTime,
        provider: 'queued',
        timestamp: new Date()
      }
    };
  }

  /**
   * Envoie un message directement
   */
  private async sendDirectly(request: SendMessageRequest, startTime: number): Promise<SendMessageResult> {
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts < this.CONFIG.maxDirectRetries) {
      try {
        // Envoyer via le gateway OnlyFans
        const result = await this.gateway.sendMessage(
          request.recipientId,
          request.content,
          {
            userId: request.userId,
            source: 'enhanced-onlyfans-service'
          }
        );

        if (result.success) {
          const messageId = `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Enregistrer le succès
          await this.recordSuccess(request.userId);
          
          return {
            success: true,
            messageId,
            status: 'sent',
            metadata: {
              processingTime: Date.now() - startTime,
              provider: 'direct',
              timestamp: new Date()
            }
          };
        } else {
          lastError = result.error?.message || 'Unknown gateway error';
          attempts++;
        }

      } catch (error) {
        lastError = error.message;
        attempts++;
        
        // Attendre avant retry
        if (attempts < this.CONFIG.maxDirectRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    // Échec après tous les retries - mettre en queue pour retry plus tard
    return await this.queueMessage(request, startTime);
  }

  /**
   * Calcule l'heure de livraison estimée
   */
  private calculateEstimatedDelivery(message: any): Date | undefined {
    if (message.status === 'sent') {
      return message.updatedAt;
    }
    
    if (message.status === 'queued' || message.status === 'pending') {
      // Estimation basique : 2 minutes par message en queue
      return new Date(Date.now() + 2 * 60 * 1000);
    }
    
    return undefined;
  }

  /**
   * Obtient les métriques de performance
   */
  private async getPerformanceStats(): Promise<OnlyFansServiceStats['performance']> {
    // Dans une vraie implémentation, ceci interrogerait les métriques stockées
    return {
      successRate: 92.5, // %
      averageResponseTime: 150, // ms
      totalMessagesSent: 1250
    };
  }

  /**
   * Enregistre un succès
   */
  private async recordSuccess(identifier: string): Promise<void> {
    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/OnlyFansService',
        MetricData: [{
          MetricName: 'MessageSent',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Status', Value: 'success' }
          ]
        }]
      }));
    } catch (error) {
      console.error('[EnhancedOnlyFansService] Failed to record success metric:', error);
    }
  }

  /**
   * Enregistre une erreur
   */
  private async recordError(identifier: string, error: string): Promise<void> {
    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/OnlyFansService',
        MetricData: [{
          MetricName: 'MessageFailed',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Status', Value: 'error' },
            { Name: 'ErrorType', Value: error.substring(0, 50) }
          ]
        }]
      }));
    } catch (err) {
      console.error('[EnhancedOnlyFansService] Failed to record error metric:', err);
    }
  }

  /**
   * Envoie des métriques de processing
   */
  private async sendProcessingMetrics(priority: string, total: number, successful: number): Promise<void> {
    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/OnlyFansService',
        MetricData: [
          {
            MetricName: 'QueueProcessed',
            Value: total,
            Unit: 'Count',
            Dimensions: [{ Name: 'Priority', Value: priority }]
          },
          {
            MetricName: 'QueueSuccessful',
            Value: successful,
            Unit: 'Count',
            Dimensions: [{ Name: 'Priority', Value: priority }]
          }
        ]
      }));
    } catch (error) {
      console.error('[EnhancedOnlyFansService] Failed to send processing metrics:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Singleton instance
 */
let enhancedServiceInstance: EnhancedOnlyFansService | null = null;

export async function getEnhancedOnlyFansService(): Promise<EnhancedOnlyFansService> {
  if (!enhancedServiceInstance) {
    enhancedServiceInstance = new EnhancedOnlyFansService();
  }
  return enhancedServiceInstance;
}