/**
 * AI Offers Service
 * 
 * Uses Llama 3.3 70B to provide intelligent pricing suggestions,
 * bundle recommendations, and discount strategies.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4
 */

import { getAIService, AIService } from './service';
import {
  SalesData,
  PricingSuggestion,
  ContentItem,
  FanPreference,
  BundleSuggestion,
  FanSegment,
  PurchaseData,
  DiscountRecommendation,
  DiscountType,
} from '../offers/types';

// ============================================
// Types
// ============================================

export interface SuggestPricingRequest {
  contentId: string;
  currentPrice?: number;
  historicalSales: SalesData[];
}

export interface SuggestBundlesRequest {
  userId: number;
  contentItems: ContentItem[];
  fanPreferences?: FanPreference[];
}

export interface RecommendDiscountsRequest {
  userId: number;
  fanSegments: FanSegment[];
  purchaseHistory?: PurchaseData[];
}

// ============================================
// AI Offers Service Class
// ============================================

export class OffersAIService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || getAIService();
  }

  /**
   * Suggest optimal pricing for content
   * Uses Llama 3.3 for analysis
   * 
   * Requirements: 6.1, 6.2, 6.3
   */
  async suggestPricing(
    request: SuggestPricingRequest
  ): Promise<PricingSuggestion[]> {
    const prompt = this.buildPricingPrompt(request);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative', // Routes to Llama 3.3
        systemPrompt: this.getPricingSystemPrompt(),
      });

      const suggestions = this.parsePricingSuggestions(result.content);
      return this.validatePricingSuggestions(suggestions);
    } catch (error) {
      console.error('[OffersAI] Error suggesting pricing:', error);
      return this.createFallbackPricingSuggestions(request);
    }
  }

  /**
   * Suggest content bundles
   * 
   * Requirements: 7.1, 7.2, 7.3
   */
  async suggestBundles(
    request: SuggestBundlesRequest
  ): Promise<BundleSuggestion[]> {
    if (request.contentItems.length < 2) {
      return [];
    }

    const prompt = this.buildBundlePrompt(request);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative',
        systemPrompt: this.getBundleSystemPrompt(),
      });

      const suggestions = this.parseBundleSuggestions(result.content);
      return this.validateBundleSuggestions(suggestions, request.contentItems);
    } catch (error) {
      console.error('[OffersAI] Error suggesting bundles:', error);
      return this.createFallbackBundleSuggestions(request);
    }
  }

  /**
   * Recommend discount strategies
   * 
   * Requirements: 8.1, 8.2, 8.3
   */
  async recommendDiscounts(
    request: RecommendDiscountsRequest
  ): Promise<DiscountRecommendation[]> {
    const prompt = this.buildDiscountPrompt(request);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative',
        systemPrompt: this.getDiscountSystemPrompt(),
      });

      const recommendations = this.parseDiscountRecommendations(result.content);
      return this.validateDiscountRecommendations(recommendations);
    } catch (error) {
      console.error('[OffersAI] Error recommending discounts:', error);
      return this.createFallbackDiscountRecommendations(request);
    }
  }

  // ============================================
  // Pricing - Prompts & Parsing
  // ============================================

  private getPricingSystemPrompt(): string {
    return `You are a pricing optimization expert for content creators.
Analyze sales data and suggest optimal pricing strategies.

Rules:
1. Recommended prices must be positive numbers
2. Confidence must be between 0 and 1
3. Provide clear reasoning for each suggestion
4. Consider market dynamics and elasticity

Response format (JSON array only, no markdown):
[
  {
    "recommendedPrice": number,
    "expectedImpact": "description of expected impact",
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
  }
]`;
  }

  private buildPricingPrompt(request: SuggestPricingRequest): string {
    const salesSummary = request.historicalSales.length > 0
      ? request.historicalSales.map(s => 
          `- ${s.period}: ${s.salesCount} sales at $${s.price}, revenue $${s.revenue}`
        ).join('\n')
      : 'No historical sales data available';

    return `Analyze pricing for content ID: ${request.contentId}

Current price: ${request.currentPrice ? `$${request.currentPrice}` : 'Not set'}

Historical sales data:
${salesSummary}

Provide 2-3 pricing suggestions with different strategies (aggressive, moderate, conservative).
Return only valid JSON array.`;
  }

  private parsePricingSuggestions(content: string): PricingSuggestion[] {
    try {
      const jsonStr = this.extractJSON(content);
      const parsed = JSON.parse(jsonStr);
      
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions;
      }
      
      return [parsed];
    } catch {
      console.error('[OffersAI] Failed to parse pricing suggestions');
      return [];
    }
  }

  private validatePricingSuggestions(
    suggestions: PricingSuggestion[]
  ): PricingSuggestion[] {
    return suggestions
      .filter(s => 
        typeof s.recommendedPrice === 'number' &&
        s.recommendedPrice > 0
      )
      .map(s => ({
        recommendedPrice: Math.round(s.recommendedPrice * 100) / 100,
        expectedImpact: s.expectedImpact || 'Impact analysis pending',
        confidence: Math.min(1, Math.max(0, s.confidence || 0.5)),
        reasoning: s.reasoning || 'Based on market analysis',
      }));
  }

  private createFallbackPricingSuggestions(
    request: SuggestPricingRequest
  ): PricingSuggestion[] {
    const basePrice = request.currentPrice || 
      (request.historicalSales[0]?.price) || 
      9.99;

    return [
      {
        recommendedPrice: Math.round(basePrice * 0.85 * 100) / 100,
        expectedImpact: 'May increase volume by 15-25%',
        confidence: 0.4,
        reasoning: 'Lower price point to attract more buyers',
      },
      {
        recommendedPrice: basePrice,
        expectedImpact: 'Maintain current performance',
        confidence: 0.6,
        reasoning: 'Keep current pricing strategy',
      },
      {
        recommendedPrice: Math.round(basePrice * 1.15 * 100) / 100,
        expectedImpact: 'May increase revenue per sale by 10-15%',
        confidence: 0.4,
        reasoning: 'Premium positioning for loyal fans',
      },
    ];
  }

  // ============================================
  // Bundles - Prompts & Parsing
  // ============================================

  private getBundleSystemPrompt(): string {
    return `You are a bundle optimization expert for content creators.
Create attractive content bundles that maximize value.

Rules:
1. Each bundle must contain at least 2 items
2. Bundle price must be less than sum of individual prices
3. Group complementary content together
4. Provide clear value proposition

Response format (JSON array only, no markdown):
[
  {
    "name": "Bundle name",
    "contentIds": ["id1", "id2"],
    "suggestedPrice": number,
    "expectedValue": "value description",
    "reasoning": "explanation"
  }
]`;
  }

  private buildBundlePrompt(request: SuggestBundlesRequest): string {
    const contentList = request.contentItems.map(c =>
      `- ID: ${c.id}, Title: "${c.title}", Type: ${c.type}, Price: $${c.price}, Sales: ${c.salesCount}`
    ).join('\n');

    const preferencesInfo = request.fanPreferences?.length
      ? `\nFan preferences:\n${request.fanPreferences.slice(0, 5).map(p =>
          `- Preferred types: ${p.preferredTypes.join(', ')}, Avg spend: $${p.averageSpend}`
        ).join('\n')}`
      : '';

    return `Create bundle suggestions from these content items:

${contentList}
${preferencesInfo}

Suggest 2-3 bundles that group complementary content.
Bundle prices should offer 15-30% savings vs individual purchase.
Return only valid JSON array.`;
  }

  private parseBundleSuggestions(content: string): BundleSuggestion[] {
    try {
      const jsonStr = this.extractJSON(content);
      const parsed = JSON.parse(jsonStr);
      
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      if (parsed.bundles && Array.isArray(parsed.bundles)) {
        return parsed.bundles;
      }
      
      return [parsed];
    } catch {
      console.error('[OffersAI] Failed to parse bundle suggestions');
      return [];
    }
  }

  private validateBundleSuggestions(
    suggestions: BundleSuggestion[],
    contentItems: ContentItem[]
  ): BundleSuggestion[] {
    const contentMap = new Map(contentItems.map(c => [c.id, c]));

    return suggestions
      .filter(s => {
        // Must have at least 2 items
        if (!s.contentIds || s.contentIds.length < 2) return false;
        
        // All content IDs must exist
        const validIds = s.contentIds.filter(id => contentMap.has(id));
        if (validIds.length < 2) return false;
        
        // Calculate sum of individual prices
        const sumPrice = validIds.reduce((sum, id) => {
          const item = contentMap.get(id);
          return sum + (item?.price || 0);
        }, 0);
        
        // Bundle price must be less than sum
        if (s.suggestedPrice >= sumPrice) return false;
        
        return true;
      })
      .map(s => ({
        name: s.name || 'Content Bundle',
        contentIds: s.contentIds.filter(id => contentMap.has(id)),
        suggestedPrice: Math.round(s.suggestedPrice * 100) / 100,
        expectedValue: s.expectedValue || 'Great value bundle',
        reasoning: s.reasoning || 'Complementary content grouped together',
      }));
  }

  private createFallbackBundleSuggestions(
    request: SuggestBundlesRequest
  ): BundleSuggestion[] {
    const items = request.contentItems;
    if (items.length < 2) return [];

    // Sort by sales count to find popular items
    const sorted = [...items].sort((a, b) => b.salesCount - a.salesCount);
    
    // Create a bundle from top 2-3 items
    const bundleItems = sorted.slice(0, Math.min(3, sorted.length));
    const sumPrice = bundleItems.reduce((sum, item) => sum + item.price, 0);
    const bundlePrice = Math.round(sumPrice * 0.8 * 100) / 100; // 20% discount

    return [{
      name: 'Best Sellers Bundle',
      contentIds: bundleItems.map(i => i.id),
      suggestedPrice: bundlePrice,
      expectedValue: `Save ${Math.round((1 - bundlePrice / sumPrice) * 100)}% vs buying separately`,
      reasoning: 'Bundle of most popular content items',
    }];
  }

  // ============================================
  // Discounts - Prompts & Parsing
  // ============================================

  private getDiscountSystemPrompt(): string {
    return `You are a discount strategy expert for content creators.
Recommend effective promotional strategies.

Available discount types:
- percentage: Percentage off (e.g., 20% off)
- fixed: Fixed amount off (e.g., $5 off)
- bogo: Buy one get one free

Rules:
1. Discount value must be positive
2. For percentage, value should be 5-50
3. Target specific audience segments
4. Provide timing recommendations

Response format (JSON array only, no markdown):
[
  {
    "discountType": "percentage|fixed|bogo",
    "discountValue": number,
    "targetAudience": "audience description",
    "timing": "when to run",
    "reasoning": "explanation"
  }
]`;
  }

  private buildDiscountPrompt(request: RecommendDiscountsRequest): string {
    const segmentInfo = request.fanSegments.map(s =>
      `- ${s.name}: ${s.size} fans, avg spend $${s.averageSpend}, engagement ${s.engagementScore}/10`
    ).join('\n');

    const purchaseInfo = request.purchaseHistory?.length
      ? `\nRecent purchases: ${request.purchaseHistory.length} transactions`
      : '';

    return `Recommend discount strategies for these fan segments:

${segmentInfo}
${purchaseInfo}

Suggest 2-3 discount strategies targeting different segments.
Return only valid JSON array.`;
  }

  private parseDiscountRecommendations(content: string): DiscountRecommendation[] {
    try {
      const jsonStr = this.extractJSON(content);
      const parsed = JSON.parse(jsonStr);
      
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return parsed.recommendations;
      }
      
      return [parsed];
    } catch {
      console.error('[OffersAI] Failed to parse discount recommendations');
      return [];
    }
  }

  private validateDiscountRecommendations(
    recommendations: DiscountRecommendation[]
  ): DiscountRecommendation[] {
    const validTypes: DiscountType[] = ['percentage', 'fixed', 'bogo'];

    return recommendations
      .filter(r => {
        if (!validTypes.includes(r.discountType as DiscountType)) return false;
        if (typeof r.discountValue !== 'number' || r.discountValue <= 0) return false;
        if (r.discountType === 'percentage' && r.discountValue > 100) return false;
        return true;
      })
      .map(r => ({
        discountType: r.discountType as DiscountType,
        discountValue: r.discountValue,
        targetAudience: r.targetAudience || 'All fans',
        timing: r.timing || 'Anytime',
        reasoning: r.reasoning || 'Strategic discount to boost engagement',
      }));
  }

  private createFallbackDiscountRecommendations(
    request: RecommendDiscountsRequest
  ): DiscountRecommendation[] {
    const recommendations: DiscountRecommendation[] = [];

    // Find high-value segment
    const highValue = request.fanSegments.find(s => s.averageSpend > 50);
    if (highValue) {
      recommendations.push({
        discountType: 'percentage',
        discountValue: 15,
        targetAudience: highValue.name,
        timing: 'Weekend promotion',
        reasoning: 'Reward loyal high-spending fans',
      });
    }

    // Find low-engagement segment
    const lowEngagement = request.fanSegments.find(s => s.engagementScore < 5);
    if (lowEngagement) {
      recommendations.push({
        discountType: 'percentage',
        discountValue: 25,
        targetAudience: lowEngagement.name,
        timing: 'Re-engagement campaign',
        reasoning: 'Win back inactive fans with attractive discount',
      });
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        discountType: 'percentage',
        discountValue: 20,
        targetAudience: 'All fans',
        timing: 'Limited time offer',
        reasoning: 'General promotion to boost sales',
      });
    }

    return recommendations;
  }

  // ============================================
  // Utility Methods
  // ============================================

  private extractJSON(content: string): string {
    let jsonStr = content.trim();

    // Remove markdown code blocks
    if (jsonStr.startsWith('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    // Try to find JSON array or object
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }

    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }

    return jsonStr;
  }
}

// ============================================
// Singleton & Factory
// ============================================

let offersAIInstance: OffersAIService | null = null;

/**
 * Get the singleton OffersAIService instance
 */
export function getOffersAIService(): OffersAIService {
  if (!offersAIInstance) {
    offersAIInstance = new OffersAIService();
  }
  return offersAIInstance;
}

/**
 * Create a new OffersAIService with custom AI service
 */
export function createOffersAIService(aiService: AIService): OffersAIService {
  return new OffersAIService(aiService);
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Suggest pricing for content
 */
export async function suggestPricing(
  request: SuggestPricingRequest
): Promise<PricingSuggestion[]> {
  return getOffersAIService().suggestPricing(request);
}

/**
 * Suggest content bundles
 */
export async function suggestBundles(
  request: SuggestBundlesRequest
): Promise<BundleSuggestion[]> {
  return getOffersAIService().suggestBundles(request);
}

/**
 * Recommend discount strategies
 */
export async function recommendDiscounts(
  request: RecommendDiscountsRequest
): Promise<DiscountRecommendation[]> {
  return getOffersAIService().recommendDiscounts(request);
}
