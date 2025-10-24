/**
 * API Authentication Middleware
 * Handles authentication and authorization for AI service calls
 */

import { NextRequest } from 'next/server';
import { AuthenticationError, AuthorizationError } from '@/lib/types/api-errors';

export interface AuthContext {
  userId: string;
  role: 'creator' | 'admin' | 'system';
  permissions: string[];
  rateLimits: {
    contentGeneration: number;
    brainstorming: number;
    trendAnalysis: number;
  };
}

export interface APIKeyConfig {
  key: string;
  userId: string;
  role: AuthContext['role'];
  permissions: string[];
  rateLimits: AuthContext['rateLimits'];
  expiresAt?: Date;
  isActive: boolean;
}

// Mock API key store (in production, use database)
const API_KEYS: Map<string, APIKeyConfig> = new Map([
  ['test-creator-key-123', {
    key: 'test-creator-key-123',
    userId: 'creator-123',
    role: 'creator',
    permissions: ['content:generate', 'content:brainstorm', 'trends:read'],
    rateLimits: {
      contentGeneration: 100, // per hour
      brainstorming: 50,      // per hour
      trendAnalysis: 10,      // per hour
    },
    isActive: true,
  }],
  ['test-admin-key-456', {
    key: 'test-admin-key-456',
    userId: 'admin-456',
    role: 'admin',
    permissions: ['*'], // All permissions
    rateLimits: {
      contentGeneration: 1000,
      brainstorming: 500,
      trendAnalysis: 100,
    },
    isActive: true,
  }],
]);

export class APIAuthService {
  private static instance: APIAuthService;
  private rateLimitStore: Map<string, Map<string, number>> = new Map();

  static getInstance(): APIAuthService {
    if (!APIAuthService.instance) {
      APIAuthService.instance = new APIAuthService();
    }
    return APIAuthService.instance;
  }

  /**
   * Authenticate API request using API key or JWT token
   */
  async authenticate(request: NextRequest): Promise<AuthContext> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      this.logDebug('Starting authentication', { requestId });
      
      const apiKey = this.extractAPIKey(request);
      const jwtToken = this.extractJWTToken(request);

      let context: AuthContext;
      
      if (apiKey) {
        this.logDebug('Authenticating with API key', { requestId, keyPrefix: apiKey.substring(0, 8) });
        context = await this.authenticateWithAPIKey(apiKey);
      } else if (jwtToken) {
        this.logDebug('Authenticating with JWT token', { requestId });
        context = await this.authenticateWithJWT(jwtToken);
      } else {
        throw new AuthenticationError('No authentication credentials provided', {
          requestId,
          availableHeaders: Array.from(request.headers.keys()),
        });
      }

      const duration = Date.now() - startTime;
      this.logDebug('Authentication successful', { 
        requestId, 
        userId: context.userId, 
        role: context.role,
        duration,
      });

      return context;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError('Authentication failed', error as Error, { requestId, duration });
      throw error;
    }
  }

  /**
   * Check if user has required permission
   */
  authorize(context: AuthContext, permission: string): void {
    // Admin role has all permissions
    if (context.role === 'admin' || context.permissions.includes('*')) {
      return;
    }

    if (!context.permissions.includes(permission)) {
      throw new AuthorizationError(`Permission denied: ${permission}`, {
        userId: context.userId,
        role: context.role,
        requiredPermission: permission,
        userPermissions: context.permissions,
      });
    }
  }

  /**
   * Check rate limits for specific operation with enhanced tracking
   */
  async checkRateLimit(
    context: AuthContext,
    operation: keyof AuthContext['rateLimits']
  ): Promise<void> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      const limit = context.rateLimits[operation];
      const windowMs = 60 * 60 * 1000; // 1 hour window
      const now = Date.now();
      const windowStart = now - windowMs;

      this.logDebug('Checking rate limit', { 
        requestId, 
        userId: context.userId, 
        operation, 
        limit 
      });

      // Get user's rate limit data
      if (!this.rateLimitStore.has(context.userId)) {
        this.rateLimitStore.set(context.userId, new Map());
      }

      const userLimits = this.rateLimitStore.get(context.userId)!;
      const operationKey = `${operation}:${Math.floor(now / windowMs)}`;

      // Clean old entries
      const cleanedEntries = this.cleanupRateLimitEntries(userLimits, windowStart);
      
      // Count current window requests
      const currentCount = Array.from(userLimits.keys())
        .filter(key => key.startsWith(`${operation}:`))
        .length;

      if (currentCount >= limit) {
        const resetTime = Math.ceil((now + windowMs) / 1000);
        const resetIn = resetTime * 1000 - now;
        
        this.logDebug('Rate limit exceeded', {
          requestId,
          userId: context.userId,
          operation,
          current: currentCount,
          limit,
          resetIn,
        });

        throw new AuthorizationError(`Rate limit exceeded for ${operation}`, {
          userId: context.userId,
          operation,
          limit,
          current: currentCount,
          resetTime,
          resetIn,
          requestId,
        });
      }

      // Record this request with additional metadata
      userLimits.set(`${operationKey}:${now}`, now);
      
      const duration = Date.now() - startTime;
      this.logDebug('Rate limit check passed', {
        requestId,
        userId: context.userId,
        operation,
        current: currentCount + 1,
        limit,
        duration,
        cleanedEntries,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError('Rate limit check failed', error as Error, { 
        requestId, 
        userId: context.userId, 
        operation,
        duration,
      });
      throw error;
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitEntries(userLimits: Map<string, number>, windowStart: number): number {
    let cleanedCount = 0;
    
    for (const [key, timestamp] of userLimits.entries()) {
      if (timestamp < windowStart) {
        userLimits.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  private extractAPIKey(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Simple check if it's an API key (not JWT)
      if (!token.includes('.')) {
        return token;
      }
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers.get('x-api-key');
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }

  private extractJWTToken(request: NextRequest): string | null {
    // Check Authorization header for JWT
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Simple check if it's a JWT (has dots)
      if (token.includes('.')) {
        return token;
      }
    }

    // Check cookies for JWT
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (cookieToken && cookieToken.includes('.')) {
      return cookieToken;
    }

    return null;
  }

  private async authenticateWithAPIKey(apiKey: string): Promise<AuthContext> {
    const keyConfig = API_KEYS.get(apiKey);

    if (!keyConfig) {
      throw new AuthenticationError('Invalid API key');
    }

    if (!keyConfig.isActive) {
      throw new AuthenticationError('API key is inactive');
    }

    if (keyConfig.expiresAt && keyConfig.expiresAt < new Date()) {
      throw new AuthenticationError('API key has expired');
    }

    return {
      userId: keyConfig.userId,
      role: keyConfig.role,
      permissions: keyConfig.permissions,
      rateLimits: keyConfig.rateLimits,
    };
  }

  private async authenticateWithJWT(token: string): Promise<AuthContext> {
    try {
      // In production, use proper JWT verification
      // For now, mock JWT validation
      const payload = this.mockJWTVerify(token);

      return {
        userId: payload.sub,
        role: payload.role || 'creator',
        permissions: payload.permissions || ['content:generate'],
        rateLimits: payload.rateLimits || {
          contentGeneration: 100,
          brainstorming: 50,
          trendAnalysis: 10,
        },
      };
    } catch (error) {
      throw new AuthenticationError('Invalid JWT token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private mockJWTVerify(token: string): any {
    // Mock JWT verification - in production use proper JWT library
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString()
      );

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('JWT token has expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`JWT verification failed: ${error}`);
    }
  }

  /**
   * Generate API key for user (admin function)
   */
  generateAPIKey(
    userId: string,
    role: AuthContext['role'],
    permissions: string[],
    rateLimits: AuthContext['rateLimits'],
    expiresAt?: Date
  ): string {
    const apiKey = `${role}-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    API_KEYS.set(apiKey, {
      key: apiKey,
      userId,
      role,
      permissions,
      rateLimits,
      expiresAt,
      isActive: true,
    });

    return apiKey;
  }

  /**
   * Revoke API key
   */
  revokeAPIKey(apiKey: string): void {
    const keyConfig = API_KEYS.get(apiKey);
    if (keyConfig) {
      keyConfig.isActive = false;
    }
  }

  /**
   * Get rate limit status for user with enhanced metrics
   */
  getRateLimitStatus(userId: string): Record<string, { 
    current: number; 
    limit: number; 
    resetTime: number;
    remaining: number;
    resetIn: number;
  }> {
    const userLimits = this.rateLimitStore.get(userId);
    if (!userLimits) {
      return {};
    }

    const now = Date.now();
    const windowMs = 60 * 60 * 1000;
    const operations = ['contentGeneration', 'brainstorming', 'trendAnalysis'] as const;
    const status: Record<string, any> = {};

    for (const operation of operations) {
      const currentCount = Array.from(userLimits.keys())
        .filter(key => key.startsWith(`${operation}:`))
        .length;

      const limit = 100; // Default limit, should get from user config
      const resetTime = Math.ceil((now + windowMs) / 1000);
      const resetIn = resetTime * 1000 - now;

      status[operation] = {
        current: currentCount,
        limit,
        resetTime,
        remaining: Math.max(0, limit - currentCount),
        resetIn,
      };
    }

    return status;
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced logging utilities
   */
  private logDebug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[APIAuthService] ${message}`, data || '');
    }
  }

  private logError(message: string, error: Error, data?: any): void {
    console.error(`[APIAuthService] ${message}`, {
      error: error.message,
      stack: error.stack,
      ...data,
    });
  }

  /**
   * Get authentication metrics
   */
  getAuthMetrics(): {
    totalAPIKeys: number;
    activeAPIKeys: number;
    rateLimitedUsers: number;
    averageRequestsPerUser: number;
  } {
    const totalAPIKeys = API_KEYS.size;
    const activeAPIKeys = Array.from(API_KEYS.values()).filter(key => key.isActive).length;
    const rateLimitedUsers = this.rateLimitStore.size;
    
    let totalRequests = 0;
    for (const userLimits of this.rateLimitStore.values()) {
      totalRequests += userLimits.size;
    }
    
    const averageRequestsPerUser = rateLimitedUsers > 0 ? totalRequests / rateLimitedUsers : 0;

    return {
      totalAPIKeys,
      activeAPIKeys,
      rateLimitedUsers,
      averageRequestsPerUser: Math.round(averageRequestsPerUser * 100) / 100,
    };
  }

  /**
   * Health check for authentication service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      apiKeyStore: boolean;
      rateLimitStore: boolean;
      memoryUsage: boolean;
    };
    metrics: ReturnType<typeof this.getAuthMetrics>;
  }> {
    const checks = {
      apiKeyStore: API_KEYS.size > 0,
      rateLimitStore: this.rateLimitStore.size < 1000, // Arbitrary threshold
      memoryUsage: process.memoryUsage().heapUsed < 100 * 1024 * 1024, // 100MB threshold
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      metrics: this.getAuthMetrics(),
    };
  }
}

// Middleware function for Next.js API routes
export async function withAuth(
  request: NextRequest,
  requiredPermission?: string
): Promise<AuthContext> {
  const authService = APIAuthService.getInstance();
  
  try {
    const context = await authService.authenticate(request);
    
    if (requiredPermission) {
      authService.authorize(context, requiredPermission);
    }
    
    return context;
  } catch (error) {
    // Re-throw authentication/authorization errors
    throw error;
  }
}

// Rate limiting middleware
export async function withRateLimit(
  context: AuthContext,
  operation: keyof AuthContext['rateLimits']
): Promise<void> {
  const authService = APIAuthService.getInstance();
  await authService.checkRateLimit(context, operation);
}

// Combined middleware
export async function withAuthAndRateLimit(
  request: NextRequest,
  requiredPermission: string,
  operation: keyof AuthContext['rateLimits']
): Promise<AuthContext> {
  const context = await withAuth(request, requiredPermission);
  await withRateLimit(context, operation);
  return context;
}