/**
 * SalesAgent - Azure AI Foundry Integration
 * 
 * Handles sales optimization and upsell suggestions using Azure AI Foundry
 * via the Python AI Router service. Uses Llama-3.3-70B for creative tasks.
 * 
 * Feature: azure-foundry-agents-integration, Task 6
 * Requirements: 1.1, 2.3, 3.1-3.3, 5.1, 5.2, 5.4, 6.3, 6.8, 7.1-7.3, 9.3
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { 
  getRouterClient, 
  RouterClient, 
  RouterResponse,
} from '../foundry/router-client';
import { 
  planToTier, 
  detectFrenchLanguage,
  type UserPlan,
  type ClientTier,
  type TypeHint 
} from '../foundry/mapping';
import { calculateCostSimple } from '../foundry/cost-calculator';
import { getCostTrackingService } from '../azure/cost-tracking.service';

// =============================================================================
// Types
// =============================================================================

export interface SalesRequest {
  creatorId: number;
  fanId: string;
  optimizationType: 'upsell' | 'ppv_suggestion' | 'tip_request' | 'subscription_renewal';
  context?: {
    fanPurchaseHistory?: unknown[];
    fanEngagementLevel?: 'high' | 'medium' | 'low';
    availableContent?: unknown[];
    currentConversation?: Array<{ role: string; content: string }>;
    fanPreferences?: Record<string, unknown>;
  };
  accountId?: string;
  plan?: UserPlan;
}

export interface SalesResponseData {
  optimizedMessage: string;
  suggestedPrice?: number;
  confidence: number;
  reasoning: string;
  expectedConversionRate: number;
  alternativeApproaches: string[];
}

export interface SalesUsage {
  model: string;
  deployment: string;
  region: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Cost calculation is now centralized in lib/ai/foundry/cost-calculator.ts


// =============================================================================
// SalesAgent Implementation
// =============================================================================

export class FoundrySalesAgent implements AITeamMember {
  id = 'sales-agent-foundry';
  name = 'Sales Agent (Foundry)';
  role = 'sales_optimization';
  model = 'Llama-3.3-70B'; // Default model, actual model comes from router response
  typeHint: TypeHint = 'creative'; // Requirement 2.3: creative for persuasive message generation
  
  private network: AIKnowledgeNetwork | null = null;
  private costTracker = getCostTrackingService();
  private routerClient: RouterClient;

  constructor(routerClient?: RouterClient) {
    this.routerClient = routerClient || getRouterClient();
  }

  /**
   * Initialize agent with Knowledge Network access
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a sales optimization request
   * Requirement 5.1: Maintain same input/output interface
   */
  async processRequest(request: SalesRequest): Promise<AIResponse> {
    try {
      const response = await this.optimizeForSales(request);
      
      return {
        success: true,
        data: response.data,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Optimize content for sales and conversions
   * 
   * Requirements:
   * - 1.1: Call Python AI Router /route endpoint
   * - 2.3: Hint router with type "creative" for persuasive messages
   * - 3.1-3.3: Map user plan to client_tier
   */
  async optimizeForSales(request: SalesRequest): Promise<{
    data: SalesResponseData;
    usage: SalesUsage;
  }> {
    const { creatorId, fanId, optimizationType, context, accountId, plan } = request;

    // Check quota before making request
    if (accountId) {
      const quotaCheck = await this.costTracker.checkQuota(accountId);
      if (!quotaCheck.allowed) {
        throw new Error('Quota exceeded for this account');
      }
    }

    // Get sales insights from Knowledge Network
    const salesInsights = await this.getSalesInsights(creatorId, fanId, optimizationType);
    
    // Build the prompt with system instructions and context
    const prompt = this.buildPrompt(optimizationType, context, salesInsights);
    
    // Requirement 3.1-3.3: Map user plan to client tier
    const clientTier: ClientTier = planToTier(plan);
    
    // Requirement 2.5: Detect French language for Mistral routing
    const languageHint = detectFrenchLanguage(prompt);

    // Requirement 1.1: Call Python AI Router
    const routerResponse = await this.routerClient.route({
      prompt,
      client_tier: clientTier,
      type_hint: this.typeHint,
      language_hint: languageHint,
    });

    // Parse response and extract structured data
    const responseData = this.parseResponse(routerResponse.output);
    
    // Requirement 7.1-7.3: Calculate cost and log usage
    const usage = this.extractUsage(routerResponse);
    
    if (accountId) {
      await this.logUsage(accountId, creatorId, optimizationType, usage);
    }

    // Store successful sales tactics in Knowledge Network
    if (responseData.confidence > 0.7 && this.network) {
      await this.storeSalesTactic(
        creatorId,
        fanId,
        optimizationType,
        responseData,
        context,
        routerResponse
      );
    }

    return {
      data: responseData,
      usage,
    };
  }

  /**
   * Get sales insights from Knowledge Network
   * Requirement 2.3: Integrate historical sales patterns
   */
  private async getSalesInsights(
    creatorId: number,
    fanId: string,
    optimizationType: string
  ): Promise<{
    successfulTactics: Insight[];
    fanBehavior: Insight[];
    pricingPatterns: Insight[];
  }> {
    if (!this.network) {
      return { successfulTactics: [], fanBehavior: [], pricingPatterns: [] };
    }

    const [successfulTactics, fanBehavior, pricingPatterns] = await Promise.all([
      this.network.getRelevantInsights(creatorId, `sales_tactic_${optimizationType}`, 3),
      this.network.getRelevantInsights(creatorId, 'fan_purchase_behavior', 3),
      this.network.getRelevantInsights(creatorId, 'pricing_optimization', 3),
    ]);

    return { successfulTactics, fanBehavior, pricingPatterns };
  }


  /**
   * Build the prompt with system instructions and context
   * Requirement 6.3, 6.8, 9.3: Optimized English prompt for Llama-3.3-70B with JSON format
   */
  private buildPrompt(
    optimizationType: string,
    context?: SalesRequest['context'],
    insights?: { successfulTactics: Insight[]; fanBehavior: Insight[]; pricingPatterns: Insight[] }
  ): string {
    // System prompt optimized for Llama-3.3-70B (creative)
    let prompt = `You are an AI sales optimization agent specializing in OnlyFans creator monetization.

Your role:
1. Craft persuasive messages that drive conversions
2. Suggest optimal pricing based on fan behavior
3. Identify upsell opportunities without being pushy
4. Maintain authenticity and creator voice
5. Maximize revenue while preserving fan relationships

Optimization type: ${optimizationType}
`;

    // Add engagement level context
    if (context?.fanEngagementLevel) {
      prompt += `Fan engagement level: ${context.fanEngagementLevel}\n`;
    }

    // Add purchase history insights
    if (context?.fanPurchaseHistory && context.fanPurchaseHistory.length > 0) {
      prompt += `\nFan purchase history:\n`;
      context.fanPurchaseHistory.slice(-3).forEach((purchase) => {
        prompt += `- ${JSON.stringify(purchase)}\n`;
      });
    }

    // Add successful tactics from Knowledge Network
    if (insights?.successfulTactics && insights.successfulTactics.length > 0) {
      prompt += `\nSuccessful sales tactics:\n`;
      insights.successfulTactics.forEach(insight => {
        prompt += `- ${JSON.stringify(insight.data)}\n`;
      });
    }

    // Add pricing patterns
    if (insights?.pricingPatterns && insights.pricingPatterns.length > 0) {
      prompt += `\nOptimal pricing patterns:\n`;
      insights.pricingPatterns.forEach(insight => {
        prompt += `- ${JSON.stringify(insight.data)}\n`;
      });
    }

    // Requirement 6.3, 9.3: Add few-shot examples for each optimization type
    prompt += this.getFewShotExamples(optimizationType);

    // Add current conversation context
    if (context?.currentConversation && context.currentConversation.length > 0) {
      prompt += `\nCurrent conversation:\n`;
      context.currentConversation.slice(-2).forEach((msg) => {
        const role = msg.role === 'creator' ? 'Creator' : 'Fan';
        prompt += `${role}: ${msg.content}\n`;
      });
    }

    // Add available content for upsell
    if (context?.availableContent && context.availableContent.length > 0) {
      prompt += `\nAvailable content for upsell:\n`;
      context.availableContent.slice(0, 3).forEach((content) => {
        prompt += `- ${JSON.stringify(content)}\n`;
      });
    }

    // Add fan preferences
    if (context?.fanPreferences) {
      prompt += `\nFan preferences: ${JSON.stringify(context.fanPreferences)}\n`;
    }

    prompt += `
You MUST respond with valid JSON:
{
  "optimizedMessage": "the sales message to send",
  "suggestedPrice": 25.00,
  "confidence": 0.85,
  "reasoning": "explanation of the approach",
  "expectedConversionRate": 0.35,
  "alternativeApproaches": ["alternative 1", "alternative 2"]
}`;

    return prompt;
  }

  /**
   * Get few-shot examples for the optimization type
   * Requirement 6.3, 9.3: Provide optimized few-shot examples
   */
  private getFewShotExamples(optimizationType: string): string {
    const examples: Record<string, string> = {
      upsell: `

Few-shot examples:

Example 1 - High engagement fan:
Input: Fan just purchased a photo set, has high engagement
Output: {
  "optimizedMessage": "Loved that you enjoyed the photos! 😘 I just posted an exclusive behind-the-scenes video that shows how I created that look. It's only $15 and I think you'll love it! 💕",
  "suggestedPrice": 15.00,
  "confidence": 0.88,
  "reasoning": "Fan is engaged and just made a purchase, perfect timing for related content upsell",
  "expectedConversionRate": 0.42,
  "alternativeApproaches": ["Bundle offer with discount", "Tease with preview clip"]
}

Example 2 - Medium engagement fan:
Input: Fan views content regularly but hasn't purchased in 2 weeks
Output: {
  "optimizedMessage": "Hey! I noticed you've been enjoying my recent posts 💖 I have something special just for you - a personalized video message for $20. Want to make your day? 😊",
  "suggestedPrice": 20.00,
  "confidence": 0.75,
  "reasoning": "Re-engagement strategy with personalized offer to reignite purchase behavior",
  "expectedConversionRate": 0.28,
  "alternativeApproaches": ["Limited time discount", "Preview of upcoming content"]
}`,

      ppv_suggestion: `

Few-shot examples:

Example 1 - New PPV content:
Input: Just created new exclusive content, fan has purchased PPV before
Output: {
  "optimizedMessage": "🔥 NEW exclusive content just dropped! This is my hottest shoot yet and I can't wait for you to see it. Only $25 for the full set. Trust me, you don't want to miss this one! 😈",
  "suggestedPrice": 25.00,
  "confidence": 0.82,
  "reasoning": "Fan has PPV purchase history, use excitement and FOMO to drive conversion",
  "expectedConversionRate": 0.38,
  "alternativeApproaches": ["Early bird discount", "Bundle with previous content"]
}`,

      tip_request: `

Few-shot examples:

Example 1 - After positive interaction:
Input: Fan just sent compliments, high engagement
Output: {
  "optimizedMessage": "You always know how to make me smile! 🥰 If you want to make my day even better, tips are always appreciated and help me create more content for you! 💕",
  "confidence": 0.79,
  "reasoning": "Capitalize on positive sentiment, soft ask that maintains relationship",
  "expectedConversionRate": 0.32,
  "alternativeApproaches": ["Offer reward for tip", "Mention specific goal"]
}`,

      subscription_renewal: `

Few-shot examples:

Example 1 - Renewal reminder:
Input: Subscription expires in 3 days, fan has been active
Output: {
  "optimizedMessage": "Hey babe! Just a heads up that your subscription renews in 3 days 💖 I have so much exciting content planned for next month - you won't want to miss it! Can't wait to keep sharing with you! 😘",
  "confidence": 0.85,
  "reasoning": "Proactive reminder with value proposition for upcoming content",
  "expectedConversionRate": 0.68,
  "alternativeApproaches": ["Offer renewal bonus", "Tease upcoming content"]
}`,
    };

    return examples[optimizationType] || '';
  }


  /**
   * Parse the AI response
   * Requirement 6.8: Parse JSON output with required fields
   */
  private parseResponse(text: string): SalesResponseData {
    try {
      const parsed = JSON.parse(text);
      return {
        optimizedMessage: parsed.optimizedMessage || text,
        suggestedPrice: typeof parsed.suggestedPrice === 'number' ? parsed.suggestedPrice : undefined,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reasoning: parsed.reasoning || 'No reasoning provided',
        expectedConversionRate: typeof parsed.expectedConversionRate === 'number' 
          ? parsed.expectedConversionRate 
          : 0.2,
        alternativeApproaches: Array.isArray(parsed.alternativeApproaches) 
          ? parsed.alternativeApproaches 
          : [],
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        optimizedMessage: text,
        confidence: 0.4,
        reasoning: 'Failed to parse structured response',
        expectedConversionRate: 0.2,
        alternativeApproaches: [],
      };
    }
  }

  /**
   * Extract usage statistics from router response
   * Requirement 5.2, 7.1-7.3: Convert usage to existing format with cost
   * Uses centralized cost calculator from lib/ai/foundry/cost-calculator.ts
   */
  private extractUsage(response: RouterResponse): SalesUsage {
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const costUsd = calculateCostSimple(response.model, inputTokens, outputTokens);

    return {
      model: response.model,
      deployment: response.deployment,
      region: response.region,
      inputTokens,
      outputTokens,
      costUsd,
    };
  }

  /**
   * Log usage to cost tracking service
   * Requirement 7.1, 7.3: Log with model, deployment, region
   */
  private async logUsage(
    accountId: string,
    creatorId: number,
    optimizationType: string,
    usage: SalesUsage
  ): Promise<void> {
    await this.costTracker.logUsage(
      {
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        totalTokens: usage.inputTokens + usage.outputTokens,
        model: 'gpt-4' as const, // Use gpt-4 as placeholder for logging compatibility
        estimatedCost: usage.costUsd,
      },
      {
        accountId,
        creatorId: creatorId.toString(),
        operation: `sales_${optimizationType}`,
        correlationId: `sales-${Date.now()}-${optimizationType}`,
        timestamp: new Date(),
      } as any
    );
  }

  /**
   * Store successful sales tactic in Knowledge Network
   * Requirement 5.4: Include actual model from router response in metadata
   */
  private async storeSalesTactic(
    creatorId: number,
    fanId: string,
    optimizationType: string,
    salesData: SalesResponseData,
    context: SalesRequest['context'],
    routerResponse: RouterResponse
  ): Promise<void> {
    if (!this.network) return;

    const insight: Insight = {
      source: this.id,
      type: `sales_tactic_${optimizationType}`,
      confidence: salesData.confidence,
      data: {
        fanId,
        optimizationType,
        suggestedPrice: salesData.suggestedPrice,
        expectedConversionRate: salesData.expectedConversionRate,
        fanEngagementLevel: context?.fanEngagementLevel,
        hadPreviousPurchases: context?.fanPurchaseHistory && context.fanPurchaseHistory.length > 0,
        timestamp: new Date().toISOString(),
        // Requirement 5.4: Include actual model info from router
        model: routerResponse.model,
        deployment: routerResponse.deployment,
        region: routerResponse.region,
        provider: 'azure-foundry',
      },
      timestamp: new Date(),
    };

    await this.network.broadcastInsight(creatorId, insight);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new FoundrySalesAgent instance
 */
export function createFoundrySalesAgent(routerClient?: RouterClient): FoundrySalesAgent {
  return new FoundrySalesAgent(routerClient);
}
