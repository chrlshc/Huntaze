/**
 * IP-based Rate Limiter with Progressive Penalties
 * 
 * Implements progressive blocking for IPs that violate rate limits:
 * - 1st violation: 1 minute block
 * - 2nd violation: 10 minutes block
 * - 3rd+ violation: 1 hour block
 * 
 * Features:
 * - IP whitelisting support
 * - Automatic violation tracking with TTL
 * - Progressive penalty escalation
 * - Redis-based distributed state
 * - Graceful fallback when Redis unavailable
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Detailed logging for debugging
 * 
 * @example
 * ```typescript
 * const limiter = getIPRateLimiter(['127.0.0.1']);
 * const result = await limiter.checkIPBlock('192.168.1.1');
 * if (!result.allowed) {
 *   return Response.json({ error: result.reason }, { status: 429 });
 * }
 * ```
 */

import { Redis } from '@upstash/redis';
import redisClient from '../../cache/redis';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Result of IP rate limit check
 */
export interface IPRateLimitResult {
  allowed: boolean;
  retryAfter?: number;        // Seconds until unblocked
  reason?: string;            // User-friendly error message
  violationCount: number;     // Total violations in window
  blockLevel: number;         // Current penalty level (0-2)
  correlationId?: string;     // For debugging
}

/**
 * IP violation tracking metadata
 */
export interface IPViolationMetadata {
  ip: string;
  count: number;
  blockLevel: number;
  blockDuration: number;
  timestamp: string;
  correlationId: string;
}

/**
 * Error types for IP rate limiting
 */
export enum IPRateLimitErrorType {
  REDIS_ERROR = 'REDIS_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * IP rate limit error
 */
export interface IPRateLimitError {
  type: IPRateLimitErrorType;
  message: string;
  ip?: string;
  correlationId: string;
  retryable: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Progressive block durations in seconds
 * - Level 0: 1 minute
 * - Level 1: 10 minutes
 * - Level 2: 1 hour
 */
const BLOCK_DURATIONS = [60, 600, 3600] as const;

/**
 * Time window for violation tracking (1 hour)
 */
const VIOLATION_TTL = 3600;

/**
 * Maximum retry attempts for Redis operations
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delay in milliseconds
 */
const RETRY_DELAY_MS = 100;

// ============================================================================
// IP Rate Limiter Class
// ============================================================================

export class IPRateLimiter {
  private redis: Redis | null = redisClient;
  private whitelist: Set<string> = new Set();

  constructor(whitelistIPs: string[] = []) {
    this.whitelist = new Set(whitelistIPs);
    console.log('[IPRateLimiter] Initialized', {
      whitelistCount: this.whitelist.size,
      redisAvailable: !!this.redis,
    });
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Check if IP is whitelisted
   * 
   * @param ip - IP address to check
   * @returns true if whitelisted
   */
  isWhitelisted(ip: string): boolean {
    if (!this.validateIP(ip)) {
      console.warn('[IPRateLimiter] Invalid IP format', { ip });
      return false;
    }
    return this.whitelist.has(ip);
  }

  /**
   * Track a rate limit violation for an IP
   * 
   * Implements progressive penalties:
   * - 1st violation: 1 minute block
   * - 2nd violation: 10 minutes block
   * - 3rd+ violation: 1 hour block
   * 
   * @param ip - IP address that violated rate limit
   * @param correlationId - Optional correlation ID for tracking
   * @returns Violation metadata or null on error
   * 
   * @example
   * ```typescript
   * await limiter.trackViolation('192.168.1.1', 'req-123');
   * ```
   */
  async trackViolation(
    ip: string,
    correlationId?: string
  ): Promise<IPViolationMetadata | null> {
    const corrId = correlationId || this.generateCorrelationId();

    // Validate IP
    if (!this.validateIP(ip)) {
      console.error('[IPRateLimiter] Invalid IP format', { ip, correlationId: corrId });
      return null;
    }

    // Skip whitelisted IPs
    if (this.isWhitelisted(ip)) {
      console.log('[IPRateLimiter] Skipping whitelisted IP', { ip, correlationId: corrId });
      return null;
    }

    // Skip if Redis unavailable
    if (!this.redis) {
      console.warn('[IPRateLimiter] Redis unavailable, skipping violation tracking', {
        ip,
        correlationId: corrId,
      });
      return null;
    }

    try {
      const violationKey = `ip:violations:${ip}`;
      
      // Increment violation count with retry
      const count = await this.retryOperation(
        () => this.redis!.incr(violationKey),
        'incr violation count',
        corrId
      );

      // Set TTL on first violation
      if (count === 1) {
        await this.retryOperation(
          () => this.redis!.expire(violationKey, VIOLATION_TTL),
          'set violation TTL',
          corrId
        );
      }

      // Calculate block level and duration
      const blockLevel = Math.min(count - 1, BLOCK_DURATIONS.length - 1);
      const blockDuration = BLOCK_DURATIONS[blockLevel];

      // Block the IP
      await this.retryOperation(
        () => this.redis!.setex(`ip:blocked:${ip}`, blockDuration, count),
        'block IP',
        corrId
      );

      const metadata: IPViolationMetadata = {
        ip,
        count,
        blockLevel,
        blockDuration,
        timestamp: new Date().toISOString(),
        correlationId: corrId,
      };

      console.log('[IPRateLimiter] Violation tracked', metadata);

      return metadata;
    } catch (error) {
      const rateLimitError = this.handleError(error, ip, corrId);
      console.error('[IPRateLimiter] Error tracking violation', rateLimitError);
      
      // Don't throw - graceful degradation
      return null;
    }
  }

  /**
   * Check if IP is currently blocked
   * 
   * @param ip - IP address to check
   * @param correlationId - Optional correlation ID for tracking
   * @returns Rate limit result with block status
   * 
   * @example
   * ```typescript
   * const result = await limiter.checkIPBlock('192.168.1.1');
   * if (!result.allowed) {
   *   console.log(`Blocked for ${result.retryAfter} seconds`);
   * }
   * ```
   */
  async checkIPBlock(
    ip: string,
    correlationId?: string
  ): Promise<IPRateLimitResult> {
    const corrId = correlationId || this.generateCorrelationId();

    // Validate IP
    if (!this.validateIP(ip)) {
      console.warn('[IPRateLimiter] Invalid IP format', { ip, correlationId: corrId });
      return {
        allowed: false,
        reason: 'Invalid IP address format',
        violationCount: 0,
        blockLevel: 0,
        correlationId: corrId,
      };
    }

    // Whitelisted IPs always allowed
    if (this.isWhitelisted(ip)) {
      return {
        allowed: true,
        violationCount: 0,
        blockLevel: 0,
        correlationId: corrId,
      };
    }

    // Allow if Redis unavailable (fail open)
    if (!this.redis) {
      console.warn('[IPRateLimiter] Redis unavailable, allowing request', {
        ip,
        correlationId: corrId,
      });
      return {
        allowed: true,
        violationCount: 0,
        blockLevel: 0,
        correlationId: corrId,
      };
    }

    try {
      // Check block status and violation count in parallel
      const [isBlocked, violationCount] = await Promise.all([
        this.redis.get<number>(`ip:blocked:${ip}`),
        this.redis.get<number>(`ip:violations:${ip}`),
      ]);

      if (isBlocked) {
        const ttl = await this.redis.ttl(`ip:blocked:${ip}`);
        const blockLevel = Math.min((violationCount || 1) - 1, BLOCK_DURATIONS.length - 1);
        
        console.log('[IPRateLimiter] IP blocked', {
          ip,
          ttl,
          blockLevel,
          violationCount,
          correlationId: corrId,
        });

        return {
          allowed: false,
          retryAfter: Math.max(0, ttl),
          reason: `IP blocked. Try again in ${Math.ceil(ttl / 60)} minutes.`,
          violationCount: violationCount || 0,
          blockLevel,
          correlationId: corrId,
        };
      }

      console.log('[IPRateLimiter] IP allowed', {
        ip,
        violationCount: violationCount || 0,
        correlationId: corrId,
      });

      return {
        allowed: true,
        violationCount: violationCount || 0,
        blockLevel: 0,
        correlationId: corrId,
      };
    } catch (error) {
      const rateLimitError = this.handleError(error, ip, corrId);
      console.error('[IPRateLimiter] Error checking IP block', rateLimitError);
      
      // Fail open on error
      return {
        allowed: true,
        violationCount: 0,
        blockLevel: 0,
        correlationId: corrId,
      };
    }
  }

  /**
   * Clear all violations for an IP
   * 
   * @param ip - IP address to clear
   * @param correlationId - Optional correlation ID for tracking
   * 
   * @example
   * ```typescript
   * await limiter.clearIPViolations('192.168.1.1');
   * ```
   */
  async clearIPViolations(ip: string, correlationId?: string): Promise<void> {
    const corrId = correlationId || this.generateCorrelationId();

    if (!this.validateIP(ip)) {
      console.error('[IPRateLimiter] Invalid IP format', { ip, correlationId: corrId });
      return;
    }

    if (!this.redis) {
      console.warn('[IPRateLimiter] Redis unavailable, cannot clear violations', {
        ip,
        correlationId: corrId,
      });
      return;
    }

    try {
      await this.redis.del(`ip:violations:${ip}`, `ip:blocked:${ip}`);
      console.log('[IPRateLimiter] Violations cleared', { ip, correlationId: corrId });
    } catch (error) {
      const rateLimitError = this.handleError(error, ip, corrId);
      console.error('[IPRateLimiter] Error clearing violations', rateLimitError);
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Validate IP address format
   */
  private validateIP(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return false;
    
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    // IPv6 validation (supports compressed format like ::1)
    // Matches full format, compressed format, and mixed formats
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Retry Redis operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = RETRY_DELAY_MS;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.warn('[IPRateLimiter] Retry attempt failed', {
          operationName,
          attempt,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          correlationId,
          error: lastError.message,
        });

        if (attempt < MAX_RETRY_ATTEMPTS) {
          await this.sleep(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError || new Error(`Operation ${operationName} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `ip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Handle and wrap errors
   */
  private handleError(error: unknown, ip: string, correlationId: string): IPRateLimitError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Determine error type
    let errorType = IPRateLimitErrorType.UNKNOWN_ERROR;
    let retryable = false;

    if (errorMessage.includes('Redis') || errorMessage.includes('ECONNREFUSED')) {
      errorType = IPRateLimitErrorType.REDIS_ERROR;
      retryable = true;
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('validation')) {
      errorType = IPRateLimitErrorType.VALIDATION_ERROR;
      retryable = false;
    }

    return {
      type: errorType,
      message: errorMessage,
      ip,
      correlationId,
      retryable,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let ipRateLimiter: IPRateLimiter | null = null;

/**
 * Get or create IP rate limiter singleton
 * 
 * @param whitelistIPs - Optional array of IPs to whitelist
 * @returns IPRateLimiter instance
 * 
 * @example
 * ```typescript
 * const limiter = getIPRateLimiter(['127.0.0.1', '::1']);
 * ```
 */
export function getIPRateLimiter(whitelistIPs?: string[]): IPRateLimiter {
  if (!ipRateLimiter) {
    const whitelist = whitelistIPs || 
      process.env.RATE_LIMIT_WHITELIST_IPS?.split(',').map(ip => ip.trim()) || 
      [];
    
    ipRateLimiter = new IPRateLimiter(whitelist);
    
    console.log('[IPRateLimiter] Singleton created', {
      whitelistCount: whitelist.length,
      timestamp: new Date().toISOString(),
    });
  }
  
  return ipRateLimiter;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetIPRateLimiter(): void {
  ipRateLimiter = null;
  console.log('[IPRateLimiter] Singleton reset');
}
