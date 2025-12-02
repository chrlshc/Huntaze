/**
 * SalesAgent - Azure OpenAI Migration
 * 
 * Handles sales optimization and upsell suggestions using Azure OpenAI Service
 * 
 * Feature: huntaze-ai-azure-migration, Task 12
 * Requirements: 2.3, 10.3, 10.5
 * Validates: Property 4 (Agent model assignment - SalesAI)
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { azureOpenAIRouter, type RouterOptions } from '../azure/azure-openai-router';
import { getCostTrackingService } from '../azure/cost-tracking.service';
import type { ChatMessage } from '../azure/azure-openai.types';

export class AzureSalesAgent implements AITeamMember {
  id = 'sales-agent-azure';
  name = 'Sales Agent (Azure)';
  role = 'sales_optimization';
  model = 'gpt-35-turbo'; // Use GPT-3.5 Turbo economy tier for sales
  
  private network: AIKnowledgeNetwork | null = null;
  private costTracker = getCostTrackingService();
  
  // Requirement 10.3: Prompt caching for repeated contexts
  private promptCache = new Map<string, { prompt: string; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  /**
   * Initialize agent with Knowledge Network access
   * Requirement 2.3: Access Knowledge Network for sales insights
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a sales optimization request
   * Requirement 2.3: Optimize messages for upsells and conversions
   */
  async processRequest(request: {
    creatorId: number;
    fanId: string;
    context: {
      fanPurchaseHistory?: any[];
      fanEngagementLevel?: 'high' | 'medium' | 'low';
      availableContent?: any[];
      currentConversation?: any[];
      fanPreferences?: any;
    };
    optimizationType: 'upsell' | 'ppv_suggestion' | 'tip_request' | 'subscription_renewal';
    accountId?: string;
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise';
  }): Promise<AIResponse> {
    try {
      const optimization = await this.optimizeForSales(
        request.creatorId,
        request.fanId,
        request.context,
        request.optimizationType,
        request.accountId,
        request.plan
      );
      
      return {
        success: true,
        data: optimization,
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
   * - 2.3: Use GPT-3.5 Turbo for cost-effective sales optimization
   * - 10.3: Implement prompt caching for repeated contexts
   * - 10.5: Include few-shot examples in prompts
   */
  async optimizeForSales(
    creatorId: number,
    fanId: string,
    context: {
      fanPurchaseHistory?: any[];
      fanEngagementLevel?: 'high' | 'medium' | 'low';
      availableContent?: any[];
      currentConversation?: any[];
      fanPreferences?: any;
    },
    optimizationType: 'upsell' | 'ppv_suggestion' | 'tip_request' | 'subscription_renewal',
    accountId?: string,
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise'
  ): Promise<{
    optimizedMessage: string;
    suggestedPrice?: number;
    confidence: number;
    reasoning: string;
    expectedConversionRate: number;
    alternativeApproaches: string[];
    usage: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };
  }> {
    // Check quota before making request
    if (accountId) {
      const quotaCheck = await this.costTracker.checkQuota(accountId);
      if (!quotaCheck.allowed) {
        throw new Error('Quota exceeded for this account');
      }
    }

    // Requirement 2.3: Get sales insights from Knowledge Network
    const salesInsights = await this.getSalesInsights(creatorId, fanId, optimizationType);
    
    // Requirement 10.3: Check prompt cache for repeated contexts
    const cacheKey = this.generateCacheKey(creatorId, optimizationType, context);
    const cachedPrompt = this.getCachedPrompt(cacheKey);
    
    // Build messages with few-shot examples and context
    const messages = this.buildSalesMessages(
      optimizationType,
      context,
      salesInsights,
      cachedPrompt
    );
    
    // Cache the system prompt for future use
    if (!cachedPrompt && messages.length > 0) {
      this.cachePrompt(cacheKey, messages[0].content);
    }
    
    // Router options for economy tier (GPT-3.5 Turbo)
    const routerOptions: RouterOptions = {
      tier: 'economy', // Use economy tier for sales optimization
      plan: plan || 'pro',
      accountId: accountId || `creator-${creatorId}`,
      correlationId: `sales-${Date.now()}-${optimizationType}`,
    };

    // Requirement 2.3: Use GPT-3.5 Turbo with optimized settings
    const result = await azureOpenAIRouter.chat(messages, {
      ...routerOptions,
      temperature: 0.7, // Balanced creativity for sales copy
      maxTokens: 400, // Reduced tokens for economy
      responseFormat: { type: 'json_object' }, // Enable JSON mode
    });

    // Parse response
    const salesData = this.parseSalesResponse(result.text);
    
    // Log usage to Application Insights
    if (accountId) {
      await this.costTracker.logUsage(
        {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          model: 'gpt-35-turbo',
          estimatedCost: result.cost,
        },
        {
          accountId,
          creatorId: creatorId.toString(),
          operation: `sales_${optimizationType}`,
          correlationId: routerOptions.correlationId!,
          timestamp: new Date(),
        }
      );
    }

    // Store successful sales tactics in Knowledge Network
    if (salesData.confidence > 0.7 && this.network) {
      await this.storeSalesTactic(
        creatorId,
        fanId,
        optimizationType,
        salesData,
        context
      );
    }

    return {
      ...salesData,
      usage: {
        model: result.model,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        costUsd: result.cost,
      },
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

    return {
      successfulTactics,
      fanBehavior,
      pricingPatterns,
    };
  }

  /**
   * Build chat messages with few-shot examples
   * Requirement 10.5: Include few-shot examples in prompts
   */
  private buildSalesMessages(
    optimizationType: string,
    context: {
      fanPurchaseHistory?: any[];
      fanEngagementLevel?: 'high' | 'medium' | 'low';
      availableContent?: any[];
      currentConversation?: any[];
      fanPreferences?: any;
    },
    insights: {
      successfulTactics: Insight[];
      fanBehavior: Insight[];
      pricingPatterns: Insight[];
    },
    cachedPrompt?: string
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Use cached prompt if available, otherwise build new one
    let systemPrompt = cachedPrompt;
    
    if (!systemPrompt) {
      systemPrompt = `You are an AI sales optimization agent specializing in OnlyFans creator monetization.

Your role is to:
1. Craft persuasive messages that drive conversions
2. Suggest optimal pricing based on fan behavior
3. Identify upsell opportunities without being pushy
4. Maintain authenticity and creator voice
5. Maximize revenue while preserving fan relationships

Optimization Type: ${optimizationType}
`;

      // Add engagement level context
      if (context.fanEngagementLevel) {
        systemPrompt += `\nFan Engagement Level: ${context.fanEngagementLevel}`;
      }

      // Add purchase history insights
      if (context.fanPurchaseHistory && context.fanPurchaseHistory.length > 0) {
        systemPrompt += `\n\nFan Purchase History:\n`;
        context.fanPurchaseHistory.slice(-3).forEach((purchase: any) => {
          systemPrompt += `- ${JSON.stringify(purchase)}\n`;
        });
      }

      // Add successful tactics from Knowledge Network
      if (insights.successfulTactics.length > 0) {
        systemPrompt += `\n\nSuccessful Sales Tactics:\n`;
        insights.successfulTactics.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      // Add pricing patterns
      if (insights.pricingPatterns.length > 0) {
        systemPrompt += `\nOptimal Pricing Patterns:\n`;
        insights.pricingPatterns.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      // Requirement 10.5: Add few-shot examples
      systemPrompt += this.getFewShotExamples(optimizationType);

      systemPrompt += `\n\nYou MUST respond with valid JSON in this exact format:
{
  "optimizedMessage": "the sales message to send",
  "suggestedPrice": 25.00,
  "confidence": 0.85,
  "reasoning": "explanation of the approach",
  "expectedConversionRate": 0.35,
  "alternativeApproaches": ["alternative 1", "alternative 2"]
}`;
    }

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add current conversation context
    if (context.currentConversation && context.currentConversation.length > 0) {
      context.currentConversation.slice(-2).forEach((msg: any) => {
        messages.push({
          role: msg.role === 'creator' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add available content for upsell
    let userPrompt = `Optimization request: ${optimizationType}\n`;
    
    if (context.availableContent && context.availableContent.length > 0) {
      userPrompt += `\nAvailable content for upsell:\n`;
      context.availableContent.slice(0, 3).forEach((content: any) => {
        userPrompt += `- ${JSON.stringify(content)}\n`;
      });
    }

    if (context.fanPreferences) {
      userPrompt += `\nFan preferences: ${JSON.stringify(context.fanPreferences)}`;
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    return messages;
  }

  /**
   * Get few-shot examples for the optimization type
   * Requirement 10.5: Provide optimized few-shot examples
   */
  private getFewShotExamples(optimizationType: string): string {
    const examples: Record<string, string> = {
      upsell: `

Few-shot Examples:

Example 1 - High Engagement Fan:
Input: Fan just purchased a photo set, has high engagement
Output: {
  "optimizedMessage": "Loved that you enjoyed the photos! 😘 I just posted an exclusive behind-the-scenes video that shows how I created that look. It's only $15 and I think you'll love it! 💕",
  "suggestedPrice": 15.00,
  "confidence": 0.88,
  "reasoning": "Fan is engaged and just made a purchase, perfect timing for related content upsell",
  "expectedConversionRate": 0.42,
  "alternativeApproaches": ["Bundle offer with discount", "Tease with preview clip"]
}

Example 2 - Medium Engagement Fan:
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

Few-shot Examples:

Example 1 - New PPV Content:
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

Few-shot Examples:

Example 1 - After Positive Interaction:
Input: Fan just sent compliments, high engagement
Output: {
  "optimizedMessage": "You always know how to make me smile! 🥰 If you want to make my day even better, tips are always appreciated and help me create more content for you! 💕",
  "confidence": 0.79,
  "reasoning": "Capitalize on positive sentiment, soft ask that maintains relationship",
  "expectedConversionRate": 0.32,
  "alternativeApproaches": ["Offer reward for tip", "Mention specific goal"]
}`,

      subscription_renewal: `

Few-shot Examples:

Example 1 - Renewal Reminder:
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
   * Parse the AI sales response
   */
  private parseSalesResponse(text: string): {
    optimizedMessage: string;
    suggestedPrice?: number;
    confidence: number;
    reasoning: string;
    expectedConversionRate: number;
    alternativeApproaches: string[];
  } {
    try {
      // Parse JSON response
      const parsed = JSON.parse(text);
      
      return {
        optimizedMessage: parsed.optimizedMessage || text,
        suggestedPrice: parsed.suggestedPrice,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'No reasoning provided',
        expectedConversionRate: parsed.expectedConversionRate || 0.2,
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
   * Store successful sales tactic in Knowledge Network
   * Requirement 2.3: Share sales insights with other agents
   */
  private async storeSalesTactic(
    creatorId: number,
    fanId: string,
    optimizationType: string,
    salesData: {
      optimizedMessage: string;
      suggestedPrice?: number;
      confidence: number;
      expectedConversionRate: number;
    },
    context: {
      fanEngagementLevel?: 'high' | 'medium' | 'low';
      fanPurchaseHistory?: any[];
    }
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
        fanEngagementLevel: context.fanEngagementLevel,
        hadPreviousPurchases: context.fanPurchaseHistory && context.fanPurchaseHistory.length > 0,
        timestamp: new Date().toISOString(),
        model: 'gpt-35-turbo',
        provider: 'azure',
      },
      timestamp: new Date(),
    };

    await this.network.broadcastInsight(creatorId, insight);
  }

  /**
   * Generate cache key for prompt caching
   * Requirement 10.3: Implement prompt caching
   */
  private generateCacheKey(
    creatorId: number,
    optimizationType: string,
    context: any
  ): string {
    // Create a stable cache key based on creator and optimization type
    // Don't include dynamic data like fanId or specific content
    return `sales-${creatorId}-${optimizationType}-${context.fanEngagementLevel || 'unknown'}`;
  }

  /**
   * Get cached prompt if available and not expired
   * Requirement 10.3: Retrieve cached prompts
   */
  private getCachedPrompt(cacheKey: string): string | undefined {
    const cached = this.promptCache.get(cacheKey);
    
    if (!cached) {
      return undefined;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.promptCache.delete(cacheKey);
      return undefined;
    }

    return cached.prompt;
  }

  /**
   * Cache a prompt for future use
   * Requirement 10.3: Store prompts in cache
   */
  private cachePrompt(cacheKey: string, prompt: string): void {
    this.promptCache.set(cacheKey, {
      prompt,
      timestamp: Date.now(),
    });

    // Clean up old cache entries (simple LRU)
    if (this.promptCache.size > 100) {
      const oldestKey = this.promptCache.keys().next().value;
      this.promptCache.delete(oldestKey);
    }
  }
}
