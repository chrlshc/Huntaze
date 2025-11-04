/**
 * ValidationOrchestrator - Central service for coordinating OAuth credential validation
 * 
 * This service manages validation across multiple platforms, handles caching,
 * concurrency control, and provides health monitoring capabilities.
 */

import {
  CredentialValidator,
  IValidationOrchestrator,
  CredentialValidationResult,
  ValidationConfig,
  ValidationHealthStatus,
  BatchValidationRequest,
  PlatformCredentials,
  Platform,
  ValidationCacheEntry,
  ValidationCache,
  ValidationException,
  ValidationTimeoutError,
  ValidationErrorUtils,
} from './index';

/**
 * Simple in-memory cache implementation
 */
class MemoryValidationCache implements ValidationCache {
  private cache = new Map<string, ValidationCacheEntry>();

  get(key: string): ValidationCacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry;
    }
    
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }
    
    return undefined;
  }

  set(key: string, entry: ValidationCacheEntry): void {
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

/**
 * ValidationOrchestrator implementation
 */
export class ValidationOrchestrator implements IValidationOrchestrator {
  private validators = new Map<Platform, CredentialValidator>();
  private cache: ValidationCache;
  private semaphore: Semaphore;
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
    this.cache = new MemoryValidationCache();
    this.semaphore = new Semaphore(config.maxConcurrentValidations);
  }

  /**
   * Register a platform validator
   */
  registerValidator(validator: CredentialValidator): void {
    this.validators.set(validator.platform, validator);
  }

  /**
   * Validate credentials for a specific platform
   */
  async validatePlatform(
    platform: Platform,
    credentials: PlatformCredentials
  ): Promise<CredentialValidationResult> {
    const validator = this.validators.get(platform);
    if (!validator) {
      throw new ValidationException(
        `No validator found for platform: ${platform}`,
        'VALIDATOR_NOT_FOUND',
        platform
      );
    }

    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(platform, credentials);
      const cached = this.cache.get(cacheKey);

      if (cached) {
        return cached.result;
      }
    }

    // Acquire semaphore for concurrency control
    await this.semaphore.acquire();

    try {
      // Validate with timeout
      const result = await Promise.race([
        validator.validateCredentials(credentials),
        this.createTimeoutPromise(this.config.timeout, platform),
      ]);

      // Cache result if caching is enabled
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey(platform, credentials);
        this.cache.set(cacheKey, {
          result,
          expiresAt: Date.now() + this.config.cacheTimeout,
        });
      }

      return result;
    } finally {
      this.semaphore.release();
    }
  }

  /**
   * Validate credentials for multiple platforms
   */
  async validateMultiplePlatforms(
    validations: BatchValidationRequest[]
  ): Promise<CredentialValidationResult[]> {
    const promises = validations.map(async ({ platform, credentials }) => {
      try {
        return await this.validatePlatform(platform, credentials);
      } catch (error) {
        // Return error result instead of throwing
        return {
          isValid: false,
          platform,
          errors: [ValidationErrorUtils.fromError(error as Error, platform)],
          warnings: [],
          metadata: {
            validatedAt: new Date(),
            responseTime: 0,
          },
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get validation health status for all platforms
   */
  async getHealthStatus(): Promise<ValidationHealthStatus> {
    const results: Record<Platform, 'healthy' | 'unhealthy'> = {} as Record<Platform, 'healthy' | 'unhealthy'>;

    for (const [platform, validator] of this.validators) {
      try {
        // Use minimal test credentials for health check
        const testCredentials = this.getTestCredentials(platform);
        if (testCredentials) {
          const formatErrors = validator.validateFormat(testCredentials);
          results[platform] = formatErrors.length === 0 ? 'healthy' : 'unhealthy';
        } else {
          results[platform] = 'unhealthy';
        }
      } catch (error) {
        results[platform] = 'unhealthy';
      }
    }

    const healthyCount = Object.values(results).filter(status => status === 'healthy').length;
    const totalCount = Object.values(results).length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      platforms: results,
      lastChecked: new Date(),
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size(),
      // TODO: Implement hit rate tracking
    };
  }

  /**
   * Get registered platforms
   */
  getRegisteredPlatforms(): Platform[] {
    return Array.from(this.validators.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update semaphore if max concurrent validations changed
    if (newConfig.maxConcurrentValidations !== undefined) {
      this.semaphore = new Semaphore(newConfig.maxConcurrentValidations);
    }
  }

  /**
   * Generate cache key for credentials (without exposing actual values)
   */
  private getCacheKey(platform: Platform, credentials: PlatformCredentials): string {
    // Create hash of credential keys/structure, not values
    const credentialHash = this.hashCredentials(credentials);
    return `${platform}:${credentialHash}`;
  }

  /**
   * Hash credentials structure for caching (without exposing values)
   */
  private hashCredentials(credentials: PlatformCredentials): string {
    const keys = Object.keys(credentials).sort();
    return Buffer.from(keys.join(':')).toString('base64');
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number, platform: Platform): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ValidationTimeoutError(platform, timeout));
      }, timeout);
    });
  }

  /**
   * Get minimal test credentials for health checks
   */
  private getTestCredentials(platform: Platform): PlatformCredentials | null {
    switch (platform) {
      case 'tiktok':
        return {
          clientKey: process.env.TIKTOK_CLIENT_KEY || 'test',
          clientSecret: process.env.TIKTOK_CLIENT_SECRET || 'test',
          redirectUri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://example.com',
        };
      case 'instagram':
        return {
          appId: process.env.FACEBOOK_APP_ID || 'test',
          appSecret: process.env.FACEBOOK_APP_SECRET || 'test',
          redirectUri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || 'https://example.com',
        };
      case 'reddit':
        return {
          clientId: process.env.REDDIT_CLIENT_ID || 'test',
          clientSecret: process.env.REDDIT_CLIENT_SECRET || 'test',
          redirectUri: process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || 'https://example.com',
          userAgent: 'TestApp/1.0.0',
        };
      default:
        return null;
    }
  }
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxConcurrentValidations: 5,
  timeout: 30 * 1000, // 30 seconds
};

/**
 * Create a pre-configured ValidationOrchestrator instance
 */
export function createValidationOrchestrator(
  config: Partial<ValidationConfig> = {}
): ValidationOrchestrator {
  const finalConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  return new ValidationOrchestrator(finalConfig);
}