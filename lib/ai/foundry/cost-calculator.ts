/**
 * Cost Calculator - Azure AI Foundry Model Pricing
 * 
 * Centralized cost calculation for all Azure AI Foundry models.
 * 
 * Feature: azure-foundry-agents-integration, Task 9.1
 * Requirements: 7.2
 * 
 * NOTE: Pricing values are indicative and must be synchronized regularly
 * with the official Azure and partner pricing pages:
 * - https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/
 * - https://azure.microsoft.com/pricing/details/machine-learning/
 */

// =============================================================================
// Types
// =============================================================================

export interface ModelPricing {
  /** Cost per 1K input tokens (USD) */
  input: number;
  /** Cost per 1K output tokens (USD) */
  output: number;
}

export interface UsageStatistics {
  /** Number of input/prompt tokens */
  promptTokens: number;
  /** Number of output/completion tokens */
  completionTokens: number;
  /** Total tokens (optional, calculated if not provided) */
  totalTokens?: number;
}

export interface CostBreakdown {
  /** Cost for input tokens (USD) */
  inputCost: number;
  /** Cost for output tokens (USD) */
  outputCost: number;
  /** Total cost (USD) */
  totalCost: number;
  /** Model used for pricing */
  model: string;
  /** Whether default pricing was used (model not found) */
  usedDefaultPricing: boolean;
}

// =============================================================================
// Model Pricing Constants
// =============================================================================

/**
 * Model pricing per 1K tokens (USD)
 * 
 * NOTE: These prices are indicative and should be synchronized regularly
 * with official Azure pricing. Last updated: December 2025
 * 
 * Sources:
 * - DeepSeek-R1: Azure AI Foundry marketplace pricing
 * - Llama-3.3-70B: Meta Llama via Azure AI Foundry
 * - Mistral-Large-2411: Mistral AI via Azure AI Foundry
 * - Phi-4-mini: Microsoft Phi-4 (classifier model)
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // DeepSeek models - optimized for math/coding
  'DeepSeek-R1': { input: 0.0014, output: 0.0028 },
  'deepseek-r1': { input: 0.0014, output: 0.0028 },
  
  // Llama models - general purpose chat/creative
  'Llama-3.3-70B': { input: 0.00099, output: 0.00099 },
  'llama-3.3-70b': { input: 0.00099, output: 0.00099 },
  'Llama-3.3-70B-Instruct': { input: 0.00099, output: 0.00099 },
  
  // Mistral models - French language optimized
  'Mistral-Large-2411': { input: 0.002, output: 0.006 },
  'mistral-large-2411': { input: 0.002, output: 0.006 },
  'Mistral-Large-2407': { input: 0.002, output: 0.006 }, // Legacy
  
  // Phi models - classifier/small tasks
  'Phi-4-mini': { input: 0.0001, output: 0.0001 },
  'phi-4-mini': { input: 0.0001, output: 0.0001 },
  'Phi-4': { input: 0.0001, output: 0.0001 },
};

/**
 * Default pricing used when model is not found in MODEL_PRICING
 * Uses Llama-3.3-70B pricing as a reasonable default
 */
export const DEFAULT_PRICING: ModelPricing = {
  input: 0.00099,
  output: 0.00099,
};

/**
 * Default model name used when model is unknown
 */
export const DEFAULT_MODEL = 'Llama-3.3-70B';

// =============================================================================
// Cost Calculation Functions
// =============================================================================

/**
 * Get pricing for a specific model
 * 
 * @param model - Model name (case-insensitive)
 * @returns Model pricing or default pricing if not found
 */
export function getModelPricing(model: string): ModelPricing {
  // Try exact match first using hasOwnProperty to avoid prototype pollution
  if (Object.prototype.hasOwnProperty.call(MODEL_PRICING, model)) {
    return MODEL_PRICING[model];
  }
  
  // Try lowercase match
  const lowerModel = model.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(MODEL_PRICING, lowerModel)) {
    return MODEL_PRICING[lowerModel];
  }
  
  // Try partial match for model families
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (lowerModel.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerModel)) {
      return pricing;
    }
  }
  
  return DEFAULT_PRICING;
}

/**
 * Calculate cost for a given model and token usage
 * 
 * Property 5: Usage statistics conversion
 * Validates: Requirements 4.3, 7.1, 7.2, 7.3
 * 
 * @param model - Model name used for the request
 * @param usage - Token usage statistics
 * @returns Total cost in USD
 */
export function calculateCost(model: string, usage: UsageStatistics): number {
  const pricing = getModelPricing(model);
  const inputCost = (usage.promptTokens / 1000) * pricing.input;
  const outputCost = (usage.completionTokens / 1000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Calculate cost with detailed breakdown
 * 
 * @param model - Model name used for the request
 * @param usage - Token usage statistics
 * @returns Detailed cost breakdown
 */
export function calculateCostBreakdown(model: string, usage: UsageStatistics): CostBreakdown {
  const pricing = getModelPricing(model);
  const usedDefaultPricing = !MODEL_PRICING[model] && !MODEL_PRICING[model.toLowerCase()];
  
  const inputCost = (usage.promptTokens / 1000) * pricing.input;
  const outputCost = (usage.completionTokens / 1000) * pricing.output;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model: usedDefaultPricing ? DEFAULT_MODEL : model,
    usedDefaultPricing,
  };
}

/**
 * Calculate cost from simple token counts
 * Convenience function for direct token count inputs
 * 
 * @param model - Model name
 * @param inputTokens - Number of input/prompt tokens
 * @param outputTokens - Number of output/completion tokens
 * @returns Total cost in USD
 */
export function calculateCostSimple(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  return calculateCost(model, {
    promptTokens: inputTokens,
    completionTokens: outputTokens,
  });
}

/**
 * Convert router usage format to standard usage statistics
 * 
 * Property 5: Usage statistics conversion
 * Validates: Requirements 4.3, 7.1
 * 
 * @param routerUsage - Usage from router response
 * @returns Standardized usage statistics
 */
export function convertRouterUsage(routerUsage: {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
}): UsageStatistics {
  return {
    promptTokens: routerUsage.prompt_tokens,
    completionTokens: routerUsage.completion_tokens,
    totalTokens: routerUsage.total_tokens ?? 
      (routerUsage.prompt_tokens + routerUsage.completion_tokens),
  };
}

/**
 * Check if a model is supported (has explicit pricing)
 * 
 * @param model - Model name to check
 * @returns True if model has explicit pricing
 */
export function isModelSupported(model: string): boolean {
  return MODEL_PRICING[model] !== undefined || 
         MODEL_PRICING[model.toLowerCase()] !== undefined;
}

/**
 * Get list of all supported models
 * 
 * @returns Array of supported model names
 */
export function getSupportedModels(): string[] {
  // Return unique model names (filter out lowercase duplicates)
  const models = new Set<string>();
  for (const key of Object.keys(MODEL_PRICING)) {
    // Only add if it starts with uppercase (canonical name)
    if (key[0] === key[0].toUpperCase()) {
      models.add(key);
    }
  }
  return Array.from(models);
}
