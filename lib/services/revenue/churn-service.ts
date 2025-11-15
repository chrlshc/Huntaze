/**
 * Churn Service - Churn Risk Prediction & Re-engagement
 * 
 * Handles churn risk analysis and fan re-engagement with validation
 */

import { revenueAPI } from './api-client';
import { validateReEngageRequest, validateCreatorId } from './api-validator';
import type {
  ChurnRiskResponse,
  ReEngageRequest,
} from './types';

export class ChurnService {
  /**
   * Get churn risk analysis for a creator
   */
  async getChurnRisks(
    creatorId: string,
    riskLevel?: 'high' | 'medium' | 'low'
  ): Promise<ChurnRiskResponse> {
    // Validate creator ID
    if (!validateCreatorId(creatorId)) {
      throw new Error('Invalid creator ID format');
    }

    // Validate risk level
    if (riskLevel && !['high', 'medium', 'low'].includes(riskLevel)) {
      throw new Error('Invalid risk level. Must be "high", "medium", or "low"');
    }

    console.log('[ChurnService] Fetching churn risks for creator:', creatorId, {
      filter: riskLevel || 'all',
    });

    const params: Record<string, string> = { creatorId };
    if (riskLevel) {
      params.riskLevel = riskLevel;
    }

    const data = await revenueAPI.get<ChurnRiskResponse>('/churn', params);

    console.log('[ChurnService] Churn risks received:', {
      totalAtRisk: data.summary.totalAtRisk,
      highRisk: data.summary.highRisk,
      mediumRisk: data.summary.mediumRisk,
      lowRisk: data.summary.lowRisk,
    });

    return data;
  }

  /**
   * Send re-engagement message to at-risk fan
   */
  async reEngageFan(request: ReEngageRequest): Promise<{ success: boolean; messageId: string }> {
    // Validate request
    validateReEngageRequest(request);

    console.log('[ChurnService] Re-engaging fan:', {
      creatorId: request.creatorId,
      fanId: request.fanId,
      hasCustomTemplate: !!request.messageTemplate,
    });

    const result = await revenueAPI.post<{ success: boolean; messageId: string }>(
      '/churn/reengage',
      request
    );

    console.log('[ChurnService] Re-engagement message sent:', result.messageId);
    return result;
  }

  /**
   * Bulk re-engage multiple fans
   */
  async bulkReEngage(
    creatorId: string,
    fanIds: string[],
    messageTemplate?: string
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    // Validate inputs
    if (!validateCreatorId(creatorId)) {
      throw new Error('Invalid creator ID format');
    }

    if (!Array.isArray(fanIds) || fanIds.length === 0) {
      throw new Error('Fan IDs must be a non-empty array');
    }

    if (fanIds.length > 100) {
      throw new Error('Cannot re-engage more than 100 fans at once');
    }

    console.log('[ChurnService] Bulk re-engaging fans:', {
      creatorId,
      fanCount: fanIds.length,
    });

    const result = await revenueAPI.post<{ success: boolean; sent: number; failed: number }>(
      '/churn/bulk-reengage',
      {
        creatorId,
        fanIds,
        messageTemplate,
      }
    );

    console.log('[ChurnService] Bulk re-engagement complete:', {
      sent: result.sent,
      failed: result.failed,
    });

    return result;
  }
}

export const churnService = new ChurnService();
