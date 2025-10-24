/**
 * Circuit Breaker Pattern Implementation
 * Protège contre les cascading failures et améliore la résilience
 */

interface CircuitBreakerConfig {
  failureThreshold: number;    // Nombre d'échecs avant ouverture
  recoveryTimeout: number;     // Temps avant tentative de récupération (ms)
  monitoringWindow: number;    // Fenêtre de monitoring (ms)
  expectedFailureRate: number; // Taux d'échec acceptable (%)
}

interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  circuitOpenCount: number;
  lastFailureTime: number;
  averageResponseTime: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private openedAt = 0;
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeouts: 0,
    circuitOpenCount: 0,
    lastFailureTime: 0,
    averageResponseTime: 0,
  };

  private responseTimes: number[] = [];
  private readonly maxResponseTimeHistory = 100;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  /**
   * Execute une fonction avec protection circuit breaker
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    const startTime = Date.now();

    // Vérifier l'état du circuit
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.logStateChange('HALF_OPEN', 'Attempting recovery');
      } else {
        this.logCircuitOpen();
        if (fallback) {
          return await this.executeFallback(fallback);
        }
        throw new CircuitBreakerOpenError(
          `Circuit breaker ${this.name} is OPEN`,
          {
            state: this.state,
            failureCount: this.failureCount,
            nextRetryAt: this.openedAt + this.config.recoveryTimeout,
          }
        );
      }
    }

    this.metrics.totalRequests++;

    try {
      const result = await this.executeWithTimeout(operation, startTime);
      this.onSuccess(startTime);
      return result;
    } catch (error) {
      this.onFailure(error as Error, startTime);
      
      // Si fallback disponible et circuit ouvert, l'utiliser
      if (this.state === 'OPEN' && fallback) {
        return await this.executeFallback(fallback);
      }
      
      throw error;
    }
  }

  /**
   * Execute avec timeout pour éviter les hanging requests
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    startTime: number
  ): Promise<T> {
    const timeout = 30000; // 30 secondes timeout par défaut
    
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          this.metrics.timeouts++;
          reject(new Error(`Operation timeout after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Execute le fallback avec gestion d'erreur
   */
  private async executeFallback<T>(fallback: () => Promise<T> | T): Promise<T> {
    try {
      const result = await fallback();
      this.logFallbackUsed();
      return result;
    } catch (fallbackError) {
      this.logFallbackFailed(fallbackError as Error);
      throw new Error(`Both primary operation and fallback failed: ${(fallbackError as Error).message}`);
    }
  }

  /**
   * Gère le succès d'une opération
   */
  private onSuccess(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.updateResponseTime(responseTime);
    
    this.metrics.successfulRequests++;
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.logStateChange('CLOSED', 'Recovery successful');
    }
  }

  /**
   * Gère l'échec d'une opération
   */
  private onFailure(error: Error, startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.updateResponseTime(responseTime);
    
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.metrics.lastFailureTime = this.lastFailureTime;

    // Calculer le taux d'échec récent
    const recentFailureRate = this.calculateRecentFailureRate();
    
    if (this.shouldOpenCircuit(recentFailureRate)) {
      this.openCircuit();
    }

    this.logFailure(error, recentFailureRate);
  }

  /**
   * Calcule le taux d'échec récent dans la fenêtre de monitoring
   */
  private calculateRecentFailureRate(): number {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;
    
    // Pour simplifier, on utilise les métriques globales
    // En production, on utiliserait une sliding window plus sophistiquée
    if (this.metrics.totalRequests === 0) return 0;
    
    return (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
  }

  /**
   * Détermine si le circuit doit s'ouvrir
   */
  private shouldOpenCircuit(failureRate: number): boolean {
    return (
      this.failureCount >= this.config.failureThreshold ||
      failureRate > this.config.expectedFailureRate
    ) && this.state !== 'OPEN';
  }

  /**
   * Ouvre le circuit
   */
  private openCircuit(): void {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.metrics.circuitOpenCount++;
    this.logStateChange('OPEN', `Failure threshold reached: ${this.failureCount} failures`);
  }

  /**
   * Détermine si on doit tenter une récupération
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.openedAt >= this.config.recoveryTimeout;
  }

  /**
   * Met à jour les temps de réponse
   */
  private updateResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Obtient les métriques du circuit breaker
   */
  getMetrics(): CircuitBreakerMetrics & {
    state: CircuitState;
    failureCount: number;
    config: CircuitBreakerConfig;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const failureRate = this.metrics.totalRequests > 0 
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
      : 0;

    let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (this.state === 'OPEN') {
      healthStatus = 'unhealthy';
    } else if (failureRate > this.config.expectedFailureRate * 0.5) {
      healthStatus = 'degraded';
    } else {
      healthStatus = 'healthy';
    }

    return {
      ...this.metrics,
      state: this.state,
      failureCount: this.failureCount,
      config: this.config,
      healthStatus,
    };
  }

  /**
   * Reset les métriques (utile pour les tests)
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.openedAt = 0;
    this.responseTimes = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      circuitOpenCount: 0,
      lastFailureTime: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Force l'ouverture du circuit (pour maintenance)
   */
  forceOpen(): void {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.logStateChange('OPEN', 'Manually forced open');
  }

  /**
   * Force la fermeture du circuit
   */
  forceClose(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.logStateChange('CLOSED', 'Manually forced closed');
  }

  // Logging methods
  private logStateChange(newState: CircuitState, reason: string): void {
    console.log(`[CircuitBreaker:${this.name}] State changed to ${newState}: ${reason}`, {
      previousState: this.state,
      newState,
      failureCount: this.failureCount,
      metrics: this.metrics,
    });
  }

  private logCircuitOpen(): void {
    console.warn(`[CircuitBreaker:${this.name}] Circuit is OPEN - rejecting request`, {
      failureCount: this.failureCount,
      openedAt: new Date(this.openedAt).toISOString(),
      nextRetryAt: new Date(this.openedAt + this.config.recoveryTimeout).toISOString(),
    });
  }

  private logFailure(error: Error, failureRate: number): void {
    console.error(`[CircuitBreaker:${this.name}] Operation failed`, {
      error: error.message,
      failureCount: this.failureCount,
      failureRate: `${failureRate.toFixed(2)}%`,
      state: this.state,
    });
  }

  private logFallbackUsed(): void {
    console.info(`[CircuitBreaker:${this.name}] Fallback executed successfully`);
  }

  private logFallbackFailed(error: Error): void {
    console.error(`[CircuitBreaker:${this.name}] Fallback failed`, {
      error: error.message,
    });
  }
}

/**
 * Erreur spécifique pour circuit breaker ouvert
 */
export class CircuitBreakerOpenError extends Error {
  constructor(
    message: string,
    public context: {
      state: CircuitState;
      failureCount: number;
      nextRetryAt: number;
    }
  ) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Factory pour créer des circuit breakers avec configurations prédéfinies
 */
export class CircuitBreakerFactory {
  private static breakers = new Map<string, CircuitBreaker>();

  /**
   * Configurations prédéfinies par type de service
   */
  private static configs = {
    // Services AI externes (OpenAI, Claude)
    ai_service: {
      failureThreshold: 5,
      recoveryTimeout: 60000,      // 1 minute
      monitoringWindow: 300000,    // 5 minutes
      expectedFailureRate: 10,     // 10% d'échecs acceptables
    },
    
    // Base de données
    database: {
      failureThreshold: 3,
      recoveryTimeout: 30000,      // 30 secondes
      monitoringWindow: 120000,    // 2 minutes
      expectedFailureRate: 5,      // 5% d'échecs acceptables
    },
    
    // Services externes (APIs tierces)
    external_api: {
      failureThreshold: 10,
      recoveryTimeout: 120000,     // 2 minutes
      monitoringWindow: 600000,    // 10 minutes
      expectedFailureRate: 15,     // 15% d'échecs acceptables
    },
    
    // Cache (Redis)
    cache: {
      failureThreshold: 5,
      recoveryTimeout: 15000,      // 15 secondes
      monitoringWindow: 60000,     // 1 minute
      expectedFailureRate: 8,      // 8% d'échecs acceptables
    },
  };

  /**
   * Obtient ou crée un circuit breaker
   */
  static getCircuitBreaker(
    name: string, 
    type: keyof typeof CircuitBreakerFactory.configs,
    customConfig?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    const key = `${type}:${name}`;
    
    if (!this.breakers.has(key)) {
      const config = {
        ...this.configs[type],
        ...customConfig,
      };
      
      this.breakers.set(key, new CircuitBreaker(name, config));
    }
    
    return this.breakers.get(key)!;
  }

  /**
   * Obtient les métriques de tous les circuit breakers
   */
  static getAllMetrics(): Record<string, ReturnType<CircuitBreaker['getMetrics']>> {
    const metrics: Record<string, any> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Reset tous les circuit breakers (pour les tests)
   */
  static resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

/**
 * Decorator pour appliquer automatiquement un circuit breaker
 */
export function withCircuitBreaker(
  name: string,
  type: keyof typeof CircuitBreakerFactory.configs,
  fallback?: () => any
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const circuitBreaker = CircuitBreakerFactory.getCircuitBreaker(name, type);

    descriptor.value = async function (...args: any[]) {
      return circuitBreaker.execute(
        () => originalMethod.apply(this, args),
        fallback
      );
    };

    return descriptor;
  };
}