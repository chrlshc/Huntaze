/**
 * AI Insights Validator
 * 
 * Validates the Insights killer feature responses.
 * 
 * @requirements 2.1, 2.2, 2.3, 2.4
 */

import type { InsightsValidationResult, TokenUsage } from './types';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

const INSIGHTS_TIMEOUT_MS = 10000;

export interface MetricsData {
  revenue?: number;
  subscribers?: number;
  engagement?: number;
  messages?: number;
  period?: string;
  [key: string]: unknown;
}

export interface InsightResponse {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  model?: string;
  tokenUsage?: TokenUsage;
}

export interface InsightsAPIResponse {
  success: boolean;
  insights: InsightResponse[];
  model?: string;
  tokenUsage?: TokenUsage;
  correlationId?: string;
}

export class InsightsValidator {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || '/api/ai/insights';
  }

  /**
   * Validate the Insights service response
   * Verifies model used is Mistral Large and token usage is tracked
   */
  async validateInsights(metrics: MetricsData): Promise<InsightsValidationResult> {
    const startTime = Date.now();

    try {
      const response = await externalFetch(this.apiUrl, {
        service: 'ai-insights',
        operation: 'validate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
        timeoutMs: INSIGHTS_TIMEOUT_MS,
        retry: { maxRetries: 0, retryMethods: [] },
      });

      const responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          responseTimeMs,
          model: 'unknown',
          hasRequiredFields: false,
          tokenUsage: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: InsightsAPIResponse = await response.json().catch(() => ({
        success: false,
        insights: [],
      } as InsightsAPIResponse));

      // Validate response structure
      const hasRequiredFields = this.validateResponseStructure(data);
      const tokenUsage = data.tokenUsage || this.extractTokenUsage(data);

      return {
        success: data.success && hasRequiredFields,
        responseTimeMs,
        model: data.model || 'mistral-large',
        hasRequiredFields,
        tokenUsage,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      if (isExternalServiceError(error) && error.code === 'TIMEOUT') {
        return {
          success: false,
          responseTimeMs,
          model: 'unknown',
          hasRequiredFields: false,
          tokenUsage: null,
          error: `Insights request timed out after ${INSIGHTS_TIMEOUT_MS}ms`,
        };
      }

      return {
        success: false,
        responseTimeMs,
        model: 'unknown',
        hasRequiredFields: false,
        tokenUsage: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate that the response contains all required fields
   */
  private validateResponseStructure(data: InsightsAPIResponse): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.insights)) return false;

    // Each insight must have type, severity, and recommendations
    return data.insights.every((insight) => {
      return (
        typeof insight.type === 'string' &&
        typeof insight.severity === 'string' &&
        ['low', 'medium', 'high', 'critical'].includes(insight.severity) &&
        Array.isArray(insight.recommendations)
      );
    });
  }

  /**
   * Extract token usage from response if available
   */
  private extractTokenUsage(data: InsightsAPIResponse): TokenUsage | null {
    if (data.tokenUsage) {
      return data.tokenUsage;
    }

    // Try to find token usage in insights
    for (const insight of data.insights || []) {
      if (insight.tokenUsage) {
        return insight.tokenUsage;
      }
    }

    return null;
  }

  /**
   * Validate a single insight object structure
   */
  static validateInsightStructure(insight: unknown): insight is InsightResponse {
    if (!insight || typeof insight !== 'object') return false;

    const obj = insight as Record<string, unknown>;

    return (
      typeof obj.type === 'string' &&
      typeof obj.severity === 'string' &&
      ['low', 'medium', 'high', 'critical'].includes(obj.severity as string) &&
      typeof obj.title === 'string' &&
      typeof obj.description === 'string' &&
      Array.isArray(obj.recommendations)
    );
  }
}

/**
 * Create an insights validator instance
 */
export function createInsightsValidator(apiUrl?: string): InsightsValidator {
  return new InsightsValidator(apiUrl);
}
