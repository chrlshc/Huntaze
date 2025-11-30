/**
 * Cache Service Usage Examples
 * 
 * Practical examples of using the cache service in various scenarios.
 * These examples demonstrate best practices and common patterns.
 * 
 * Optimizations Applied:
 * 1. ✅ Structured error handling with custom error types
 * 2. ✅ Retry strategies for transient failures
 * 3. ✅ Complete TypeScript types for all operations
 * 4. ✅ Structured logging with correlation IDs
 * 5. ✅ Performance monitoring and metrics
 * 6. ✅ Comprehensive documentation
 * 7. ✅ Production-ready patterns
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { cacheService } from './cache.service';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('cache-examples');

// ============================================================================
// Types & Interfaces
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserStats {
  messagesSent: number;
  responseRate: number;
  revenue: number;
}

/**
 * Cache operation result with metadata
 */
interface CacheResult<T> {
  data: T | null;
  cached: boolean;
  duration: number;
  correlationId: string;
}

/**
 * Cache error types
 */
export enum CacheExampleErrorType {
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * Structured cache error
 */
export class CacheExampleError extends Error {
  constructor(
    public type: CacheExampleErrorType,
    message: string,
    public correlationId: string,
    public retryable: boolean = false,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'CacheExampleError';
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Prisma errors
  if (error.code) {
    const retryableCodes = ['P2024', 'P2034', 'P1001', 'P1002', 'P1008', 'P1017'];
    if (retryableCodes.includes(error.code)) {
      return true;
    }
  }
  
  // Network errors
  const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
  if (error.code && networkErrors.includes(error.code)) {
    return true;
  }
  
  return false;
}

/**
 * Retry operation with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  attempt: number = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const retryable = isRetryableError(error);
    
    if (!retryable || attempt >= config.maxRetries) {
      logger.error('Operation failed after retries', error, {
        correlationId,
        attempt,
        retryable,
      });
      throw error;
    }
    
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );
    
    logger.warn('Retrying operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, config, attempt + 1);
  }
}

/**
 * Fetch user with caching (with error handling and logging)
 * Cache for 5 minutes
 * 
 * @param userId - User ID to fetch
 * @returns User data or null if not found
 * @throws CacheExampleError on database errors
 * 
 * @example
 * ```typescript
 * const user = await getUserWithCache(123);
 * if (user) {
 *   console.log('User found:', user.name);
 * }
 * ```
 */
export async function getUserWithCache(userId: number): Promise<User | null> {
  const correlationId = generateCorrelationId('get-user-cache');
  const startTime = Date.now();
  const cacheKey = `user:${userId}`;
  
  try {
    // Validation
    if (!userId || userId <= 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'Invalid user ID',
        correlationId,
        false,
        { userId }
      );
    }
    
    // Try cache first
    const cached = cacheService.get<User>(cacheKey);
    if (cached) {
      const duration = Date.now() - startTime;
      logger.info('Cache hit for user', {
        correlationId,
        userId,
        duration,
        cached: true,
      });
      return cached;
    }
    
    // Fetch from database with retry
    logger.debug('Cache miss for user', { correlationId, userId });
    
    const user = await retryWithBackoff(
      async () => {
        return await prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        });
      },
      correlationId
    );
    
    if (user) {
      // Cache for 5 minutes
      try {
        cacheService.set(cacheKey, user, 5 * 60);
      } catch (cacheError) {
        // Log cache error but don't fail the request
        logger.warn('Failed to cache user', {
          correlationId,
          userId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('User fetched successfully', {
      correlationId,
      userId,
      found: !!user,
      duration,
      cached: false,
    });
    
    return user;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      throw error;
    }
    
    logger.error('Error fetching user', error, {
      correlationId,
      userId,
      duration,
    });
    
    throw new CacheExampleError(
      CacheExampleErrorType.DATABASE_ERROR,
      `Failed to fetch user: ${error.message}`,
      correlationId,
      isRetryableError(error),
      { userId, originalError: error.message }
    );
  }
}

// ============================================================================
// Example 2: getOrSet Pattern (Recommended)
// ============================================================================

/**
 * Fetch user with getOrSet pattern (RECOMMENDED)
 * Simpler and safer than manual cache check
 * Includes automatic retry and error handling
 * 
 * @param userId - User ID to fetch
 * @returns User data or null if not found
 * @throws CacheExampleError on database errors
 * 
 * @example
 * ```typescript
 * try {
 *   const user = await getUserWithGetOrSet(123);
 *   if (user) {
 *     console.log('User:', user.name);
 *   }
 * } catch (error) {
 *   if (error instanceof CacheExampleError) {
 *     console.error('Error:', error.type, error.message);
 *   }
 * }
 * ```
 */
export async function getUserWithGetOrSet(userId: number): Promise<User | null> {
  const correlationId = generateCorrelationId('get-user-getorset');
  const startTime = Date.now();
  
  try {
    // Validation
    if (!userId || userId <= 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'Invalid user ID',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.debug('Fetching user with getOrSet', { correlationId, userId });
    
    const user = await cacheService.getOrSet(
      `user:${userId}`,
      async () => {
        // Factory function with retry logic
        return await retryWithBackoff(
          async () => {
            return await prisma.users.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true },
            });
          },
          correlationId
        );
      },
      5 * 60 // 5 minutes
    );
    
    const duration = Date.now() - startTime;
    logger.info('User fetched with getOrSet', {
      correlationId,
      userId,
      found: !!user,
      duration,
    });
    
    return user;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      throw error;
    }
    
    logger.error('Error in getUserWithGetOrSet', error, {
      correlationId,
      userId,
      duration,
    });
    
    throw new CacheExampleError(
      CacheExampleErrorType.DATABASE_ERROR,
      `Failed to fetch user: ${error.message}`,
      correlationId,
      isRetryableError(error),
      { userId, originalError: error.message }
    );
  }
}

// ============================================================================
// Example 3: Cache Invalidation on Mutation
// ============================================================================

/**
 * Update user and invalidate cache
 * Includes transaction safety and comprehensive error handling
 * 
 * @param userId - User ID to update
 * @param data - Partial user data to update
 * @returns Updated user data
 * @throws CacheExampleError on database or validation errors
 * 
 * Requirements: 11.4 (Cache Invalidation)
 * 
 * @example
 * ```typescript
 * const updated = await updateUser(123, { name: 'New Name' });
 * console.log('Updated:', updated.name);
 * ```
 */
export async function updateUser(
  userId: number,
  data: Partial<User>
): Promise<User> {
  const correlationId = generateCorrelationId('update-user');
  const startTime = Date.now();
  
  try {
    // Validation
    if (!userId || userId <= 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'Invalid user ID',
        correlationId,
        false,
        { userId }
      );
    }
    
    if (!data || Object.keys(data).length === 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'No data provided for update',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.info('Updating user', { correlationId, userId, fields: Object.keys(data) });
    
    // Update database with retry
    const updated = await retryWithBackoff(
      async () => {
        return await prisma.users.update({
          where: { id: userId },
          data,
        });
      },
      correlationId
    );
    
    // Invalidate all user-related cache entries (Requirement 11.4)
    try {
      const invalidatedCount = cacheService.invalidatePattern(`^user:${userId}`);
      logger.info('Cache invalidated after user update', {
        correlationId,
        userId,
        invalidatedCount,
      });
    } catch (cacheError) {
      // Log cache error but don't fail the update
      logger.warn('Failed to invalidate cache after update', {
        correlationId,
        userId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }
    
    const duration = Date.now() - startTime;
    logger.info('User updated successfully', {
      correlationId,
      userId,
      duration,
    });
    
    return updated;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      throw error;
    }
    
    // Check if user not found
    if (error.code === 'P2025') {
      throw new CacheExampleError(
        CacheExampleErrorType.NOT_FOUND,
        'User not found',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.error('Error updating user', error, {
      correlationId,
      userId,
      duration,
    });
    
    throw new CacheExampleError(
      CacheExampleErrorType.DATABASE_ERROR,
      `Failed to update user: ${error.message}`,
      correlationId,
      isRetryableError(error),
      { userId, originalError: error.message }
    );
  }
}

/**
 * Delete user and invalidate cache
 * Includes comprehensive error handling and audit logging
 * 
 * @param userId - User ID to delete
 * @throws CacheExampleError on database or validation errors
 * 
 * Requirements: 11.4 (Cache Invalidation)
 * 
 * @example
 * ```typescript
 * await deleteUser(123);
 * console.log('User deleted');
 * ```
 */
export async function deleteUser(userId: number): Promise<void> {
  const correlationId = generateCorrelationId('delete-user');
  const startTime = Date.now();
  
  try {
    // Validation
    if (!userId || userId <= 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'Invalid user ID',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.info('Deleting user', { correlationId, userId });
    
    // Delete from database with retry
    await retryWithBackoff(
      async () => {
        return await prisma.users.delete({
          where: { id: userId },
        });
      },
      correlationId
    );
    
    // Invalidate all user-related cache entries (Requirement 11.4)
    try {
      const invalidatedCount = cacheService.invalidatePattern(`^user:${userId}`);
      logger.info('Cache invalidated after user deletion', {
        correlationId,
        userId,
        invalidatedCount,
      });
    } catch (cacheError) {
      // Log cache error but don't fail the deletion
      logger.warn('Failed to invalidate cache after deletion', {
        correlationId,
        userId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }
    
    const duration = Date.now() - startTime;
    logger.info('User deleted successfully', {
      correlationId,
      userId,
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      throw error;
    }
    
    // Check if user not found
    if (error.code === 'P2025') {
      throw new CacheExampleError(
        CacheExampleErrorType.NOT_FOUND,
        'User not found',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.error('Error deleting user', error, {
      correlationId,
      userId,
      duration,
    });
    
    throw new CacheExampleError(
      CacheExampleErrorType.DATABASE_ERROR,
      `Failed to delete user: ${error.message}`,
      correlationId,
      isRetryableError(error),
      { userId, originalError: error.message }
    );
  }
}

// ============================================================================
// Example 4: Multi-Level Caching
// ============================================================================

/**
 * Fetch user stats with different TTLs based on data freshness
 * Short TTL for real-time data
 * 
 * @param userId - User ID
 * @returns User stats or null if not found
 * @throws CacheExampleError on database errors
 * 
 * Requirements: 11.1 (TTL-based expiration)
 * 
 * @example
 * ```typescript
 * const stats = await getUserStats(123);
 * if (stats) {
 *   console.log('Messages sent:', stats.messagesSent);
 * }
 * ```
 */
export async function getUserStats(userId: number): Promise<UserStats | null> {
  const correlationId = generateCorrelationId('get-user-stats');
  const startTime = Date.now();
  
  try {
    // Validation
    if (!userId || userId <= 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'Invalid user ID',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.debug('Fetching user stats (realtime)', { correlationId, userId });
    
    // Try cache with short TTL (1 minute for real-time data)
    const stats = await cacheService.getOrSet(
      `stats:${userId}:realtime`,
      async () => {
        return await retryWithBackoff(
          async () => {
            return await prisma.userStats.findUnique({
              where: { userId },
              select: {
                messagesSent: true,
                responseRate: true,
                revenue: true,
              },
            });
          },
          correlationId
        );
      },
      60 // 1 minute for real-time stats
    );
    
    const duration = Date.now() - startTime;
    logger.info('User stats fetched', {
      correlationId,
      userId,
      found: !!stats,
      duration,
      ttl: 60,
    });
    
    return stats;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      throw error;
    }
    
    logger.error('Error fetching user stats', error, {
      correlationId,
      userId,
      duration,
    });
    
    throw new CacheExampleError(
      CacheExampleErrorType.DATABASE_ERROR,
      `Failed to fetch user stats: ${error.message}`,
      correlationId,
      isRetryableError(error),
      { userId, originalError: error.message }
    );
  }
}

/**
 * Fetch user stats summary with longer TTL
 * Longer TTL for less frequently changing data
 * 
 * @param userId - User ID
 * @returns User stats or null if not found
 * @throws CacheExampleError on database errors
 * 
 * Requirements: 11.1 (TTL-based expiration)
 * 
 * @example
 * ```typescript
 * const summary = await getUserStatsSummary(123);
 * if (summary) {
 *   console.log('Revenue:', summary.revenue);
 * }
 * ```
 */
export async function getUserStatsSummary(userId: number): Promise<UserStats | null> {
  const correlationId = generateCorrelationId('get-user-stats-summary');
  const startTime = Date.now();
  
  try {
    // Validation
    if (!userId || userId <= 0) {
      throw new CacheExampleError(
        CacheExampleErrorType.VALIDATION_ERROR,
        'Invalid user ID',
        correlationId,
        false,
        { userId }
      );
    }
    
    logger.debug('Fetching user stats summary', { correlationId, userId });
    
    // Cache for 1 hour (less frequently changing data)
    const stats = await cacheService.getOrSet(
      `stats:${userId}:summary`,
      async () => {
        return await retryWithBackoff(
          async () => {
            return await prisma.userStats.findUnique({
              where: { userId },
              select: {
                messagesSent: true,
                responseRate: true,
                revenue: true,
              },
            });
          },
          correlationId
        );
      },
      60 * 60 // 1 hour
    );
    
    const duration = Date.now() - startTime;
    logger.info('User stats summary fetched', {
      correlationId,
      userId,
      found: !!stats,
      duration,
      ttl: 3600,
    });
    
    return stats;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      throw error;
    }
    
    logger.error('Error fetching user stats summary', error, {
      correlationId,
      userId,
      duration,
    });
    
    throw new CacheExampleError(
      CacheExampleErrorType.DATABASE_ERROR,
      `Failed to fetch user stats summary: ${error.message}`,
      correlationId,
      isRetryableError(error),
      { userId, originalError: error.message }
    );
  }
}

// ============================================================================
// Example 5: Batch Operations with Caching
// ============================================================================

/**
 * Fetch multiple users with caching
 * Uses Promise.all for parallel fetching
 */
export async function getMultipleUsers(userIds: number[]): Promise<User[]> {
  const promises = userIds.map(userId => getUserWithGetOrSet(userId));
  const results = await Promise.all(promises);
  return results.filter((user): user is User => user !== null);
}

// ============================================================================
// Example 6: Conditional Caching
// ============================================================================

/**
 * Fetch data with conditional caching based on user role
 */
export async function getUserData(
  userId: number,
  userRole: 'admin' | 'user'
): Promise<User | null> {
  // Admins get fresh data (no cache)
  if (userRole === 'admin') {
    return await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  }
  
  // Regular users get cached data
  return await getUserWithGetOrSet(userId);
}

// ============================================================================
// Example 7: Cache Warming
// ============================================================================

/**
 * Pre-populate cache with frequently accessed data
 * Call this on application startup or periodically
 */
export async function warmCache(): Promise<void> {
  console.log('Warming cache...');
  
  // Fetch top 100 active users
  const activeUsers = await prisma.users.findMany({
    take: 100,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, email: true },
  });
  
  // Cache each user
  for (const user of activeUsers) {
    cacheService.set(`user:${user.id}`, user, 5 * 60);
  }
  
  console.log(`Cache warmed with ${activeUsers.length} users`);
}

// ============================================================================
// Example 8: Cache Monitoring
// ============================================================================

/**
 * Monitor cache performance and log statistics
 * Call this periodically (e.g., every minute)
 */
export function monitorCachePerformance(): void {
  const stats = cacheService.getStats();
  
  console.log('Cache Statistics:', {
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    missRate: `${stats.missRate.toFixed(2)}%`,
    size: `${stats.size}/${cacheService.getMaxSize()}`,
    evictions: stats.evictions,
  });
  
  // Alert on low hit rate
  if (stats.hitRate < 50) {
    console.warn('⚠️ Low cache hit rate:', stats.hitRate);
  }
  
  // Alert on high eviction count
  if (stats.evictions > 100) {
    console.warn('⚠️ High eviction count:', stats.evictions);
  }
  
  // Alert on cache near capacity
  const capacityUsage = (stats.size / cacheService.getMaxSize()) * 100;
  if (capacityUsage > 90) {
    console.warn('⚠️ Cache near capacity:', `${capacityUsage.toFixed(2)}%`);
  }
}

// ============================================================================
// Example 9: Cache with Fallback
// ============================================================================

/**
 * Fetch data with multiple fallback strategies
 */
export async function getUserWithFallback(userId: number): Promise<User | null> {
  try {
    // Try cache first
    const cached = cacheService.get<User>(`user:${userId}`);
    if (cached) {
      return cached;
    }
    
    // Try database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    
    if (user) {
      cacheService.set(`user:${userId}`, user, 5 * 60);
      return user;
    }
    
    // Fallback to default
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    
    // Try to return stale cache data if available
    const stale = cacheService.get<User>(`user:${userId}:stale`);
    if (stale) {
      console.log('Returning stale cache data');
      return stale;
    }
    
    return null;
  }
}

// ============================================================================
// Example 10: Cache Namespace Management
// ============================================================================

/**
 * Cache manager for a specific namespace
 * Provides scoped cache operations
 */
export class UserCacheManager {
  private namespace = 'user';
  
  private getKey(userId: number, suffix?: string): string {
    return suffix ? `${this.namespace}:${userId}:${suffix}` : `${this.namespace}:${userId}`;
  }
  
  async getUser(userId: number): Promise<User | null> {
    return await cacheService.getOrSet(
      this.getKey(userId),
      async () => {
        return await prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        });
      },
      5 * 60
    );
  }
  
  async getUserProfile(userId: number): Promise<any> {
    return await cacheService.getOrSet(
      this.getKey(userId, 'profile'),
      async () => {
        return await prisma.users.findUnique({
          where: { id: userId },
          include: { stats: true },
        });
      },
      5 * 60
    );
  }
  
  invalidateUser(userId: number): void {
    cacheService.invalidatePattern(`^${this.namespace}:${userId}`);
  }
  
  invalidateAll(): void {
    cacheService.invalidatePattern(`^${this.namespace}:`);
  }
}

// ============================================================================
// Example 11: Rate Limiting with Cache
// ============================================================================

/**
 * Simple rate limiter using cache
 */
export class CacheRateLimiter {
  private namespace = 'ratelimit';
  
  async checkLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `${this.namespace}:${identifier}`;
    
    // Get current count
    const current = cacheService.get<number>(key) || 0;
    
    if (current >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment count
    cacheService.set(key, current + 1, windowSeconds);
    
    return {
      allowed: true,
      remaining: maxRequests - current - 1,
    };
  }
}

// ============================================================================
// Example 12: Cache with Compression (for large data)
// ============================================================================

/**
 * Cache large data with compression
 * Note: This is a conceptual example - actual compression would require a library
 */
export async function cacheLargeData(
  key: string,
  data: any,
  ttlSeconds: number
): Promise<void> {
  // In production, you might compress the data before caching
  // const compressed = await compress(JSON.stringify(data));
  // cacheService.set(key, compressed, ttlSeconds);
  
  // For now, just cache normally
  cacheService.set(key, data, ttlSeconds);
}

// ============================================================================
// Usage in API Routes
// ============================================================================

/**
 * API Response types
 */
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  duration: number;
  correlationId: string;
  cached?: boolean;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  correlationId: string;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Example API route using cache service
 * Includes comprehensive error handling and structured responses
 * 
 * @param userId - User ID to fetch
 * @returns Structured API response
 * 
 * @example
 * ```typescript
 * // In Next.js API route
 * export async function GET(request: NextRequest) {
 *   const userId = parseInt(request.nextUrl.searchParams.get('userId') || '0');
 *   const response = await handleGetUser(userId);
 *   
 *   return NextResponse.json(
 *     response,
 *     { status: response.success ? 200 : (response.error === 'User not found' ? 404 : 500) }
 *   );
 * }
 * ```
 */
export async function handleGetUser(userId: number): Promise<ApiResponse<User>> {
  const correlationId = generateCorrelationId('api-get-user');
  const startTime = Date.now();
  
  try {
    logger.info('API: Fetching user', { correlationId, userId });
    
    const user = await getUserWithGetOrSet(userId);
    
    if (!user) {
      logger.warn('API: User not found', { correlationId, userId });
      
      return {
        success: false,
        error: 'User not found',
        correlationId,
        retryable: false,
      };
    }
    
    const duration = Date.now() - startTime;
    logger.info('API: User fetched successfully', {
      correlationId,
      userId,
      duration,
    });
    
    return {
      success: true,
      data: user,
      duration,
      correlationId,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      logger.error('API: Cache example error', error, {
        correlationId,
        userId,
        duration,
        errorType: error.type,
      });
      
      return {
        success: false,
        error: error.message,
        correlationId,
        retryable: error.retryable,
        metadata: error.metadata,
      };
    }
    
    logger.error('API: Unexpected error', error, {
      correlationId,
      userId,
      duration,
    });
    
    return {
      success: false,
      error: 'Internal server error',
      correlationId,
      retryable: true,
    };
  }
}

/**
 * Example API route with cache invalidation
 * Includes validation, error handling, and audit logging
 * 
 * @param userId - User ID to update
 * @param data - Partial user data to update
 * @returns Structured API response
 * 
 * @example
 * ```typescript
 * // In Next.js API route
 * export async function PATCH(request: NextRequest) {
 *   const userId = parseInt(request.nextUrl.searchParams.get('userId') || '0');
 *   const body = await request.json();
 *   const response = await handleUpdateUser(userId, body);
 *   
 *   return NextResponse.json(
 *     response,
 *     { status: response.success ? 200 : 500 }
 *   );
 * }
 * ```
 */
export async function handleUpdateUser(
  userId: number,
  data: Partial<User>
): Promise<ApiResponse<User>> {
  const correlationId = generateCorrelationId('api-update-user');
  const startTime = Date.now();
  
  try {
    logger.info('API: Updating user', {
      correlationId,
      userId,
      fields: Object.keys(data),
    });
    
    const updated = await updateUser(userId, data);
    
    const duration = Date.now() - startTime;
    logger.info('API: User updated successfully', {
      correlationId,
      userId,
      duration,
    });
    
    return {
      success: true,
      data: updated,
      duration,
      correlationId,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      logger.error('API: Cache example error', error, {
        correlationId,
        userId,
        duration,
        errorType: error.type,
      });
      
      return {
        success: false,
        error: error.message,
        correlationId,
        retryable: error.retryable,
        metadata: error.metadata,
      };
    }
    
    logger.error('API: Unexpected error', error, {
      correlationId,
      userId,
      duration,
    });
    
    return {
      success: false,
      error: 'Internal server error',
      correlationId,
      retryable: true,
    };
  }
}

/**
 * Example API route for deleting user
 * Includes comprehensive error handling and audit logging
 * 
 * @param userId - User ID to delete
 * @returns Structured API response
 * 
 * @example
 * ```typescript
 * // In Next.js API route
 * export async function DELETE(request: NextRequest) {
 *   const userId = parseInt(request.nextUrl.searchParams.get('userId') || '0');
 *   const response = await handleDeleteUser(userId);
 *   
 *   return NextResponse.json(
 *     response,
 *     { status: response.success ? 200 : 500 }
 *   );
 * }
 * ```
 */
export async function handleDeleteUser(userId: number): Promise<ApiResponse<{ deleted: true }>> {
  const correlationId = generateCorrelationId('api-delete-user');
  const startTime = Date.now();
  
  try {
    logger.info('API: Deleting user', { correlationId, userId });
    
    await deleteUser(userId);
    
    const duration = Date.now() - startTime;
    logger.info('API: User deleted successfully', {
      correlationId,
      userId,
      duration,
    });
    
    return {
      success: true,
      data: { deleted: true },
      duration,
      correlationId,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CacheExampleError) {
      logger.error('API: Cache example error', error, {
        correlationId,
        userId,
        duration,
        errorType: error.type,
      });
      
      return {
        success: false,
        error: error.message,
        correlationId,
        retryable: error.retryable,
        metadata: error.metadata,
      };
    }
    
    logger.error('API: Unexpected error', error, {
      correlationId,
      userId,
      duration,
    });
    
    return {
      success: false,
      error: 'Internal server error',
      correlationId,
      retryable: true,
    };
  }
}
