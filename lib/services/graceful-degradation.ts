/**
 * Graceful Degradation Service
 * Gère les fallbacks intelligents et la dégradation gracieuse des services
 */

interface ServicePriority {
  name: string;
  priority: 'critical' | 'important' | 'optional';
  timeout: number;
  fallback?: () => Promise<any> | any;
}

interface DegradationConfig {
  services: ServicePriority[];
  strategy: 'fail_fast' | 'best_effort' | 'essential_only';
  globalTimeout: number;
}

interface ServiceResult<T = any> {
  name: string;
  status: 'success' | 'failed' | 'timeout' | 'skipped';
  data?: T;
  error?: Error;
  duration: number;
  fallbackUsed: boolean;
}

interface DegradationResult<T = any> {
  status: 'success' | 'partial' | 'failed';
  results: ServiceResult<T>[];
  criticalFailures: string[];
  degradedServices: string[];
  totalDuration: number;
  strategy: string;
}

/**
 * Service de dégradation gracieuse
 */
export class GracefulDegradationService {
  private static instance: GracefulDegradationService;
  
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    partialRequests: 0,
    failedRequests: 0,
    fallbacksUsed: 0,
    averageDuration: 0,
  };

  static getInstance(): GracefulDegradationService {
    if (!this.instance) {
      this.instance = new GracefulDegradationService();
    }
    return this.instance;
  }

  /**
   * Execute plusieurs services avec dégradation gracieuse
   */
  async executeWithDegradation<T>(
    config: DegradationConfig
  ): Promise<DegradationResult<T>> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const results: ServiceResult<T>[] = [];
    const criticalFailures: string[] = [];
    const degradedServices: string[] = [];

    try {
      // Séparer les services par priorité
      const criticalServices = config.services.filter(s => s.priority === 'critical');
      const importantServices = config.services.filter(s => s.priority === 'important');
      const optionalServices = config.services.filter(s => s.priority === 'optional');

      // Stratégie d'exécution basée sur la configuration
      switch (config.strategy) {
        case 'fail_fast':
          await this.executeFailFast(criticalServices, results, criticalFailures);
          if (criticalFailures.length === 0) {
            await this.executeBestEffort([...importantServices, ...optionalServices], results, degradedServices);
          }
          break;

        case 'best_effort':
          await this.executeBestEffort(config.services, results, degradedServices);
          // Identifier les échecs critiques
          criticalFailures.push(...results
            .filter(r => r.status === 'failed' && 
              config.services.find(s => s.name === r.name)?.priority === 'critical')
            .map(r => r.name));
          break;

        case 'essential_only':
          await this.executeEssentialOnly(criticalServices, results, criticalFailures);
          // Marquer les services non-critiques comme skippés
          [...importantServices, ...optionalServices].forEach(service => {
            results.push({
              name: service.name,
              status: 'skipped',
              duration: 0,
              fallbackUsed: false,
            });
          });
          break;
      }

      const totalDuration = Date.now() - startTime;
      
      // Déterminer le statut global
      let status: 'success' | 'partial' | 'failed';
      if (criticalFailures.length > 0) {
        status = 'failed';
        this.metrics.failedRequests++;
      } else if (degradedServices.length > 0) {
        status = 'partial';
        this.metrics.partialRequests++;
      } else {
        status = 'success';
        this.metrics.successfulRequests++;
      }

      // Mettre à jour les métriques
      this.updateMetrics(totalDuration);

      return {
        status,
        results,
        criticalFailures,
        degradedServices,
        totalDuration,
        strategy: config.strategy,
      };

    } catch (error) {
      this.metrics.failedRequests++;
      throw error;
    }
  }

  /**
   * Stratégie fail-fast : arrêt dès qu'un service critique échoue
   */
  private async executeFailFast(
    services: ServicePriority[],
    results: ServiceResult[],
    criticalFailures: string[]
  ): Promise<void> {
    for (const service of services) {
      const result = await this.executeService(service);
      results.push(result);

      if (result.status === 'failed' && service.priority === 'critical') {
        criticalFailures.push(service.name);
        break; // Arrêt immédiat
      }
    }
  }

  /**
   * Stratégie best-effort : tente tous les services, utilise les fallbacks
   */
  private async executeBestEffort(
    services: ServicePriority[],
    results: ServiceResult[],
    degradedServices: string[]
  ): Promise<void> {
    // Exécuter les services critiques en premier, en parallèle
    const criticalServices = services.filter(s => s.priority === 'critical');
    const otherServices = services.filter(s => s.priority !== 'critical');

    // Services critiques en parallèle avec timeout court
    if (criticalServices.length > 0) {
      const criticalResults = await Promise.allSettled(
        criticalServices.map(service => this.executeService(service))
      );

      criticalResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.status !== 'success') {
            degradedServices.push(result.value.name);
          }
        } else {
          results.push({
            name: criticalServices[index].name,
            status: 'failed',
            error: result.reason,
            duration: 0,
            fallbackUsed: false,
          });
          degradedServices.push(criticalServices[index].name);
        }
      });
    }

    // Services non-critiques en parallèle avec timeout plus long
    if (otherServices.length > 0) {
      const otherResults = await Promise.allSettled(
        otherServices.map(service => this.executeService(service))
      );

      otherResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.status !== 'success') {
            degradedServices.push(result.value.name);
          }
        } else {
          results.push({
            name: otherServices[index].name,
            status: 'failed',
            error: result.reason,
            duration: 0,
            fallbackUsed: false,
          });
          degradedServices.push(otherServices[index].name);
        }
      });
    }
  }

  /**
   * Stratégie essential-only : exécute uniquement les services critiques
   */
  private async executeEssentialOnly(
    criticalServices: ServicePriority[],
    results: ServiceResult[],
    criticalFailures: string[]
  ): Promise<void> {
    const criticalResults = await Promise.allSettled(
      criticalServices.map(service => this.executeService(service))
    );

    criticalResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (result.value.status === 'failed') {
          criticalFailures.push(result.value.name);
        }
      } else {
        const serviceName = criticalServices[index].name;
        results.push({
          name: serviceName,
          status: 'failed',
          error: result.reason,
          duration: 0,
          fallbackUsed: false,
        });
        criticalFailures.push(serviceName);
      }
    });
  }

  /**
   * Exécute un service individuel avec gestion des timeouts et fallbacks
   */
  private async executeService<T>(service: ServicePriority): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    let fallbackUsed = false;

    try {
      // Créer une promesse avec timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Service ${service.name} timeout`)), service.timeout);
      });

      // Exécuter le service (cette fonction devrait être fournie dans la config)
      const servicePromise = this.getServiceFunction(service.name)();

      const result = await Promise.race([servicePromise, timeoutPromise]);

      return {
        name: service.name,
        status: 'success',
        data: result,
        duration: Date.now() - startTime,
        fallbackUsed,
      };

    } catch (error) {
      // Tenter le fallback si disponible
      if (service.fallback) {
        try {
          const fallbackResult = await service.fallback();
          fallbackUsed = true;
          this.metrics.fallbacksUsed++;

          return {
            name: service.name,
            status: 'success',
            data: fallbackResult,
            duration: Date.now() - startTime,
            fallbackUsed,
          };
        } catch (fallbackError) {
          return {
            name: service.name,
            status: 'failed',
            error: fallbackError as Error,
            duration: Date.now() - startTime,
            fallbackUsed,
          };
        }
      }

      // Déterminer le type d'échec
      const status = (error as Error).message.includes('timeout') ? 'timeout' : 'failed';

      return {
        name: service.name,
        status,
        error: error as Error,
        duration: Date.now() - startTime,
        fallbackUsed,
      };
    }
  }

  /**
   * Obtient la fonction de service (à implémenter selon les besoins)
   */
  private getServiceFunction(serviceName: string): () => Promise<any> {
    // Cette fonction devrait être configurée avec un registry de services
    // Pour l'exemple, on retourne une fonction mock
    return async () => {
      throw new Error(`Service function for ${serviceName} not implemented`);
    };
  }

  /**
   * Met à jour les métriques
   */
  private updateMetrics(duration: number): void {
    const totalDuration = this.metrics.averageDuration * (this.metrics.totalRequests - 1);
    this.metrics.averageDuration = (totalDuration + duration) / this.metrics.totalRequests;
  }

  /**
   * Obtient les métriques
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;

    const partialRate = this.metrics.totalRequests > 0 
      ? (this.metrics.partialRequests / this.metrics.totalRequests) * 100 
      : 0;

    const fallbackRate = this.metrics.totalRequests > 0 
      ? (this.metrics.fallbacksUsed / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      successRate,
      partialRate,
      fallbackRate,
    };
  }

  /**
   * Reset des métriques
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      partialRequests: 0,
      failedRequests: 0,
      fallbacksUsed: 0,
      averageDuration: 0,
    };
  }
}

/**
 * Configurations prédéfinies pour différents scénarios
 */
export class DegradationConfigs {
  /**
   * Configuration pour dashboard utilisateur
   */
  static userDashboard(): DegradationConfig {
    return {
      strategy: 'best_effort',
      globalTimeout: 10000,
      services: [
        {
          name: 'user_profile',
          priority: 'critical',
          timeout: 2000,
          fallback: () => ({ name: 'User', plan: 'free' }),
        },
        {
          name: 'campaigns',
          priority: 'critical',
          timeout: 3000,
          fallback: () => [],
        },
        {
          name: 'analytics',
          priority: 'important',
          timeout: 5000,
          fallback: () => ({ views: 0, revenue: 0 }),
        },
        {
          name: 'ai_recommendations',
          priority: 'optional',
          timeout: 8000,
        },
        {
          name: 'social_media_stats',
          priority: 'optional',
          timeout: 6000,
        },
      ],
    };
  }

  /**
   * Configuration pour génération de contenu
   */
  static contentGeneration(): DegradationConfig {
    return {
      strategy: 'fail_fast',
      globalTimeout: 30000,
      services: [
        {
          name: 'ai_service',
          priority: 'critical',
          timeout: 15000,
          fallback: () => ({ content: 'Fallback content generated' }),
        },
        {
          name: 'image_generation',
          priority: 'important',
          timeout: 20000,
        },
        {
          name: 'hashtag_suggestions',
          priority: 'optional',
          timeout: 5000,
          fallback: () => ['#content', '#creator'],
        },
      ],
    };
  }

  /**
   * Configuration pour analytics
   */
  static analytics(): DegradationConfig {
    return {
      strategy: 'best_effort',
      globalTimeout: 15000,
      services: [
        {
          name: 'real_time_stats',
          priority: 'critical',
          timeout: 3000,
          fallback: () => ({ current_viewers: 0 }),
        },
        {
          name: 'historical_data',
          priority: 'important',
          timeout: 8000,
          fallback: () => ({ revenue: [], views: [] }),
        },
        {
          name: 'competitor_analysis',
          priority: 'optional',
          timeout: 12000,
        },
        {
          name: 'trend_analysis',
          priority: 'optional',
          timeout: 10000,
        },
      ],
    };
  }

  /**
   * Configuration mode maintenance
   */
  static maintenanceMode(): DegradationConfig {
    return {
      strategy: 'essential_only',
      globalTimeout: 5000,
      services: [
        {
          name: 'user_auth',
          priority: 'critical',
          timeout: 2000,
        },
        {
          name: 'basic_profile',
          priority: 'critical',
          timeout: 3000,
          fallback: () => ({ message: 'Service temporarily unavailable' }),
        },
      ],
    };
  }
}

/**
 * Decorator pour appliquer la dégradation gracieuse
 */
export function withGracefulDegradation(config: DegradationConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const degradationService = GracefulDegradationService.getInstance();

    descriptor.value = async function (...args: any[]) {
      try {
        // Tenter l'exécution normale
        return await originalMethod.apply(this, args);
      } catch (error) {
        // En cas d'échec, utiliser la dégradation gracieuse
        console.warn(`[GracefulDegradation] Primary method failed, using degradation for ${propertyKey}`, error);
        
        const result = await degradationService.executeWithDegradation(config);
        
        if (result.status === 'failed') {
          throw new Error(`All services failed: ${result.criticalFailures.join(', ')}`);
        }
        
        return result;
      }
    };

    return descriptor;
  };
}

/**
 * Utilitaires pour patterns courants
 */
export class DegradationPatterns {
  private static service = GracefulDegradationService.getInstance();

  /**
   * Exécution avec fallback simple
   */
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    timeout: number = 5000
  ): Promise<T> {
    const config: DegradationConfig = {
      strategy: 'best_effort',
      globalTimeout: timeout,
      services: [
        {
          name: 'primary',
          priority: 'critical',
          timeout,
          fallback,
        },
      ],
    };

    const result = await this.service.executeWithDegradation(config);
    
    if (result.status === 'failed') {
      throw new Error('Both primary and fallback failed');
    }
    
    return result.results[0].data;
  }

  /**
   * Exécution avec multiple fallbacks
   */
  static async withMultipleFallbacks<T>(
    operations: Array<{
      name: string;
      fn: () => Promise<T>;
      timeout?: number;
    }>
  ): Promise<T> {
    for (const operation of operations) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), operation.timeout || 5000);
        });

        return await Promise.race([operation.fn(), timeoutPromise]);
      } catch (error) {
        console.warn(`[DegradationPatterns] Operation ${operation.name} failed:`, error);
        // Continue to next fallback
      }
    }

    throw new Error('All fallback operations failed');
  }
}

// Export de l'instance globale
export const gracefulDegradation = GracefulDegradationService.getInstance();