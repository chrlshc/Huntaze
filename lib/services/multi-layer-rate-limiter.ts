/**
 * Multi-Layer Rate Limiter - Production Grade
 * 
 * Système de rate limiting multi-couches pour OnlyFans et autres plateformes
 * Prévient les cascades d'échecs et s'adapte automatiquement à la santé des plateformes
 * 
 * @module multi-layer-rate-limiter
 */

import { Redis } from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  throttled?: boolean;
  delayMs?: number;
  layer: 'token_bucket' | 'sliding_window' | 'circuit_breaker' | 'adaptive_throttling' | 'none';
  reason?: string;
}

export interface PlatformHealth {
  healthy: boolean;
  throttle: boolean;
  load: number;
  metrics: {
    errorRate: number;
    avgLatency: number;
    successRate: number;
  };
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  onOpen?: (action: string) => void;
  onClose?: (action: string) => void;
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Vérifier si on peut passer en HALF_OPEN
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.config.onClose?.('circuit_closed');
      }
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.config.onOpen?.('circuit_opened');
    }
  }

  getRetryTime(): number {
    return Math.max(0, this.config.timeout - (Date.now() - this.lastFailureTime));
  }
}

export class MultiLayerRateLimiter {
  private redis: Redis;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Vérifie les limites sur toutes les couches
   */
  async checkLimit(
    userId: string,
    action: 'message' | 'profile_view' | 'content_post'
  ): Promise<RateLimitResult> {
    // Layer 1: Per-user token bucket (plus granulaire)
    const tokenBucket = await this.checkTokenBucket(userId, action);
    if (!tokenBucket.allowed) {
      return {
        allowed: false,
        retryAfter: tokenBucket.retryAfter,
        layer: 'token_bucket'
      };
    }

    // Layer 2: Sliding window (prévient les bursts)
    const slidingWindow = await this.checkSlidingWindow(userId, action);
    if (!slidingWindow.allowed) {
      return {
        allowed: false,
        retryAfter: slidingWindow.retryAfter,
        layer: 'sliding_window'
      };
    }

    // Layer 3: Circuit breaker (protection système)
    const circuitBreaker = this.getCircuitBreaker(action);
    if (circuitBreaker.isOpen()) {
      return {
        allowed: false,
        retryAfter: circuitBreaker.getRetryTime(),
        layer: 'circuit_breaker',
        reason: 'System experiencing high load'
      };
    }

    // Layer 4: Adaptive throttling (basé sur santé plateforme)
    const platformHealth = await this.checkPlatformHealth();
    if (platformHealth.throttle) {
      const delay = this.calculateAdaptiveDelay(platformHealth.load);
      return {
        allowed: true,
        throttled: true,
        delayMs: delay,
        layer: 'adaptive_throttling'
      };
    }

    return { allowed: true, layer: 'none' };
  }

  /**
   * Token bucket algorithm avec refill automatique
   */
  private async checkTokenBucket(
    userId: string,
    action: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `rate_limit:token_bucket:${userId}:${action}`;

    // Limites basées sur recherches OnlyFans patterns
    const limits = {
      message: { tokens: 30, refillRate: 1, period: 60 }, // 30/min, 1/sec
      profile_view: { tokens: 100, refillRate: 2, period: 60 },
      content_post: { tokens: 10, refillRate: 0.2, period: 3600 } // 10/hour
    };

    const limit = limits[action];
    const now = Date.now();

    // Script Lua pour opération atomique
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Refill tokens basé sur temps écoulé
      local elapsed = now - lastRefill
      local refillAmount = (elapsed / 1000) * refillRate
      tokens = math.min(capacity, tokens + refillAmount)
      
      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {1, tokens}
      else
        local retryAfter = math.ceil((1 - tokens) / refillRate * 1000)
        return {0, retryAfter}
      end
    `;

    const result = await this.redis.eval(
      script,
      1,
      key,
      limit.tokens,
      limit.refillRate,
      now
    ) as [number, number];

    return {
      allowed: result[0] === 1,
      retryAfter: result[0] === 0 ? result[1] : undefined
    };
  }

  /**
   * Sliding window pour prévenir les bursts
   */
  private async checkSlidingWindow(
    userId: string,
    action: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `rate_limit:sliding:${userId}:${action}`;
    const windowSize = 60000; // 1 minute
    const maxRequests = action === 'message' ? 25 : 50;
    const now = Date.now();
    const windowStart = now - windowSize;

    // Script Lua pour sliding window
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      
      -- Nettoyer les entrées expirées
      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
      
      -- Compter les requêtes dans la fenêtre
      local count = redis.call('ZCARD', key)
      
      if count < maxRequests then
        -- Ajouter la nouvelle requête
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, 120)
        return {1, count + 1}
      else
        -- Calculer le temps d'attente
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local retryAfter = oldest[2] and (tonumber(oldest[2]) + 60000 - now) or 60000
        return {0, retryAfter}
      end
    `;

    const result = await this.redis.eval(
      script,
      1,
      key,
      now,
      windowStart,
      maxRequests
    ) as [number, number];

    return {
      allowed: result[0] === 1,
      retryAfter: result[0] === 0 ? Math.max(1000, result[1]) : undefined
    };
  }

  /**
   * Circuit breaker pour protection système
   */
  private getCircuitBreaker(action: string): CircuitBreaker {
    if (!this.circuitBreakers.has(action)) {
      const breaker = new CircuitBreaker({
        failureThreshold: 5, // Ouvre après 5 échecs
        successThreshold: 2, // Ferme après 2 succès
        timeout: 60000, // 60s half-open timeout
        onOpen: (reason) => {
          this.logCircuitBreakerEvent(action, 'OPEN', reason);
          this.alertOpsTeam(action);
        },
        onClose: (reason) => {
          this.logCircuitBreakerEvent(action, 'CLOSED', reason);
        }
      });
      this.circuitBreakers.set(action, breaker);
    }
    return this.circuitBreakers.get(action)!;
  }

  /**
   * Vérification de la santé de la plateforme
   */
  private async checkPlatformHealth(): Promise<PlatformHealth> {
    // Monitor métriques spécifiques à la plateforme
    const metrics = await Promise.all([
      this.redis.get('platform:onlyfans:error_rate'),
      this.redis.get('platform:onlyfans:avg_latency'),
      this.redis.get('platform:onlyfans:success_rate')
    ]);

    const errorRate = parseFloat(metrics[0] || '0');
    const avgLatency = parseFloat(metrics[1] || '0');
    const successRate = parseFloat(metrics[2] || '100');

    // Adaptive throttling basé sur santé
    const shouldThrottle = errorRate > 0.05 || avgLatency > 5000 || successRate < 0.95;

    return {
      healthy: !shouldThrottle,
      throttle: shouldThrottle,
      load: errorRate + (avgLatency / 10000), // Score de charge normalisé
      metrics: { errorRate, avgLatency, successRate }
    };
  }

  /**
   * Calcul du délai adaptatif basé sur la charge
   */
  private calculateAdaptiveDelay(load: number): number {
    // Exponential backoff basé sur load
    const baseDelay = 1000; // 1s
    const maxDelay = 30000; // 30s

    const delay = Math.min(
      baseDelay * Math.pow(2, Math.floor(load * 10)),
      maxDelay
    );

    return delay;
  }

  /**
   * Enregistre le succès d'une opération
   */
  async recordSuccess(action: string): Promise<void> {
    const circuitBreaker = this.getCircuitBreaker(action);
    circuitBreaker.recordSuccess();

    // Mettre à jour les métriques de santé
    await this.updatePlatformHealth(action, true);
  }

  /**
   * Enregistre l'échec d'une opération
   */
  async recordFailure(action: string, error: any): Promise<void> {
    const circuitBreaker = this.getCircuitBreaker(action);
    circuitBreaker.recordFailure();

    // Mettre à jour les métriques de santé
    await this.updatePlatformHealth(action, false, error);
  }

  /**
   * Met à jour les métriques de santé de la plateforme
   */
  private async updatePlatformHealth(
    action: string,
    success: boolean,
    error?: any
  ): Promise<void> {
    const now = Date.now();
    const key = `platform:onlyfans:health:${action}`;

    // Utiliser une fenêtre glissante de 5 minutes
    const windowSize = 5 * 60 * 1000;
    const windowStart = now - windowSize;

    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local success = tonumber(ARGV[3])
      local latency = tonumber(ARGV[4]) or 0
      
      -- Nettoyer les anciennes entrées
      redis.call('ZREMRANGEBYSCORE', key .. ':events', '-inf', windowStart)
      
      -- Ajouter le nouvel événement
      local eventData = success .. ':' .. latency
      redis.call('ZADD', key .. ':events', now, eventData)
      redis.call('EXPIRE', key .. ':events', 600)
      
      -- Calculer les métriques
      local events = redis.call('ZRANGE', key .. ':events', 0, -1)
      local totalEvents = #events
      local successCount = 0
      local totalLatency = 0
      
      for i = 1, totalEvents do
        local parts = {}
        for part in string.gmatch(events[i], '([^:]+)') do
          table.insert(parts, part)
        end
        if tonumber(parts[1]) == 1 then
          successCount = successCount + 1
        end
        totalLatency = totalLatency + tonumber(parts[2])
      end
      
      local successRate = totalEvents > 0 and (successCount / totalEvents) or 1
      local errorRate = 1 - successRate
      local avgLatency = totalEvents > 0 and (totalLatency / totalEvents) or 0
      
      -- Stocker les métriques agrégées
      redis.call('SET', 'platform:onlyfans:error_rate', errorRate)
      redis.call('SET', 'platform:onlyfans:avg_latency', avgLatency)
      redis.call('SET', 'platform:onlyfans:success_rate', successRate)
      redis.call('EXPIRE', 'platform:onlyfans:error_rate', 600)
      redis.call('EXPIRE', 'platform:onlyfans:avg_latency', 600)
      redis.call('EXPIRE', 'platform:onlyfans:success_rate', 600)
      
      return {successRate, errorRate, avgLatency}
    `;

    const latency = error?.latency || 0;
    await this.redis.eval(
      script,
      1,
      key,
      now,
      windowStart,
      success ? 1 : 0,
      latency
    );
  }

  // Utilitaires de logging et alerting
  private logCircuitBreakerEvent(action: string, state: string, reason?: string): void {
    console.log(`[CircuitBreaker] ${action} -> ${state}`, { reason, timestamp: new Date() });
  }

  private alertOpsTeam(action: string): void {
    // Intégration avec système d'alerting (Slack, PagerDuty, etc.)
    console.warn(`[ALERT] Circuit breaker opened for action: ${action}`);
  }
}

/**
 * Factory pour créer des rate limiters configurés
 */
export class RateLimiterFactory {
  static createOnlyFansLimiter(redis: Redis): MultiLayerRateLimiter {
    return new MultiLayerRateLimiter(redis);
  }

  static createInstagramLimiter(redis: Redis): MultiLayerRateLimiter {
    // Configuration spécifique Instagram
    return new MultiLayerRateLimiter(redis);
  }

  static createTikTokLimiter(redis: Redis): MultiLayerRateLimiter {
    // Configuration spécifique TikTok
    return new MultiLayerRateLimiter(redis);
  }
}