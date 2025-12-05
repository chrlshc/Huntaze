/**
 * AIProviderConfig - Feature flag system for AI provider selection
 * 
 * Supports three modes:
 * - 'foundry': Use Azure AI Foundry exclusively
 * - 'legacy': Use legacy providers (Gemini, OpenAI) exclusively
 * - 'canary': Split traffic between Foundry and Legacy based on percentage
 * 
 * Requirements: 3.1, 3.2
 */

export type AIProvider = 'foundry' | 'legacy' | 'canary';

export interface AIProviderConfigOptions {
  /** AI provider mode */
  provider: AIProvider;
  /** Canary percentage (0-100) - only used when provider is 'canary' */
  canaryPercentage: number;
  /** Router URL for Foundry provider */
  routerUrl: string;
  /** Enable fallback to legacy on Foundry failure */
  fallbackEnabled: boolean;
  /** API key for router authentication */
  routerApiKey?: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: AIProviderConfigOptions = {
  provider: 'legacy',
  canaryPercentage: 10,
  routerUrl: 'http://localhost:8000',
  fallbackEnabled: true,
  routerApiKey: undefined,
};

/**
 * AIProviderConfig singleton
 * 
 * Reads configuration from environment variables:
 * - AI_PROVIDER: 'foundry' | 'legacy' | 'canary'
 * - AI_CANARY_PERCENTAGE: 0-100 (default: 10)
 * - AI_ROUTER_URL: Router endpoint URL
 * - AI_FALLBACK_ENABLED: 'true' | 'false'
 * - AI_ROUTER_API_KEY: API key for router authentication
 */
export class AIProviderConfig {
  private static instance: AIProviderConfig | null = null;
  private config: AIProviderConfigOptions;

  private constructor() {
    this.config = this.loadFromEnvironment();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIProviderConfig {
    if (!AIProviderConfig.instance) {
      AIProviderConfig.instance = new AIProviderConfig();
    }
    return AIProviderConfig.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    AIProviderConfig.instance = null;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): AIProviderConfigOptions {
    const providerEnv = process.env.AI_PROVIDER?.toLowerCase();
    let provider: AIProvider = DEFAULT_CONFIG.provider;
    
    if (providerEnv === 'foundry' || providerEnv === 'legacy' || providerEnv === 'canary') {
      provider = providerEnv;
    }

    const canaryPercentageEnv = process.env.AI_CANARY_PERCENTAGE;
    let canaryPercentage = DEFAULT_CONFIG.canaryPercentage;
    
    if (canaryPercentageEnv) {
      const parsed = parseInt(canaryPercentageEnv, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        canaryPercentage = parsed;
      }
    }

    const routerUrl = process.env.AI_ROUTER_URL || DEFAULT_CONFIG.routerUrl;
    
    const fallbackEnabledEnv = process.env.AI_FALLBACK_ENABLED?.toLowerCase();
    const fallbackEnabled = fallbackEnabledEnv === 'false' ? false : DEFAULT_CONFIG.fallbackEnabled;

    const routerApiKey = process.env.AI_ROUTER_API_KEY;

    return {
      provider,
      canaryPercentage,
      routerUrl,
      fallbackEnabled,
      routerApiKey,
    };
  }

  /**
   * Get current provider mode
   * Requirement 3.1: Feature flag for provider selection
   */
  getProvider(): AIProvider {
    return this.config.provider;
  }

  /**
   * Get canary percentage
   * Requirement 3.2: Canary traffic percentage
   */
  getCanaryPercentage(): number {
    return this.config.canaryPercentage;
  }

  /**
   * Get router URL
   */
  getRouterUrl(): string {
    return this.config.routerUrl;
  }

  /**
   * Check if fallback is enabled
   */
  isFallbackEnabled(): boolean {
    return this.config.fallbackEnabled;
  }

  /**
   * Get router API key
   */
  getRouterApiKey(): string | undefined {
    return this.config.routerApiKey;
  }

  /**
   * Check if Foundry should be used for this request
   * Uses consistent hashing for user stickiness in canary mode
   * 
   * @param userId - Optional user ID for consistent routing
   * @returns true if Foundry should be used
   */
  shouldUseFoundry(userId?: string): boolean {
    const provider = this.config.provider;

    if (provider === 'foundry') {
      return true;
    }

    if (provider === 'legacy') {
      return false;
    }

    // Canary mode: use percentage-based routing with optional user stickiness
    if (provider === 'canary') {
      if (userId) {
        // Consistent hashing for user stickiness
        const hash = this.hashUserId(userId);
        return hash < this.config.canaryPercentage;
      }
      // Random selection if no user ID
      return Math.random() * 100 < this.config.canaryPercentage;
    }

    return false;
  }

  /**
   * Hash user ID to a number between 0-99 for consistent routing
   * Uses simple string hash for deterministic results
   * 
   * @param userId - User ID to hash
   * @returns Number between 0-99
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get full configuration (for debugging/logging)
   */
  getConfig(): Readonly<AIProviderConfigOptions> {
    return { ...this.config };
  }

  /**
   * Override configuration (for testing)
   */
  setConfig(config: Partial<AIProviderConfigOptions>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Convenience function to get provider config instance
 */
export function getAIProviderConfig(): AIProviderConfig {
  return AIProviderConfig.getInstance();
}

/**
 * Convenience function to check if Foundry should be used
 */
export function shouldUseFoundry(userId?: string): boolean {
  return AIProviderConfig.getInstance().shouldUseFoundry(userId);
}
