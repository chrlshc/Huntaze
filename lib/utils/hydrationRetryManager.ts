/**
 * Gestionnaire de retry intelligent pour l'hydratation
 * 
 * Ce module fournit :
 * 1. Retry automatique avec backoff exponentiel
 * 2. Circuit breaker pour éviter les boucles infinies
 * 3. Stratégies de retry adaptatives
 * 4. Monitoring des tentatives
 */

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

interface RetryAttempt {
  attemptNumber: number;
  timestamp: number;
  delay: number;
  error?: Error;
  success: boolean;
}

interface RetryContext {
  componentId: string;
  attempts: RetryAttempt[];
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  circuitBreakerOpenTime?: number;
  lastSuccessTime?: number;
}

type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'adaptive';

class HydrationRetryManager {
  private contexts = new Map<string, RetryContext>();
  private globalConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBase: 2,
    jitter: true,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 30000
  };

  /**
   * Configure les paramètres globaux de retry
   */
  public configure(config: Partial<RetryConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };
  }

  /**
   * Exécute une fonction avec retry automatique
   */
  public async executeWithRetry<T>(
    componentId: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    strategy: RetryStrategy = 'exponential'
  ): Promise<T> {
    const effectiveConfig = { ...this.globalConfig, ...config };
    const context = this.getOrCreateContext(componentId);

    // Vérifier le circuit breaker
    if (this.isCircuitBreakerOpen(context)) {
      throw new Error(`Circuit breaker is open for component ${componentId}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= effectiveConfig.maxRetries; attempt++) {
      try {
        // Calculer le délai pour cette tentative
        const delay = this.calculateDelay(attempt, strategy, effectiveConfig);
        
        // Attendre le délai (sauf pour la première tentative)
        if (attempt > 1) {
          await this.sleep(delay);
        }

        // Enregistrer la tentative
        const attemptRecord: RetryAttempt = {
          attemptNumber: attempt,
          timestamp: Date.now(),
          delay: attempt > 1 ? delay : 0,
          success: false
        };

        // Exécuter l'opération
        const result = await operation();

        // Succès - mettre à jour le contexte
        attemptRecord.success = true;
        context.attempts.push(attemptRecord);
        context.lastSuccessTime = Date.now();
        context.circuitBreakerState = 'closed';

        return result;

      } catch (error) {
        lastError = error as Error;
        
        // Enregistrer l'échec
        const attemptRecord: RetryAttempt = {
          attemptNumber: attempt,
          timestamp: Date.now(),
          delay: attempt > 1 ? this.calculateDelay(attempt, strategy, effectiveConfig) : 0,
          error: lastError,
          success: false
        };
        
        context.attempts.push(attemptRecord);

        // Vérifier si on doit ouvrir le circuit breaker
        this.checkCircuitBreaker(context, effectiveConfig);

        // Si c'est la dernière tentative, ne pas continuer
        if (attempt === effectiveConfig.maxRetries) {
          break;
        }

        console.warn(`Retry attempt ${attempt}/${effectiveConfig.maxRetries} failed for ${componentId}:`, lastError);
      }
    }

    // Toutes les tentatives ont échoué
    throw new Error(`All retry attempts failed for component ${componentId}. Last error: ${lastError?.message}`);
  }

  /**
   * Calcule le délai pour une tentative donnée
   */
  private calculateDelay(
    attempt: number,
    strategy: RetryStrategy,
    config: RetryConfig
  ): number {
    let delay: number;

    switch (strategy) {
      case 'exponential':
        delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
        break;
      
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      
      case 'fixed':
        delay = config.baseDelay;
        break;
      
      case 'adaptive':
        delay = this.calculateAdaptiveDelay(attempt, config);
        break;
      
      default:
        delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    }

    // Appliquer le délai maximum
    delay = Math.min(delay, config.maxDelay);

    // Ajouter du jitter si configuré
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Calcule un délai adaptatif basé sur l'historique
   */
  private calculateAdaptiveDelay(attempt: number, config: RetryConfig): number {
    // Stratégie adaptative : augmente le délai si les échecs récents sont fréquents
    const recentFailures = this.getRecentFailures();
    const failureRate = recentFailures.length / 10; // Sur les 10 dernières tentatives
    
    const baseDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    const adaptiveMultiplier = 1 + failureRate;
    
    return baseDelay * adaptiveMultiplier;
  }

  /**
   * Obtient ou crée un contexte pour un composant
   */
  private getOrCreateContext(componentId: string): RetryContext {
    if (!this.contexts.has(componentId)) {
      this.contexts.set(componentId, {
        componentId,
        attempts: [],
        circuitBreakerState: 'closed'
      });
    }
    return this.contexts.get(componentId)!;
  }

  /**
   * Vérifie si le circuit breaker est ouvert
   */
  private isCircuitBreakerOpen(context: RetryContext): boolean {
    if (context.circuitBreakerState === 'closed') {
      return false;
    }

    if (context.circuitBreakerState === 'open') {
      // Vérifier si le timeout est écoulé
      if (context.circuitBreakerOpenTime && 
          Date.now() - context.circuitBreakerOpenTime > this.globalConfig.circuitBreakerTimeout) {
        context.circuitBreakerState = 'half-open';
        return false;
      }
      return true;
    }

    // État half-open : permettre une tentative
    return false;
  }

  /**
   * Vérifie et met à jour l'état du circuit breaker
   */
  private checkCircuitBreaker(context: RetryContext, config: RetryConfig): void {
    const recentAttempts = context.attempts.slice(-config.circuitBreakerThreshold);
    const recentFailures = recentAttempts.filter(a => !a.success);

    if (recentFailures.length >= config.circuitBreakerThreshold) {
      context.circuitBreakerState = 'open';
      context.circuitBreakerOpenTime = Date.now();
      console.warn(`Circuit breaker opened for component ${context.componentId}`);
    }
  }

  /**
   * Obtient les échecs récents (toutes composants confondus)
   */
  private getRecentFailures(): RetryAttempt[] {
    const allAttempts: RetryAttempt[] = [];
    const cutoffTime = Date.now() - 60000; // Dernière minute

    for (const context of this.contexts.values()) {
      const recentAttempts = context.attempts.filter(a => 
        a.timestamp > cutoffTime && !a.success
      );
      allAttempts.push(...recentAttempts);
    }

    return allAttempts.slice(-10); // 10 derniers échecs
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Réinitialise le contexte d'un composant
   */
  public resetContext(componentId: string): void {
    this.contexts.delete(componentId);
  }

  /**
   * Réinitialise tous les contextes
   */
  public resetAllContexts(): void {
    this.contexts.clear();
  }

  /**
   * Obtient les statistiques de retry pour un composant
   */
  public getComponentStats(componentId: string): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageDelay: number;
    circuitBreakerState: string;
    lastSuccessTime?: number;
  } | null {
    const context = this.contexts.get(componentId);
    if (!context) return null;

    const totalAttempts = context.attempts.length;
    const successfulAttempts = context.attempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    const averageDelay = context.attempts.length > 0 
      ? context.attempts.reduce((sum, a) => sum + a.delay, 0) / context.attempts.length
      : 0;

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      averageDelay,
      circuitBreakerState: context.circuitBreakerState,
      lastSuccessTime: context.lastSuccessTime
    };
  }

  /**
   * Obtient les statistiques globales
   */
  public getGlobalStats(): {
    totalComponents: number;
    totalAttempts: number;
    successRate: number;
    averageDelay: number;
    circuitBreakersOpen: number;
  } {
    let totalAttempts = 0;
    let successfulAttempts = 0;
    let totalDelay = 0;
    let circuitBreakersOpen = 0;

    for (const context of this.contexts.values()) {
      totalAttempts += context.attempts.length;
      successfulAttempts += context.attempts.filter(a => a.success).length;
      totalDelay += context.attempts.reduce((sum, a) => sum + a.delay, 0);
      
      if (context.circuitBreakerState === 'open') {
        circuitBreakersOpen++;
      }
    }

    return {
      totalComponents: this.contexts.size,
      totalAttempts,
      successRate: totalAttempts > 0 ? successfulAttempts / totalAttempts : 0,
      averageDelay: totalAttempts > 0 ? totalDelay / totalAttempts : 0,
      circuitBreakersOpen
    };
  }

  /**
   * Force la fermeture d'un circuit breaker (pour recovery manuel)
   */
  public forceCloseCircuitBreaker(componentId: string): void {
    const context = this.contexts.get(componentId);
    if (context) {
      context.circuitBreakerState = 'closed';
      context.circuitBreakerOpenTime = undefined;
      console.log(`Circuit breaker manually closed for component ${componentId}`);
    }
  }

  /**
   * Nettoie les anciens contextes (pour éviter les fuites mémoire)
   */
  public cleanup(maxAge: number = 3600000): void { // 1 heure par défaut
    const cutoffTime = Date.now() - maxAge;
    
    for (const [componentId, context] of this.contexts.entries()) {
      const hasRecentActivity = context.attempts.some(a => a.timestamp > cutoffTime);
      
      if (!hasRecentActivity) {
        this.contexts.delete(componentId);
      } else {
        // Nettoyer les anciennes tentatives
        context.attempts = context.attempts.filter(a => a.timestamp > cutoffTime);
      }
    }
  }
}

// Export singleton instance
export const hydrationRetryManager = new HydrationRetryManager();

// Types exports
export type { RetryConfig, RetryAttempt, RetryContext, RetryStrategy };