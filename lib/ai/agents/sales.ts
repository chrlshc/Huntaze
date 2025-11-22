/**
 * SalesAgent - Handles conversion optimization and sales messaging
 * 
 * Generates optimized sales messages with psychological tactics
 * Requirements: 1.2, 1.5
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { generateTextWithBilling } from '../gemini-billing.service';

export class SalesAgent implements AITeamMember {
  id = 'sales-agent';
  name = 'Sales Agent';
  role = 'conversion_optimization';
  model = 'gemini-2.5-flash'; // Use faster model for sales messaging
  
  private network: AIKnowledgeNetwork | null = null;

  /**
   * Initialize agent with Knowledge Network access
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a sales optimization request
   */
  async processRequest(request: {
    creatorId: number;
    fanId: string;
    context: {
      fanHistory?: any;
      purchaseHistory?: any[];
      engagementLevel?: string;
      contentType?: string;
      pricePoint?: number;
    };
  }): Promise<AIResponse> {
    try {
      const result = await this.optimizeSalesMessage(
        request.creatorId,
        request.fanId,
        request.context
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Optimize sales message for conversion
   * 
   * Requirements:
   * - 1.2: Generate optimized sales messages with psychological tactics
   * - 1.2: Add pricing optimization
   * - 1.2: Track conversion strategies
   * - 1.5: Store sales insights
   */
  async optimizeSalesMessage(
    creatorId: number,
    fanId: string,
    context: {
      fanHistory?: any;
      purchaseHistory?: any[];
      engagementLevel?: string;
      contentType?: string;
      pricePoint?: number;
    }
  ): Promise<{
    message: string;
    tactics: string[];
    suggestedPrice?: number;
    confidence: number;
    usage: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };
  }> {
    // Get relevant sales insights from Knowledge Network
    const insights = await this.getSalesInsights(creatorId, fanId);
    
    // Build prompt with sales psychology
    const prompt = this.buildPrompt(context, insights);
    
    // Generate optimized message via Gemini
    const result = await generateTextWithBilling({
      prompt,
      metadata: {
        creatorId,
        feature: 'sales_optimization',
        agentId: this.id,
      },
      model: this.model,
      temperature: 0.7, // Balanced temperature for persuasive but natural messaging
      maxOutputTokens: 400,
    });

    // Parse response
    const salesData = this.parseResponse(result.text);
    
    // Store sales insights
    if (salesData.confidence > 0.7 && this.network) {
      await this.storeSalesInsight(creatorId, fanId, context, salesData);
    }

    return {
      ...salesData,
      usage: result.usage,
    };
  }

  /**
   * Get relevant sales insights from Knowledge Network
   */
  private async getSalesInsights(creatorId: number, fanId: string): Promise<{
    salesTactics: Insight[];
    conversionStrategies: Insight[];
    pricingInsights: Insight[];
  }> {
    if (!this.network) {
      return { salesTactics: [], conversionStrategies: [], pricingInsights: [] };
    }

    const [salesTactics, conversionStrategies, pricingInsights] = await Promise.all([
      this.network.getRelevantInsights(creatorId, 'sales_tactic', 5),
      this.network.getRelevantInsights(creatorId, 'conversion_strategy', 5),
      this.network.getRelevantInsights(creatorId, 'pricing_insight', 3),
    ]);

    return {
      salesTactics,
      conversionStrategies,
      pricingInsights,
    };
  }

  /**
   * Build prompt with sales psychology
   */
  private buildPrompt(
    context: {
      fanHistory?: any;
      purchaseHistory?: any[];
      engagementLevel?: string;
      contentType?: string;
      pricePoint?: number;
    },
    insights: {
      salesTactics: Insight[];
      conversionStrategies: Insight[];
      pricingInsights: Insight[];
    }
  ): string {
    let prompt = `You are an AI sales optimization expert helping an OnlyFans creator maximize conversions.

Context:
- Fan engagement level: ${context.engagementLevel || 'medium'}
- Content type: ${context.contentType || 'exclusive content'}
- Current price point: $${context.pricePoint || 'not set'}
- Purchase history: ${context.purchaseHistory?.length || 0} previous purchases

`;

    // Add purchase history details
    if (context.purchaseHistory && context.purchaseHistory.length > 0) {
      prompt += `Previous purchases:\n`;
      context.purchaseHistory.slice(-3).forEach((purchase: any) => {
        prompt += `- ${purchase.type || 'content'} at $${purchase.price || 'unknown'}\n`;
      });
      prompt += `\n`;
    }

    // Add successful tactics from Knowledge Network
    if (insights.salesTactics.length > 0) {
      prompt += `Successful sales tactics:\n`;
      insights.salesTactics.forEach(insight => {
        prompt += `- ${JSON.stringify(insight.data)}\n`;
      });
      prompt += `\n`;
    }

    // Add pricing insights
    if (insights.pricingInsights.length > 0) {
      prompt += `Pricing insights:\n`;
      insights.pricingInsights.forEach(insight => {
        prompt += `- ${JSON.stringify(insight.data)}\n`;
      });
      prompt += `\n`;
    }

    prompt += `Generate an optimized sales message that:

1. Uses proven psychological tactics:
   - Scarcity (limited time/quantity)
   - Social proof (others are buying)
   - Exclusivity (special access)
   - FOMO (fear of missing out)
   - Reciprocity (give value first)
   - Authority (your expertise)

2. Matches the fan's engagement level and history
3. Creates urgency without being pushy
4. Highlights unique value proposition
5. Includes a clear call-to-action
6. Feels personal and authentic

Also suggest:
- Optimal pricing based on fan history and market insights
- Which psychological tactics to emphasize
- Timing recommendations

Return your response in this JSON format:
{
  "message": "the sales message to send",
  "tactics": ["tactic1", "tactic2", ...],
  "suggestedPrice": number or null,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of strategy"
}`;

    return prompt;
  }

  /**
   * Parse the AI response
   */
  private parseResponse(text: string): {
    message: string;
    tactics: string[];
    suggestedPrice?: number;
    confidence: number;
  } {
    try {
      const parsed = JSON.parse(text);
      return {
        message: parsed.message || text,
        tactics: Array.isArray(parsed.tactics) ? parsed.tactics : [],
        suggestedPrice: parsed.suggestedPrice || undefined,
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      // If not JSON, extract tactics from text
      const tactics = this.extractTactics(text);
      return {
        message: text,
        tactics,
        confidence: 0.5,
      };
    }
  }

  /**
   * Extract sales tactics from unstructured text
   */
  private extractTactics(text: string): string[] {
    const knownTactics = [
      'scarcity', 'urgency', 'exclusivity', 'fomo', 'social proof',
      'reciprocity', 'authority', 'limited time', 'limited quantity',
      'special offer', 'exclusive access'
    ];

    const lower = text.toLowerCase();
    return knownTactics.filter(tactic => lower.includes(tactic));
  }

  /**
   * Store sales insight in Knowledge Network
   */
  private async storeSalesInsight(
    creatorId: number,
    fanId: string,
    context: any,
    salesData: {
      message: string;
      tactics: string[];
      suggestedPrice?: number;
      confidence: number;
    }
  ): Promise<void> {
    if (!this.network) return;

    // Store sales tactic insight
    const tacticInsight: Insight = {
      source: this.id,
      type: 'sales_tactic',
      confidence: salesData.confidence,
      data: {
        fanId,
        tactics: salesData.tactics,
        contentType: context.contentType,
        engagementLevel: context.engagementLevel,
        hadPurchaseHistory: (context.purchaseHistory?.length || 0) > 0,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };
    await this.network.broadcastInsight(creatorId, tacticInsight);

    // Store pricing insight if price was suggested
    if (salesData.suggestedPrice) {
      const pricingInsight: Insight = {
        source: this.id,
        type: 'pricing_insight',
        confidence: salesData.confidence,
        data: {
          contentType: context.contentType,
          suggestedPrice: salesData.suggestedPrice,
          originalPrice: context.pricePoint,
          fanEngagement: context.engagementLevel,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      };
      await this.network.broadcastInsight(creatorId, pricingInsight);
    }

    // Store conversion strategy
    const strategyInsight: Insight = {
      source: this.id,
      type: 'conversion_strategy',
      confidence: salesData.confidence,
      data: {
        primaryTactic: salesData.tactics[0] || 'general',
        messageLength: salesData.message.length,
        hasUrgency: salesData.tactics.some(t => 
          t.includes('urgency') || t.includes('scarcity') || t.includes('limited')
        ),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };
    await this.network.broadcastInsight(creatorId, strategyInsight);
  }
}
