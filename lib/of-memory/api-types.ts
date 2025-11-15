/**
 * OnlyFans AI Memory Service - API Types
 * 
 * TypeScript types for API requests and responses
 */

import { z } from 'zod';
import type {
  MemoryContext,
  InteractionEvent,
  MemoryStats,
  PersonalityProfile,
  FanPreferences,
  EmotionalState,
  EngagementMetrics
} from './types';

// ============================================================================
// REQUEST SCHEMAS (Zod for validation)
// ============================================================================

/**
 * Get memory context request schema
 */
export const GetMemoryContextRequestSchema = z.object({
  fanId: z.string().min(1, 'fanId is required'),
  creatorId: z.string().min(1, 'creatorId is required')
});

export type GetMemoryContextRequest = z.infer<typeof GetMemoryContextRequestSchema>;

/**
 * Save interaction request schema
 */
export const SaveInteractionRequestSchema = z.object({
  fanId: z.string().min(1, 'fanId is required'),
  creatorId: z.string().min(1, 'creatorId is required'),
  type: z.enum(['message', 'purchase', 'tip', 'like', 'view']),
  content: z.string().optional(),
  amount: z.number().positive().optional(),
  timestamp: z.coerce.date(),
  metadata: z.record(z.any()).optional()
});

export type SaveInteractionRequest = z.infer<typeof SaveInteractionRequestSchema>;

/**
 * Clear memory request schema
 */
export const ClearMemoryRequestSchema = z.object({
  fanId: z.string().min(1, 'fanId is required'),
  creatorId: z.string().min(1, 'creatorId is required')
});

export type ClearMemoryRequest = z.infer<typeof ClearMemoryRequestSchema>;

/**
 * Get bulk memories request schema
 */
export const GetBulkMemoriesRequestSchema = z.object({
  fanIds: z.array(z.string()).min(1, 'At least one fanId is required').max(100, 'Maximum 100 fanIds allowed'),
  creatorId: z.string().min(1, 'creatorId is required')
});

export type GetBulkMemoriesRequest = z.infer<typeof GetBulkMemoriesRequestSchema>;

/**
 * Get engagement score request schema
 */
export const GetEngagementScoreRequestSchema = z.object({
  fanId: z.string().min(1, 'fanId is required'),
  creatorId: z.string().min(1, 'creatorId is required')
});

export type GetEngagementScoreRequest = z.infer<typeof GetEngagementScoreRequestSchema>;

/**
 * Get memory stats request schema
 */
export const GetMemoryStatsRequestSchema = z.object({
  creatorId: z.string().min(1, 'creatorId is required')
});

export type GetMemoryStatsRequest = z.infer<typeof GetMemoryStatsRequestSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  correlationId: string;
  timestamp: string;
}

/**
 * API error structure
 */
export interface ApiError {
  type: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // Only in development
}

/**
 * Get memory context response
 */
export interface GetMemoryContextResponse extends ApiResponse<MemoryContext> {
  data: MemoryContext;
}

/**
 * Save interaction response
 */
export interface SaveInteractionResponse extends ApiResponse<void> {
  success: true;
}

/**
 * Clear memory response
 */
export interface ClearMemoryResponse extends ApiResponse<void> {
  success: true;
}

/**
 * Get bulk memories response
 */
export interface GetBulkMemoriesResponse extends ApiResponse<Record<string, MemoryContext>> {
  data: Record<string, MemoryContext>;
  metadata: {
    totalRequested: number;
    totalReturned: number;
    duration: number;
  };
}

/**
 * Get engagement score response
 */
export interface GetEngagementScoreResponse extends ApiResponse<number> {
  data: number;
}

/**
 * Get memory stats response
 */
export interface GetMemoryStatsResponse extends ApiResponse<MemoryStats> {
  data: MemoryStats;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  correlationId: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    correlationId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  type: string,
  message: string,
  correlationId: string,
  details?: Record<string, any>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      type,
      message,
      details
    },
    correlationId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate request with Zod schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(
    err => `${err.path.join('.')}: ${err.message}`
  );
  
  return { success: false, errors };
}

// ============================================================================
// HTTP CLIENT TYPES
// ============================================================================

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP client interface
 */
export interface IMemoryServiceClient {
  getMemoryContext(request: GetMemoryContextRequest): Promise<GetMemoryContextResponse>;
  saveInteraction(request: SaveInteractionRequest): Promise<SaveInteractionResponse>;
  clearMemory(request: ClearMemoryRequest): Promise<ClearMemoryResponse>;
  getBulkMemories(request: GetBulkMemoriesRequest): Promise<GetBulkMemoriesResponse>;
  getEngagementScore(request: GetEngagementScoreRequest): Promise<GetEngagementScoreResponse>;
  getMemoryStats(request: GetMemoryStatsRequest): Promise<GetMemoryStatsResponse>;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Memory update webhook payload
 */
export interface MemoryUpdateWebhook {
  event: 'memory.updated' | 'memory.cleared' | 'interaction.saved';
  fanId: string;
  creatorId: string;
  timestamp: string;
  data?: {
    interactionType?: string;
    engagementScore?: number;
  };
}

/**
 * Webhook signature verification
 */
export interface WebhookSignature {
  timestamp: string;
  signature: string;
  algorithm: 'sha256' | 'sha512';
}
