/**
 * Client-side utilities for AI Analyze Performance API
 */

import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api/types/responses';
import { AnalyzePerformanceRequest, AnalyzePerformanceResponse } from './types';

/**
 * Analyze performance metrics with AI-powered insights
 * 
 * @param request - Performance analysis request with metrics
 * @returns Promise with insights and recommendations
 * 
 * @example
 * ```typescript
 * const response = await analyzePerformance({
 *   metrics: {
 *     platforms: ['instagram', 'tiktok'],
 *     contentTypes: ['photo', 'video'],
 *     timeframe: 'last_30_days',
 *     engagementData: {
 *       likes: 15000,
 *       comments: 500,
 *       shares: 200
 *     }
 *   }
 * });
 * 
 * console.log(response.data.insights);
 * console.log(response.data.recommendations);
 * ```
 */
export async function analyzePerformance(
  request: AnalyzePerformanceRequest
): Promise<ApiSuccessResponse<AnalyzePerformanceResponse> | ApiErrorResponse> {
  const response = await fetch('/api/ai/analyze-performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}

/**
 * Type guard to check if response is successful
 */
export function isAnalysisSuccess(
  response: ApiSuccessResponse<AnalyzePerformanceResponse> | ApiErrorResponse
): response is ApiSuccessResponse<AnalyzePerformanceResponse> {
  return response.success === true;
}

/**
 * Extract analysis response or throw error
 */
export function unwrapAnalysisResponse(
  response: ApiSuccessResponse<AnalyzePerformanceResponse> | ApiErrorResponse
): AnalyzePerformanceResponse {
  if (isAnalysisSuccess(response)) {
    return response.data;
  }

  throw new Error(response.error.message);
}
