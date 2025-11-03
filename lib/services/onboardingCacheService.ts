import Redis from 'ioredis';

interface CachedOnboardingProfile {
  userId: string;
  currentLevel: string;
  completionPercentage: number;
  unlockedFeatures: string[];
  lastUpdated: string;
}

interface CachedFeatureUnlocks {
  [featureName: string]: {
    unlocked: boolean;
    unlockedAt?: string;
    unlockLevel: string;
  };
}

export class OnboardingCacheService {
  private redis: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly PROFILE_KEY_PREFIX = 'onboarding:profile:';
  private readonly FEATURES_KEY_PREFIX = 'onboarding:features:';
  private readonly EVENTS_KEY_PREFIX = 'onboarding:events:';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Cache onboarding profile
  async cacheProfile(userId: string, profile: CachedOnboardingProfile): Promise<void> {
    const key = `${this.PROFILE_KEY_PREFIX}${userId}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(profile));
  }

  // Get cached profile
  async getCachedProfile(userId: string): Promise<CachedOnboardingProfile | null> {
    const key = `${this.PROFILE_KEY_PREFIX}${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache feature unlocks
  async cacheFeatureUnlocks(userId: string, features: CachedFeatureUnlocks): Promise<void> {
    const key = `${this.FEATURES_KEY_PREFIX}${userId}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(features));
  }

  // Get cached feature unlocks
  async getCachedFeatureUnlocks(userId: string): Promise<CachedFeatureUnlocks | null> {
    const key = `${this.FEATURES_KEY_PREFIX}${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache recent events for quick access
  async cacheRecentEvents(userId: string, events: any[]): Promise<void> {
    const key = `${this.EVENTS_KEY_PREFIX}${userId}`;
    await this.redis.setex(key, 300, JSON.stringify(events)); // 5 minutes TTL
  }

  // Get cached recent events
  async getCachedRecentEvents(userId: string): Promise<any[] | null> {
    const key = `${this.EVENTS_KEY_PREFIX}${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Invalidate user's onboarding cache
  async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      `${this.PROFILE_KEY_PREFIX}${userId}`,
      `${this.FEATURES_KEY_PREFIX}${userId}`,
      `${this.EVENTS_KEY_PREFIX}${userId}`
    ];
    
    await this.redis.del(...keys);
  }

  // Cache onboarding analytics data
  async cacheAnalytics(key: string, data: any, ttl: number = 1800): Promise<void> {
    await this.redis.setex(`analytics:${key}`, ttl, JSON.stringify(data));
  }

  // Get cached analytics
  async getCachedAnalytics(key: string): Promise<any | null> {
    const cached = await this.redis.get(`analytics:${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Batch cache operations for better performance
  async batchCacheProfiles(profiles: Array<{ userId: string; profile: CachedOnboardingProfile }>): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    profiles.forEach(({ userId, profile }) => {
      const key = `${this.PROFILE_KEY_PREFIX}${userId}`;
      pipeline.setex(key, this.CACHE_TTL, JSON.stringify(profile));
    });
    
    await pipeline.exec();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cleanup expired keys
  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, but we can add custom cleanup logic here
    const pattern = 'onboarding:*';
    const keys = await this.redis.keys(pattern);
    
    // Remove keys that are older than expected
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) { // Key exists but has no TTL
        pipeline.expire(key, this.CACHE_TTL);
      }
    }
    
    await pipeline.exec();
  }
}