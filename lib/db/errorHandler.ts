/**
 * Database Error Handler
 * Provides safe database operations with proper error handling and fallbacks
 */

import { query } from '@/lib/db';

export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isConnectionError?: boolean;
}

/**
 * Execute a database query with proper error handling
 */
export async function safeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<DatabaseResult<T>> {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: 'Database not configured',
        isConnectionError: true,
      };
    }

    const result = await query(sql, params);
    return {
      success: true,
      data: result as T,
    };
  } catch (error) {
    console.error('Database query error:', error);
    
    // Determine if this is a connection error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = 
      errorMessage.includes('connect') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND');

    return {
      success: false,
      error: errorMessage,
      isConnectionError,
    };
  }
}

/**
 * Check if database is available and responsive
 */
export async function checkDatabaseHealth(): Promise<DatabaseResult<boolean>> {
  return safeQuery('SELECT 1 as test');
}

/**
 * Retry database operation with exponential backoff
 */
export async function retryQuery<T = any>(
  sql: string,
  params: any[] = [],
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<DatabaseResult<T>> {
  let lastError: DatabaseResult<T> | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await safeQuery<T>(sql, params);
    
    if (result.success) {
      return result;
    }

    lastError = result;

    // Don't retry if it's not a connection error
    if (!result.isConnectionError) {
      break;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return lastError || {
    success: false,
    error: 'Max retries exceeded',
  };
}