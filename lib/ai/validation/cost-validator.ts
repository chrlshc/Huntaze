/**
 * Cost Tracking Validator
 * 
 * Validates cost calculation and tracking for AI operations.
 * Ensures all cost fields are present and calculations are correct.
 * 
 * @module lib/ai/validation/cost-validator
 */

import {
  CostValidationResult,
  CostBreakdown,
  TokenUsage,
  CostTrackingValidator,
} from './types';

// Model pricing (per 1K tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'mistral-large': { input: 0.004, output: 0.012 },
  'mistral-small': { input: 0.001, output: 0.003 },
  'phi-4-mini': { input: 0.0001, output: 0.0003 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
};

const DEFAULT_PRICING = { input: 0.001, output: 0.003 };

/**
 * Cost Tracking Validator Service
 * 
 * Validates cost calculations and ensures all required fields are present.
 */
export class CostValidatorService implements CostTrackingValidator {
  private modelPricing: Record<string, { input: number; output: number }>;

  constructor(customPricing?: Record<string, { input: number; output: number }>) {
    this.modelPricing = { ...MODEL_PRICING, ...customPricing };
  }

  /**
   * Validate cost calculation for given token usage
   */
  async validateCostCalculation(usage: TokenUsage): Promise<CostValidationResult> {
    try {
      // Validate token usage fields
      const hasInputTokens = typeof usage.inputTokens === 'number' && usage.inputTokens >= 0;
      const hasOutputTokens = typeof usage.outputTokens === 'number' && usage.outputTokens >= 0;

      if (!hasInputTokens || !hasOutputTokens) {
        return {
          costCalculated: false,
          hasModelName: false,
          hasInputTokens,
          hasOutputTokens,
          hasTotalCostUsd: false,
          calculatedCost: 0,
          error: 'Invalid token usage data',
        };
      }

      // Calculate cost using default pricing
      const breakdown = this.validateCostBreakdown('default', usage);

      return {
        costCalculated: true,
        hasModelName: true,
        hasInputTokens: true,
        hasOutputTokens: true,
        hasTotalCostUsd: true,
        calculatedCost: breakdown.totalCost,
        breakdown,
      };
    } catch (error) {
      return {
        costCalculated: false,
        hasModelName: false,
        hasInputTokens: false,
        hasOutputTokens: false,
        hasTotalCostUsd: false,
        calculatedCost: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate and validate cost breakdown for a specific model
   */
  validateCostBreakdown(model: string, usage: TokenUsage): CostBreakdown {
    const pricing = this.modelPricing[model] || DEFAULT_PRICING;
    const usedDefaultPricing = !this.modelPricing[model];

    // Calculate costs (pricing is per 1K tokens)
    const inputCost = (usage.inputTokens / 1000) * pricing.input;
    const outputCost = (usage.outputTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      model,
      inputCost: roundToDecimals(inputCost, 6),
      outputCost: roundToDecimals(outputCost, 6),
      totalCost: roundToDecimals(totalCost, 6),
      usedDefaultPricing,
    };
  }

  /**
   * Validate that a cost breakdown has all required fields
   */
  validateBreakdownFields(breakdown: CostBreakdown): {
    valid: boolean;
    missingFields: string[];
  } {
    const requiredFields = ['model', 'inputCost', 'outputCost', 'totalCost'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(field in breakdown) || breakdown[field as keyof CostBreakdown] === undefined) {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Validate that cost calculation is mathematically correct
   */
  validateCostMath(breakdown: CostBreakdown): {
    valid: boolean;
    expectedTotal: number;
    actualTotal: number;
    difference: number;
  } {
    const expectedTotal = breakdown.inputCost + breakdown.outputCost;
    const difference = Math.abs(expectedTotal - breakdown.totalCost);
    
    // Allow for floating point precision issues (6 decimal places)
    const valid = difference < 0.000001;

    return {
      valid,
      expectedTotal: roundToDecimals(expectedTotal, 6),
      actualTotal: breakdown.totalCost,
      difference: roundToDecimals(difference, 6),
    };
  }

  /**
   * Get pricing for a model
   */
  getModelPricing(model: string): { input: number; output: number } | null {
    return this.modelPricing[model] || null;
  }

  /**
   * Get all available model pricing
   */
  getAllPricing(): Record<string, { input: number; output: number }> {
    return { ...this.modelPricing };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Round a number to specified decimal places
 */
function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================================
// Factory and Singleton
// ============================================================================

let validatorInstance: CostValidatorService | null = null;

/**
 * Get or create the Cost Validator instance
 */
export function getCostValidator(
  customPricing?: Record<string, { input: number; output: number }>
): CostValidatorService {
  if (!validatorInstance || customPricing) {
    validatorInstance = new CostValidatorService(customPricing);
  }
  return validatorInstance;
}

/**
 * Quick validation function for cost calculation
 */
export async function validateCost(usage: TokenUsage): Promise<CostValidationResult> {
  const validator = getCostValidator();
  return validator.validateCostCalculation(usage);
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock cost validation result for testing
 */
export function createMockCostResult(
  overrides?: Partial<CostValidationResult>
): CostValidationResult {
  return {
    costCalculated: true,
    hasModelName: true,
    hasInputTokens: true,
    hasOutputTokens: true,
    hasTotalCostUsd: true,
    calculatedCost: 0.0045,
    breakdown: {
      model: 'gpt-3.5-turbo',
      inputCost: 0.0005,
      outputCost: 0.004,
      totalCost: 0.0045,
      usedDefaultPricing: false,
    },
    ...overrides,
  };
}

/**
 * Create mock token usage for testing
 */
export function createMockTokenUsage(
  overrides?: Partial<TokenUsage>
): TokenUsage {
  return {
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500,
    ...overrides,
  };
}

/**
 * Validate that cost breakdown is complete and correct
 */
export function isValidCostBreakdown(breakdown: CostBreakdown): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!breakdown.model) {
    issues.push('Missing model name');
  }

  if (typeof breakdown.inputCost !== 'number' || breakdown.inputCost < 0) {
    issues.push('Invalid input cost');
  }

  if (typeof breakdown.outputCost !== 'number' || breakdown.outputCost < 0) {
    issues.push('Invalid output cost');
  }

  if (typeof breakdown.totalCost !== 'number' || breakdown.totalCost < 0) {
    issues.push('Invalid total cost');
  }

  // Verify math
  const expectedTotal = breakdown.inputCost + breakdown.outputCost;
  if (Math.abs(expectedTotal - breakdown.totalCost) > 0.000001) {
    issues.push(`Total cost mismatch: expected ${expectedTotal}, got ${breakdown.totalCost}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
