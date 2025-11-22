/**
 * Type definitions for AI Optimize Sales API
 */

/**
 * Sales context for optimization
 */
export interface SalesContext {
  currentMessage?: string;
  fanProfile?: any;
  purchaseHistory?: any;
  engagementLevel?: 'low' | 'medium' | 'high';
  contentType?: string;
  pricePoint?: number;
}

/**
 * Request body for POST /api/ai/optimize-sales
 */
export interface OptimizeSalesRequest {
  fanId: string;
  context: SalesContext;
}

/**
 * Sales tactic
 */
export interface SalesTactic {
  name: string;
  description: string;
  rationale: string;
}

/**
 * Alternative sales message
 */
export interface AlternativeMessage {
  message: string;
  approach: string;
  expectedConversionRate: number;
}

/**
 * Response data from POST /api/ai/optimize-sales
 */
export interface OptimizeSalesResponse {
  message: string;
  tactics: SalesTactic[];
  suggestedPrice?: number;
  confidence: number;
  expectedConversionRate: number;
  alternativeMessages?: AlternativeMessage[];
  agentsInvolved: string[];
  usage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
}
