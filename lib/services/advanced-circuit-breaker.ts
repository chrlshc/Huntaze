/**
 * Advanced Circuit Breaker with Half-Open Progressive Testing
 * Implémentation niveau GAFAM avec fallback hiérarchique
 */

import { CircuitBreaker, CircuitBreakerConfig } from './circuit-breaker';

interface AdvancedCircuitBreakerConfig extends CircuitBreakerConfig {
  halfOpenMaxRequests: number;    // Nombre max de requêtes test en HALF_OPEN
  halfOpenSuccessThreshold: number; // Succès requis pour fermer le circuit
  fallbackChain: Array<{
    name: string;
    fn: () => Promise<any>;
    timeout: number;
  }>;
}

interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  lastStateChange: Date;
  timeInCurrentState: number;
  healthScore: number; // 0-100
}

/**
 * Circuit Breaker avancé avec test progressif et fallback hiérarchique
 */
export class AdvancedCircuitBreaker extends CircuitBreaker {
  private halfOpenRequestCount = 0;
  private halfOpenSuccessCount = 0;
  private fallbackChain: AdvancedCircuitBreakerConfig['fallbackChain'] = [];
  private serviceMetrics: ServiceMetrics;

  constructor(
    name: string,
    private advancedConfig: AdvancedCircuitBreakerConfig
  ) {
    super(name, advancedConfig);
    this.fallbackChain = advancedConfig.fallbackChain || [];
    this.serviceMetrics = this.initializeMetrics();
  }

  /**
   * Execute avec fallback hiérarchique intelligent
   */
  async executeWithHierarchicalFallback<T>(
    primaryFn: () => Promise<T>,
    context?: { userId?: string; operation?: string }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Tenter service principal
      if (this.canExecutePrimary()) {
        const result = await this.executeInCurrentState(primaryFn, startTime);
        this.updateMetrics(startTime, true);
        return result;
      }
    } catch (error) {
      this.updateMetrics(startTime, false);
      this.logPrimaryFailure(error as Error, context);
    }

    // Fallback hiérarchique
    return await this.executeFallbackChain(context);
  }

  /**
   * Détermine si le service principal peut être utilisé
   */
  private canExecutePrimary(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') return false;
    
    // HALF_OPEN: limite le nombre de requêtes test
    return this.halfOpenRequestCount < this.advancedConfig.halfOpenMaxRequests;
  }

  /**
   * Execute dans l'état actuel avec gestion HALF_OPEN
   */
  private async executeInCurrentState<T>(
    fn: () => Promise<T>,
    startTime: number
  ): Promise<T> {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenRequestCount++;
    }

    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.halfOpenSuccessCount++;
        this.checkHalfOpenTransition();
      }
      
      return result;
    } catch (error) {
      if (this.state === 'HALF_OPEN') {
        // Un échec en HALF_OPEN → retour OPEN immédiat
        this.transitionToOpen('Half-open test failed');
      }
      throw error;
    }
  }

  /**
   * Vérifie si on peut passer de HALF_OPEN à CLOSED
   */
  private checkHalfOpenTransition(): void {
    if (this.halfOpenSuccessCount >= this.advancedConfig.halfOpenSuccessThreshold) {
      this.transitionToClosed('Half-open tests successful');
    }
  }

  /**
   * Execute la chaîne de fallback
   */
  private async executeFallbackChain<T>(context?: any): Promise<T> {
    let lastError: Error;

    for (const [index, fallback] of this.fallbackChain.entries()) {
      try {
        this.logFallbackAttempt(fallback.name, index + 1);
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Fallback ${fallback.name} timeout`)), fallback.timeout);
        });

        const result = await Promise.race([fallback.fn(), timeoutPromise]);
        
        this.logFallbackSuccess(fallback.name, index + 1);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        this.logFallbackFailure(fallback.name, index + 1, lastError);
        continue;
      }
    }

    // Tous les fallbacks ont échoué
    throw new Error(`All services failed. Last error: ${lastError!.message}`);
  }

  /**
   * Transitions d'état avec reset des compteurs
   */
  private transitionToOpen(reason: string): void {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.halfOpenRequestCount = 0;
    this.halfOpenSuccessCount = 0;
    this.serviceMetrics.lastStateChange = new Date();
    this.logStateTransition('OPEN', reason);
  }

  private transitionToClosed(reason: string): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenRequestCount = 0;
    this.halfOpenSuccessCount = 0;
    this.serviceMetrics.lastStateChange = new Date();
    this.logStateTransition('CLOSED', reason);
  }

  private transitionToHalfOpen(reason: string): void {
    this.state = 'HALF_OPEN';
    this.halfOpenRequestCount = 0;
    this.halfOpenSuccessCount = 0;
    this.serviceMetrics.lastStateChange = new Date();
    this.logStateTransition('HALF_OPEN', reason);
  }

  /**
   * Met à jour les métriques de service
   */
  private updateMetrics(startTime: number, success: boolean): void {
    const duration = Date.now() - startTime;
    
    this.serviceMetrics.totalRequests++;
    
    if (success) {
      this.serviceMetrics.successfulRequests++;
    } else {
      this.serviceMetrics.failedRequests++;
    }

    // Mise à jour latence (moyenne mobile)
    const alpha = 0.1; // Facteur de lissage
    this.serviceMetrics.avgLatency = 
      this.serviceMetrics.avgLatency * (1 - alpha) + duration * alpha;

    // Approximation P95 (simplifiée)
    this.serviceMetrics.p95Latency = Math.max(
      this.serviceMetrics.p95Latency * 0.95 + duration * 0.05,
      duration
    );

    // Taux d'erreur
    this.serviceMetrics.errorRate = 
      (this.serviceMetrics.failedRequests / this.serviceMetrics.totalRequests) * 100;

    // Temps dans l'état actuel
    this.serviceMetrics.timeInCurrentState = 
      Date.now() - this.serviceMetrics.lastStateChange.getTime();

    // Score de santé (0-100)
    this.serviceMetrics.healthScore = this.calculateHealthScore();
  }

  /**
   * Calcule un score de santé global
   */
  private calculateHealthScore(): number {
    let score = 100;

    // Pénalité pour taux d'erreur
    score -= this.serviceMetrics.errorRate * 10;

    // Pénalité pour latence élevée
    if (this.serviceMetrics.avgLatency > 1000) {
      score -= 20;
    } else if (this.serviceMetrics.avgLatency > 500) {
      score -= 10;
    }

    // Pénalité pour état OPEN
    if (this.state === 'OPEN') {
      score -= 30;
    } else if (this.state === 'HALF_OPEN') {
      score -= 15;
    }

    // Bonus pour stabilité (temps long dans CLOSED)
    if (this.state === 'CLOSED' && this.serviceMetrics.timeInCurrentState > 300000) { // 5min
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Obtient les métriques détaillées
   */
  getDetailedMetrics(): ServiceMetrics & {
    state: string;
    failureCount: number;
    halfOpenStats: {
      requestCount: number;
      successCount: number;
      successRate: number;
    };
    fallbackChainStatus: Array<{
      name: string;
      available: boolean;
      lastUsed?: Date;
    }>;
  } {
    return {
      ...this.serviceMetrics,
      state: this.state,
      failureCount: this.failureCount,
      halfOpenStats: {
        requestCount: this.halfOpenRequestCount,
        successCount: this.halfOpenSuccessCount,
        successRate: this.halfOpenRequestCount > 0 
          ? (this.halfOpenSuccessCount / this.halfOpenRequestCount) * 100 
          : 0,
      },
      fallbackChainStatus: this.fallbackChain.map(fallback => ({
        name: fallback.name,
        available: true, // À implémenter selon les besoins
      })),
    };
  }

  /**
   * Initialise les métriques
   */
  private initializeMetrics(): ServiceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      p95Latency: 0,
      errorRate: 0,
      lastStateChange: new Date(),
      timeInCurrentState: 0,
      healthScore: 100,
    };
  }

  // Méthodes de logging
  private logStateTransition(newState: string, reason: string): void {
    console.log(`[AdvancedCircuitBreaker:${this.name}] ${this.state} → ${newState}: ${reason}`, {
      metrics: this.serviceMetrics,
      halfOpenStats: {
        requests: this.halfOpenRequestCount,
        successes: this.halfOpenSuccessCount,
      },
    });
  }

  private logPrimaryFailure(error: Error, context?: any): void {
    console.error(`[AdvancedCircuitBreaker:${this.name}] Primary service failed`, {
      error: error.message,
      state: this.state,
      context,
      healthScore: this.serviceMetrics.healthScore,
    });
  }

  private logFallbackAttempt(fallbackName: string, attempt: number): void {
    console.info(`[AdvancedCircuitBreaker:${this.name}] Trying fallback ${attempt}: ${fallbackName}`);
  }

  private logFallbackSuccess(fallbackName: string, attempt: number): void {
    console.info(`[AdvancedCircuitBreaker:${this.name}] Fallback ${attempt} (${fallbackName}) succeeded`);
  }

  private logFallbackFailure(fallbackName: string, attempt: number, error: Error): void {
    console.warn(`[AdvancedCircuitBreaker:${this.name}] Fallback ${attempt} (${fallbackName}) failed: ${error.message}`);
  }
}

/**
 * Factory pour circuit breakers avancés avec configurations prédéfinies
 */
export class AdvancedCircuitBreakerFactory {
  private static breakers = new Map<string, AdvancedCircuitBreaker>();

  /**
   * Configuration pour services AI avec fallback hiérarchique
   */
  static createAIServiceBreaker(name: string): AdvancedCircuitBreaker {
    const config: AdvancedCircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringWindow: 300000,
      expectedFailureRate: 10,
      halfOpenMaxRequests: 3,
      halfOpenSuccessThreshold: 2,
      fallbackChain: [
        {
          name: 'claude_fallback',
          fn: async () => {
            // Fallback vers Claude si OpenAI échoue
            throw new Error('Claude fallback not implemented');
          },
          timeout: 15000,
        },
        {
          name: 'cached_response',
          fn: async () => {
            // Fallback vers réponse en cache
            throw new Error('Cache fallback not implemented');
          },
          timeout: 1000,
        },
        {
          name: 'static_fallback',
          fn: async () => {
            // Fallback statique minimal
            return {
              content: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
              fallback: true,
            };
          },
          timeout: 100,
        },
      ],
    };

    const breaker = new AdvancedCircuitBreaker(name, config);
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Configuration pour base de données avec fallback read-only
   */
  static createDatabaseBreaker(name: string): AdvancedCircuitBreaker {
    const config: AdvancedCircuitBreakerConfig = {
      failureThreshold: 3,
      recoveryTimeout: 30000,
      monitoringWindow: 120000,
      expectedFailureRate: 5,
      halfOpenMaxRequests: 2,
      halfOpenSuccessThreshold: 2,
      fallbackChain: [
        {
          name: 'read_replica',
          fn: async () => {
            // Fallback vers replica en lecture seule
            throw new Error('Read replica fallback not implemented');
          },
          timeout: 5000,
        },
        {
          name: 'cache_only',
          fn: async () => {
            // Mode cache uniquement
            throw new Error('Cache-only mode not implemented');
          },
          timeout: 1000,
        },
      ],
    };

    const breaker = new AdvancedCircuitBreaker(name, config);
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Obtient tous les circuit breakers avec leurs métriques
   */
  static getAllMetrics(): Record<string, ReturnType<AdvancedCircuitBreaker['getDetailedMetrics']>> {
    const metrics: Record<string, any> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      metrics[name] = breaker.getDetailedMetrics();
    }
    
    return metrics;
  }

  /**
   * Health check global de tous les circuit breakers
   */
  static getGlobalHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalBreakers: number;
    healthyBreakers: number;
    degradedBreakers: number;
    unhealthyBreakers: number;
    averageHealthScore: number;
  } {
    const allMetrics = this.getAllMetrics();
    const breakerCount = Object.keys(allMetrics).length;
    
    if (breakerCount === 0) {
      return {
        status: 'healthy',
        totalBreakers: 0,
        healthyBreakers: 0,
        degradedBreakers: 0,
        unhealthyBreakers: 0,
        averageHealthScore: 100,
      };
    }

    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;
    let totalHealthScore = 0;

    Object.values(allMetrics).forEach(metrics => {
      totalHealthScore += metrics.healthScore;
      
      if (metrics.healthScore >= 80) {
        healthyCount++;
      } else if (metrics.healthScore >= 50) {
        degradedCount++;
      } else {
        unhealthyCount++;
      }
    });

    const averageHealthScore = totalHealthScore / breakerCount;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0 || averageHealthScore < 50) {
      status = 'unhealthy';
    } else if (degradedCount > 0 || averageHealthScore < 80) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      totalBreakers: breakerCount,
      healthyBreakers: healthyCount,
      degradedBreakers: degradedCount,
      unhealthyBreakers: unhealthyCount,
      averageHealthScore: Math.round(averageHealthScore),
    };
  }
}

/**
 * Decorator pour circuit breaker avancé
 */
export function withAdvancedCircuitBreaker(
  name: string,
  type: 'ai_service' | 'database' | 'external_api'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    let breaker: AdvancedCircuitBreaker;
    switch (type) {
      case 'ai_service':
        breaker = AdvancedCircuitBreakerFactory.createAIServiceBreaker(name);
        break;
      case 'database':
        breaker = AdvancedCircuitBreakerFactory.createDatabaseBreaker(name);
        break;
      default:
        throw new Error(`Unsupported circuit breaker type: ${type}`);
    }

    descriptor.value = async function (...args: any[]) {
      return breaker.executeWithHierarchicalFallback(
        () => originalMethod.apply(this, args),
        {
          userId: args[0]?.userId,
          operation: propertyKey,
        }
      );
    };

    return descriptor;
  };
}