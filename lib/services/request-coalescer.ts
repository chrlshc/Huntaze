/**
 * Request Coalescing Service
 * Évite les requêtes duplicatas simultanées et optimise les performances
 */

interface CoalescingOptions {
  ttl?: number;           // Durée de vie du cache (ms)
  maxConcurrent?: number; // Nombre max de requêtes simultanées
  keyGenerator?: (args: any[]) => string; // Générateur de clé personnalisé
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  subscribers: number;
}

interface CoalescingMetrics {
  totalRequests: number;
  coalescedRequests: number;
  cacheHits: number;
  averageSubscribers: number;
  coalescingRate: number; // Pourcentage de requêtes coalescées
}

/**
 * Service de coalescing pour éviter les requêtes duplicatas
 */
export class RequestCoalescer {
  private pending = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private metrics: CoalescingMetrics = {
    totalRequests: 0,
    coalescedRequests: 0,
    cacheHits: 0,
    averageSubscribers: 0,
    coalescingRate: 0,
  };

  private readonly defaultTTL = 5000; // 5 secondes par défaut
  private readonly maxCacheSize = 1000;
  private readonly cleanupInterval = 60000; // Nettoyage toutes les minutes

  constructor() {
    // Nettoyage périodique
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Execute une fonction avec coalescing
   */
  async coalesce<T>(
    key: string,
    fn: () => Promise<T>,
    options: CoalescingOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL } = options;
    
    this.metrics.totalRequests++;

    // Vérifier le cache d'abord
    const cached = this.getFromCache(key);
    if (cached !== null) {
      this.metrics.cacheHits++;
      return cached;
    }

    // Vérifier si une requête est déjà en cours
    const existing = this.pending.get(key);
    if (existing) {
      existing.subscribers++;
      this.metrics.coalescedRequests++;
      
      try {
        const result = await existing.promise;
        return result;
      } catch (error) {
        // Si la requête échoue, on ne met pas en cache
        throw error;
      }
    }

    // Créer une nouvelle requête
    const pendingRequest: PendingRequest<T> = {
      promise: this.executeRequest(key, fn, ttl),
      timestamp: Date.now(),
      subscribers: 1,
    };

    this.pending.set(key, pendingRequest);

    try {
      const result = await pendingRequest.promise;
      
      // Mettre à jour les métriques
      this.updateMetrics(pendingRequest.subscribers);
      
      return result;
    } finally {
      // Nettoyer la requête en cours
      this.pending.delete(key);
    }
  }

  /**
   * Execute la requête et gère le cache
   */
  private async executeRequest<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const result = await fn();
      
      // Mettre en cache le résultat
      this.setCache(key, result, ttl);
      
      return result;
    } catch (error) {
      // Ne pas mettre en cache les erreurs
      throw error;
    }
  }

  /**
   * Coalescing avec génération automatique de clé
   */
  async coalesceByArgs<T>(
    fn: (...args: any[]) => Promise<T>,
    args: any[],
    options: CoalescingOptions = {}
  ): Promise<T> {
    const { keyGenerator = this.defaultKeyGenerator } = options;
    const key = keyGenerator(args);
    
    return this.coalesce(key, () => fn(...args), options);
  }

  /**
   * Générateur de clé par défaut
   */
  private defaultKeyGenerator(args: any[]): string {
    return JSON.stringify(args);
  }

  /**
   * Batch coalescing pour plusieurs requêtes
   */
  async coalesceBatch<T>(
    requests: Array<{
      key: string;
      fn: () => Promise<T>;
      options?: CoalescingOptions;
    }>
  ): Promise<T[]> {
    const promises = requests.map(({ key, fn, options }) =>
      this.coalesce(key, fn, options)
    );

    return Promise.all(promises);
  }

  /**
   * Invalidation manuelle du cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pending.delete(key);
  }

  /**
   * Invalidation par pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    for (const key of this.pending.keys()) {
      if (pattern.test(key)) {
        this.pending.delete(key);
      }
    }
    
    return invalidated;
  }

  /**
   * Préchargement du cache
   */
  async warmup<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const result = await fn();
      this.setCache(key, result, ttl);
    } catch (error) {
      console.warn(`[RequestCoalescer] Warmup failed for key ${key}:`, error);
    }
  }

  /**
   * Gestion du cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Nettoyer le cache si trop plein
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Nettoyage du cache expiré
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Nettoyer le cache expiré
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        this.cache.delete(key);
      }
    }

    // Nettoyer les requêtes en attente trop anciennes (> 5 minutes)
    for (const [key, pending] of this.pending.entries()) {
      if (now - pending.timestamp > 300000) {
        this.pending.delete(key);
      }
    }
  }

  private cleanupCache(): void {
    // Supprimer les entrées les plus anciennes
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = Math.floor(this.maxCacheSize * 0.2); // Supprimer 20%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Mise à jour des métriques
   */
  private updateMetrics(subscribers: number): void {
    const totalSubscribers = this.metrics.averageSubscribers * this.metrics.totalRequests;
    this.metrics.averageSubscribers = (totalSubscribers + subscribers) / this.metrics.totalRequests;
    this.metrics.coalescingRate = (this.metrics.coalescedRequests / this.metrics.totalRequests) * 100;
  }

  /**
   * Obtenir les métriques
   */
  getMetrics(): CoalescingMetrics & {
    pendingRequests: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    const cacheHitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      pendingRequests: this.pending.size,
      cacheSize: this.cache.size,
      cacheHitRate,
    };
  }

  /**
   * Reset des métriques
   */
  reset(): void {
    this.pending.clear();
    this.cache.clear();
    this.metrics = {
      totalRequests: 0,
      coalescedRequests: 0,
      cacheHits: 0,
      averageSubscribers: 0,
      coalescingRate: 0,
    };
  }

  /**
   * Health check
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      pendingRequests: number;
      cacheSize: number;
      coalescingRate: number;
      cacheHitRate: number;
    };
  } {
    const metrics = this.getMetrics();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Trop de requêtes en attente
    if (metrics.pendingRequests > 100) {
      status = 'unhealthy';
    } else if (metrics.pendingRequests > 50) {
      status = 'degraded';
    }
    
    // Cache trop plein
    if (metrics.cacheSize > this.maxCacheSize * 0.9) {
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      details: {
        pendingRequests: metrics.pendingRequests,
        cacheSize: metrics.cacheSize,
        coalescingRate: metrics.coalescingRate,
        cacheHitRate: metrics.cacheHitRate,
      },
    };
  }
}

/**
 * Instance globale du coalescer
 */
let globalCoalescer: RequestCoalescer | null = null;

export function getRequestCoalescer(): RequestCoalescer {
  if (!globalCoalescer) {
    globalCoalescer = new RequestCoalescer();
  }
  return globalCoalescer;
}

/**
 * Decorator pour appliquer automatiquement le coalescing
 */
export function withCoalescing(
  keyPrefix: string,
  options: CoalescingOptions = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const coalescer = getRequestCoalescer();

    descriptor.value = async function (...args: any[]) {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      
      return coalescer.coalesce(
        key,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

/**
 * Utilitaires pour patterns courants
 */
export class CoalescingPatterns {
  private static coalescer = getRequestCoalescer();

  /**
   * Coalescing pour requêtes utilisateur
   */
  static async userRequest<T>(
    userId: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `user:${userId}:${operation}`;
    return this.coalescer.coalesce(key, fn, { ttl: 30000 }); // 30s TTL
  }

  /**
   * Coalescing pour données de campagne
   */
  static async campaignData<T>(
    campaignId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `campaign:${campaignId}:data`;
    return this.coalescer.coalesce(key, fn, { ttl: 60000 }); // 1min TTL
  }

  /**
   * Coalescing pour analytics
   */
  static async analytics<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `analytics:${query}`;
    return this.coalescer.coalesce(key, fn, { ttl: 300000 }); // 5min TTL
  }

  /**
   * Coalescing pour recommandations AI
   */
  static async aiRecommendations<T>(
    userId: string,
    context: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `ai:${userId}:${context}`;
    return this.coalescer.coalesce(key, fn, { ttl: 1800000 }); // 30min TTL
  }
}