/**
 * Azure AI Caching Service
 * Implements response caching, embedding caching, and cache warming
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 46: Optimize caching strategies
 * Validates: Requirements 10.3
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  lastAccessed: Date;
  size: number; // Approximate size in bytes
  tags: string[];
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTLMs: number;
  embeddingTTLMs: number;
  responseTTLMs: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
  enableCompression: boolean;
  warmingEnabled: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  warmingCount: number;
}

export interface WarmingQuery {
  id: string;
  query: string;
  frequency: number; // How often this query is used
  lastWarmed: Date | null;
  priority: number;
}

/**
 * Azure AI Caching Service
 * Provides intelligent caching for AI responses and embeddings
 */
export class AzureCachingService {
  private responseCache: Map<string, CacheEntry<string>> = new Map();
  private embeddingCache: Map<string, CacheEntry<number[]>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private warmingQueries: Map<string, WarmingQuery> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;


  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize || 100 * 1024 * 1024, // 100MB default
      defaultTTLMs: config?.defaultTTLMs || 3600000, // 1 hour
      embeddingTTLMs: config?.embeddingTTLMs || 86400000, // 24 hours
      responseTTLMs: config?.responseTTLMs || 1800000, // 30 minutes
      evictionPolicy: config?.evictionPolicy || 'lru',
      enableCompression: config?.enableCompression ?? false,
      warmingEnabled: config?.warmingEnabled ?? true,
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      warmingCount: 0,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Generate cache key from prompt/query
   */
  private generateKey(input: string, prefix: string = ''): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${prefix}${Math.abs(hash).toString(36)}`;
  }

  /**
   * Estimate size of a value in bytes
   */
  private estimateSize(value: unknown): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    if (Array.isArray(value)) {
      if (typeof value[0] === 'number') {
        return value.length * 8; // Float64
      }
      return JSON.stringify(value).length * 2;
    }
    return JSON.stringify(value).length * 2;
  }

  /**
   * Cache a response
   * Validates: Requirements 10.3
   */
  cacheResponse(prompt: string, response: string, ttlMs?: number, tags: string[] = []): void {
    const key = this.generateKey(prompt, 'resp:');
    const size = this.estimateSize(response);
    const ttl = ttlMs || this.config.responseTTLMs;

    // Check if we need to evict
    this.ensureCapacity(size);

    const entry: CacheEntry<string> = {
      key,
      value: response,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      hits: 0,
      lastAccessed: new Date(),
      size,
      tags,
    };

    this.responseCache.set(key, entry);
    this.updateStats();
  }

  /**
   * Get cached response
   */
  getResponse(prompt: string): string | null {
    const key = this.generateKey(prompt, 'resp:');
    const entry = this.responseCache.get(key);

    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // Check expiration
    if (entry.expiresAt < new Date()) {
      this.responseCache.delete(key);
      this.stats.missCount++;
      this.updateStats();
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = new Date();
    this.stats.hitCount++;
    this.updateHitRate();

    return entry.value;
  }

  /**
   * Cache an embedding
   */
  cacheEmbedding(text: string, embedding: number[], ttlMs?: number, tags: string[] = []): void {
    const key = this.generateKey(text, 'emb:');
    const size = this.estimateSize(embedding);
    const ttl = ttlMs || this.config.embeddingTTLMs;

    // Check if we need to evict
    this.ensureCapacity(size);

    const entry: CacheEntry<number[]> = {
      key,
      value: embedding,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      hits: 0,
      lastAccessed: new Date(),
      size,
      tags,
    };

    this.embeddingCache.set(key, entry);
    this.updateStats();
  }

  /**
   * Get cached embedding
   */
  getEmbedding(text: string): number[] | null {
    const key = this.generateKey(text, 'emb:');
    const entry = this.embeddingCache.get(key);

    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // Check expiration
    if (entry.expiresAt < new Date()) {
      this.embeddingCache.delete(key);
      this.stats.missCount++;
      this.updateStats();
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = new Date();
    this.stats.hitCount++;
    this.updateHitRate();

    return entry.value;
  }

  /**
   * Batch cache embeddings
   */
  cacheEmbeddingsBatch(items: Array<{ text: string; embedding: number[] }>, ttlMs?: number): void {
    for (const item of items) {
      this.cacheEmbedding(item.text, item.embedding, ttlMs);
    }
  }

  /**
   * Get multiple embeddings from cache
   */
  getEmbeddingsBatch(texts: string[]): Map<string, number[] | null> {
    const results = new Map<string, number[] | null>();
    for (const text of texts) {
      results.set(text, this.getEmbedding(text));
    }
    return results;
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(requiredSize: number): void {
    while (this.stats.totalSize + requiredSize > this.config.maxSize) {
      const evicted = this.evictOne();
      if (!evicted) break;
    }
  }

  /**
   * Evict one entry based on policy
   */
  private evictOne(): boolean {
    let entryToEvict: { cache: Map<string, CacheEntry<unknown>>; key: string } | null = null;

    switch (this.config.evictionPolicy) {
      case 'lru':
        entryToEvict = this.findLRUEntry();
        break;
      case 'lfu':
        entryToEvict = this.findLFUEntry();
        break;
      case 'ttl':
        entryToEvict = this.findNearestExpiryEntry();
        break;
    }

    if (entryToEvict) {
      entryToEvict.cache.delete(entryToEvict.key);
      this.stats.evictionCount++;
      this.updateStats();
      return true;
    }

    return false;
  }

  /**
   * Find least recently used entry
   */
  private findLRUEntry(): { cache: Map<string, CacheEntry<unknown>>; key: string } | null {
    let oldest: { cache: Map<string, CacheEntry<unknown>>; key: string; time: Date } | null = null;

    for (const [key, entry] of this.responseCache) {
      if (!oldest || entry.lastAccessed < oldest.time) {
        oldest = { cache: this.responseCache as Map<string, CacheEntry<unknown>>, key, time: entry.lastAccessed };
      }
    }

    for (const [key, entry] of this.embeddingCache) {
      if (!oldest || entry.lastAccessed < oldest.time) {
        oldest = { cache: this.embeddingCache as Map<string, CacheEntry<unknown>>, key, time: entry.lastAccessed };
      }
    }

    return oldest ? { cache: oldest.cache, key: oldest.key } : null;
  }

  /**
   * Find least frequently used entry
   */
  private findLFUEntry(): { cache: Map<string, CacheEntry<unknown>>; key: string } | null {
    let leastUsed: { cache: Map<string, CacheEntry<unknown>>; key: string; hits: number } | null = null;

    for (const [key, entry] of this.responseCache) {
      if (!leastUsed || entry.hits < leastUsed.hits) {
        leastUsed = { cache: this.responseCache as Map<string, CacheEntry<unknown>>, key, hits: entry.hits };
      }
    }

    for (const [key, entry] of this.embeddingCache) {
      if (!leastUsed || entry.hits < leastUsed.hits) {
        leastUsed = { cache: this.embeddingCache as Map<string, CacheEntry<unknown>>, key, hits: entry.hits };
      }
    }

    return leastUsed ? { cache: leastUsed.cache, key: leastUsed.key } : null;
  }

  /**
   * Find entry nearest to expiry
   */
  private findNearestExpiryEntry(): { cache: Map<string, CacheEntry<unknown>>; key: string } | null {
    let nearest: { cache: Map<string, CacheEntry<unknown>>; key: string; expiry: Date } | null = null;

    for (const [key, entry] of this.responseCache) {
      if (!nearest || entry.expiresAt < nearest.expiry) {
        nearest = { cache: this.responseCache as Map<string, CacheEntry<unknown>>, key, expiry: entry.expiresAt };
      }
    }

    for (const [key, entry] of this.embeddingCache) {
      if (!nearest || entry.expiresAt < nearest.expiry) {
        nearest = { cache: this.embeddingCache as Map<string, CacheEntry<unknown>>, key, expiry: entry.expiresAt };
      }
    }

    return nearest ? { cache: nearest.cache, key: nearest.key } : null;
  }


  /**
   * Update cache statistics
   */
  private updateStats(): void {
    let totalSize = 0;
    let totalEntries = 0;

    for (const entry of this.responseCache.values()) {
      totalSize += entry.size;
      totalEntries++;
    }

    for (const entry of this.embeddingCache.values()) {
      totalSize += entry.size;
      totalEntries++;
    }

    this.stats.totalSize = totalSize;
    this.stats.totalEntries = totalEntries;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? this.stats.hitCount / total : 0;
  }

  /**
   * Register a query for cache warming
   */
  registerWarmingQuery(query: string, priority: number = 1): void {
    const id = this.generateKey(query, 'warm:');
    
    const existing = this.warmingQueries.get(id);
    if (existing) {
      existing.frequency++;
      existing.priority = Math.max(existing.priority, priority);
    } else {
      this.warmingQueries.set(id, {
        id,
        query,
        frequency: 1,
        lastWarmed: null,
        priority,
      });
    }
  }

  /**
   * Get queries that need warming
   */
  getQueriesToWarm(limit: number = 10): WarmingQuery[] {
    return Array.from(this.warmingQueries.values())
      .sort((a, b) => {
        // Sort by priority first, then by frequency
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.frequency - a.frequency;
      })
      .slice(0, limit);
  }

  /**
   * Mark query as warmed
   */
  markWarmed(queryId: string): void {
    const query = this.warmingQueries.get(queryId);
    if (query) {
      query.lastWarmed = new Date();
      this.stats.warmingCount++;
    }
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    let invalidated = 0;

    for (const [key, entry] of this.responseCache) {
      if (entry.tags.includes(tag)) {
        this.responseCache.delete(key);
        invalidated++;
      }
    }

    for (const [key, entry] of this.embeddingCache) {
      if (entry.tags.includes(tag)) {
        this.embeddingCache.delete(key);
        invalidated++;
      }
    }

    this.updateStats();
    return invalidated;
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidateByPrefix(prefix: string): number {
    let invalidated = 0;

    for (const key of this.responseCache.keys()) {
      if (key.startsWith(prefix)) {
        this.responseCache.delete(key);
        invalidated++;
      }
    }

    for (const key of this.embeddingCache.keys()) {
      if (key.startsWith(prefix)) {
        this.embeddingCache.delete(key);
        invalidated++;
      }
    }

    this.updateStats();
    return invalidated;
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.responseCache.clear();
    this.embeddingCache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      warmingCount: this.stats.warmingCount,
    };
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = new Date();
    let cleared = 0;

    for (const [key, entry] of this.responseCache) {
      if (entry.expiresAt < now) {
        this.responseCache.delete(key);
        cleared++;
      }
    }

    for (const [key, entry] of this.embeddingCache) {
      if (entry.expiresAt < now) {
        this.embeddingCache.delete(key);
        cleared++;
      }
    }

    this.updateStats();
    return cleared;
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, 300000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache info
   */
  getCacheInfo(): {
    responses: { count: number; size: number };
    embeddings: { count: number; size: number };
    warmingQueries: number;
    config: CacheConfig;
  } {
    let responseSize = 0;
    let embeddingSize = 0;

    for (const entry of this.responseCache.values()) {
      responseSize += entry.size;
    }

    for (const entry of this.embeddingCache.values()) {
      embeddingSize += entry.size;
    }

    return {
      responses: { count: this.responseCache.size, size: responseSize },
      embeddings: { count: this.embeddingCache.size, size: embeddingSize },
      warmingQueries: this.warmingQueries.size,
      config: { ...this.config },
    };
  }

  /**
   * Check if response is cached
   */
  hasResponse(prompt: string): boolean {
    const key = this.generateKey(prompt, 'resp:');
    const entry = this.responseCache.get(key);
    return entry !== undefined && entry.expiresAt > new Date();
  }

  /**
   * Check if embedding is cached
   */
  hasEmbedding(text: string): boolean {
    const key = this.generateKey(text, 'emb:');
    const entry = this.embeddingCache.get(key);
    return entry !== undefined && entry.expiresAt > new Date();
  }

  /**
   * Extend TTL for an entry
   */
  extendTTL(prompt: string, additionalMs: number, type: 'response' | 'embedding' = 'response'): boolean {
    const key = this.generateKey(prompt, type === 'response' ? 'resp:' : 'emb:');
    const cache = type === 'response' ? this.responseCache : this.embeddingCache;
    const entry = cache.get(key);

    if (entry) {
      entry.expiresAt = new Date(entry.expiresAt.getTime() + additionalMs);
      return true;
    }

    return false;
  }

  /**
   * Get configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get most accessed entries
   */
  getMostAccessed(limit: number = 10): Array<{ key: string; hits: number; type: string }> {
    const entries: Array<{ key: string; hits: number; type: string }> = [];

    for (const [key, entry] of this.responseCache) {
      entries.push({ key, hits: entry.hits, type: 'response' });
    }

    for (const [key, entry] of this.embeddingCache) {
      entries.push({ key, hits: entry.hits, type: 'embedding' });
    }

    return entries.sort((a, b) => b.hits - a.hits).slice(0, limit);
  }
}

// Export singleton instance
export const azureCachingService = new AzureCachingService();
