/**
 * OnlyFans AI Memory System - Database Connection Manager
 * 
 * Enhanced PostgreSQL connection pool with health checks, retry logic,
 * and monitoring for the memory system.
 */

import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { MemoryError, MemoryErrorType } from '../types';

/**
 * Connection pool configuration
 */
interface MemoryDbConfig extends PoolConfig {
  maxRetries?: number;
  retryDelay?: number;
  healthCheckInterval?: number;
}

/**
 * Connection pool statistics
 */
interface PoolStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}

/**
 * Database connection manager for memory system
 */
export class MemoryDbConnection {
  private pool: Pool;
  private config: MemoryDbConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy: boolean = true;
  private connectionAttempts: number = 0;
  private lastHealthCheck: Date | null = null;

  constructor(config?: MemoryDbConfig) {
    this.config = {
      connectionString: process.env.DATABASE_URL,
      max: config?.max || 20, // Maximum pool size
      min: config?.min || 5, // Minimum pool size
      idleTimeoutMillis: config?.idleTimeoutMillis || 30000, // 30 seconds
      connectionTimeoutMillis: config?.connectionTimeoutMillis || 5000, // 5 seconds
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000, // 1 second
      healthCheckInterval: config?.healthCheckInterval || 60000, // 1 minute
      ...config
    };

    this.pool = new Pool(this.config);
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  /**
   * Setup pool event handlers
   */
  private setupEventHandlers(): void {
    // Handle connection errors
    this.pool.on('error', (err, client) => {
      console.error('[MemoryDb] Unexpected error on idle client:', err);
      this.isHealthy = false;
    });

    // Handle new connections
    this.pool.on('connect', (client) => {
      this.connectionAttempts++;
      console.log('[MemoryDb] New client connected. Total attempts:', this.connectionAttempts);
    });

    // Handle connection removal
    this.pool.on('remove', (client) => {
      console.log('[MemoryDb] Client removed from pool');
    });
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.config.healthCheckInterval && this.config.healthCheckInterval > 0) {
      this.healthCheckInterval = setInterval(async () => {
        await this.checkHealth();
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Stop health checks
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check database health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      this.isHealthy = result.rows.length > 0;
      this.lastHealthCheck = new Date();
      
      if (!this.isHealthy) {
        console.error('[MemoryDb] Health check failed: No rows returned');
      }
      
      return this.isHealthy;
    } catch (error) {
      console.error('[MemoryDb] Health check failed:', error);
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    lastCheck: Date | null;
    connectionAttempts: number;
  } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Execute a query with retry logic
   */
  async query<T extends Record<string, any> = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const maxRetries = this.config.maxRetries || 3;
    const retryDelay = this.config.retryDelay || 1000;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.pool.query<T>(text, params);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`[MemoryDb] Query attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw new MemoryError(
            MemoryErrorType.DATABASE_ERROR,
            `Database query failed: ${(error as Error).message}`,
            false,
            { query: text, params, attempt: attempt + 1 }
          );
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }
    
    // All retries failed
    throw new MemoryError(
      MemoryErrorType.DATABASE_ERROR,
      `Database query failed after ${maxRetries} attempts: ${lastError?.message}`,
      true,
      { query: text, params, maxRetries }
    );
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      throw new MemoryError(
        MemoryErrorType.DATABASE_ERROR,
        `Failed to get database client: ${(error as Error).message}`,
        true
      );
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new MemoryError(
        MemoryErrorType.DATABASE_ERROR,
        `Transaction failed: ${(error as Error).message}`,
        true
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): PoolStats {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount
    };
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      '23505', // unique_violation
      '23503', // foreign_key_violation
      '23502', // not_null_violation
      '23514', // check_violation
      '42P01', // undefined_table
      '42703', // undefined_column
      '42883', // undefined_function
      '42P02', // undefined_parameter
      '42601', // syntax_error
    ];
    
    return nonRetryableCodes.includes(error?.code);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    this.stopHealthCheck();
    await this.pool.end();
    console.log('[MemoryDb] Connection pool closed');
  }

  /**
   * Get the underlying pool (for advanced use cases)
   */
  getPool(): Pool {
    return this.pool;
  }
}

// Create singleton instance
let memoryDbInstance: MemoryDbConnection | null = null;

/**
 * Get or create the memory database connection instance
 */
export function getMemoryDb(config?: MemoryDbConfig): MemoryDbConnection {
  if (!memoryDbInstance) {
    memoryDbInstance = new MemoryDbConnection(config);
  }
  return memoryDbInstance;
}

/**
 * Close the memory database connection
 */
export async function closeMemoryDb(): Promise<void> {
  if (memoryDbInstance) {
    await memoryDbInstance.close();
    memoryDbInstance = null;
  }
}

// Export default instance
export const memoryDb = getMemoryDb();
