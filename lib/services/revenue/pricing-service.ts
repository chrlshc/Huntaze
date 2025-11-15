/**
 * Pricing Service - Dynamic Pricing Recommendations
 * 
 * Handles pricing recommendations and application with validation
 */

import { revenueAPI } from './api-client';
import { validatePricingRequest, validateCreatorId } from './api-validator';
import type {
  PricingRecommendation,
  ApplyPricingRequest,
} from './types';

export class PricingService {
  /**
   * Get pricing recommendations for a creator
   */
  async getRecommendations(creatorId: string): Promise<PricingRecommendation> {
    // Validate creator ID
    if (!validateCreatorId(creatorId)) {
      throw new Error('Invalid creator ID format');
    }

    console.log('[PricingService] Fetching recommendations for creator:', creatorId);
    
    const data = await revenueAPI.get<PricingRecommendation>('/pricing', {
      creatorId,
    });

    console.log('[PricingService] Recommendations received:', {
      subscriptionImpact: data.subscription.revenueImpact,
      ppvCount: data.ppv.length,
      confidence: data.subscription.confidence,
    });

    return data;
  }

  /**
   * Apply pricing recommendation
   */
  async applyPricing(request: ApplyPricingRequest): Promise<{ success: boolean }> {
    // Validate request
    validatePricingRequest(request);

    console.log('[PricingService] Applying pricing:', {
      creatorId: request.creatorId,
      priceType: request.priceType,
      newPrice: request.newPrice,
    });

    const result = await revenueAPI.post<{ success: boolean }>(
      '/pricing/apply',
      request
    );

    console.log('[PricingService] Pricing applied successfully');
    return result;
  }
}

export const pricingService = new PricingService();
