/**
 * Huntaze AI Service - Unified AI Integration
 * 
 * High-level service for AI operations in the Huntaze app.
 * Wraps the router client with app-specific functionality.
 */

import { 
  getRouterClient, 
  RouterClient, 
  RouterResponse, 
  RouterError,
  RouterErrorCode 
} from './foundry/router-client';

import { 
  calculateCost, 
  calculateCostBreakdown, 
  convertRouterUsage,
  CostBreakdown 
} from './foundry/cost-calculator';

// =============================================================================
// Types
// =============================================================================

export type AITaskType = 'chat' | 'math' | 'coding' | 'creative';
export type ClientTier = 'standard' | 'vip';
export interface AIRequest {
  /** The prompt/message to send */
  prompt: string;
  /** Task type for routing optimization */
  type?: AITaskType;

  /** User tier (affects model selection) */
  tier?: ClientTier;
  /** System prompt to prepend */
  systemPrompt?: string;
}

export interface AIResult {
  /** The AI-generated response */
  content: string;
  /** Model that was used */
  model: string;
  /** Deployment name */
  deployment: string;
  /** Token usage */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  /** Cost breakdown */
  cost: CostBreakdown;
  /** Routing decision info */
  routing: {
    type: string;
    complexity: string;
    language: string;
  };
}

export interface AIServiceConfig {
  /** Default client tier */
  defaultTier?: ClientTier;
  /** Enable cost tracking */
  trackCosts?: boolean;
  /** Custom router URL (overrides env) */
  routerUrl?: string;
}

// =============================================================================
// AI Service Class
// =============================================================================

export class AIService {
  private client: RouterClient;
  private config: Required<AIServiceConfig>;
  private totalCost: number = 0;
  private requestCount: number = 0;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      defaultTier: config.defaultTier || 'standard',
      trackCosts: config.trackCosts ?? true,
      routerUrl: config.routerUrl || ''
    };

    this.client = this.config.routerUrl 
      ? new RouterClient(this.config.routerUrl)
      : getRouterClient();
  }

  /**
   * Send a request to the AI router
   */
  async request(req: AIRequest): Promise<AIResult> {
    // Build the full prompt
    const fullPrompt = req.systemPrompt 
      ? `${req.systemPrompt}\n\nUser: ${req.prompt}`
      : req.prompt;

    // Make the request
    const response = await this.client.route({
      prompt: fullPrompt,
      client_tier: req.tier || this.config.defaultTier,
      type_hint: req.type
    });

    // Calculate costs
    const tokens = response.usage ? {
      input: response.usage.prompt_tokens,
      output: response.usage.completion_tokens,
      total: response.usage.total_tokens
    } : { input: 0, output: 0, total: 0 };

    const cost = response.usage 
      ? calculateCostBreakdown(response.model, convertRouterUsage(response.usage))
      : { inputCost: 0, outputCost: 0, totalCost: 0, model: response.model, usedDefaultPricing: true };

    // Track costs
    if (this.config.trackCosts) {
      this.totalCost += cost.totalCost;
      this.requestCount++;
    }

    return {
      content: response.output,
      model: response.model,
      deployment: response.deployment,
      tokens,
      cost,
      routing: {
        type: response.routing?.type || 'unknown',
        complexity: response.routing?.complexity || 'unknown',
        language: response.routing?.language || 'unknown'
      }
    };
  }

  /**
   * Simple chat request
   */
  async chat(message: string, tier?: ClientTier): Promise<string> {
    const result = await this.request({
      prompt: message,
      type: 'chat',
      tier
    });
    return result.content;
  }

  /**
   * Math/reasoning request (uses DeepSeek R1 for complex problems)
   */
  async solve(problem: string, tier?: ClientTier): Promise<string> {
    const result = await this.request({
      prompt: problem,
      type: 'math',
      tier
    });
    return result.content;
  }

  /**
   * Code generation request
   */
  async code(prompt: string, tier?: ClientTier): Promise<string> {
    const result = await this.request({
      prompt,
      type: 'coding',
      tier
    });
    return result.content;
  }

  /**
   * Creative writing request
   */
  async create(prompt: string, tier?: ClientTier): Promise<string> {
    const result = await this.request({
      prompt,
      type: 'creative',
      tier
    });
    return result.content;
  }

  /**
   * Check router health
   */
  async healthCheck(): Promise<{ healthy: boolean; region: string }> {
    try {
      const health = await this.client.healthCheck();
      return { healthy: health.status === 'healthy', region: health.region };
    } catch {
      return { healthy: false, region: 'unknown' };
    }
  }

  /**
   * Get accumulated cost statistics
   */
  getStats(): { totalCost: number; requestCount: number; avgCost: number } {
    return {
      totalCost: this.totalCost,
      requestCount: this.requestCount,
      avgCost: this.requestCount > 0 ? this.totalCost / this.requestCount : 0
    };
  }

  /**
   * Reset cost tracking
   */
  resetStats(): void {
    this.totalCost = 0;
    this.requestCount = 0;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let aiServiceInstance: AIService | null = null;

/**
 * Get the singleton AI service instance
 */
export function getAIService(config?: AIServiceConfig): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(config);
  }
  return aiServiceInstance;
}

/**
 * Create a new AI service with custom config
 */
export function createAIService(config: AIServiceConfig): AIService {
  return new AIService(config);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick chat function
 */
export async function aiChat(message: string): Promise<string> {
  return getAIService().chat(message);
}

/**
 * Quick math/reasoning function
 */
export async function aiSolve(problem: string): Promise<string> {
  return getAIService().solve(problem);
}

/**
 * Quick code generation function
 */
export async function aiCode(prompt: string): Promise<string> {
  return getAIService().code(prompt);
}

/**
 * Quick creative writing function
 */
export async function aiCreate(prompt: string): Promise<string> {
  return getAIService().create(prompt);
}

// =============================================================================
// Re-exports
// =============================================================================

export { RouterError, RouterErrorCode } from './foundry/router-client';
export { calculateCost, calculateCostBreakdown } from './foundry/cost-calculator';
