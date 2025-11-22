/**
 * Client-side utilities for AI Generate Caption API
 */

import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api/types/responses';
import { GenerateCaptionRequest, GenerateCaptionResponse } from './types';

/**
 * Generate AI-powered caption and hashtags for content
 * 
 * @param request - Caption generation request with platform and content info
 * @returns Promise with caption and hashtags
 * 
 * @example
 * ```typescript
 * const response = await generateCaption({
 *   platform: 'instagram',
 *   contentInfo: {
 *     type: 'photo',
 *     description: 'Beach sunset photo',
 *     mood: 'relaxed',
 *     targetAudience: 'lifestyle enthusiasts'
 *   }
 * });
 * 
 * console.log(response.data.caption);
 * console.log(response.data.hashtags);
 * ```
 */
export async function generateCaption(
  request: GenerateCaptionRequest
): Promise<ApiSuccessResponse<GenerateCaptionResponse> | ApiErrorResponse> {
  const response = await fetch('/api/ai/generate-caption', {
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
export function isCaptionSuccess(
  response: ApiSuccessResponse<GenerateCaptionResponse> | ApiErrorResponse
): response is ApiSuccessResponse<GenerateCaptionResponse> {
  return response.success === true;
}

/**
 * Extract caption response or throw error
 */
export function unwrapCaptionResponse(
  response: ApiSuccessResponse<GenerateCaptionResponse> | ApiErrorResponse
): GenerateCaptionResponse {
  if (isCaptionSuccess(response)) {
    return response.data;
  }

  throw new Error(response.error.message);
}
