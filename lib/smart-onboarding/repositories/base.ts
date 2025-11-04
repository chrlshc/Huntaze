// Smart Onboarding System - Base Repository Classes

import { Pool, PoolClient } from 'pg';
import { smartOnboardingCache } from '../config/redis';
import type { ApiResponse } from '../types';

// Base repository interface
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: Record<string, any>): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Base repository implementation with caching
export abstract class CachedRepository<T extends { id: string }> implements BaseRepository<T> {
  protected db: Pool;
  protected tableName: string;
  protected cachePrefix: string;
  protected cacheTTL: number;
  
  constructor(
    db: Pool, 
    tableName: string, 
    cachePrefix: string, 
    cacheTTL: number = 3600
  ) {
    this.db = db;
    this.tableName = tableName;
    this.cachePrefix = cachePrefix;
    this.cacheTTL = cacheTTL;
  }
  
  // Abstract methods to be implemented by subclasses
  protected abstract mapRowToEntity(row: any): T;
  protected abstract mapEntityToRow(entity: Partial<T>): Record<string, any>;
  
  // Cache key generation
  protected getCacheKey(id: string): string {
    return `${this.cachePrefix}:${id}`;
  }
  
  protected getListCacheKey(filters?: Record<string, any>): string {
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    return `${this.cachePrefix}:list:${filterKey}`;
  }
  
  // Find by ID with caching
  async findById(id: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(id);
    
    // Try cache first
    const cached = await smartOnboardingCache.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const entity = this.mapRowToEntity(result.rows[0]);
    
    // Cache the result
    await smartOnboardingCache.redis.setex(
      cacheKey, 
      this.cacheTTL, 
      JSON.stringify(entity)
    );
    
    return entity;
  }
  
  // Find many with optional caching
  async findMany(filters?: Record<string, any>): Promise<T[]> {
    const cacheKey = this.getListCacheKey(filters);
    
    // Try cache first (only for simple queries)
    if (!filters || Object.keys(filters).length <= 2) {
      const cached = await smartOnboardingCache.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    // Build query
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key, index) => {
        params.push(filters[key]);
        return `${key} = $${index + 1}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.db.query(query, params);
    const entities = result.rows.map(row => this.mapRowToEntity(row));
    
    // Cache simple queries
    if (!filters || Object.keys(filters).length <= 2) {
      await smartOnboardingCache.redis.setex(
        cacheKey,
        this.cacheTTL,
        JSON.stringify(entities)
      );
    }
    
    return entities;
  }
  
  // Create with cache invalidation
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const row = this.mapEntityToRow(data);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    const entity = this.mapRowToEntity(result.rows[0]);
    
    // Cache the new entity
    const cacheKey = this.getCacheKey(entity.id);
    await smartOnboardingCache.redis.setex(
      cacheKey,
      this.cacheTTL,
      JSON.stringify(entity)
    );
    
    // Invalidate list caches
    await this.invalidateListCaches();
    
    return entity;
  }
  
  // Update with cache invalidation
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const row = this.mapEntityToRow(data);
    const columns = Object.keys(row);
    const values = Object.values(row);
    
    if (columns.length === 0) {
      return this.findById(id);
    }
    
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`);
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.db.query(query, [id, ...values]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const entity = this.mapRowToEntity(result.rows[0]);
    
    // Update cache
    const cacheKey = this.getCacheKey(id);
    await smartOnboardingCache.redis.setex(
      cacheKey,
      this.cacheTTL,
      JSON.stringify(entity)
    );
    
    // Invalidate list caches
    await this.invalidateListCaches();
    
    return entity;
  }
  
  // Delete with cache invalidation
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    
    if (result.rowCount && result.rowCount > 0) {
      // Remove from cache
      const cacheKey = this.getCacheKey(id);
      await smartOnboardingCache.redis.del(cacheKey);
      
      // Invalidate list caches
      await this.invalidateListCaches();
      
      return true;
    }
    
    return false;
  }
  
  // Batch operations
  async findByIds(ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];
    
    // Try to get from cache first
    const cacheKeys = ids.map(id => this.getCacheKey(id));
    const cached = await smartOnboardingCache.redis.mget(...cacheKeys);
    
    const results: T[] = [];
    const missingIds: string[] = [];
    
    cached.forEach((cachedItem, index) => {
      if (cachedItem) {
        results.push(JSON.parse(cachedItem));
      } else {
        missingIds.push(ids[index]);
      }
    });
    
    // Query missing items from database
    if (missingIds.length > 0) {
      const placeholders = missingIds.map((_, index) => `$${index + 1}`);
      const query = `SELECT * FROM ${this.tableName} WHERE id IN (${placeholders.join(', ')})`;
      const result = await this.db.query(query, missingIds);
      
      const dbResults = result.rows.map(row => this.mapRowToEntity(row));
      results.push(...dbResults);
      
      // Cache the missing items
      const pipeline = smartOnboardingCache.redis.pipeline();
      dbResults.forEach(entity => {
        const cacheKey = this.getCacheKey(entity.id);
        pipeline.setex(cacheKey, this.cacheTTL, JSON.stringify(entity));
      });
      await pipeline.exec();
    }
    
    return results;
  }
  
  async createMany(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<T[]> {
    if (items.length === 0) return [];
    
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      const results: T[] = [];
      
      for (const item of items) {
        const row = this.mapEntityToRow(item);
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, index) => `$${index + 1}`);
        
        const query = `
          INSERT INTO ${this.tableName} (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        const entity = this.mapRowToEntity(result.rows[0]);
        results.push(entity);
      }
      
      await client.query('COMMIT');
      
      // Cache all created entities
      const pipeline = smartOnboardingCache.redis.pipeline();
      results.forEach(entity => {
        const cacheKey = this.getCacheKey(entity.id);
        pipeline.setex(cacheKey, this.cacheTTL, JSON.stringify(entity));
      });
      await pipeline.exec();
      
      // Invalidate list caches
      await this.invalidateListCaches();
      
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Utility methods
  protected async invalidateListCaches(): Promise<void> {
    const pattern = `${this.cachePrefix}:list:*`;
    const keys = await smartOnboardingCache.redis.keys(pattern);
    
    if (keys.length > 0) {
      await smartOnboardingCache.redis.del(...keys);
    }
  }
  
  protected async invalidateCache(id: string): Promise<void> {
    const cacheKey = this.getCacheKey(id);
    await smartOnboardingCache.redis.del(cacheKey);
    await this.invalidateListCaches();
  }
  
  // Transaction support
  async withTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    
    try {
      await this.db.query('SELECT 1');
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - start;
      return {
        status: 'unhealthy',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Time-series repository for high-volume data
export abstract class TimeSeriesRepository<T extends { id: string; timestamp: Date }> {
  protected db: Pool;
  protected tableName: string;
  
  constructor(db: Pool, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }
  
  protected abstract mapRowToEntity(row: any): T;
  protected abstract mapEntityToRow(entity: Omit<T, 'id'>): Record<string, any>;
  
  // Insert single event
  async insert(data: Omit<T, 'id'>): Promise<T> {
    const row = this.mapEntityToRow(data);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    return this.mapRowToEntity(result.rows[0]);
  }
  
  // Batch insert for high-volume data
  async insertBatch(items: Omit<T, 'id'>[]): Promise<void> {
    if (items.length === 0) return;
    
    const firstRow = this.mapEntityToRow(items[0]);
    const columns = Object.keys(firstRow);
    
    const values: any[] = [];
    const valueGroups: string[] = [];
    
    items.forEach((item, itemIndex) => {
      const row = this.mapEntityToRow(item);
      const group = columns.map((_, colIndex) => {
        const paramIndex = itemIndex * columns.length + colIndex + 1;
        values.push(row[columns[colIndex]]);
        return `$${paramIndex}`;
      });
      valueGroups.push(`(${group.join(', ')})`);
    });
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES ${valueGroups.join(', ')}
    `;
    
    await this.db.query(query, values);
  }
  
  // Query by time range
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    filters?: Record<string, any>,
    limit?: number
  ): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE timestamp >= $1 AND timestamp <= $2`;
    const params: any[] = [startTime, endTime];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key, index) => {
        params.push(filters[key]);
        return `${key} = $${index + 3}`;
      });
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY timestamp DESC';
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
  
  // Aggregate data by time intervals
  async aggregateByInterval(
    startTime: Date,
    endTime: Date,
    interval: '1 minute' | '5 minutes' | '1 hour' | '1 day',
    aggregateFields: Record<string, 'count' | 'avg' | 'sum' | 'min' | 'max'>,
    filters?: Record<string, any>
  ): Promise<Array<{ time_bucket: Date; [key: string]: any }>> {
    const aggregateSelects = Object.entries(aggregateFields).map(([field, func]) => {
      return `${func.toUpperCase()}(${field}) as ${field}_${func}`;
    });
    
    let query = `
      SELECT 
        date_trunc('${interval}', timestamp) as time_bucket,
        ${aggregateSelects.join(', ')}
      FROM ${this.tableName}
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
    
    const params: any[] = [startTime, endTime];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key, index) => {
        params.push(filters[key]);
        return `${key} = $${index + 3}`;
      });
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += ' GROUP BY time_bucket ORDER BY time_bucket';
    
    const result = await this.db.query(query, params);
    return result.rows;
  }
  
  // Clean up old data
  async cleanup(olderThan: Date): Promise<number> {
    const query = `DELETE FROM ${this.tableName} WHERE timestamp < $1`;
    const result = await this.db.query(query, [olderThan]);
    return result.rowCount || 0;
  }
}

// Error handling utilities
export class RepositoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export const handleRepositoryError = (error: any): never => {
  if (error.code === '23505') { // Unique violation
    throw new RepositoryError('Duplicate entry', 'DUPLICATE_ENTRY', error.detail);
  } else if (error.code === '23503') { // Foreign key violation
    throw new RepositoryError('Referenced record not found', 'FOREIGN_KEY_VIOLATION', error.detail);
  } else if (error.code === '23502') { // Not null violation
    throw new RepositoryError('Required field missing', 'NOT_NULL_VIOLATION', error.detail);
  } else {
    throw new RepositoryError('Database operation failed', 'DATABASE_ERROR', error.message);
  }
};

// Response wrapper utility
export const createApiResponse = <T>(
  data?: T,
  error?: string,
  metadata?: any
): ApiResponse<T> => {
  return {
    success: !error,
    data,
    error: error ? {
      code: 'OPERATION_FAILED',
      message: error,
      timestamp: new Date()
    } : undefined,
    metadata: metadata ? {
      requestId: `req_${Date.now()}`,
      timestamp: new Date(),
      processingTime: 0,
      version: '1.0',
      ...metadata
    } : undefined
  };
};