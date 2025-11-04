/**
 * Configuration system for OAuth credentials validation framework
 * 
 * This module handles environment-based configuration loading, validation,
 * and provides default settings for the validation framework.
 */

import { ValidationConfig, Platform } from './types';
import { ValidationException } from './errors';

/**
 * Environment-specific validation configuration
 */
export interface ValidationEnvironmentConfig extends ValidationConfig {
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableAlerts: boolean;
}

/**
 * Platform-specific configuration
 */
export interface PlatformConfig {
  enabled: boolean;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  sandboxMode: boolean;
}

/**
 * Complete validation system configuration
 */
export interface ValidationSystemConfig {
  validation: ValidationEnvironmentConfig;
  platforms: Record<Platform, PlatformConfig>;
  monitoring: {
    metricsRetention: number; // days
    alertThresholds: {
      errorRate: number; // percentage
      responseTime: number; // milliseconds
      failureCount: number; // count
    };
  };
}

/**
 * Default platform configurations
 */
const DEFAULT_PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  tiktok: {
    enabled: true,
    timeout: 15000, // 15 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    sandboxMode: false,
  },
  instagram: {
    enabled: true,
    timeout: 20000, // 20 seconds (Facebook API can be slower)
    maxRetries: 3,
    retryDelay: 1000,
    sandboxMode: false,
  },
  reddit: {
    enabled: true,
    timeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000,
    sandboxMode: false,
  },
};

/**
 * Default validation configuration
 */
const DEFAULT_VALIDATION_CONFIG: ValidationEnvironmentConfig = {
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxConcurrentValidations: 5,
  timeout: 30 * 1000, // 30 seconds
  environment: 'development',
  logLevel: 'info',
  enableMetrics: true,
  enableAlerts: false, // Disabled by default in development
};

/**
 * Default monitoring configuration
 */
const DEFAULT_MONITORING_CONFIG = {
  metricsRetention: 30, // 30 days
  alertThresholds: {
    errorRate: 10, // 10%
    responseTime: 30000, // 30 seconds
    failureCount: 5, // 5 failures
  },
};

/**
 * Configuration loader and validator
 */
export class ValidationConfigLoader {
  private static instance: ValidationConfigLoader;
  private config: ValidationSystemConfig | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ValidationConfigLoader {
    if (!ValidationConfigLoader.instance) {
      ValidationConfigLoader.instance = new ValidationConfigLoader();
    }
    return ValidationConfigLoader.instance;
  }

  /**
   * Load configuration from environment variables
   */
  loadConfig(): ValidationSystemConfig {
    if (this.config) {
      return this.config;
    }

    const environment = this.getEnvironment();
    
    this.config = {
      validation: this.loadValidationConfig(environment),
      platforms: this.loadPlatformConfigs(),
      monitoring: this.loadMonitoringConfig(),
    };

    this.validateConfig(this.config);
    return this.config;
  }

  /**
   * Get current configuration (load if not already loaded)
   */
  getConfig(): ValidationSystemConfig {
    return this.config || this.loadConfig();
  }

  /**
   * Reload configuration from environment
   */
  reloadConfig(): ValidationSystemConfig {
    this.config = null;
    return this.loadConfig();
  }

  /**
   * Update configuration programmatically
   */
  updateConfig(updates: Partial<ValidationSystemConfig>): ValidationSystemConfig {
    const currentConfig = this.getConfig();
    this.config = {
      ...currentConfig,
      ...updates,
      validation: { ...currentConfig.validation, ...updates.validation },
      platforms: { ...currentConfig.platforms, ...updates.platforms },
      monitoring: { ...currentConfig.monitoring, ...updates.monitoring },
    };
    
    this.validateConfig(this.config);
    return this.config;
  }

  /**
   * Get platform-specific configuration
   */
  getPlatformConfig(platform: Platform): PlatformConfig {
    const config = this.getConfig();
    return config.platforms[platform];
  }

  /**
   * Check if platform is enabled
   */
  isPlatformEnabled(platform: Platform): boolean {
    return this.getPlatformConfig(platform).enabled;
  }

  /**
   * Get environment from NODE_ENV
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    const env = process.env.NODE_ENV?.toLowerCase();
    
    switch (env) {
      case 'production':
        return 'production';
      case 'staging':
        return 'staging';
      default:
        return 'development';
    }
  }

  /**
   * Load validation configuration from environment
   */
  private loadValidationConfig(environment: string): ValidationEnvironmentConfig {
    return {
      ...DEFAULT_VALIDATION_CONFIG,
      environment: environment as any,
      enableCaching: this.getBooleanEnv('VALIDATION_ENABLE_CACHING', DEFAULT_VALIDATION_CONFIG.enableCaching),
      cacheTimeout: this.getNumberEnv('VALIDATION_CACHE_TIMEOUT', DEFAULT_VALIDATION_CONFIG.cacheTimeout),
      maxConcurrentValidations: this.getNumberEnv('VALIDATION_MAX_CONCURRENT', DEFAULT_VALIDATION_CONFIG.maxConcurrentValidations),
      timeout: this.getNumberEnv('VALIDATION_TIMEOUT', DEFAULT_VALIDATION_CONFIG.timeout),
      logLevel: this.getStringEnv('VALIDATION_LOG_LEVEL', DEFAULT_VALIDATION_CONFIG.logLevel) as any,
      enableMetrics: this.getBooleanEnv('VALIDATION_ENABLE_METRICS', DEFAULT_VALIDATION_CONFIG.enableMetrics),
      enableAlerts: this.getBooleanEnv('VALIDATION_ENABLE_ALERTS', environment === 'production'),
    };
  }

  /**
   * Load platform configurations from environment
   */
  private loadPlatformConfigs(): Record<Platform, PlatformConfig> {
    const configs: Record<Platform, PlatformConfig> = {} as Record<Platform, PlatformConfig>;

    for (const platform of ['tiktok', 'instagram', 'reddit'] as Platform[]) {
      const defaultConfig = DEFAULT_PLATFORM_CONFIGS[platform];
      const envPrefix = platform.toUpperCase();

      configs[platform] = {
        enabled: this.getBooleanEnv(`${envPrefix}_VALIDATION_ENABLED`, defaultConfig.enabled),
        timeout: this.getNumberEnv(`${envPrefix}_VALIDATION_TIMEOUT`, defaultConfig.timeout),
        maxRetries: this.getNumberEnv(`${envPrefix}_VALIDATION_MAX_RETRIES`, defaultConfig.maxRetries),
        retryDelay: this.getNumberEnv(`${envPrefix}_VALIDATION_RETRY_DELAY`, defaultConfig.retryDelay),
        sandboxMode: this.getBooleanEnv(`${envPrefix}_SANDBOX_MODE`, defaultConfig.sandboxMode),
      };
    }

    return configs;
  }

  /**
   * Load monitoring configuration from environment
   */
  private loadMonitoringConfig() {
    return {
      metricsRetention: this.getNumberEnv('VALIDATION_METRICS_RETENTION_DAYS', DEFAULT_MONITORING_CONFIG.metricsRetention),
      alertThresholds: {
        errorRate: this.getNumberEnv('VALIDATION_ALERT_ERROR_RATE', DEFAULT_MONITORING_CONFIG.alertThresholds.errorRate),
        responseTime: this.getNumberEnv('VALIDATION_ALERT_RESPONSE_TIME', DEFAULT_MONITORING_CONFIG.alertThresholds.responseTime),
        failureCount: this.getNumberEnv('VALIDATION_ALERT_FAILURE_COUNT', DEFAULT_MONITORING_CONFIG.alertThresholds.failureCount),
      },
    };
  }

  /**
   * Validate configuration values
   */
  private validateConfig(config: ValidationSystemConfig): void {
    const errors: string[] = [];

    // Validate validation config
    if (config.validation.cacheTimeout < 0) {
      errors.push('Cache timeout must be non-negative');
    }

    if (config.validation.maxConcurrentValidations < 1) {
      errors.push('Max concurrent validations must be at least 1');
    }

    if (config.validation.timeout < 1000) {
      errors.push('Validation timeout must be at least 1000ms');
    }

    // Validate platform configs
    for (const [platform, platformConfig] of Object.entries(config.platforms)) {
      if (platformConfig.timeout < 1000) {
        errors.push(`${platform} timeout must be at least 1000ms`);
      }

      if (platformConfig.maxRetries < 0) {
        errors.push(`${platform} max retries must be non-negative`);
      }

      if (platformConfig.retryDelay < 0) {
        errors.push(`${platform} retry delay must be non-negative`);
      }
    }

    // Validate monitoring config
    if (config.monitoring.metricsRetention < 1) {
      errors.push('Metrics retention must be at least 1 day');
    }

    if (config.monitoring.alertThresholds.errorRate < 0 || config.monitoring.alertThresholds.errorRate > 100) {
      errors.push('Error rate threshold must be between 0 and 100');
    }

    if (errors.length > 0) {
      throw new ValidationException(
        `Configuration validation failed: ${errors.join(', ')}`,
        'INVALID_CONFIGURATION'
      );
    }
  }

  /**
   * Get boolean environment variable
   */
  private getBooleanEnv(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get number environment variable
   */
  private getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get string environment variable
   */
  private getStringEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
}

/**
 * Convenience functions for accessing configuration
 */
export const getValidationConfig = (): ValidationSystemConfig => {
  return ValidationConfigLoader.getInstance().getConfig();
};

export const getPlatformConfig = (platform: Platform): PlatformConfig => {
  return ValidationConfigLoader.getInstance().getPlatformConfig(platform);
};

export const isPlatformEnabled = (platform: Platform): boolean => {
  return ValidationConfigLoader.getInstance().isPlatformEnabled(platform);
};

export const reloadValidationConfig = (): ValidationSystemConfig => {
  return ValidationConfigLoader.getInstance().reloadConfig();
};

/**
 * Environment variable documentation
 */
export const ENV_VARS_DOCUMENTATION = {
  // General validation settings
  VALIDATION_ENABLE_CACHING: 'Enable validation result caching (true/false)',
  VALIDATION_CACHE_TIMEOUT: 'Cache timeout in milliseconds (default: 300000)',
  VALIDATION_MAX_CONCURRENT: 'Maximum concurrent validations (default: 5)',
  VALIDATION_TIMEOUT: 'Validation timeout in milliseconds (default: 30000)',
  VALIDATION_LOG_LEVEL: 'Log level (debug/info/warn/error)',
  VALIDATION_ENABLE_METRICS: 'Enable metrics collection (true/false)',
  VALIDATION_ENABLE_ALERTS: 'Enable alerting (true/false)',

  // Platform-specific settings
  TIKTOK_VALIDATION_ENABLED: 'Enable TikTok validation (true/false)',
  TIKTOK_VALIDATION_TIMEOUT: 'TikTok validation timeout in milliseconds',
  TIKTOK_VALIDATION_MAX_RETRIES: 'Maximum retries for TikTok validation',
  TIKTOK_VALIDATION_RETRY_DELAY: 'Retry delay for TikTok validation in milliseconds',
  TIKTOK_SANDBOX_MODE: 'Use TikTok sandbox mode (true/false)',

  INSTAGRAM_VALIDATION_ENABLED: 'Enable Instagram validation (true/false)',
  INSTAGRAM_VALIDATION_TIMEOUT: 'Instagram validation timeout in milliseconds',
  INSTAGRAM_VALIDATION_MAX_RETRIES: 'Maximum retries for Instagram validation',
  INSTAGRAM_VALIDATION_RETRY_DELAY: 'Retry delay for Instagram validation in milliseconds',
  INSTAGRAM_SANDBOX_MODE: 'Use Instagram sandbox mode (true/false)',

  REDDIT_VALIDATION_ENABLED: 'Enable Reddit validation (true/false)',
  REDDIT_VALIDATION_TIMEOUT: 'Reddit validation timeout in milliseconds',
  REDDIT_VALIDATION_MAX_RETRIES: 'Maximum retries for Reddit validation',
  REDDIT_VALIDATION_RETRY_DELAY: 'Retry delay for Reddit validation in milliseconds',
  REDDIT_SANDBOX_MODE: 'Use Reddit sandbox mode (true/false)',

  // Monitoring settings
  VALIDATION_METRICS_RETENTION_DAYS: 'Metrics retention in days (default: 30)',
  VALIDATION_ALERT_ERROR_RATE: 'Error rate threshold for alerts (percentage)',
  VALIDATION_ALERT_RESPONSE_TIME: 'Response time threshold for alerts (milliseconds)',
  VALIDATION_ALERT_FAILURE_COUNT: 'Failure count threshold for alerts',
};