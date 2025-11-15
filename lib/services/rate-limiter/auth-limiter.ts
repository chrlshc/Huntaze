/**
 * Authentication Rate Limiter
 * 
 * Specialized rate limiting for authentication endpoints with:
 * - Per-IP and per-username tracking
 * - Exponential backoff for repeated failures
 * - Failed login attempt tracking
 * - Credential stuffing detection
 */

import { Redis } from '@upstash/redis';
import redisClient from '../../cache/redis';

export interface FailedLoginAttempt {
  ip: string;
  username?: string;
  timestamp: number;
  attemptCount: number;
}

export interface AuthRateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
  attemptCount: number;
}

/**
 * Exponential backoff durations in seconds
 */
const BACKOFF_DURATIONS = [
  60,      // 1 minute after 1st failure
  300,     // 5 minutes after 2nd failure
  900,     // 15 minutes after 3rd failure
  3600,    // 1 hour after 4th+ failures
];

const FAILED_LOGIN_TTL = 900; // 15 minutes

export class AuthRateLimiter {
  private redis: Redis | null = redisClient;

  /**
   * Track a failed login attempt
   */
  async trackFailedLogin(ip: string, username?: string): Promise<void> {
    if (!this.redis) {
      console.warn('Redis unavailable, cannot track failed login');
      return;
    }

    const timestamp = Date.now();

    try {
      // Track by IP
      const ipKey = `auth:failed:ip:${ip}`;
      const ipCount = await this.redis.incr(ipKey);
      
      if (ipCount === 1) {
        await this.redis.expire(ipKey, FAILED_LOGIN_TTL);
      }

      // Track by username if provided
      if (username) {
        const usernameKey = `auth:failed:username:${username}`;
        const usernameCount = await this.redis.incr(usernameKey);
        
        if (usernameCount === 1) {
          await this.redis.expire(usernameKey, FAILED_LOGIN_TTL);
        }

        // Track IP-username combination for credential stuffing detection
        const comboKey = `auth:failed:combo:${username}`;
        await this.redis.sadd(comboKey, ip);
        await this.redis.expire(comboKey, 300); // 5 minutes
      }

      console.log('Failed login tracked', {
        ip,
        username: username ? `${username.substring(0, 3)}***` : undefined,
        ipCount,
        timestamp,
      });
    } catch (error) {
      console.error('Error tracking failed login:', error);
    }
  }

  /**
   * Check if login attempt is rate limited
   */
  async checkLoginRateLimit(ip: string, username?: string): Promise<AuthRateLimitResult> {
    if (!this.redis) {
      // Fail open when Redis unavailable
      return {
        allowed: true,
        attemptCount: 0,
      };
    }

    try {
      // Check IP-based rate limit
      const ipKey = `auth:failed:ip:${ip}`;
      const ipAttempts = await this.redis.get<number>(ipKey) || 0;

      // Check username-based rate limit if provided
      let usernameAttempts = 0;
      if (username) {
        const usernameKey = `auth:failed:username:${username}`;
        usernameAttempts = await this.redis.get<number>(usernameKey) || 0;
      }

      // Use the higher attempt count for stricter limiting
      const attemptCount = Math.max(ipAttempts, usernameAttempts);

      // Calculate backoff duration
      const backoffIndex = Math.min(attemptCount - 1, BACKOFF_DURATIONS.length - 1);
      const backoffDuration = attemptCount > 0 ? BACKOFF_DURATIONS[backoffIndex] : 0;

      // Check if still in backoff period
      if (attemptCount > 0) {
        const ttl = await this.redis.ttl(ipKey);
        const remainingBackoff = Math.max(0, ttl);

        if (remainingBackoff > 0) {
          return {
            allowed: false,
            retryAfter: remainingBackoff,
            reason: `Too many failed login attempts. Try again in ${Math.ceil(remainingBackoff / 60)} minutes.`,
            attemptCount,
          };
        }
      }

      return {
        allowed: true,
        attemptCount,
      };
    } catch (error) {
      console.error('Error checking login rate limit:', error);
      // Fail open on error
      return {
        allowed: true,
        attemptCount: 0,
      };
    }
  }

  /**
   * Reset failed login counter on successful login
   */
  async resetFailedLogins(ip: string, username?: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const keys: string[] = [`auth:failed:ip:${ip}`];
      
      if (username) {
        keys.push(`auth:failed:username:${username}`);
        keys.push(`auth:failed:combo:${username}`);
      }

      await this.redis.del(...keys);

      console.log('Failed login counters reset', {
        ip,
        username: username ? `${username.substring(0, 3)}***` : undefined,
      });
    } catch (error) {
      console.error('Error resetting failed logins:', error);
    }
  }

  /**
   * Detect potential credential stuffing attack
   * Returns true if multiple IPs are attempting the same username
   */
  async detectCredentialStuffing(username: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const comboKey = `auth:failed:combo:${username}`;
      const ipCount = await this.redis.scard(comboKey);

      // Alert if 5+ different IPs tried the same username in 5 minutes
      const threshold = 5;
      if (ipCount >= threshold) {
        const ips = await this.redis.smembers(comboKey);
        
        console.warn('Credential stuffing detected', {
          username: `${username.substring(0, 3)}***`,
          ipCount,
          ips: ips.slice(0, 10), // Log first 10 IPs
          timestamp: new Date().toISOString(),
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting credential stuffing:', error);
      return false;
    }
  }

  /**
   * Get failed login statistics for monitoring
   */
  async getFailedLoginStats(ip: string, username?: string): Promise<{
    ipAttempts: number;
    usernameAttempts: number;
    ipTTL: number;
    usernameTTL: number;
  }> {
    if (!this.redis) {
      return {
        ipAttempts: 0,
        usernameAttempts: 0,
        ipTTL: 0,
        usernameTTL: 0,
      };
    }

    try {
      const ipKey = `auth:failed:ip:${ip}`;
      const ipAttempts = await this.redis.get<number>(ipKey) || 0;
      const ipTTL = ipAttempts > 0 ? await this.redis.ttl(ipKey) : 0;

      let usernameAttempts = 0;
      let usernameTTL = 0;

      if (username) {
        const usernameKey = `auth:failed:username:${username}`;
        usernameAttempts = await this.redis.get<number>(usernameKey) || 0;
        usernameTTL = usernameAttempts > 0 ? await this.redis.ttl(usernameKey) : 0;
      }

      return {
        ipAttempts,
        usernameAttempts,
        ipTTL,
        usernameTTL,
      };
    } catch (error) {
      console.error('Error getting failed login stats:', error);
      return {
        ipAttempts: 0,
        usernameAttempts: 0,
        ipTTL: 0,
        usernameTTL: 0,
      };
    }
  }
}

// Singleton instance
let authRateLimiter: AuthRateLimiter | null = null;

export function getAuthRateLimiter(): AuthRateLimiter {
  if (!authRateLimiter) {
    authRateLimiter = new AuthRateLimiter();
  }
  return authRateLimiter;
}

/**
 * Example integration in login endpoint:
 * 
 * ```typescript
 * import { getAuthRateLimiter } from '@/lib/services/rate-limiter/auth-limiter';
 * import { getClientIp } from '@/lib/services/rate-limiter/identity';
 * 
 * export async function POST(request: Request) {
 *   const authLimiter = getAuthRateLimiter();
 *   const ip = getClientIp(request);
 *   const { username, password } = await request.json();
 *   
 *   // Check rate limit before authentication
 *   const rateLimitResult = await authLimiter.checkLoginRateLimit(ip, username);
 *   if (!rateLimitResult.allowed) {
 *     return new Response(JSON.stringify({ error: rateLimitResult.reason }), {
 *       status: 429,
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
 *       },
 *     });
 *   }
 *   
 *   // Attempt authentication
 *   const authResult = await authenticate(username, password);
 *   
 *   if (!authResult.success) {
 *     // Track failed login
 *     await authLimiter.trackFailedLogin(ip, username);
 *     
 *     // Check for credential stuffing
 *     await authLimiter.detectCredentialStuffing(username);
 *     
 *     return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
 *       status: 401,
 *       headers: { 'Content-Type': 'application/json' },
 *     });
 *   }
 *   
 *   // Reset counters on successful login
 *   await authLimiter.resetFailedLogins(ip, username);
 *   
 *   return new Response(JSON.stringify({ success: true, token: authResult.token }), {
 *     status: 200,
 *     headers: { 'Content-Type': 'application/json' },
 *   });
 * }
 * ```
 */
