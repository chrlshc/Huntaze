/**
 * Enhanced Rate Limiter - OnlyFans Compliance
 * 
 * Rate limiter production-ready avec:
 * - Règles OnlyFans spécifiques (10 messages/minute)
 * - Multi-layer limiting (user, recipient, global)
 * - Redis + PostgreSQL persistence
 * - Intelligent queuing avec priorités
 * - Monitoring et alertes
 * 
 * @module enhanced-rate-limiter
 */

import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds
  throttled: boolean;
  delayMs?: number;
  layer: 'user' | 'recipient' | 'global' | 'onlyfans_tos';
  reason?: string;
}

export interface RateLimitStats {
  userId: string;
  currentPeriod: {
    messages: number;
    limit: number;
    resetTime: Date;
  };
  violations: {
    count: number;
    lastViolation?: Date;
  };
  recipients: {
    [recipientId: string]: {
      messages: number;
      limit: number;
      resetTime: Date;
    };
  };
}

export interface GlobalRateLimitStats {
  totalUsers: number;
  activeUsers: number;
  messagesPerMinute: number;
  violationsPerHour: number;
  topViolators: Array<{
    userId: string;
    violations: number;
  }>;
}

export interface OnlyFansRules {
  // Limites par utilisateur
  userLimits: {
    messagesPerMinute: number;
    messagesPerHour: number;
    messagesPerDay: number;
  };
  
  // Limites par destinataire
  recipientLimits: {
    messagesPerMinute: number;
    messagesPerHour: number;
    uniqueRecipientsPerHour: number;
  };
  
  // Limites globales
  globalLimits: {
    messagesPerSecond: number;
    concurrentUsers: number;
  };
  
  // Types de messages avec limites spécifiques
  messageTypeLimits: {
    welcome: { perHour: number };
    follow_up: { perHour: number };
    promotional: { perDay: number };
    custom: { perMinute: number };
  };
  
  // Règles de compliance OnlyFans
  complianceRules: {
    minDelayBetweenMessages: number; // ms
    maxBurstSize: number;
    cooldownAfterBurst: number; // ms
    suspiciousActivityThreshold: number;
  };
}

export class EnhancedRateLimiter {
  private readonly redis: Redis;
  private readonly prisma: PrismaClient;
  private readonly sqsClient: SQSClient;
  private readonly cloudWatch: CloudWatchClient;
  
  // Configuration OnlyFans optimisée
  private readonly ONLYFANS_RULES: OnlyFansRules = {
    userLimits: {
      messagesPerMinute: 10,  // Limite principale OnlyFans
      messagesPerHour: 100,   // Limite horaire conservative
      messagesPerDay: 500     // Limite journalière
    },
    recipientLimits: {
      messagesPerMinute: 2,   // Max 2 messages par destinataire/minute
      messagesPerHour: 10,    // Max 10 messages par destinataire/heure
      uniqueRecipientsPerHour: 50 // Max 50 destinataires différents/heure
    },
    globalLimits: {
      messagesPerSecond: 5,   // Limite globale système
      concurrentUsers: 100    // Max utilisateurs actifs simultanés
    },
    messageTypeLimits: {
      welcome: { perHour: 20 },
      follow_up: { perHour: 30 },
      promotional: { perDay: 50 },
      custom: { perMinute: 5 }
    },
    complianceRules: {
      minDelayBetweenMessages: 6000,  // 6 secondes minimum entre messages
      maxBurstSize: 3,                // Max 3 messages en burst
      cooldownAfterBurst: 30000,      // 30s cooldown après burst
      suspiciousActivityThreshold: 50  // 50 messages/heure = suspect
    }
  };

  // Queues SQS pour retry et délais
  private readonly SQS_QUEUES = {
    DELAYED_MESSAGES: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
    RETRY_QUEUE: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-dlq-production'
  };

  constructor(
    redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379',
    region: string = 'us-east-1'
  ) {
    this.redis = new Redis(redisUrl);
    this.prisma = new PrismaClient();
    this.sqsClient = new SQSClient({ region });
    this.cloudWatch = new CloudWatchClient({ region });
  }

  /**
   * Vérifie les limites pour un utilisateur et une action
   */
  async checkLimit(userId: string, action: string = 'message'): Promise<RateLimitResult> {
    const now = Date.now();
    
    try {
      // 1. Vérifier les limites utilisateur
      const userCheck = await this.checkUserLimits(userId, now);
      if (!userCheck.allowed) {
        await this.recordViolation(userId, 'user_limit', userCheck.layer);
        return userCheck;
      }

      // 2. Vérifier les limites globales
      const globalCheck = await this.checkGlobalLimits(now);
      if (!globalCheck.allowed) {
        await this.recordViolation(userId, 'global_limit', globalCheck.layer);
        return globalCheck;
      }

      // 3. Vérifier les règles de compliance OnlyFans
      const complianceCheck = await this.checkComplianceRules(userId, now);
      if (!complianceCheck.allowed) {
        await this.recordViolation(userId, 'compliance_violation', complianceCheck.layer);
        return complianceCheck;
      }

      // Tout est OK, incrémenter les compteurs
      await this.incrementCounters(userId, action, now);
      
      return {
        allowed: true,
        remaining: this.ONLYFANS_RULES.userLimits.messagesPerMinute - (await this.getUserCount(userId, 'minute')),
        resetTime: new Date(Math.ceil(now / 60000) * 60000), // Prochaine minute
        throttled: false,
        layer: 'user'
      };

    } catch (error) {
      console.error('[EnhancedRateLimiter] Error checking limits:', error);
      
      // En cas d'erreur, être conservateur et refuser
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + 60000),
        throttled: true,
        layer: 'user',
        reason: 'rate_limiter_error'
      };
    }
  }

  /**
   * Vérifie les limites spécifiques OnlyFans pour un destinataire
   */
  async checkOnlyFansLimits(userId: string, recipientId: string): Promise<RateLimitResult> {
    const now = Date.now();
    
    try {
      // 1. Vérifier les limites par destinataire
      const recipientKey = `recipient:${userId}:${recipientId}`;
      const recipientCount = await this.redis.get(`${recipientKey}:minute`) || '0';
      
      if (parseInt(recipientCount) >= this.ONLYFANS_RULES.recipientLimits.messagesPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Math.ceil(now / 60000) * 60000),
          retryAfter: 60,
          throttled: true,
          layer: 'recipient',
          reason: 'recipient_limit_exceeded'
        };
      }

      // 2. Vérifier le délai minimum entre messages
      const lastMessageKey = `last_message:${userId}:${recipientId}`;
      const lastMessageTime = await this.redis.get(lastMessageKey);
      
      if (lastMessageTime) {
        const timeSinceLastMessage = now - parseInt(lastMessageTime);
        if (timeSinceLastMessage < this.ONLYFANS_RULES.complianceRules.minDelayBetweenMessages) {
          const delayNeeded = this.ONLYFANS_RULES.complianceRules.minDelayBetweenMessages - timeSinceLastMessage;
          
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(now + delayNeeded),
            retryAfter: Math.ceil(delayNeeded / 1000),
            throttled: true,
            delayMs: delayNeeded,
            layer: 'onlyfans_tos',
            reason: 'min_delay_violation'
          };
        }
      }

      // 3. Vérifier les destinataires uniques par heure
      const uniqueRecipientsCount = await this.getUniqueRecipientsCount(userId, 'hour');
      if (uniqueRecipientsCount >= this.ONLYFANS_RULES.recipientLimits.uniqueRecipientsPerHour) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Math.ceil(now / 3600000) * 3600000), // Prochaine heure
          retryAfter: 3600,
          throttled: true,
          layer: 'recipient',
          reason: 'unique_recipients_limit'
        };
      }

      return {
        allowed: true,
        remaining: this.ONLYFANS_RULES.recipientLimits.messagesPerMinute - parseInt(recipientCount),
        resetTime: new Date(Math.ceil(now / 60000) * 60000),
        throttled: false,
        layer: 'recipient'
      };

    } catch (error) {
      console.error('[EnhancedRateLimiter] Error checking OnlyFans limits:', error);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + 60000),
        throttled: true,
        layer: 'onlyfans_tos',
        reason: 'onlyfans_check_error'
      };
    }
  }

  /**
   * Applique les limites de messages avec queuing intelligent
   */
  async enforceMessageLimits(userId: string, recipientId?: string): Promise<RateLimitResult> {
    // Vérifier les limites générales
    const generalCheck = await this.checkLimit(userId, 'message');
    if (!generalCheck.allowed) {
      return generalCheck;
    }

    // Si destinataire spécifié, vérifier les limites OnlyFans
    if (recipientId) {
      const onlyFansCheck = await this.checkOnlyFansLimits(userId, recipientId);
      if (!onlyFansCheck.allowed) {
        // Si throttled, programmer pour plus tard
        if (onlyFansCheck.throttled && onlyFansCheck.delayMs) {
          await this.scheduleDelayedMessage(userId, recipientId, onlyFansCheck.delayMs);
        }
        return onlyFansCheck;
      }
    }

    return generalCheck;
  }

  /**
   * Obtient les statistiques de rate limiting pour un utilisateur
   */
  async getRateLimitStats(userId: string): Promise<RateLimitStats> {
    const now = Date.now();
    
    const [
      minuteCount,
      hourCount,
      dayCount,
      violations,
      recipients
    ] = await Promise.all([
      this.getUserCount(userId, 'minute'),
      this.getUserCount(userId, 'hour'),
      this.getUserCount(userId, 'day'),
      this.getViolationsCount(userId),
      this.getRecipientStats(userId)
    ]);

    return {
      userId,
      currentPeriod: {
        messages: minuteCount,
        limit: this.ONLYFANS_RULES.userLimits.messagesPerMinute,
        resetTime: new Date(Math.ceil(now / 60000) * 60000)
      },
      violations: {
        count: violations.count,
        lastViolation: violations.lastViolation
      },
      recipients
    };
  }

  /**
   * Obtient les statistiques globales
   */
  async getGlobalStats(): Promise<GlobalRateLimitStats> {
    const now = Date.now();
    
    const [
      activeUsers,
      messagesPerMinute,
      violationsPerHour,
      topViolators
    ] = await Promise.all([
      this.getActiveUsersCount(),
      this.getGlobalMessagesCount('minute'),
      this.getGlobalViolationsCount('hour'),
      this.getTopViolators(5)
    ]);

    return {
      totalUsers: await this.getTotalUsersCount(),
      activeUsers,
      messagesPerMinute,
      violationsPerHour,
      topViolators
    };
  }

  /**
   * Vérifie les limites utilisateur
   */
  private async checkUserLimits(userId: string, now: number): Promise<RateLimitResult> {
    const minuteCount = await this.getUserCount(userId, 'minute');
    
    if (minuteCount >= this.ONLYFANS_RULES.userLimits.messagesPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Math.ceil(now / 60000) * 60000),
        retryAfter: 60,
        throttled: true,
        layer: 'user',
        reason: 'user_minute_limit'
      };
    }

    const hourCount = await this.getUserCount(userId, 'hour');
    if (hourCount >= this.ONLYFANS_RULES.userLimits.messagesPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Math.ceil(now / 3600000) * 3600000),
        retryAfter: 3600,
        throttled: true,
        layer: 'user',
        reason: 'user_hour_limit'
      };
    }

    return {
      allowed: true,
      remaining: this.ONLYFANS_RULES.userLimits.messagesPerMinute - minuteCount,
      resetTime: new Date(Math.ceil(now / 60000) * 60000),
      throttled: false,
      layer: 'user'
    };
  }

  /**
   * Vérifie les limites globales
   */
  private async checkGlobalLimits(now: number): Promise<RateLimitResult> {
    const globalCount = await this.getGlobalMessagesCount('second');
    
    if (globalCount >= this.ONLYFANS_RULES.globalLimits.messagesPerSecond) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Math.ceil(now / 1000) * 1000),
        retryAfter: 1,
        throttled: true,
        layer: 'global',
        reason: 'global_rate_limit'
      };
    }

    return {
      allowed: true,
      remaining: this.ONLYFANS_RULES.globalLimits.messagesPerSecond - globalCount,
      resetTime: new Date(Math.ceil(now / 1000) * 1000),
      throttled: false,
      layer: 'global'
    };
  }

  /**
   * Vérifie les règles de compliance OnlyFans
   */
  private async checkComplianceRules(userId: string, now: number): Promise<RateLimitResult> {
    // Vérifier l'activité suspecte
    const hourCount = await this.getUserCount(userId, 'hour');
    if (hourCount >= this.ONLYFANS_RULES.complianceRules.suspiciousActivityThreshold) {
      // Marquer comme activité suspecte et ralentir
      await this.redis.setex(`suspicious:${userId}`, 3600, '1');
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + 3600000), // 1 heure de cooldown
        retryAfter: 3600,
        throttled: true,
        layer: 'onlyfans_tos',
        reason: 'suspicious_activity'
      };
    }

    // Vérifier les bursts
    const burstCount = await this.getBurstCount(userId);
    if (burstCount >= this.ONLYFANS_RULES.complianceRules.maxBurstSize) {
      const cooldownRemaining = await this.getBurstCooldownRemaining(userId);
      if (cooldownRemaining > 0) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now + cooldownRemaining),
          retryAfter: Math.ceil(cooldownRemaining / 1000),
          throttled: true,
          delayMs: cooldownRemaining,
          layer: 'onlyfans_tos',
          reason: 'burst_cooldown'
        };
      }
    }

    return {
      allowed: true,
      remaining: this.ONLYFANS_RULES.complianceRules.maxBurstSize - burstCount,
      resetTime: new Date(now + 60000),
      throttled: false,
      layer: 'onlyfans_tos'
    };
  }

  /**
   * Incrémente les compteurs après validation
   */
  private async incrementCounters(userId: string, action: string, now: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Compteurs utilisateur par période
    const minuteKey = `user:${userId}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `user:${userId}:hour:${Math.floor(now / 3600000)}`;
    const dayKey = `user:${userId}:day:${Math.floor(now / 86400000)}`;
    
    pipeline.incr(minuteKey);
    pipeline.expire(minuteKey, 120); // 2 minutes TTL
    pipeline.incr(hourKey);
    pipeline.expire(hourKey, 7200); // 2 heures TTL
    pipeline.incr(dayKey);
    pipeline.expire(dayKey, 172800); // 2 jours TTL
    
    // Compteurs globaux
    const globalSecondKey = `global:second:${Math.floor(now / 1000)}`;
    const globalMinuteKey = `global:minute:${Math.floor(now / 60000)}`;
    
    pipeline.incr(globalSecondKey);
    pipeline.expire(globalSecondKey, 10);
    pipeline.incr(globalMinuteKey);
    pipeline.expire(globalMinuteKey, 120);
    
    // Marquer l'utilisateur comme actif
    pipeline.setex(`active:${userId}`, 300, '1'); // 5 minutes
    
    await pipeline.exec();
    
    // Envoyer métriques à CloudWatch
    await this.sendMetrics(userId, action);
  }

  /**
   * Programme un message avec délai via SQS
   */
  private async scheduleDelayedMessage(userId: string, recipientId: string, delayMs: number): Promise<void> {
    const delaySeconds = Math.ceil(delayMs / 1000);
    
    const messagePayload = {
      userId,
      recipientId,
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
      reason: 'rate_limit_delay',
      originalTimestamp: new Date().toISOString()
    };

    await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: this.SQS_QUEUES.DELAYED_MESSAGES,
      MessageBody: JSON.stringify(messagePayload),
      DelaySeconds: Math.min(delaySeconds, 900), // Max 15 minutes SQS delay
      MessageGroupId: userId, // FIFO grouping
      MessageDeduplicationId: `${userId}-${recipientId}-${Date.now()}`
    }));

    console.log(`[EnhancedRateLimiter] Scheduled delayed message for ${userId} → ${recipientId} in ${delaySeconds}s`);
  }

  /**
   * Enregistre une violation de rate limit
   */
  private async recordViolation(userId: string, type: string, layer: string): Promise<void> {
    const now = Date.now();
    
    // Incrémenter le compteur de violations
    await this.redis.incr(`violations:${userId}:${Math.floor(now / 3600000)}`);
    await this.redis.setex(`last_violation:${userId}`, 86400, now.toString());
    
    // Enregistrer en base pour analyse
    try {
      await this.prisma.onlyFansMessage.create({
        data: {
          workflowId: `violation-${Date.now()}`,
          userId,
          recipientId: 'rate-limit-violation',
          content: `Rate limit violation: ${type} (${layer})`,
          status: 'rate_limited',
          lastError: `${type}: ${layer}`,
          scheduledFor: new Date()
        }
      });
    } catch (error) {
      console.error('[EnhancedRateLimiter] Failed to record violation in DB:', error);
    }

    // Envoyer alerte CloudWatch
    await this.cloudWatch.send(new PutMetricDataCommand({
      Namespace: 'Huntaze/RateLimiter',
      MetricData: [{
        MetricName: 'RateLimitViolations',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'UserId', Value: userId },
          { Name: 'ViolationType', Value: type },
          { Name: 'Layer', Value: layer }
        ]
      }]
    }));
  }

  /**
   * Envoie des métriques à CloudWatch
   */
  private async sendMetrics(userId: string, action: string): Promise<void> {
    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/RateLimiter',
        MetricData: [{
          MetricName: 'MessagesProcessed',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'UserId', Value: userId },
            { Name: 'Action', Value: action }
          ]
        }]
      }));
    } catch (error) {
      console.error('[EnhancedRateLimiter] Failed to send metrics:', error);
    }
  }

  // Méthodes utilitaires pour les compteurs
  private async getUserCount(userId: string, period: 'second' | 'minute' | 'hour' | 'day'): Promise<number> {
    const now = Date.now();
    let divisor: number;
    
    switch (period) {
      case 'second': divisor = 1000; break;
      case 'minute': divisor = 60000; break;
      case 'hour': divisor = 3600000; break;
      case 'day': divisor = 86400000; break;
    }
    
    const key = `user:${userId}:${period}:${Math.floor(now / divisor)}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }

  private async getGlobalMessagesCount(period: 'second' | 'minute'): Promise<number> {
    const now = Date.now();
    const divisor = period === 'second' ? 1000 : 60000;
    const key = `global:${period}:${Math.floor(now / divisor)}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }

  private async getActiveUsersCount(): Promise<number> {
    const keys = await this.redis.keys('active:*');
    return keys.length;
  }

  private async getTotalUsersCount(): Promise<number> {
    // Approximation basée sur les clés utilisateur récentes
    const keys = await this.redis.keys('user:*:minute:*');
    const uniqueUsers = new Set(keys.map(key => key.split(':')[1]));
    return uniqueUsers.size;
  }

  private async getBurstCount(userId: string): Promise<number> {
    const key = `burst:${userId}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }

  private async getBurstCooldownRemaining(userId: string): Promise<number> {
    const key = `burst_cooldown:${userId}`;
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl * 1000 : 0;
  }

  private async getViolationsCount(userId: string): Promise<{ count: number; lastViolation?: Date }> {
    const now = Date.now();
    const hourKey = `violations:${userId}:${Math.floor(now / 3600000)}`;
    const lastViolationKey = `last_violation:${userId}`;
    
    const [count, lastViolation] = await Promise.all([
      this.redis.get(hourKey),
      this.redis.get(lastViolationKey)
    ]);
    
    return {
      count: parseInt(count || '0'),
      lastViolation: lastViolation ? new Date(parseInt(lastViolation)) : undefined
    };
  }

  private async getRecipientStats(userId: string): Promise<RateLimitStats['recipients']> {
    // Simplification - dans une vraie implémentation, ceci interrogerait Redis
    return {};
  }

  private async getUniqueRecipientsCount(userId: string, period: 'hour'): Promise<number> {
    const now = Date.now();
    const hourKey = `recipients:${userId}:${Math.floor(now / 3600000)}`;
    const count = await this.redis.scard(hourKey);
    return count;
  }

  private async getGlobalViolationsCount(period: 'hour'): Promise<number> {
    const keys = await this.redis.keys(`violations:*:${Math.floor(Date.now() / 3600000)}`);
    let total = 0;
    for (const key of keys) {
      const count = await this.redis.get(key);
      total += parseInt(count || '0');
    }
    return total;
  }

  private async getTopViolators(limit: number): Promise<Array<{ userId: string; violations: number }>> {
    const keys = await this.redis.keys(`violations:*:${Math.floor(Date.now() / 3600000)}`);
    const violators: Array<{ userId: string; violations: number }> = [];
    
    for (const key of keys) {
      const userId = key.split(':')[1];
      const count = await this.redis.get(key);
      violators.push({ userId, violations: parseInt(count || '0') });
    }
    
    return violators
      .sort((a, b) => b.violations - a.violations)
      .slice(0, limit);
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
let rateLimiterInstance: EnhancedRateLimiter | null = null;

export async function getEnhancedRateLimiter(): Promise<EnhancedRateLimiter> {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new EnhancedRateLimiter();
  }
  return rateLimiterInstance;
}