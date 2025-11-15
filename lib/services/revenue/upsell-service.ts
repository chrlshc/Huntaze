/**
 * Upsell Service - Upsell Opportunities & Automation
 * 
 * Handles upsell opportunity detection and sending with validation
 */

import { revenueAPI } from './api-client';
import { validateUpsellRequest, validateCreatorId } from './api-validator';
import type {
  UpsellOpportunitiesResponse,
  SendUpsellRequest,
  AutomationSettings,
} from './types';

export class UpsellService {
  /**
   * Get upsell opportunities for a creator
   */
  async getOpportunities(creatorId: string): Promise<UpsellOpportunitiesResponse> {
    // Validate creator ID
    if (!validateCreatorId(creatorId)) {
      throw new Error('Invalid creator ID format');
    }

    console.log('[UpsellService] Fetching opportunities for creator:', creatorId);

    const data = await revenueAPI.get<UpsellOpportunitiesResponse>('/upsells', {
      creatorId,
    });

    console.log('[UpsellService] Opportunities received:', {
      count: data.opportunities.length,
      expectedRevenue: data.stats.expectedRevenue,
      averageBuyRate: data.stats.averageBuyRate,
    });

    return data;
  }

  /**
   * Send upsell message to fan
   */
  async sendUpsell(request: SendUpsellRequest): Promise<{ success: boolean; messageId: string }> {
    // Validate request
    validateUpsellRequest(request);

    console.log('[UpsellService] Sending upsell:', {
      creatorId: request.creatorId,
      opportunityId: request.opportunityId,
      hasCustomMessage: !!request.customMessage,
    });

    const result = await revenueAPI.post<{ success: boolean; messageId: string }>(
      '/upsells/send',
      request
    );

    console.log('[UpsellService] Upsell sent:', result.messageId);
    return result;
  }

  /**
   * Dismiss an upsell opportunity
   */
  async dismissOpportunity(
    creatorId: string,
    opportunityId: string
  ): Promise<{ success: boolean }> {
    console.log('[UpsellService] Dismissing opportunity:', {
      creatorId,
      opportunityId,
    });

    const result = await revenueAPI.post<{ success: boolean }>(
      '/upsells/dismiss',
      { creatorId, opportunityId }
    );

    return result;
  }

  /**
   * Get automation settings
   */
  async getAutomationSettings(creatorId: string): Promise<AutomationSettings> {
    console.log('[UpsellService] Fetching automation settings for creator:', creatorId);

    const data = await revenueAPI.get<AutomationSettings>('/upsells/automation', {
      creatorId,
    });

    console.log('[UpsellService] Automation settings:', {
      enabled: data.enabled,
      threshold: data.autoSendThreshold,
      maxDaily: data.maxDailyUpsells,
    });

    return data;
  }

  /**
   * Update automation settings
   */
  async updateAutomationSettings(
    creatorId: string,
    settings: AutomationSettings
  ): Promise<{ success: boolean }> {
    console.log('[UpsellService] Updating automation settings:', {
      creatorId,
      enabled: settings.enabled,
      threshold: settings.autoSendThreshold,
    });

    const result = await revenueAPI.post<{ success: boolean }>(
      '/upsells/automation',
      { creatorId, ...settings }
    );

    console.log('[UpsellService] Automation settings updated');
    return result;
  }
}

export const upsellService = new UpsellService();
