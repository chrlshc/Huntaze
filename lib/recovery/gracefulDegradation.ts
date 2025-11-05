/**
 * Graceful Degradation System
 * Maintains core functionality during service failures
 */

export enum DegradationLevel {
  NONE = 0,
  MINIMAL = 1,
  MODERATE = 2,
  SEVERE = 3,
  EMERGENCY = 4
}

export interface DegradationRule {
  name: string;
  level: DegradationLevel;
  condition: () => boolean | Promise<boolean>;
  actions: DegradationAction[];
  priority: number;
}

export interface DegradationAction {
  type: 'disable_feature' | 'use_cache' | 'simplify_ui' | 'reduce_quality' | 'custom';
  target: string;
  fallback?: any;
  execute?: () => void | Promise<void>;
}

export interface DegradationStatus {
  level: DegradationLevel;
  activeRules: string[];
  disabledFeatures: string[];
  timestamp: number;
}

class GracefulDegradationManager {
  private rules = new Map<string, DegradationRule>();
  private currentLevel = DegradationLevel.NONE;
  private activeRules = new Set<string>();
  private disabledFeatures = new Set<string>();
  private featureFlags = new Map<string, boolean>();
  private cachedResponses = new Map<string, { data: any; timestamp: number; ttl: number }>();

  registerRule(rule: DegradationRule): void {
    this.rules.set(rule.name, rule);
  }

  async evaluateRules(): Promise<DegradationStatus> {
    const applicableRules: DegradationRule[] = [];

    // Check all rules
    for (const rule of this.rules.values()) {
      try {
        const shouldApply = await rule.condition();
        if (shouldApply) {
          applicableRules.push(rule);
        }
      } catch (error) {
        console.error(`Error evaluating degradation rule ${rule.name}:`, error);
      }
    }

    // Sort by priority (higher priority first)
    applicableRules.sort((a, b) => b.priority - a.priority);

    // Determine degradation level
    const maxLevel = applicableRules.reduce(
      (max, rule) => Math.max(max, rule.level),
      DegradationLevel.NONE
    );

    // Apply rules if level changed
    if (maxLevel !== this.currentLevel) {
      await this.applyDegradationLevel(maxLevel, applicableRules);
    }

    return {
      level: this.currentLevel,
      activeRules: Array.from(this.activeRules),
      disabledFeatures: Array.from(this.disabledFeatures),
      timestamp: Date.now()
    };
  }

  private async applyDegradationLevel(
    level: DegradationLevel,
    rules: DegradationRule[]
  ): Promise<void> {
    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.activeRules.clear();

    // If degradation level decreased, re-enable features
    if (level < previousLevel) {
      await this.restoreFeatures();
    }

    // Apply new rules
    for (const rule of rules) {
      if (rule.level <= level) {
        this.activeRules.add(rule.name);
        await this.executeActions(rule.actions);
      }
    }

    console.log(`Degradation level changed: ${previousLevel} → ${level}`);
  }

  private async executeActions(actions: DegradationAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'disable_feature':
            this.disableFeature(action.target);
            break;
          case 'use_cache':
            // Cache-based fallback is handled in getWithFallback
            break;
          case 'simplify_ui':
            this.setFeatureFlag(`simplified_${action.target}`, true);
            break;
          case 'reduce_quality':
            this.setFeatureFlag(`reduced_quality_${action.target}`, true);
            break;
          case 'custom':
            if (action.execute) {
              await action.execute();
            }
            break;
        }
      } catch (error) {
        console.error(`Error executing degradation action ${action.type}:`, error);
      }
    }
  }

  private async restoreFeatures(): Promise<void> {
    // Re-enable all features
    this.disabledFeatures.clear();
    
    // Reset feature flags
    for (const [key] of this.featureFlags) {
      if (key.startsWith('simplified_') || key.startsWith('reduced_quality_')) {
        this.featureFlags.delete(key);
      }
    }
  }

  // Feature management
  disableFeature(featureName: string): void {
    this.disabledFeatures.add(featureName);
    this.setFeatureFlag(featureName, false);
  }

  enableFeature(featureName: string): void {
    this.disabledFeatures.delete(featureName);
    this.setFeatureFlag(featureName, true);
  }

  isFeatureEnabled(featureName: string): boolean {
    if (this.disabledFeatures.has(featureName)) {
      return false;
    }
    return this.featureFlags.get(featureName) ?? true;
  }

  setFeatureFlag(name: string, value: boolean): void {
    this.featureFlags.set(name, value);
  }

  getFeatureFlag(name: string): boolean {
    return this.featureFlags.get(name) ?? false;
  }

  // Cache management for fallbacks
  setCachedResponse(key: string, data: any, ttlSeconds: number = 300): void {
    this.cachedResponses.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  getCachedResponse(key: string): any | null {
    const cached = this.cachedResponses.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cachedResponses.delete(key);
      return null;
    }

    return cached.data;
  }

  // Fallback data retrieval
  async getWithFallback<T>(
    key: string,
    primaryOperation: () => Promise<T>,
    fallbackData?: T
  ): Promise<T> {
    try {
      const result = await primaryOperation();
      // Cache successful result
      this.setCachedResponse(key, result);
      return result;
    } catch (error) {
      // Try cached response first
      const cached = this.getCachedResponse(key);
      if (cached) {
        console.log(`Using cached response for ${key}`);
        return cached;
      }

      // Use provided fallback
      if (fallbackData !== undefined) {
        console.log(`Using fallback data for ${key}`);
        return fallbackData;
      }

      throw error;
    }
  }

  // Status and metrics
  getStatus(): DegradationStatus {
    return {
      level: this.currentLevel,
      activeRules: Array.from(this.activeRules),
      disabledFeatures: Array.from(this.disabledFeatures),
      timestamp: Date.now()
    };
  }

  reset(): void {
    this.currentLevel = DegradationLevel.NONE;
    this.activeRules.clear();
    this.disabledFeatures.clear();
    this.featureFlags.clear();
  }
}

// Global instance
export const degradationManager = new GracefulDegradationManager();

// Pre-configured degradation rules
export const setupDefaultDegradationRules = () => {
  // High memory usage rule
  degradationManager.registerRule({
    name: 'high_memory_usage',
    level: DegradationLevel.MODERATE,
    priority: 100,
    condition: () => {
      const memUsage = process.memoryUsage();
      const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      return usagePercent > 85;
    },
    actions: [
      { type: 'disable_feature', target: 'analytics_real_time' },
      { type: 'disable_feature', target: 'image_processing' },
      { type: 'reduce_quality', target: 'thumbnails' }
    ]
  });

  // Database connection issues
  degradationManager.registerRule({
    name: 'database_issues',
    level: DegradationLevel.SEVERE,
    priority: 200,
    condition: async () => {
      try {
        const { getCircuitBreakerMetrics } = await import('./circuitBreaker');
        const dbMetrics = getCircuitBreakerMetrics('database');
        return dbMetrics.state === 'OPEN';
      } catch {
        return false;
      }
    },
    actions: [
      { type: 'use_cache', target: 'user_data' },
      { type: 'disable_feature', target: 'real_time_updates' },
      { type: 'simplify_ui', target: 'dashboard' }
    ]
  });

  // Cache service down
  degradationManager.registerRule({
    name: 'cache_service_down',
    level: DegradationLevel.MINIMAL,
    priority: 50,
    condition: async () => {
      try {
        const { getCircuitBreakerMetrics } = await import('./circuitBreaker');
        const cacheMetrics = getCircuitBreakerMetrics('cache');
        return cacheMetrics.state === 'OPEN';
      } catch {
        return false;
      }
    },
    actions: [
      { type: 'disable_feature', target: 'session_caching' },
      { type: 'reduce_quality', target: 'page_performance' }
    ]
  });

  // External API failures
  degradationManager.registerRule({
    name: 'external_api_failures',
    level: DegradationLevel.MODERATE,
    priority: 75,
    condition: async () => {
      try {
        const { getCircuitBreakerMetrics } = await import('./circuitBreaker');
        const apiMetrics = getCircuitBreakerMetrics('external-api');
        return apiMetrics.failureRate > 50;
      } catch {
        return false;
      }
    },
    actions: [
      { type: 'use_cache', target: 'external_data' },
      { type: 'disable_feature', target: 'social_integrations' },
      { type: 'simplify_ui', target: 'social_widgets' }
    ]
  });
};

// Convenience functions
export const checkDegradationStatus = () => degradationManager.evaluateRules();
export const isFeatureEnabled = (feature: string) => degradationManager.isFeatureEnabled(feature);
export const getWithFallback = <T>(
  key: string,
  operation: () => Promise<T>,
  fallback?: T
) => degradationManager.getWithFallback(key, operation, fallback);

// React hook for feature flags (if using React)
export const useFeatureFlag = (flagName: string): boolean => {
  return degradationManager.getFeatureFlag(flagName);
};