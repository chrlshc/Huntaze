/**
 * Type definitions for AI Chat API
 */

/**
 * Request body for POST /api/ai/chat
 */
export interface ChatRequest {
  fanId: string;
  message: string;
  context?: Record<string, any>;
}

/**
 * Response data from POST /api/ai/chat
 */
export interface ChatResponse {
  response: string;
  confidence: number;
  suggestedUpsell?: string;
  salesTactics?: string[];
  suggestedPrice?: number;
  agentsInvolved: string[];
  usage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
}

/**
 * Error response when rate limit is exceeded
 */
export interface RateLimitError {
  retryAfter: number;
  limit: number;
  remaining: number;
}

/**
 * Error response when quota is exceeded
 */
export interface QuotaExceededError {
  currentUsage: number;
  limit: number;
  plan: string;
  estimatedCost: number;
}
