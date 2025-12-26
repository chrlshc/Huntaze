/**
 * Fan Segmentation Validator
 * 
 * Validates the Fan Segmentation killer feature responses.
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4
 */

import type { SegmentationValidationResult, FanSegment } from './types';
import { VALID_FAN_SEGMENTS, isValidFanSegment, isValidChurnProbability } from './types';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

const SEGMENTATION_TIMEOUT_MS = 15000;

export interface Fan {
  id: string;
  name?: string;
  totalSpent?: number;
  subscriptionDate?: string;
  lastActivity?: string;
  messageCount?: number;
  [key: string]: unknown;
}

export interface SegmentedFan {
  fanId: string;
  segment: FanSegment;
  churnProbability: number;
  confidence: number;
  recommendations: string[];
}

export interface SegmentationAPIResponse {
  success: boolean;
  segmentedFans: SegmentedFan[];
  model?: string;
  summary?: {
    totalFans: number;
    segmentCounts: Record<FanSegment, number>;
  };
}

export class SegmentationValidator {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || '/api/ai/fans/segment';
  }

  /**
   * Validate the Fan Segmentation service response
   * Verifies segments are valid and churn probability is in [0, 1] range
   */
  async validateFanSegmentation(fans: Fan[]): Promise<SegmentationValidationResult> {
    const startTime = Date.now();

    try {
      const response = await externalFetch(this.apiUrl, {
        service: 'ai-segmentation',
        operation: 'validate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fans }),
        timeoutMs: SEGMENTATION_TIMEOUT_MS,
        retry: { maxRetries: 0, retryMethods: [] },
      });

      const responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          responseTimeMs,
          model: 'unknown',
          validSegments: false,
          churnProbabilityValid: false,
          hasRecommendations: false,
          segments: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: SegmentationAPIResponse = await response.json().catch(() => ({
        success: false,
        segmentedFans: [],
      } as SegmentationAPIResponse));

      // Validate response structure
      const validSegments = this.validateSegments(data);
      const churnProbabilityValid = this.validateChurnProbabilities(data);
      const hasRecommendations = this.validateRecommendations(data);
      const segments = this.extractSegments(data);
      const avgChurnProbability = this.calculateAverageChurnProbability(data);

      return {
        success: data.success && validSegments && churnProbabilityValid && hasRecommendations,
        responseTimeMs,
        model: data.model || 'deepseek-r1',
        validSegments,
        churnProbabilityValid,
        hasRecommendations,
        segments,
        churnProbability: avgChurnProbability,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      if (isExternalServiceError(error) && error.code === 'TIMEOUT') {
        return {
          success: false,
          responseTimeMs,
          model: 'unknown',
          validSegments: false,
          churnProbabilityValid: false,
          hasRecommendations: false,
          segments: [],
          error: `Segmentation request timed out after ${SEGMENTATION_TIMEOUT_MS}ms`,
        };
      }

      return {
        success: false,
        responseTimeMs,
        model: 'unknown',
        validSegments: false,
        churnProbabilityValid: false,
        hasRecommendations: false,
        segments: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate that all segments are valid
   */
  private validateSegments(data: SegmentationAPIResponse): boolean {
    if (!data?.segmentedFans || !Array.isArray(data.segmentedFans)) {
      return false;
    }

    return data.segmentedFans.every((fan) => isValidFanSegment(fan.segment));
  }

  /**
   * Validate that all churn probabilities are in [0, 1] range
   */
  private validateChurnProbabilities(data: SegmentationAPIResponse): boolean {
    if (!data?.segmentedFans || !Array.isArray(data.segmentedFans)) {
      return false;
    }

    return data.segmentedFans.every((fan) => isValidChurnProbability(fan.churnProbability));
  }

  /**
   * Validate that recommendations are present for each fan
   */
  private validateRecommendations(data: SegmentationAPIResponse): boolean {
    if (!data?.segmentedFans || !Array.isArray(data.segmentedFans)) {
      return false;
    }

    return data.segmentedFans.every(
      (fan) => Array.isArray(fan.recommendations) && fan.recommendations.length > 0
    );
  }

  /**
   * Extract unique segments from response
   */
  private extractSegments(data: SegmentationAPIResponse): FanSegment[] {
    if (!data?.segmentedFans || !Array.isArray(data.segmentedFans)) {
      return [];
    }

    const segments = new Set<FanSegment>();
    for (const fan of data.segmentedFans) {
      if (isValidFanSegment(fan.segment)) {
        segments.add(fan.segment);
      }
    }

    return Array.from(segments);
  }

  /**
   * Calculate average churn probability
   */
  private calculateAverageChurnProbability(data: SegmentationAPIResponse): number | undefined {
    if (!data?.segmentedFans || data.segmentedFans.length === 0) {
      return undefined;
    }

    const validProbabilities = data.segmentedFans
      .map((fan) => fan.churnProbability)
      .filter(isValidChurnProbability);

    if (validProbabilities.length === 0) {
      return undefined;
    }

    const sum = validProbabilities.reduce((acc, prob) => acc + prob, 0);
    return sum / validProbabilities.length;
  }

  /**
   * Validate a single segmented fan structure
   */
  static validateSegmentedFanStructure(fan: unknown): fan is SegmentedFan {
    if (!fan || typeof fan !== 'object') return false;

    const obj = fan as Record<string, unknown>;

    return (
      typeof obj.fanId === 'string' &&
      isValidFanSegment(obj.segment as string) &&
      isValidChurnProbability(obj.churnProbability as number) &&
      typeof obj.confidence === 'number' &&
      obj.confidence >= 0 &&
      obj.confidence <= 1 &&
      Array.isArray(obj.recommendations)
    );
  }

  /**
   * Get valid segment names
   */
  static getValidSegments(): readonly FanSegment[] {
    return VALID_FAN_SEGMENTS;
  }
}

/**
 * Create a segmentation validator instance
 */
export function createSegmentationValidator(apiUrl?: string): SegmentationValidator {
  return new SegmentationValidator(apiUrl);
}
