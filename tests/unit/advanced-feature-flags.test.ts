/**
 * Tests for Advanced Feature Flags
 * Tests cross-stack feature flag management and rollout control
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock external dependencies
const mockRedisClient = {
  get: vi.fn(),
  set: vi.fn(),
  hget: vi.fn(),
  hset: vi.fn(),
  hgetall: vi.fn(),
  del: vi.fn(),
  expire: vi.fn()
};

const mockAnalyticsService = {
  trackFeatureUsage: vi.fn(),
  getFeatureMetrics: vi.fn()
};

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient)
}));

// Types for advanced feature flags
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout: number; // 0-100 percentage
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureFlagCondition {
  type: 'user_id' | 'user_tier' | 'geographic' | 'time_based' | 'custom';
  operator: 'equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'matches';
  value: any;
}

interface FeatureFlagContext {
  userId?: string;
  userTier?: 'free' | 'premium' | 'vip';
  geographic?: string;
  timestamp?: Date;
  customAttributes?: Record<string, any>;
}

interface FeatureFlagEvaluation {
  flagName: string;
  enabled: boolean;
  reason: string;
  rolloutPercentage: number;
  conditionsMet: boolean;
  evaluatedAt: Date;
}

// Mock implementation of AdvancedFeatureFlags
class AdvancedFeatureFlags {
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCache: Map<string, FeatureFlagEvaluation> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor(
    private redis = mockRedisClient,
    private analytics = mockAnalyticsService
  ) {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags() {
    const defaultFlags: FeatureFlag[] = [
      {
        name: 'ai-onlyfans-integration',
        enabled: true,
        rollout: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'content-marketing-sync',
        enabled: true,
        rollout: 90,
        conditions: [
          { type: 'user_tier', operator: 'in', value: ['premium', 'vip'] }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'analytics-ai-insights',
        enabled: true,
        rollout: 80,
        conditions: [
          { type: 'user_tier', operator: 'equals', value: 'vip' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'multi-agent-orchestration',
        enabled: true,
        rollout: 10,
        conditions: [
          { type: 'user_id', operator: 'in', value: ['beta-user-1', 'beta-user-2'] }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'predictive-content-planning',
        enabled: false,
        rollout: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }

  async isEnabled(flagName: string, context: FeatureFlagContext = {}): Promise<boolean> {
    const evaluation = await this.evaluateFlag(flagName, context);
    
    // Track usage
    await this.analytics.trackFeatureUsage({
      flagName,
      enabled: evaluation.enabled,
      userId: context.userId,
      timestamp: new Date()
    });

    return evaluation.enabled;
  }

  async evaluateFlag(flagName: string, context: FeatureFlagContext = {}): Promise<FeatureFlagEvaluation> {
    const cacheKey = `${flagName}:${JSON.stringify(context)}`;
    
    // Check cache first
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && Date.now() - cached.evaluatedAt.getTime() < this.cacheTimeout) {
      return cached;
    }

    const flag = await this.getFlag(flagName);
    if (!flag) {
      const evaluation: FeatureFlagEvaluation = {
        flagName,
        enabled: false,
        reason: 'Flag not found',
        rolloutPercentage: 0,
        conditionsMet: false,
        evaluatedAt: new Date()
      };
      this.evaluationCache.set(cacheKey, evaluation);
      return evaluation;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      const evaluation: FeatureFlagEvaluation = {
        flagName,
        enabled: false,
        reason: 'Flag globally disabled',
        rolloutPercentage: flag.rollout,
        conditionsMet: false,
        evaluatedAt: new Date()
      };
      this.evaluationCache.set(cacheKey, evaluation);
      return evaluation;
    }

    // Evaluate conditions
    const conditionsMet = this.evaluateConditions(flag.conditions || [], context);
    if (!conditionsMet) {
      const evaluation: FeatureFlagEvaluation = {
        flagName,
        enabled: false,
        reason: 'Conditions not met',
        rolloutPercentage: flag.rollout,
        conditionsMet: false,
        evaluatedAt: new Date()
      };
      this.evaluationCache.set(cacheKey, evaluation);
      return evaluation;
    }

    // Check rollout percentage
    const rolloutEnabled = this.checkRollout(flag.rollout, context.userId || 'anonymous');
    
    const evaluation: FeatureFlagEvaluation = {
      flagName,
      enabled: rolloutEnabled,
      reason: rolloutEnabled ? 'Enabled by rollout' : 'Excluded by rollout',
      rolloutPercentage: flag.rollout,
      conditionsMet: true,
      evaluatedAt: new Date()
    };

    this.evaluationCache.set(cacheKey, evaluation);
    return evaluation;
  }

  private evaluateConditions(conditions: FeatureFlagCondition[], context: FeatureFlagContext): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      switch (condition.type) {
        case 'user_id':
          return this.evaluateCondition(context.userId, condition.operator, condition.value);
        
        case 'user_tier':
          return this.evaluateCondition(context.userTier, condition.operator, condition.value);
        
        case 'geographic':
          return this.evaluateCondition(context.geographic, condition.operator, condition.value);
        
        case 'time_based':
          const currentTime = context.timestamp || new Date();
          return this.evaluateCondition(currentTime.getHours(), condition.operator, condition.value);
        
        case 'custom':
          const customValue = context.customAttributes?.[condition.value.attribute];
          return this.evaluateCondition(customValue, condition.operator, condition.value.expected);
        
        default:
          return false;
      }
    });
  }

  private evaluateCondition(actualValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      
      case 'greater_than':
        return actualValue > expectedValue;
      
      case 'less_than':
        return actualValue < expectedValue;
      
      case 'matches':
        return new RegExp(expectedValue).test(String(actualValue));
      
      default:
        return false;
    }
  }

  private checkRollout(rolloutPercentage: number, userId: string): boolean {
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    // Consistent hash-based rollout
    const hash = this.hashString(userId);
    const userPercentile = hash % 100;
    return userPercentile < rolloutPercentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async getFlag(flagName: string): Promise<FeatureFlag | null> {
    // Try local cache first
    const localFlag = this.flags.get(flagName);
    if (localFlag) return localFlag;

    // Try Redis cache
    try {
      const redisFlag = await this.redis.get(`flag:${flagName}`);
      if (redisFlag) {
        const flag = JSON.parse(redisFlag);
        flag.createdAt = new Date(flag.createdAt);
        flag.updatedAt = new Date(flag.updatedAt);
        this.flags.set(flagName, flag);
        return flag;
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    return null;
  }

  async setFlag(flag: FeatureFlag): Promise<void> {
    flag.updatedAt = new Date();
    
    // Update local cache
    this.flags.set(flag.name, flag);
    
    // Update Redis
    try {
      await this.redis.set(`flag:${flag.name}`, JSON.stringify(flag));
      await this.redis.expire(`flag:${flag.name}`, 86400); // 24 hours
    } catch (error) {
      console.error('Redis error:', error);
    }

    // Clear evaluation cache for this flag
    this.clearEvaluationCache(flag.name);
  }

  async updateRollout(flagName: string, rolloutPercentage: number): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    if (!flag) return false;

    flag.rollout = Math.max(0, Math.min(100, rolloutPercentage));
    await this.setFlag(flag);
    return true;
  }

  async enableFlag(flagName: string): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    if (!flag) return false;

    flag.enabled = true;
    await this.setFlag(flag);
    return true;
  }

  async disableFlag(flagName: string): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    if (!flag) return false;

    flag.enabled = false;
    await this.setFlag(flag);
    return true;
  }

  async addCondition(flagName: string, condition: FeatureFlagCondition): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    if (!flag) return false;

    if (!flag.conditions) flag.conditions = [];
    flag.conditions.push(condition);
    await this.setFlag(flag);
    return true;
  }

  async removeCondition(flagName: string, conditionIndex: number): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    if (!flag || !flag.conditions || conditionIndex >= flag.conditions.length) return false;

    flag.conditions.splice(conditionIndex, 1);
    await this.setFlag(flag);
    return true;
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  async getFlagMetrics(flagName: string): Promise<{
    totalEvaluations: number;
    enabledCount: number;
    disabledCount: number;
    enabledPercentage: number;
  }> {
    return await this.analytics.getFeatureMetrics(flagName);
  }

  clearEvaluationCache(flagName?: string): void {
    if (flagName) {
      // Clear cache entries for specific flag
      const keysToDelete = Array.from(this.evaluationCache.keys())
        .filter(key => key.startsWith(`${flagName}:`));
      keysToDelete.forEach(key => this.evaluationCache.delete(key));
    } else {
      // Clear all cache
      this.evaluationCache.clear();
    }
  }

  async createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<void> {
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.setFlag(newFlag);
  }

  async deleteFlag(flagName: string): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    if (!flag) return false;

    // Remove from local cache
    this.flags.delete(flagName);
    
    // Remove from Redis
    try {
      await this.redis.del(`flag:${flagName}`);
    } catch (error) {
      console.error('Redis error:', error);
    }

    // Clear evaluation cache
    this.clearEvaluationCache(flagName);
    
    return true;
  }
}

describe('AdvancedFeatureFlags', () => {
  let featureFlags: AdvancedFeatureFlags;

  beforeEach(() => {
    featureFlags = new AdvancedFeatureFlags();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Flag Evaluation', () => {
    it('should evaluate enabled flags correctly', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      const result = await featureFlags.isEnabled('ai-onlyfans-integration');

      expect(result).toBe(true);
      expect(mockAnalyticsService.trackFeatureUsage).toHaveBeenCalledWith({
        flagName: 'ai-onlyfans-integration',
        enabled: true,
        userId: undefined,
        timestamp: expect.any(Date)
      });
    });

    it('should evaluate disabled flags correctly', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      const result = await featureFlags.isEnabled('predictive-content-planning');

      expect(result).toBe(false);
      expect(mockAnalyticsService.trackFeatureUsage).toHaveBeenCalledWith({
        flagName: 'predictive-content-planning',
        enabled: false,
        userId: undefined,
        timestamp: expect.any(Date)
      });
    });

    it('should handle non-existent flags', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      const result = await featureFlags.isEnabled('non-existent-flag');

      expect(result).toBe(false);
    });

    it('should evaluate user tier conditions', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      // Premium user should have access to content-marketing-sync
      const premiumResult = await featureFlags.isEnabled('content-marketing-sync', {
        userId: 'user-123',
        userTier: 'premium'
      });

      expect(premiumResult).toBe(true);

      // Free user should not have access
      const freeResult = await featureFlags.isEnabled('content-marketing-sync', {
        userId: 'user-456',
        userTier: 'free'
      });

      expect(freeResult).toBe(false);
    });

    it('should evaluate user ID conditions', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      // Beta user should have access to multi-agent-orchestration
      const betaResult = await featureFlags.isEnabled('multi-agent-orchestration', {
        userId: 'beta-user-1'
      });

      expect(betaResult).toBe(true);

      // Regular user should not have access
      const regularResult = await featureFlags.isEnabled('multi-agent-orchestration', {
        userId: 'regular-user'
      });

      expect(regularResult).toBe(false);
    });

    it('should respect rollout percentages', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      // Test with multiple users to verify rollout consistency
      const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      const results = await Promise.all(
        users.map(userId => featureFlags.isEnabled('analytics-ai-insights', {
          userId,
          userTier: 'vip' // Meets condition
        }))
      );

      const enabledCount = results.filter(Boolean).length;
      
      // Should be around 80% (with some variance due to hashing)
      expect(enabledCount).toBeGreaterThan(70);
      expect(enabledCount).toBeLessThan(90);

      // Same user should always get same result (consistency)
      const user1Result1 = await featureFlags.isEnabled('analytics-ai-insights', {
        userId: 'consistent-user',
        userTier: 'vip'
      });
      const user1Result2 = await featureFlags.isEnabled('analytics-ai-insights', {
        userId: 'consistent-user',
        userTier: 'vip'
      });

      expect(user1Result1).toBe(user1Result2);
    });
  });

  describe('Flag Management', () => {
    it('should create new flags', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      await featureFlags.createFlag({
        name: 'new-test-flag',
        enabled: true,
        rollout: 50,
        conditions: [
          { type: 'user_tier', operator: 'equals', value: 'premium' }
        ]
      });

      const flag = await featureFlags.getFlag('new-test-flag');
      expect(flag).toBeDefined();
      expect(flag?.name).toBe('new-test-flag');
      expect(flag?.enabled).toBe(true);
      expect(flag?.rollout).toBe(50);
      expect(flag?.conditions).toHaveLength(1);
    });

    it('should update flag rollout', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      const success = await featureFlags.updateRollout('ai-onlyfans-integration', 75);
      expect(success).toBe(true);

      const flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.rollout).toBe(75);
    });

    it('should enable and disable flags', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      // Disable flag
      const disableSuccess = await featureFlags.disableFlag('ai-onlyfans-integration');
      expect(disableSuccess).toBe(true);

      let flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.enabled).toBe(false);

      // Re-enable flag
      const enableSuccess = await featureFlags.enableFlag('ai-onlyfans-integration');
      expect(enableSuccess).toBe(true);

      flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.enabled).toBe(true);
    });

    it('should add and remove conditions', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      const newCondition: FeatureFlagCondition = {
        type: 'geographic',
        operator: 'equals',
        value: 'US'
      };

      const addSuccess = await featureFlags.addCondition('ai-onlyfans-integration', newCondition);
      expect(addSuccess).toBe(true);

      let flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.conditions).toHaveLength(1);
      expect(flag?.conditions?.[0]).toEqual(newCondition);

      const removeSuccess = await featureFlags.removeCondition('ai-onlyfans-integration', 0);
      expect(removeSuccess).toBe(true);

      flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.conditions).toHaveLength(0);
    });

    it('should delete flags', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const deleteSuccess = await featureFlags.deleteFlag('predictive-content-planning');
      expect(deleteSuccess).toBe(true);

      const flag = await featureFlags.getFlag('predictive-content-planning');
      expect(flag).toBeNull();
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate time-based conditions', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      // Create flag with time-based condition (only enabled during business hours)
      await featureFlags.createFlag({
        name: 'business-hours-feature',
        enabled: true,
        rollout: 100,
        conditions: [
          { type: 'time_based', operator: 'greater_than', value: 8 },
          { type: 'time_based', operator: 'less_than', value: 18 }
        ]
      });

      // Test during business hours (10 AM)
      const businessHoursResult = await featureFlags.isEnabled('business-hours-feature', {
        timestamp: new Date('2024-01-15T10:00:00Z')
      });

      expect(businessHoursResult).toBe(true);

      // Test outside business hours (2 AM)
      const afterHoursResult = await featureFlags.isEnabled('business-hours-feature', {
        timestamp: new Date('2024-01-15T02:00:00Z')
      });

      expect(afterHoursResult).toBe(false);
    });

    it('should evaluate custom attribute conditions', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      await featureFlags.createFlag({
        name: 'custom-attribute-feature',
        enabled: true,
        rollout: 100,
        conditions: [
          { 
            type: 'custom', 
            operator: 'equals', 
            value: { attribute: 'accountType', expected: 'creator' }
          }
        ]
      });

      // Test with matching custom attribute
      const creatorResult = await featureFlags.isEnabled('custom-attribute-feature', {
        customAttributes: { accountType: 'creator', subscriptionLevel: 'pro' }
      });

      expect(creatorResult).toBe(true);

      // Test with non-matching custom attribute
      const fanResult = await featureFlags.isEnabled('custom-attribute-feature', {
        customAttributes: { accountType: 'fan', subscriptionLevel: 'basic' }
      });

      expect(fanResult).toBe(false);
    });

    it('should evaluate geographic conditions', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      await featureFlags.createFlag({
        name: 'geo-restricted-feature',
        enabled: true,
        rollout: 100,
        conditions: [
          { type: 'geographic', operator: 'in', value: ['US', 'CA', 'UK'] }
        ]
      });

      // Test with allowed geography
      const allowedResult = await featureFlags.isEnabled('geo-restricted-feature', {
        geographic: 'US'
      });

      expect(allowedResult).toBe(true);

      // Test with restricted geography
      const restrictedResult = await featureFlags.isEnabled('geo-restricted-feature', {
        geographic: 'CN'
      });

      expect(restrictedResult).toBe(false);
    });

    it('should evaluate regex matching conditions', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      await featureFlags.createFlag({
        name: 'email-pattern-feature',
        enabled: true,
        rollout: 100,
        conditions: [
          { 
            type: 'custom', 
            operator: 'matches', 
            value: { attribute: 'email', expected: '.*@company\\.com$' }
          }
        ]
      });

      // Test with matching email pattern
      const companyEmailResult = await featureFlags.isEnabled('email-pattern-feature', {
        customAttributes: { email: 'user@company.com' }
      });

      expect(companyEmailResult).toBe(true);

      // Test with non-matching email pattern
      const personalEmailResult = await featureFlags.isEnabled('email-pattern-feature', {
        customAttributes: { email: 'user@gmail.com' }
      });

      expect(personalEmailResult).toBe(false);
    });
  });

  describe('Caching and Performance', () => {
    it('should cache evaluation results', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      const context = { userId: 'cache-test-user', userTier: 'premium' as const };

      // First evaluation
      const result1 = await featureFlags.evaluateFlag('content-marketing-sync', context);
      
      // Second evaluation (should use cache)
      const result2 = await featureFlags.evaluateFlag('content-marketing-sync', context);

      expect(result1).toEqual(result2);
      expect(result1.evaluatedAt).toEqual(result2.evaluatedAt); // Same timestamp indicates cache hit
    });

    it('should clear evaluation cache when flag is updated', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      const context = { userId: 'cache-clear-user' };

      // Initial evaluation
      await featureFlags.evaluateFlag('ai-onlyfans-integration', context);

      // Update flag
      await featureFlags.updateRollout('ai-onlyfans-integration', 50);

      // Evaluation after update should have new timestamp
      const resultAfterUpdate = await featureFlags.evaluateFlag('ai-onlyfans-integration', context);
      
      const flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.rollout).toBe(50);
      expect(resultAfterUpdate.rolloutPercentage).toBe(50);
    });

    it('should handle Redis failures gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection failed'));
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      // Should still work with local cache
      const result = await featureFlags.isEnabled('ai-onlyfans-integration');
      expect(result).toBe(true);

      // Should still be able to update flags (local cache only)
      const updateSuccess = await featureFlags.updateRollout('ai-onlyfans-integration', 75);
      expect(updateSuccess).toBe(true);
    });
  });

  describe('Metrics and Analytics', () => {
    it('should track feature usage', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      await featureFlags.isEnabled('content-marketing-sync', {
        userId: 'metrics-user',
        userTier: 'premium'
      });

      expect(mockAnalyticsService.trackFeatureUsage).toHaveBeenCalledWith({
        flagName: 'content-marketing-sync',
        enabled: true,
        userId: 'metrics-user',
        timestamp: expect.any(Date)
      });
    });

    it('should provide flag metrics', async () => {
      mockAnalyticsService.getFeatureMetrics.mockResolvedValue({
        totalEvaluations: 1000,
        enabledCount: 800,
        disabledCount: 200,
        enabledPercentage: 80
      });

      const metrics = await featureFlags.getFlagMetrics('ai-onlyfans-integration');

      expect(metrics.totalEvaluations).toBe(1000);
      expect(metrics.enabledCount).toBe(800);
      expect(metrics.disabledCount).toBe(200);
      expect(metrics.enabledPercentage).toBe(80);
    });
  });

  describe('Flag Listing and Management', () => {
    it('should list all flags', () => {
      const allFlags = featureFlags.getAllFlags();

      expect(allFlags).toHaveLength(5);
      expect(allFlags.map(f => f.name)).toContain('ai-onlyfans-integration');
      expect(allFlags.map(f => f.name)).toContain('content-marketing-sync');
      expect(allFlags.map(f => f.name)).toContain('analytics-ai-insights');
      expect(allFlags.map(f => f.name)).toContain('multi-agent-orchestration');
      expect(allFlags.map(f => f.name)).toContain('predictive-content-planning');
    });

    it('should handle rollout percentage bounds', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      // Test negative rollout (should be clamped to 0)
      await featureFlags.updateRollout('ai-onlyfans-integration', -10);
      let flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.rollout).toBe(0);

      // Test rollout over 100 (should be clamped to 100)
      await featureFlags.updateRollout('ai-onlyfans-integration', 150);
      flag = await featureFlags.getFlag('ai-onlyfans-integration');
      expect(flag?.rollout).toBe(100);
    });

    it('should handle operations on non-existent flags', async () => {
      const updateResult = await featureFlags.updateRollout('non-existent', 50);
      expect(updateResult).toBe(false);

      const enableResult = await featureFlags.enableFlag('non-existent');
      expect(enableResult).toBe(false);

      const disableResult = await featureFlags.disableFlag('non-existent');
      expect(disableResult).toBe(false);

      const addConditionResult = await featureFlags.addCondition('non-existent', {
        type: 'user_tier',
        operator: 'equals',
        value: 'premium'
      });
      expect(addConditionResult).toBe(false);

      const deleteResult = await featureFlags.deleteFlag('non-existent');
      expect(deleteResult).toBe(false);
    });
  });

  describe('Rollout Consistency', () => {
    it('should provide consistent rollout results for same user', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      const userId = 'consistent-user-test';
      const results: boolean[] = [];

      // Test multiple evaluations for same user
      for (let i = 0; i < 10; i++) {
        const result = await featureFlags.isEnabled('content-marketing-sync', {
          userId,
          userTier: 'premium'
        });
        results.push(result);
      }

      // All results should be the same
      const firstResult = results[0];
      expect(results.every(r => r === firstResult)).toBe(true);
    });

    it('should distribute users evenly across rollout percentage', async () => {
      mockAnalyticsService.trackFeatureUsage.mockResolvedValue({});

      // Create a flag with 50% rollout
      await featureFlags.createFlag({
        name: 'rollout-distribution-test',
        enabled: true,
        rollout: 50
      });

      const users = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      const results = await Promise.all(
        users.map(userId => featureFlags.isEnabled('rollout-distribution-test', { userId }))
      );

      const enabledCount = results.filter(Boolean).length;
      
      // Should be close to 50% (allowing for some variance)
      expect(enabledCount).toBeGreaterThan(450);
      expect(enabledCount).toBeLessThan(550);
    });
  });
});