/**
 * Type definitions for AI Generate Caption API
 */

/**
 * Supported social media platforms
 */
export type Platform = 'instagram' | 'tiktok' | 'twitter' | 'onlyfans' | 'facebook';

/**
 * Content information for caption generation
 */
export interface ContentInfo {
  type?: string;
  description?: string;
  mood?: string;
  targetAudience?: string;
  analyticsInsights?: any;
}

/**
 * Request body for POST /api/ai/generate-caption
 */
export interface GenerateCaptionRequest {
  platform: Platform;
  contentInfo: ContentInfo;
}

/**
 * Response data from POST /api/ai/generate-caption
 */
export interface GenerateCaptionResponse {
  caption: string;
  hashtags: string[];
  confidence: number;
  performanceInsights?: any;
  agentsInvolved: string[];
  usage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
}
