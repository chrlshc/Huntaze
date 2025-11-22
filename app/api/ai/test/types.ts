/**
 * AI Test API Types
 * 
 * Type definitions for the AI test endpoint.
 * Ensures type safety across client and server.
 */

/**
 * Request body for AI test endpoint
 */
export interface AITestRequest {
  creatorId: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Usage information returned by AI service
 */
export interface AIUsageInfo {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

/**
 * Success response data
 */
export interface AITestData {
  text: string;
  usage: AIUsageInfo;
}

/**
 * Success response structure
 */
export interface AITestSuccessResponse {
  success: true;
  data: AITestData;
  meta: {
    timestamp: string;
    requestId: string;
    duration: number;
  };
}

/**
 * Error response structure
 */
export interface AITestErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
  meta: {
    timestamp: string;
    requestId: string;
    duration: number;
  };
}

/**
 * Response type (union)
 */
export type AITestResponse = AITestSuccessResponse | AITestErrorResponse;

/**
 * Error codes
 */
export enum AITestErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
