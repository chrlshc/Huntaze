/**
 * Smart Request Coalescer with Priority and Stale-While-Revalidate
 * Coalescing intelligent avec gestion des timeouts et priorités
 */

interface SmartCoalescingOptions {
  ttl?: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  maxWaitTime?: number;
  staleWhileRevalidate?: boolean;
  maxCoalescingTime?: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  startTime: number;
  subscribers: Array<{
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    maxWaitTime: number;
  }>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  stale: boolean;
}

interface CoalescingMetrics {
  totalRequests: number;
  coalescedRequests: number;
  cacheHits: number;
  staleServed: number;
  timeoutsByPriority: Record<string, number>;
  averageWaitTime: number;
  coalescingEfficiency: number;
}

/**
 * Request Coalescer intelligent avec priorités et optimisations avancées
 */
export class SmartRequestCoalescer {
  private pending = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: CoalescingMetrics = {
    totalRequests: 0,
    coalescedRequests: 0,
    cacheHits: 0,
    staleServed: 0,
    timeoutsByPriority: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    averageWaitTime: 0,
    coalescingEfficiency: 0,
  };

  private readonly defaultTTL = 60000; // 1 minute
  private readonly maxCacheSize = 2000;
  private readonly defaultMaxCoalescingTime = 5000; // 5 secondes max
  private readonly cleanupInterval = 120000; // Nettoyage toutes les 2 minutes

  constructor() {
    setInterval(() => this.cleanup(), this.cleanupInterval);
    setInterval(() => this.updateMetrics(), 10000); // Métriques toutes les 10s
  }

  /**
   * Coalescing intelligent avec gestion des priorités
   */
  async coalesce<T>(
    key: string,
    fn: () => Promise<T>,
    options: SmartCoalescingOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const {
      ttl = this.defaultTTL,
      priority = 'MEDIUM',
      maxWaitTime = this.getDefaultMaxWaitTime(priority),
      staleWhileRevalidate = false,
      maxCoalescingTime = this.defaultMaxCoalescingTime,
    } = options;

    this.metrics.totalRequests++;

    // Vérifier le cache d'abord
    const cached = this.getFromCache(key, staleWhileRevalidate);
    if (cached !== null) {
      if (cached.isStale && staleWhileRevalidate) {
        // Stale-while-revalidate : retourne stale, revalide en arrière-plan
        this.revalidateInBackground(key, fn, ttl);
        this.metrics.staleServed++;
      } else {
        this.metrics.cacheHits++;
      }
      return cached.data;
    }

    // Vérifier si une requête est en cours
    const existing = this.pending.get(key);
    if (existing) {
      return this.joinExistingRequest(existing, priority, maxWaitTime, maxCoalescingTime);
    }

    // Créer nouvelle requête pour HIGH priority ou si pas de coalescing
    if (priority === 'HIGH') {
      return this.executeImmediately(key, fn, ttl);
    }

    // Créer requête coalescée pour MEDIUM/LOW priority
    return this.createCoalescedRequest(key, fn, ttl, priority, maxWaitTime);
  }

  /**
   * Rejoint une requête existante avec gestion des timeouts
   */
  private async joinExistingRequest<T>(
    existing: PendingRequest<T>,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    maxWaitTime: number,
    maxCoalescingTime: number
  ): Promise<T> {
    const elapsed = Date.now() - existing.startTime;

    // Si la requête coalesced prend trop de temps, lance une nouvelle requête
    if (elapsed > maxCoalescingTime) {
      console.warn(`[SmartCoalescer] Coalescing timeout after ${elapsed}ms, executing new request`);
      this.metrics.timeoutsByPriority[priority]++;
      
      // Pour HIGH priority, exécute immédiatement
      if (priority === 'HIGH') {
        throw new Error('Coalescing timeout - execute independently');
      }
    }

    // Ajouter à la liste des subscribers
    return new Promise<T>((resolve, reject) => {
      existing.subscribers.push({
        resolve,
        reject,
        priority,
        maxWaitTime,
      });

      this.metrics.coalescedRequests++;

      // Timeout individuel pour ce subscriber
      setTimeout(() => {
        reject(new Error(`Request timeout after ${maxWaitTime}ms`));
        this.metrics.timeoutsByPriority[priority]++;
      }, maxWaitTime);
    });
  }

  /**
   * Exécute immédiatement (HIGH priority)
   */
  private async executeImmediately<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const result = await fn();
      this.setCache(key, result, ttl);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une requête coalescée
   */
  private async createCoalescedRequest<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    maxWaitTime: number
  ): Promise<T> {
    const startTime = Date.now();
    
    const pendingRequest: PendingRequest<T> = {
      promise: this.executeCoalescedRequest(key, fn, ttl),
      startTime,
      subscribers: [],
    };

    this.pending.set(key, pendingRequest);

    try {
      const result = await pendingRequest.promise;
      
      // Notifier tous les subscribers
      pendingRequest.subscribers.forEach(subscriber => {
        subscriber.resolve(result);
      });

      return result;
    } catch (error) {
      // Notifier l'erreur à tous les subscribers
      pendingRequest.subscribers.forEach(subscriber => {
        subscriber.reject(error as Error);
      });
      
      throw error;
    } finally {
      this.pending.delete(key);
    }
  }

  /**
   * Exécute la requête coalescée
   */
  private async executeCoalescedRequest<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const result = await fn();
      this.setCache(key, result, ttl);
      return result;
    } catch (error) {
      // Ne pas mettre en cache les erreurs
      throw error;
    }
  }

  /**
   * Revalidation en arrière-plan pour stale-while-revalidate
   */
  private revalidateInBackground<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number
  ): void {
    setImmediate(async () => {
      try {
        const fresh = await fn();
        this.setCache(key, fresh, ttl);
        console.debug(`[SmartCoalescer] Background revalidation completed for ${key}`);
      } catch (error) {
        console.warn(`[SmartCoalescer] Background revalidation failed for ${key}:`, error);
      }
    });
  }

  /**
   * Gestion du cache avec stale-while-revalidate
   */
  private getFromCache<T>(
    key: string,
    staleWhileRevalidate: boolean
  ): { data: T; isStale: boolean } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp;
    const isExpired = age > cached.ttl;

    // Mettre à jour les stats d'accès
    cached.accessCount++;
    cached.lastAccess = now;

    if (isExpired) {
      if (staleWhileRevalidate) {
        // Retourner données stale
        cached.stale = true;
        return { data: cached.data, isStale: true };
      } else {
        // Supprimer du cache
        this.cache.delete(key);
        return null;
      }
    }

    return { data: cached.data, isStale: false };
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    // Nettoyer le cache si trop plein
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now(),
      stale: false,
    });
  }

  /**
   * Éviction LRU intelligente
   */
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    
    // Trier par score LRU (combinaison de dernière utilisation et fréquence)
    entries.sort((a, b) => {
      const scoreA = this.calculateLRUScore(a[1]);
      const scoreB = this.calculateLRUScore(b[1]);
      return scoreA - scoreB; // Plus petit score = éviction prioritaire
    });

    // Supprimer 20% des entrées les moins utilisées
    const toRemove = Math.floor(this.maxCacheSize * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.debug(`[SmartCoalescer] Evicted ${toRemove} cache entries via LRU`);
  }

  /**
   * Calcule un score LRU (plus bas = éviction prioritaire)
   */
  private calculateLRUScore(entry: CacheEntry<any>): number {
    const now = Date.now();
    const timeSinceLastAccess = now - entry.lastAccess;
    const accessFrequency = entry.accessCount;
    
    // Score basé sur récence et fréquence
    // Plus récent et plus fréquent = score plus élevé
    return accessFrequency / (timeSinceLastAccess / 1000 + 1);
  }

  /**
   * Temps d'attente par défaut selon la priorité
   */
  private getDefaultMaxWaitTime(priority: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (priority) {
      case 'HIGH': return 1000;   // 1 seconde max
      case 'MEDIUM': return 3000; // 3 secondes max
      case 'LOW': return 10000;   // 10 secondes max
    }
  }

  /**
   * Invalidation intelligente par pattern
   */
  invalidatePattern(pattern: RegExp, options?: { 
    keepStale?: boolean;
    maxAge?: number;
  }): number {
    let invalidated = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        if (options?.keepStale) {
          // Marquer comme stale au lieu de supprimer
          entry.stale = true;
          entry.ttl = options.maxAge || 60000; // 1 minute par défaut
        } else {
          this.cache.delete(key);
        }
        invalidated++;
      }
    }
    
    // Invalider aussi les requêtes en cours
    for (const key of this.pending.keys()) {
      if (pattern.test(key)) {
        this.pending.delete(key);
      }
    }
    
    console.info(`[SmartCoalescer] Invalidated ${invalidated} entries matching pattern ${pattern}`);
    return invalidated;
  }

  /**
   * Préchargement intelligent du cache
   */
  async warmCache<T>(
    entries: Array<{
      key: string;
      fn: () => Promise<T>;
      ttl?: number;
      priority?: number; // 1-10, plus élevé = plus prioritaire
    }>
  ): Promise<void> {
    // Trier par priorité
    const sortedEntries = entries.sort((a, b) => (b.priority || 5) - (a.priority || 5));
    
    console.info(`[SmartCoalescer] Warming cache with ${entries.length} entries`);
    
    // Exécuter en parallèle avec limite de concurrence
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(sortedEntries, concurrencyLimit);
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async ({ key, fn, ttl = this.defaultTTL }) => {
          try {
            const result = await fn();
            this.setCache(key, result, ttl);
            console.debug(`[SmartCoalescer] Cache warmed for ${key}`);
          } catch (error) {
            console.warn(`[SmartCoalescer] Cache warming failed for ${key}:`, error);
          }
        })
      );
    }
  }

  /**
   * Nettoyage périodique
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    // Nettoyer le cache expiré
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl && !entry.stale) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    // Nettoyer les requêtes en attente trop anciennes
    for (const [key, pending] of this.pending.entries()) {
      if (now - pending.startTime > 300000) { // 5 minutes
        this.pending.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.debug(`[SmartCoalescer] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Met à jour les métriques calculées
   */
  private updateMetrics(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.coalescingEfficiency = 
        (this.metrics.coalescedRequests / this.metrics.totalRequests) * 100;
    }
  }

  /**
   * Obtient les métriques détaillées
   */
  getMetrics(): CoalescingMetrics & {
    pendingRequests: number;
    cacheSize: number;
    cacheHitRate: number;
    staleHitRate: number;
    averageCacheAge: number;
    topCachedKeys: Array<{ key: string; accessCount: number; age: number }>;
  } {
    const cacheHitRate = this.metrics.totalRequests > 0 
      ? ((this.metrics.cacheHits + this.metrics.staleServed) / this.metrics.totalRequests) * 100 
      : 0;

    const staleHitRate = this.metrics.totalRequests > 0
      ? (this.metrics.staleServed / this.metrics.totalRequests) * 100
      : 0;

    // Calculer l'âge moyen du cache
    const now = Date.now();
    const cacheAges = Array.from(this.cache.values()).map(entry => now - entry.timestamp);
    const averageCacheAge = cacheAges.length > 0 
      ? cacheAges.reduce((sum, age) => sum + age, 0) / cacheAges.length 
      : 0;

    // Top clés les plus utilisées
    const topCachedKeys = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: now - entry.timestamp,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      ...this.metrics,
      pendingRequests: this.pending.size,
      cacheSize: this.cache.size,
      cacheHitRate,
      staleHitRate,
      averageCacheAge,
      topCachedKeys,
    };
  }

  /**
   * Health check
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      cacheEfficiency: number;
      coalescingEfficiency: number;
      timeoutRate: number;
      memoryPressure: number;
    };
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];
    
    // Calculer les indicateurs de santé
    const cacheEfficiency = metrics.cacheHitRate;
    const coalescingEfficiency = metrics.coalescingEfficiency;
    const totalTimeouts = Object.values(metrics.timeoutsByPriority).reduce((sum, count) => sum + count, 0);
    const timeoutRate = metrics.totalRequests > 0 ? (totalTimeouts / metrics.totalRequests) * 100 : 0;
    const memoryPressure = (metrics.cacheSize / this.maxCacheSize) * 100;

    // Déterminer le statut
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (timeoutRate > 5 || memoryPressure > 95) {
      status = 'unhealthy';
    } else if (timeoutRate > 2 || memoryPressure > 85 || cacheEfficiency < 50) {
      status = 'degraded';
    }

    // Générer des recommandations
    if (cacheEfficiency < 60) {
      recommendations.push('Consider increasing cache TTL or improving cache key strategy');
    }
    
    if (coalescingEfficiency < 20) {
      recommendations.push('Low coalescing efficiency - review request patterns');
    }
    
    if (timeoutRate > 1) {
      recommendations.push('High timeout rate - consider adjusting maxWaitTime or maxCoalescingTime');
    }
    
    if (memoryPressure > 80) {
      recommendations.push('High memory pressure - consider increasing maxCacheSize or improving eviction');
    }

    return {
      status,
      details: {
        cacheEfficiency,
        coalescingEfficiency,
        timeoutRate,
        memoryPressure,
      },
      recommendations,
    };
  }

  /**
   * Utilitaire pour diviser un array en chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Reset complet (pour les tests)
   */
  reset(): void {
    this.pending.clear();
    this.cache.clear();
    this.metrics = {
      totalRequests: 0,
      coalescedRequests: 0,
      cacheHits: 0,
      staleServed: 0,
      timeoutsByPriority: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      averageWaitTime: 0,
      coalescingEfficiency: 0,
    };
  }
}

/**
 * Instance globale du smart coalescer
 */
let globalSmartCoalescer: SmartRequestCoalescer | null = null;

export function getSmartRequestCoalescer(): SmartRequestCoalescer {
  if (!globalSmartCoalescer) {
    globalSmartCoalescer = new SmartRequestCoalescer();
  }
  return globalSmartCoalescer;
}

/**
 * Patterns de coalescing intelligents
 */
export class SmartCoalescingPatterns {
  private static coalescer = getSmartRequestCoalescer();

  /**
   * Requêtes utilisateur avec priorité HIGH
   */
  static async userRequest<T>(
    userId: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `user:${userId}:${operation}`;
    return this.coalescer.coalesce(key, fn, {
      ttl: 30000,
      priority: 'HIGH',
      staleWhileRevalidate: true,
    });
  }

  /**
   * Analytics avec priorité LOW et long TTL
   */
  static async analytics<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `analytics:${query}`;
    return this.coalescer.coalesce(key, fn, {
      ttl: 300000, // 5 minutes
      priority: 'LOW',
      maxWaitTime: 10000,
      staleWhileRevalidate: true,
    });
  }

  /**
   * Recommandations AI avec cache intelligent
   */
  static async aiRecommendations<T>(
    userId: string,
    context: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `ai:${userId}:${context}`;
    return this.coalescer.coalesce(key, fn, {
      ttl: 1800000, // 30 minutes
      priority: 'MEDIUM',
      staleWhileRevalidate: true,
      maxCoalescingTime: 8000, // Plus de temps pour AI
    });
  }
}

/**
 * Decorator pour coalescing intelligent
 */
export function withSmartCoalescing(
  keyPrefix: string,
  options: SmartCoalescingOptions = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const coalescer = getSmartRequestCoalescer();

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