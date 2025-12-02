/**
 * Azure OpenAI LLM Router (stubbed)
 *
 * This router is disabled because the Azure integration
 * is incomplete in this deployment. Any usage will throw
 * a descriptive AzureOpenAIError.
 */

import { AzureOpenAIService } from './azure-openai.service';
import { AZURE_OPENAI_CONFIG, AZURE_OPENAI_MODELS } from './azure-openai.config';
import type {
  GenerationOptions,
  GenerationResponse,
  ChatMessage,
  AzureOpenAIErrorCode,
} from './azure-openai.types';
import { AzureOpenAIError } from './azure-openai.types';

export type ModelTier = 'premium' | 'standard' | 'economy';
export type UserPlan = 'starter' | 'pro' | 'scale' | 'enterprise';

export interface RouterOptions {
  tier?: ModelTier;
  plan?: UserPlan;
  accountId?: string;
  correlationId?: string;
  region?: 'primary' | 'secondary';
}

export interface RouterResponse extends GenerationResponse {
  tier: ModelTier;
  deployment: string;
  region: string;
  cost: number;
}

/**
 * Maps user plans to allowed model tiers
 */
const PLAN_TIER_MAPPING: Record<UserPlan, ModelTier[]> = {
  starter: ['economy'],
  pro: ['economy', 'standard'],
  scale: ['economy', 'standard', 'premium'],
  enterprise: ['economy', 'standard', 'premium'],
};

/**
 * Maps tiers to Azure OpenAI deployments
 */
const TIER_DEPLOYMENT_MAPPING: Record<ModelTier, string> = {
  premium: AZURE_OPENAI_CONFIG.deployments.premium,
  standard: AZURE_OPENAI_CONFIG.deployments.standard,
  economy: AZURE_OPENAI_CONFIG.deployments.economy,
};

/**
 * Azure OpenAI Router
 * Routes requests to appropriate Azure OpenAI deployments based on tier and plan
 */
export class AzureOpenAIRouter {
  private services: Map<string, AzureOpenAIService> = new Map();
  private initialized = false;

  constructor() {
    // Defer expensive client initialization until first use.
    // This keeps `next build` safe even if Azure config is missing.
  }

  /**
   * Initialize Azure OpenAI services for each deployment
   */
  private initializeServices(): void {
    // Stub: do not initialize any Azure services
    this.initialized = true;
  }

  /**
   * Generate text with tier-based routing
   */
  async generateText(
    prompt: string,
    options: GenerationOptions & RouterOptions = {}
  ): Promise<RouterResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Chat with tier-based routing
   */
  async chat(
    messages: ChatMessage[],
    options: GenerationOptions & RouterOptions = {}
  ): Promise<RouterResponse> {
    // Always throw: Azure router is disabled
    throw new AzureOpenAIError(
      'Azure OpenAI router is disabled in this deployment',
      'deployment_not_found' as AzureOpenAIErrorCode,
      404,
      false
    );
  }

  /**
   * Generate text with streaming
   */
  async *chatStream(
    messages: ChatMessage[],
    options: GenerationOptions & RouterOptions = {}
  ): AsyncGenerator<string> {
    // Always throw: Azure router is disabled
    throw new AzureOpenAIError(
      'Azure OpenAI router streaming is disabled in this deployment',
      'deployment_not_found' as AzureOpenAIErrorCode,
      404,
      false
    );
  }

  /**
   * Determine the appropriate tier based on plan and requested tier
   * Validates: Requirements 1.1, 1.2, 1.3
   */
  private determineTier(requestedTier?: ModelTier, plan?: UserPlan): ModelTier {
    // Default to economy if no tier specified
    if (!requestedTier) {
      return 'economy';
    }

    // If no plan specified, allow requested tier
    if (!plan) {
      return requestedTier;
    }

    // Check if plan allows requested tier
    const allowedTiers = PLAN_TIER_MAPPING[plan];
    if (allowedTiers.includes(requestedTier)) {
      return requestedTier;
    }

    // Downgrade to highest allowed tier
    if (allowedTiers.includes('premium')) return 'premium';
    if (allowedTiers.includes('standard')) return 'standard';
    return 'economy';
  }

  /**
   * Calculate cost based on deployment and token usage
   */
  private calculateCost(deployment: string, usage: { promptTokens: number; completionTokens: number }): number {
    const modelInfo = AZURE_OPENAI_MODELS[deployment as keyof typeof AZURE_OPENAI_MODELS];
    if (!modelInfo || !('costPer1kInput' in modelInfo)) {
      return 0;
    }

    const inputCost = (usage.promptTokens / 1000) * modelInfo.costPer1kInput;
    const outputCost = (usage.completionTokens / 1000) * modelInfo.costPer1kOutput;
    
    return inputCost + outputCost;
  }

  /**
   * Get available tiers for a plan
   */
  getAvailableTiers(plan: UserPlan): ModelTier[] {
    return PLAN_TIER_MAPPING[plan];
  }

  /**
   * Get deployment for a tier
   */
  getDeploymentForTier(tier: ModelTier): string {
    return TIER_DEPLOYMENT_MAPPING[tier];
  }
}

// Export singleton instance
export const azureOpenAIRouter = new AzureOpenAIRouter();
