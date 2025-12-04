/**
 * Campaign Generator Validator
 * 
 * Validates the Campaign Generator killer feature responses.
 * 
 * @requirements 3.1, 3.2, 3.3, 3.4
 */

import type { CampaignValidationResult } from './types';

const CAMPAIGN_TIMEOUT_MS = 15000;

export interface CampaignRequest {
  goal?: string;
  audience?: string;
  tone?: string;
  productType?: string;
  [key: string]: unknown;
}

export interface CampaignVariation {
  subject: string;
  body: string;
  engagementScore: number;
}

export interface CampaignAPIResponse {
  success: boolean;
  campaign: {
    subject: string;
    body: string;
    variations: CampaignVariation[];
    engagementScores?: number[];
  };
  correlationId: string;
  model?: string;
}

export class CampaignValidator {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || '/api/ai/campaigns/generate';
  }

  /**
   * Validate the Campaign Generator service response
   * Verifies subject lines, body content, and A/B variations are present
   */
  async validateCampaignGenerator(request: CampaignRequest): Promise<CampaignValidationResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CAMPAIGN_TIMEOUT_MS);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          responseTimeMs,
          hasSubjectLine: false,
          hasBodyContent: false,
          hasVariations: false,
          correlationId: '',
          engagementScores: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: CampaignAPIResponse = await response.json();

      // Validate response structure
      const hasSubjectLine = this.validateSubjectLine(data);
      const hasBodyContent = this.validateBodyContent(data);
      const hasVariations = this.validateVariations(data);
      const engagementScores = this.extractEngagementScores(data);

      return {
        success: data.success && hasSubjectLine && hasBodyContent && hasVariations,
        responseTimeMs,
        hasSubjectLine,
        hasBodyContent,
        hasVariations,
        correlationId: data.correlationId || '',
        engagementScores,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          responseTimeMs,
          hasSubjectLine: false,
          hasBodyContent: false,
          hasVariations: false,
          correlationId: '',
          engagementScores: [],
          error: `Campaign request timed out after ${CAMPAIGN_TIMEOUT_MS}ms`,
        };
      }

      return {
        success: false,
        responseTimeMs,
        hasSubjectLine: false,
        hasBodyContent: false,
        hasVariations: false,
        correlationId: '',
        engagementScores: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate that subject line is present and non-empty
   */
  private validateSubjectLine(data: CampaignAPIResponse): boolean {
    return (
      data?.campaign?.subject !== undefined &&
      typeof data.campaign.subject === 'string' &&
      data.campaign.subject.length > 0
    );
  }

  /**
   * Validate that body content is present and non-empty
   */
  private validateBodyContent(data: CampaignAPIResponse): boolean {
    return (
      data?.campaign?.body !== undefined &&
      typeof data.campaign.body === 'string' &&
      data.campaign.body.length > 0
    );
  }

  /**
   * Validate that A/B variations are present
   */
  private validateVariations(data: CampaignAPIResponse): boolean {
    if (!data?.campaign?.variations) return false;
    if (!Array.isArray(data.campaign.variations)) return false;
    if (data.campaign.variations.length === 0) return false;

    // Each variation must have subject, body, and engagement score
    return data.campaign.variations.every((variation) => {
      return (
        typeof variation.subject === 'string' &&
        variation.subject.length > 0 &&
        typeof variation.body === 'string' &&
        variation.body.length > 0 &&
        typeof variation.engagementScore === 'number' &&
        variation.engagementScore >= 0 &&
        variation.engagementScore <= 100
      );
    });
  }

  /**
   * Extract engagement scores from variations
   */
  private extractEngagementScores(data: CampaignAPIResponse): number[] {
    if (data?.campaign?.engagementScores) {
      return data.campaign.engagementScores;
    }

    if (data?.campaign?.variations) {
      return data.campaign.variations.map((v) => v.engagementScore);
    }

    return [];
  }

  /**
   * Validate a single campaign variation structure
   */
  static validateVariationStructure(variation: unknown): variation is CampaignVariation {
    if (!variation || typeof variation !== 'object') return false;

    const obj = variation as Record<string, unknown>;

    return (
      typeof obj.subject === 'string' &&
      obj.subject.length > 0 &&
      typeof obj.body === 'string' &&
      obj.body.length > 0 &&
      typeof obj.engagementScore === 'number' &&
      obj.engagementScore >= 0 &&
      obj.engagementScore <= 100
    );
  }

  /**
   * Check if engagement scores are valid numbers
   */
  static areValidEngagementScores(scores: unknown[]): boolean {
    return scores.every(
      (score) =>
        typeof score === 'number' &&
        !isNaN(score) &&
        score >= 0 &&
        score <= 100
    );
  }
}

/**
 * Create a campaign validator instance
 */
export function createCampaignValidator(apiUrl?: string): CampaignValidator {
  return new CampaignValidator(apiUrl);
}
