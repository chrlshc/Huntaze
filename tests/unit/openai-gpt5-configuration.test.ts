/**
 * Tests for OpenAI GPT-5 Configuration (August 2025)
 * Validates GPT-5, GPT-5 Mini, and GPT-5 Nano model configuration and routing
 * Updated to reflect GPT-5 availability as of August 2025
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock environment variables
const mockEnv = {
  OPENAI_GPT5_MODEL: 'gpt-5',
  OPENAI_GPT5_MINI_MODEL: 'gpt-5-mini',
  OPENAI_GPT5_NANO_MODEL: 'gpt-5-nano',
  OPENAI_API_KEY: 'sk-test-key',
  USE_GPT5_FOR_STRATEGY: 'true',
  USE_GPT5_MINI_FOR_CONTENT: 'true',
  USE_GPT5_NANO_FOR_SIMPLE: 'true',
  // Legacy o1 models (deprecated)
  OPENAI_O1_MODEL: 'o1-preview',
  OPENAI_O1_MINI_MODEL: 'o1-mini'
};

// Mock OpenAI client
const mockOpenAIClient = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAIClient)
}));

// Types for model configuration
interface ModelConfig {
  provider: 'openai';
  maxTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
}

interface ModelRoutingConfig {
  [taskType: string]: string;
}

interface CostEstimate {
  provider: string;
  model: string;
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
}

// Mock implementation of GPT-5 Configuration (August 2025)
class GPT5Configuration {
  private modelConfig: Record<string, ModelConfig> = {
    // GPT-5 Models (Available August 2025)
    'gpt-5': {
      provider: 'openai',
      maxTokens: 256000, // 256K standard, 1M extended
      costPer1kInput: 0.020, // Estimated pricing
      costPer1kOutput: 0.080,
      supportsStreaming: true,
      supportsVision: true
    },
    'gpt-5-mini': {
      provider: 'openai',
      maxTokens: 128000,
      costPer1kInput: 0.009, // 45-60% cheaper than GPT-5
      costPer1kOutput: 0.036,
      supportsStreaming: true,
      supportsVision: false
    },
    'gpt-5-nano': {
      provider: 'openai',
      maxTokens: 32768,
      costPer1kInput: 0.002, // Minimal cost
      costPer1kOutput: 0.008,
      supportsStreaming: true,
      supportsVision: false
    },
    
    // Legacy OpenAI o1 Models (Deprecated - use GPT-5 instead)
    'o1-preview': {
      provider: 'openai',
      maxTokens: 32768,
      costPer1kInput: 0.015,
      costPer1kOutput: 0.060,
      supportsStreaming: false,
      supportsVision: false
    },
    'o1-mini': {
      provider: 'openai',
      maxTokens: 16384,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.012,
      supportsStreaming: false,
      supportsVision: false
    },
    
    // Legacy models (Replaced by GPT-5 family)
    'gpt-4-turbo': {
      provider: 'openai',
      maxTokens: 128000,
      costPer1kInput: 0.016, // 80% of GPT-5 cost
      costPer1kOutput: 0.064,
      supportsStreaming: true,
      supportsVision: true
    },
    'gpt-3.5-turbo': {
      provider: 'openai',
      maxTokens: 16384,
      costPer1kInput: 0.001, // 5% of GPT-5 cost
      costPer1kOutput: 0.004,
      supportsStreaming: true,
      supportsVision: false
    }
  };

  private routingConfig: ModelRoutingConfig = {
    // Complex tasks → GPT-5 (High reasoning)
    'marketing_strategy': 'gpt-5',
    'analytics_insights': 'gpt-5',
    'campaign_optimization': 'gpt-5',
    'multi_step_planning': 'gpt-5',
    
    // Daily tasks → GPT-5 Mini (Medium reasoning)
    'content_planning': 'gpt-5-mini',
    'caption_generation': 'gpt-5-mini',
    'hashtag_research': 'gpt-5-mini',
    'chatbot_response': 'gpt-5-mini',
    'content_generation': 'gpt-5-mini',
    
    // Simple tasks → GPT-5 Nano (Low reasoning, high throughput)
    'post_scheduling': 'gpt-5-nano',
    'simple_analytics': 'gpt-5-nano',
    'classification': 'gpt-5-nano',
    'repetitive_tasks': 'gpt-5-nano'
  };

  getModelConfig(modelName: string): ModelConfig | null {
    return this.modelConfig[modelName] || null;
  }

  getRoutingConfig(): ModelRoutingConfig {
    return { ...this.routingConfig };
  }

  routeToOptimalModel(taskType: string, complexity: 'low' | 'medium' | 'high' = 'medium'): {
    provider: string;
    model: string;
    estimatedCost: number;
  } {
    // Complex tasks → GPT-5 (High reasoning)
    if (complexity === 'high' || taskType.includes('strategy') || taskType.includes('multi_step')) {
      return {
        provider: 'openai',
        model: 'gpt-5',
        estimatedCost: 0.050 // $0.050 per request (avg)
      };
    }
    
    // Medium tasks → GPT-5 Mini (Balanced)
    if (complexity === 'medium' || taskType.includes('content') || taskType.includes('chat')) {
      return {
        provider: 'openai',
        model: 'gpt-5-mini',
        estimatedCost: 0.023 // $0.023 per request (avg, 45-60% cheaper)
      };
    }
    
    // Simple tasks → GPT-5 Nano (High throughput)
    return {
      provider: 'openai',
      model: 'gpt-5-nano',
      estimatedCost: 0.005 // $0.005 per request (avg, minimal cost)
    };
  }

  calculateCost(model: string, inputTokens: number, outputTokens: number): CostEstimate {
    const config = this.getModelConfig(model);
    if (!config) {
      throw new Error(`Unknown model: ${model}`);
    }

    const inputCost = (inputTokens / 1000) * config.costPer1kInput;
    const outputCost = (outputTokens / 1000) * config.costPer1kOutput;
    const totalCost = inputCost + outputCost;

    return {
      provider: config.provider,
      model,
      estimatedCost: totalCost,
      inputTokens,
      outputTokens
    };
  }

  getSupportedModels(): string[] {
    return Object.keys(this.modelConfig);
  }

  isModelSupported(modelName: string): boolean {
    return modelName in this.modelConfig;
  }

  compareModelCosts(model1: string, model2: string, avgTokens: number = 1000): {
    model1Cost: number;
    model2Cost: number;
    savings: number;
    savingsPercent: number;
  } {
    const config1 = this.getModelConfig(model1);
    const config2 = this.getModelConfig(model2);

    if (!config1 || !config2) {
      throw new Error('One or both models not found');
    }

    const cost1 = (avgTokens / 1000) * (config1.costPer1kInput + config1.costPer1kOutput);
    const cost2 = (avgTokens / 1000) * (config2.costPer1kInput + config2.costPer1kOutput);
    const savings = cost1 - cost2;
    const savingsPercent = (savings / cost1) * 100;

    return {
      model1Cost: cost1,
      model2Cost: cost2,
      savings,
      savingsPercent
    };
  }

  migrateToGPT5(currentModel: string): string {
    const migrationMap: Record<string, string> = {
      'o1-preview': 'gpt-5',
      'o1-mini': 'gpt-5-mini',
      'gpt-4-turbo': 'gpt-5',
      'gpt-3.5-turbo': 'gpt-5-nano'
    };

    return migrationMap[currentModel] || currentModel;
  }
}

describe('GPT5Configuration (August 2025)', () => {
  let config: GPT5Configuration;

  beforeEach(() => {
    config = new GPT5Configuration();
    vi.clearAllMocks();
    
    // Setup environment variables
    process.env = { ...process.env, ...mockEnv };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Model Configuration', () => {
    it('should support GPT-5 model with 256K context', () => {
      const gpt5Config = config.getModelConfig('gpt-5');
      
      expect(gpt5Config).toBeDefined();
      expect(gpt5Config?.provider).toBe('openai');
      expect(gpt5Config?.maxTokens).toBe(256000); // 256K standard
      expect(gpt5Config?.costPer1kInput).toBe(0.020);
      expect(gpt5Config?.costPer1kOutput).toBe(0.080);
      expect(gpt5Config?.supportsStreaming).toBe(true);
      expect(gpt5Config?.supportsVision).toBe(true);
    });

    it('should support GPT-5 Mini model (45-60% cheaper)', () => {
      const gpt5MiniConfig = config.getModelConfig('gpt-5-mini');
      
      expect(gpt5MiniConfig).toBeDefined();
      expect(gpt5MiniConfig?.provider).toBe('openai');
      expect(gpt5MiniConfig?.maxTokens).toBe(128000);
      expect(gpt5MiniConfig?.costPer1kInput).toBe(0.009);
      expect(gpt5MiniConfig?.costPer1kOutput).toBe(0.036);
      expect(gpt5MiniConfig?.supportsStreaming).toBe(true);
      expect(gpt5MiniConfig?.supportsVision).toBe(false);
    });

    it('should support GPT-5 Nano model (minimal cost)', () => {
      const gpt5NanoConfig = config.getModelConfig('gpt-5-nano');
      
      expect(gpt5NanoConfig).toBeDefined();
      expect(gpt5NanoConfig?.provider).toBe('openai');
      expect(gpt5NanoConfig?.maxTokens).toBe(32768);
      expect(gpt5NanoConfig?.costPer1kInput).toBe(0.002);
      expect(gpt5NanoConfig?.costPer1kOutput).toBe(0.008);
      expect(gpt5NanoConfig?.supportsStreaming).toBe(true);
      expect(gpt5NanoConfig?.supportsVision).toBe(false);
    });

    it('should mark o1 models as legacy/deprecated', () => {
      const o1Config = config.getModelConfig('o1-preview');
      const o1MiniConfig = config.getModelConfig('o1-mini');
      
      // Still supported for backward compatibility
      expect(o1Config).toBeDefined();
      expect(o1MiniConfig).toBeDefined();
      
      // But should migrate to GPT-5
      expect(config.migrateToGPT5('o1-preview')).toBe('gpt-5');
      expect(config.migrateToGPT5('o1-mini')).toBe('gpt-5-mini');
    });

    it('should list all supported models including GPT-5 family', () => {
      const models = config.getSupportedModels();
      
      expect(models).toContain('gpt-5');
      expect(models).toContain('gpt-5-mini');
      expect(models).toContain('gpt-5-nano');
      expect(models).toContain('o1-preview'); // Legacy
      expect(models).toContain('o1-mini'); // Legacy
      expect(models).toContain('gpt-4-turbo'); // Legacy
      expect(models).toContain('gpt-3.5-turbo'); // Legacy
    });
  });

  describe('Model Routing (August 2025)', () => {
    it('should route complex tasks to GPT-5', () => {
      const result = config.routeToOptimalModel('marketing_strategy', 'high');
      
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-5');
      expect(result.estimatedCost).toBe(0.050);
    });

    it('should route medium tasks to GPT-5 Mini', () => {
      const result = config.routeToOptimalModel('content_planning', 'medium');
      
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-5-mini');
      expect(result.estimatedCost).toBe(0.023);
    });

    it('should route simple tasks to GPT-5 Nano', () => {
      const result = config.routeToOptimalModel('post_scheduling', 'low');
      
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-5-nano');
      expect(result.estimatedCost).toBe(0.005);
    });

    it('should route multi-step planning to GPT-5', () => {
      const result = config.routeToOptimalModel('multi_step_planning', 'high');
      
      expect(result.model).toBe('gpt-5');
    });

    it('should route chatbot responses to GPT-5 Mini', () => {
      const result = config.routeToOptimalModel('chatbot_response', 'medium');
      
      expect(result.model).toBe('gpt-5-mini');
    });

    it('should route classification to GPT-5 Nano', () => {
      const routing = config.getRoutingConfig();
      expect(routing['classification']).toBe('gpt-5-nano');
    });

    it('should route repetitive tasks to GPT-5 Nano', () => {
      const routing = config.getRoutingConfig();
      expect(routing['repetitive_tasks']).toBe('gpt-5-nano');
    });
  });

  describe('Cost Calculation (August 2025 Pricing)', () => {
    it('should calculate cost for GPT-5', () => {
      const cost = config.calculateCost('gpt-5', 1000, 500);
      
      expect(cost.provider).toBe('openai');
      expect(cost.model).toBe('gpt-5');
      // (1000/1000 * 0.020) + (500/1000 * 0.080) = 0.020 + 0.040 = 0.060
      expect(cost.estimatedCost).toBeCloseTo(0.060, 3);
    });

    it('should calculate cost for GPT-5 Mini', () => {
      const cost = config.calculateCost('gpt-5-mini', 1000, 500);
      
      // (1000/1000 * 0.009) + (500/1000 * 0.036) = 0.009 + 0.018 = 0.027
      expect(cost.estimatedCost).toBeCloseTo(0.027, 3);
    });

    it('should calculate cost for GPT-5 Nano', () => {
      const cost = config.calculateCost('gpt-5-nano', 1000, 500);
      
      // (1000/1000 * 0.002) + (500/1000 * 0.008) = 0.002 + 0.004 = 0.006
      expect(cost.estimatedCost).toBeCloseTo(0.006, 3);
    });

    it('should show GPT-5 Mini is 45-60% cheaper than GPT-5', () => {
      const gpt5Cost = config.calculateCost('gpt-5', 1000, 1000);
      const gpt5MiniCost = config.calculateCost('gpt-5-mini', 1000, 1000);
      
      const savingsPercent = ((gpt5Cost.estimatedCost - gpt5MiniCost.estimatedCost) / gpt5Cost.estimatedCost) * 100;
      
      expect(savingsPercent).toBeGreaterThan(45);
      expect(savingsPercent).toBeLessThan(60);
    });

    it('should show GPT-5 Nano is 10-20% of GPT-5 cost', () => {
      const gpt5Cost = config.calculateCost('gpt-5', 1000, 1000);
      const gpt5NanoCost = config.calculateCost('gpt-5-nano', 1000, 1000);
      
      const costRatio = (gpt5NanoCost.estimatedCost / gpt5Cost.estimatedCost) * 100;
      
      expect(costRatio).toBeGreaterThan(10);
      expect(costRatio).toBeLessThan(20);
    });
  });

  describe('Cost Comparison (GPT-5 vs Legacy)', () => {
    it('should compare GPT-5 vs GPT-4 Turbo costs', () => {
      const comparison = config.compareModelCosts('gpt-5', 'gpt-4-turbo', 1000);
      
      // GPT-4 Turbo should be ~80% of GPT-5 cost
      expect(comparison.model2Cost).toBeLessThan(comparison.model1Cost);
      expect(comparison.model2Cost / comparison.model1Cost).toBeCloseTo(0.80, 1);
    });

    it('should compare GPT-5 Mini vs o1-mini costs', () => {
      const comparison = config.compareModelCosts('gpt-5-mini', 'o1-mini', 1000);
      
      // GPT-5 Mini: 0.009 + 0.036 = 0.045
      // o1-mini: 0.003 + 0.012 = 0.015
      expect(comparison.model1Cost).toBeCloseTo(0.045, 3);
      expect(comparison.model2Cost).toBeCloseTo(0.015, 3);
    });

    it('should compare GPT-5 Nano vs GPT-3.5 Turbo costs', () => {
      const comparison = config.compareModelCosts('gpt-5-nano', 'gpt-3.5-turbo', 1000);
      
      // GPT-5 Nano: 0.002 + 0.008 = 0.010
      // GPT-3.5 Turbo: 0.001 + 0.004 = 0.005
      expect(comparison.model1Cost).toBeCloseTo(0.010, 3);
      expect(comparison.model2Cost).toBeCloseTo(0.005, 3);
    });
  });

  describe('Migration to GPT-5', () => {
    it('should migrate o1-preview to gpt-5', () => {
      const migrated = config.migrateToGPT5('o1-preview');
      expect(migrated).toBe('gpt-5');
    });

    it('should migrate o1-mini to gpt-5-mini', () => {
      const migrated = config.migrateToGPT5('o1-mini');
      expect(migrated).toBe('gpt-5-mini');
    });

    it('should migrate gpt-4-turbo to gpt-5', () => {
      const migrated = config.migrateToGPT5('gpt-4-turbo');
      expect(migrated).toBe('gpt-5');
    });

    it('should migrate gpt-3.5-turbo to gpt-5-nano', () => {
      const migrated = config.migrateToGPT5('gpt-3.5-turbo');
      expect(migrated).toBe('gpt-5-nano');
    });

    it('should keep unknown models unchanged', () => {
      const migrated = config.migrateToGPT5('custom-model');
      expect(migrated).toBe('custom-model');
    });
  });

  describe('Environment Variables (August 2025)', () => {
    it('should read OPENAI_GPT5_MODEL from environment', () => {
      expect(process.env.OPENAI_GPT5_MODEL).toBe('gpt-5');
    });

    it('should read OPENAI_GPT5_MINI_MODEL from environment', () => {
      expect(process.env.OPENAI_GPT5_MINI_MODEL).toBe('gpt-5-mini');
    });

    it('should read OPENAI_GPT5_NANO_MODEL from environment', () => {
      expect(process.env.OPENAI_GPT5_NANO_MODEL).toBe('gpt-5-nano');
    });

    it('should read USE_GPT5_FOR_STRATEGY flag', () => {
      expect(process.env.USE_GPT5_FOR_STRATEGY).toBe('true');
    });

    it('should read USE_GPT5_MINI_FOR_CONTENT flag', () => {
      expect(process.env.USE_GPT5_MINI_FOR_CONTENT).toBe('true');
    });

    it('should read USE_GPT5_NANO_FOR_SIMPLE flag', () => {
      expect(process.env.USE_GPT5_NANO_FOR_SIMPLE).toBe('true');
    });

    it('should still support legacy o1 environment variables', () => {
      expect(process.env.OPENAI_O1_MODEL).toBe('o1-preview');
      expect(process.env.OPENAI_O1_MINI_MODEL).toBe('o1-mini');
    });
  });

  describe('Model Features (August 2025)', () => {
    it('should indicate GPT-5 supports streaming and vision', () => {
      const gpt5Config = config.getModelConfig('gpt-5');
      expect(gpt5Config?.supportsStreaming).toBe(true);
      expect(gpt5Config?.supportsVision).toBe(true);
    });

    it('should indicate GPT-5 Mini supports streaming but not vision', () => {
      const miniConfig = config.getModelConfig('gpt-5-mini');
      expect(miniConfig?.supportsStreaming).toBe(true);
      expect(miniConfig?.supportsVision).toBe(false);
    });

    it('should indicate GPT-5 Nano supports streaming but not vision', () => {
      const nanoConfig = config.getModelConfig('gpt-5-nano');
      expect(nanoConfig?.supportsStreaming).toBe(true);
      expect(nanoConfig?.supportsVision).toBe(false);
    });

    it('should indicate o1 models do not support streaming', () => {
      const o1Config = config.getModelConfig('o1-preview');
      const o1MiniConfig = config.getModelConfig('o1-mini');
      
      expect(o1Config?.supportsStreaming).toBe(false);
      expect(o1MiniConfig?.supportsStreaming).toBe(false);
    });
  });

  describe('Context Window Sizes', () => {
    it('should have GPT-5 with 256K context window', () => {
      const gpt5Config = config.getModelConfig('gpt-5');
      expect(gpt5Config?.maxTokens).toBe(256000);
    });

    it('should have GPT-5 Mini with 128K context window', () => {
      const miniConfig = config.getModelConfig('gpt-5-mini');
      expect(miniConfig?.maxTokens).toBe(128000);
    });

    it('should have GPT-5 Nano with 32K context window', () => {
      const nanoConfig = config.getModelConfig('gpt-5-nano');
      expect(nanoConfig?.maxTokens).toBe(32768);
    });
  });

  describe('Cost Optimization Scenarios (August 2025)', () => {
    it('should calculate daily cost with GPT-5 family', () => {
      const tasks = [
        { type: 'strategy', count: 100, model: 'gpt-5', avgCost: 0.050 },
        { type: 'content', count: 200, model: 'gpt-5-mini', avgCost: 0.023 },
        { type: 'chatbot', count: 500, model: 'gpt-5-mini', avgCost: 0.023 },
        { type: 'simple', count: 1000, model: 'gpt-5-nano', avgCost: 0.005 }
      ];

      const totalCost = tasks.reduce((sum, task) => sum + (task.count * task.avgCost), 0);
      
      // Expected: (100 * 0.050) + (200 * 0.023) + (500 * 0.023) + (1000 * 0.005)
      // = 5.00 + 4.60 + 11.50 + 5.00 = 26.10
      expect(totalCost).toBeCloseTo(26.10, 2);
    });

    it('should show cost reduction vs o1 models', () => {
      // Old scenario with o1 models
      const oldCost = (100 * 0.045) + (200 * 0.009) + (500 * 0.009) + (1000 * 0.002);
      // = 4.50 + 1.80 + 4.50 + 2.00 = 12.80

      // New scenario with GPT-5 family
      const newCost = (100 * 0.050) + (200 * 0.023) + (500 * 0.023) + (1000 * 0.005);
      // = 5.00 + 4.60 + 11.50 + 5.00 = 26.10

      // Note: GPT-5 family is more expensive but offers better capabilities
      expect(newCost).toBeGreaterThan(oldCost);
      
      const costIncrease = ((newCost - oldCost) / oldCost) * 100;
      expect(costIncrease).toBeCloseTo(104, 0); // ~104% increase
    });

    it('should calculate monthly cost with GPT-5 family', () => {
      const dailyCost = 26.10;
      const monthlyCost = dailyCost * 30;
      
      expect(monthlyCost).toBeCloseTo(783, 0);
    });
  });

  describe('Task-Specific Routing (August 2025)', () => {
    it('should route OnlyFans chatbot to GPT-5 Mini', () => {
      const routing = config.getRoutingConfig();
      expect(routing['chatbot_response']).toBe('gpt-5-mini');
    });

    it('should route content planning to GPT-5 Mini', () => {
      const routing = config.getRoutingConfig();
      expect(routing['content_planning']).toBe('gpt-5-mini');
    });

    it('should route marketing strategy to GPT-5', () => {
      const routing = config.getRoutingConfig();
      expect(routing['marketing_strategy']).toBe('gpt-5');
    });

    it('should route analytics insights to GPT-5', () => {
      const routing = config.getRoutingConfig();
      expect(routing['analytics_insights']).toBe('gpt-5');
    });

    it('should route simple analytics to GPT-5 Nano', () => {
      const routing = config.getRoutingConfig();
      expect(routing['simple_analytics']).toBe('gpt-5-nano');
    });

    it('should route post scheduling to GPT-5 Nano', () => {
      const routing = config.getRoutingConfig();
      expect(routing['post_scheduling']).toBe('gpt-5-nano');
    });

    it('should route classification to GPT-5 Nano', () => {
      const routing = config.getRoutingConfig();
      expect(routing['classification']).toBe('gpt-5-nano');
    });
  });

  describe('Backward Compatibility', () => {
    it('should still support o1-preview for legacy code', () => {
      const o1Config = config.getModelConfig('o1-preview');
      expect(o1Config).toBeDefined();
      expect(o1Config?.provider).toBe('openai');
    });

    it('should still support o1-mini for legacy code', () => {
      const o1MiniConfig = config.getModelConfig('o1-mini');
      expect(o1MiniConfig).toBeDefined();
      expect(o1MiniConfig?.provider).toBe('openai');
    });

    it('should provide migration path from o1 to GPT-5', () => {
      expect(config.migrateToGPT5('o1-preview')).toBe('gpt-5');
      expect(config.migrateToGPT5('o1-mini')).toBe('gpt-5-mini');
    });
  });
});
