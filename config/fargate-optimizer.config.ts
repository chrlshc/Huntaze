/**
 * Configuration pour le Fargate Cost Optimizer
 * Gère les paramètres par environnement et les secrets
 */

export interface FargateOptimizerConfig {
  aws: {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  api: {
    timeout: number;
    retryConfig: {
      maxRetries: number;
      baseDelay: number;
      maxDelay: number;
      backoffMultiplier: number;
    };
  };
  cache: {
    type: 'memory' | 'redis';
    redis?: {
      host: string;
      port: number;
      password?: string;
      db: number;
    };
    ttl: {
      optimization: number;
      metrics: number;
      graviton: number;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    outputs: Array<'console' | 'file' | 'cloudwatch'>;
  };
  monitoring: {
    enabled: boolean;
    metricsNamespace: string;
    customMetrics: boolean;
  };
  optimization: {
    defaultTaskDefinitions: string[];
    concurrency: number;
    pricing: {
      region: string;
      cpu: {
        onDemand: number;
        spot: number;
      };
      memory: {
        onDemand: number;
        spot: number;
      };
    };
  };
}

// Configuration par défaut
const defaultConfig: FargateOptimizerConfig = {
  aws: {
    region: 'eu-west-1'
  },
  api: {
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }
  },
  cache: {
    type: 'memory',
    ttl: {
      optimization: 3600, // 1 hour
      metrics: 300,       // 5 minutes
      graviton: 3600      // 1 hour
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    outputs: ['console']
  },
  monitoring: {
    enabled: true,
    metricsNamespace: 'Huntaze/FargateOptimizer',
    customMetrics: true
  },
  optimization: {
    defaultTaskDefinitions: [
      'huntaze-browser-worker',
      'huntaze-ai-processor',
      'huntaze-content-generator'
    ],
    concurrency: 3,
    pricing: {
      region: 'eu-west-1',
      cpu: {
        onDemand: 0.04048,
        spot: 0.01419
      },
      memory: {
        onDemand: 0.004445,
        spot: 0.001556
      }
    }
  }
};

// Configuration pour le développement
const developmentConfig: Partial<FargateOptimizerConfig> = {
  aws: {
    region: 'eu-west-1'
  },
  api: {
    timeout: 10000,
    retryConfig: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2
    }
  },
  cache: {
    type: 'memory',
    ttl: {
      optimization: 300, // 5 minutes for faster development
      metrics: 60,       // 1 minute
      graviton: 300      // 5 minutes
    }
  },
  logging: {
    level: 'debug',
    format: 'text',
    outputs: ['console']
  },
  monitoring: {
    enabled: false, // Disable monitoring in development
    metricsNamespace: 'Huntaze/FargateOptimizer/Dev',
    customMetrics: false
  },
  optimization: {
    concurrency: 2, // Lower concurrency for development
    defaultTaskDefinitions: [
      'huntaze-browser-worker-dev',
      'huntaze-ai-processor-dev'
    ],
    pricing: {
      region: 'eu-west-1',
      cpu: {
        onDemand: 0.04048,
        spot: 0.01419
      },
      memory: {
        onDemand: 0.004445,
        spot: 0.001556
      }
    }
  }
};

// Configuration pour les tests
const testConfig: Partial<FargateOptimizerConfig> = {
  aws: {
    region: 'us-east-1' // Use different region for tests
  },
  api: {
    timeout: 5000,
    retryConfig: {
      maxRetries: 1,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2
    }
  },
  cache: {
    type: 'memory',
    ttl: {
      optimization: 60,
      metrics: 30,
      graviton: 60
    }
  },
  logging: {
    level: 'warn', // Reduce noise in tests
    format: 'text',
    outputs: ['console']
  },
  monitoring: {
    enabled: false,
    metricsNamespace: 'Huntaze/FargateOptimizer/Test',
    customMetrics: false
  },
  optimization: {
    defaultTaskDefinitions: ['test-task-1', 'test-task-2'],
    concurrency: 1,
    pricing: {
      region: 'us-east-1',
      cpu: {
        onDemand: 0.04048,
        spot: 0.01419
      },
      memory: {
        onDemand: 0.004445,
        spot: 0.001556
      }
    }
  }
};

// Configuration pour la production
const productionConfig: Partial<FargateOptimizerConfig> = {
  aws: {
    region: process.env.AWS_REGION || 'eu-west-1'
  },
  api: {
    timeout: 60000, // Longer timeout for production
    retryConfig: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2
    }
  },
  cache: {
    type: 'redis',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    },
    ttl: {
      optimization: 7200, // 2 hours
      metrics: 600,       // 10 minutes
      graviton: 7200      // 2 hours
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    outputs: ['console', 'cloudwatch']
  },
  monitoring: {
    enabled: true,
    metricsNamespace: 'Huntaze/FargateOptimizer/Prod',
    customMetrics: true
  },
  optimization: {
    concurrency: 5, // Higher concurrency for production
    defaultTaskDefinitions: [
      'huntaze-browser-worker-prod',
      'huntaze-ai-processor-prod',
      'huntaze-content-generator-prod'
    ],
    pricing: {
      region: process.env.AWS_REGION || 'eu-west-1',
      // Pricing will be loaded from AWS Pricing API or config
      cpu: {
        onDemand: parseFloat(process.env.FARGATE_CPU_ON_DEMAND_PRICE || '0.04048'),
        spot: parseFloat(process.env.FARGATE_CPU_SPOT_PRICE || '0.01419')
      },
      memory: {
        onDemand: parseFloat(process.env.FARGATE_MEMORY_ON_DEMAND_PRICE || '0.004445'),
        spot: parseFloat(process.env.FARGATE_MEMORY_SPOT_PRICE || '0.001556')
      }
    }
  }
};

// Factory pour créer la configuration
export class FargateOptimizerConfigFactory {
  /**
   * Crée la configuration basée sur l'environnement
   */
  static create(environment?: string): FargateOptimizerConfig {
    const env = environment || process.env.NODE_ENV || 'development';
    
    let envConfig: Partial<FargateOptimizerConfig>;
    
    switch (env) {
      case 'production':
        envConfig = productionConfig;
        break;
      case 'test':
        envConfig = testConfig;
        break;
      case 'development':
      default:
        envConfig = developmentConfig;
        break;
    }
    
    // Merge avec la configuration par défaut
    return this.mergeConfigs(defaultConfig, envConfig);
  }

  /**
   * Crée une configuration personnalisée
   */
  static createCustom(overrides: Partial<FargateOptimizerConfig>): FargateOptimizerConfig {
    return this.mergeConfigs(defaultConfig, overrides);
  }

  /**
   * Valide la configuration
   */
  static validate(config: FargateOptimizerConfig): void {
    // Validation de la région AWS
    if (!config.aws.region) {
      throw new Error('AWS region is required');
    }

    // Validation du cache Redis en production
    if (config.cache.type === 'redis' && !config.cache.redis?.host) {
      throw new Error('Redis host is required when using Redis cache');
    }

    // Validation des prix
    if (config.optimization.pricing.cpu.onDemand <= 0) {
      throw new Error('CPU on-demand price must be positive');
    }

    if (config.optimization.pricing.memory.onDemand <= 0) {
      throw new Error('Memory on-demand price must be positive');
    }

    // Validation de la concurrence
    if (config.optimization.concurrency < 1 || config.optimization.concurrency > 10) {
      throw new Error('Concurrency must be between 1 and 10');
    }

    // Validation des TTL
    if (config.cache.ttl.optimization < 60) {
      throw new Error('Optimization cache TTL must be at least 60 seconds');
    }
  }

  /**
   * Charge la configuration depuis les variables d'environnement
   */
  static fromEnvironment(): FargateOptimizerConfig {
    const config = this.create();
    
    // Override avec les variables d'environnement
    if (process.env.FARGATE_OPTIMIZER_LOG_LEVEL) {
      config.logging.level = process.env.FARGATE_OPTIMIZER_LOG_LEVEL as any;
    }
    
    if (process.env.FARGATE_OPTIMIZER_CACHE_TYPE) {
      config.cache.type = process.env.FARGATE_OPTIMIZER_CACHE_TYPE as any;
    }
    
    if (process.env.FARGATE_OPTIMIZER_CONCURRENCY) {
      config.optimization.concurrency = parseInt(process.env.FARGATE_OPTIMIZER_CONCURRENCY);
    }
    
    if (process.env.FARGATE_OPTIMIZER_TIMEOUT) {
      config.api.timeout = parseInt(process.env.FARGATE_OPTIMIZER_TIMEOUT);
    }

    this.validate(config);
    return config;
  }

  /**
   * Fusionne deux configurations
   */
  private static mergeConfigs(
    base: FargateOptimizerConfig,
    override: Partial<FargateOptimizerConfig>
  ): FargateOptimizerConfig {
    return {
      aws: { ...base.aws, ...override.aws },
      api: {
        ...base.api,
        ...override.api,
        retryConfig: {
          ...base.api.retryConfig,
          ...override.api?.retryConfig
        }
      },
      cache: {
        ...base.cache,
        ...override.cache,
        redis: base.cache.redis || override.cache?.redis ? { 
          ...base.cache.redis, 
          ...override.cache?.redis 
        } : undefined,
        ttl: { ...base.cache.ttl, ...override.cache?.ttl }
      },
      logging: { ...base.logging, ...override.logging },
      monitoring: { ...base.monitoring, ...override.monitoring },
      optimization: {
        ...base.optimization,
        ...override.optimization,
        pricing: {
          ...base.optimization.pricing,
          ...override.optimization?.pricing,
          cpu: {
            ...base.optimization.pricing.cpu,
            ...override.optimization?.pricing?.cpu
          },
          memory: {
            ...base.optimization.pricing.memory,
            ...override.optimization?.pricing?.memory
          }
        }
      }
    };
  }
}

// Export des configurations prêtes à l'emploi
export const configs = {
  development: () => FargateOptimizerConfigFactory.create('development'),
  test: () => FargateOptimizerConfigFactory.create('test'),
  production: () => FargateOptimizerConfigFactory.create('production'),
  fromEnv: () => FargateOptimizerConfigFactory.fromEnvironment()
};

// Helper pour créer des loggers configurés
export const createLogger = (config: FargateOptimizerConfig) => {
  const winston = require('winston');
  
  const transports = [];
  
  if (config.logging.outputs.includes('console')) {
    transports.push(new winston.transports.Console({
      format: config.logging.format === 'json' 
        ? winston.format.json()
        : winston.format.simple()
    }));
  }
  
  if (config.logging.outputs.includes('file')) {
    transports.push(new winston.transports.File({
      filename: 'fargate-optimizer.log',
      format: winston.format.json()
    }));
  }
  
  if (config.logging.outputs.includes('cloudwatch')) {
    // CloudWatch transport would be configured here
    // transports.push(new WinstonCloudWatch({ ... }));
  }
  
  return winston.createLogger({
    level: config.logging.level,
    transports
  });
};

// Helper pour créer des clients AWS configurés
export const createAWSClients = (config: FargateOptimizerConfig) => {
  const { CloudWatch } = require('@aws-sdk/client-cloudwatch');
  const { ECS } = require('@aws-sdk/client-ecs');
  
  const clientConfig = {
    region: config.aws.region,
    ...(config.aws.credentials && { credentials: config.aws.credentials })
  };
  
  return {
    cloudwatch: new CloudWatch(clientConfig),
    ecs: new ECS(clientConfig)
  };
};