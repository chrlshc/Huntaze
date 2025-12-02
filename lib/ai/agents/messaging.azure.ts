/**
 * MessagingAgent - Azure OpenAI Migration
 * 
 * Handles fan interactions and message generation using Azure OpenAI Service
 * 
 * Feature: huntaze-ai-azure-migration, Task 10
 * Requirements: 2.1, 10.1, 10.2
 * Validates: Property 6 (MessagingAI Model Selection)
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { azureOpenAIRouter, type RouterOptions } from '../azure/azure-openai-router';
import { getCostTrackingService } from '../azure/cost-tracking.service';
import type { ChatMessage } from '../azure/azure-openai.types';

export class AzureMessagingAgent implements AITeamMember {
  id = 'messaging-agent-azure';
  name = 'Messaging Agent (Azure)';
  role = 'fan_interaction';
  model = 'gpt-4'; // Use GPT-4 standard tier for messaging
  
  private network: AIKnowledgeNetwork | null = null;
  private costTracker = getCostTrackingService();

  /**
   * Initialize agent with Knowledge Network access
   * Requirement 2.1: Access Knowledge Network for context
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a fan message request
   * Requirement 2.1: Generate contextual response based on fan history
   */
  async processRequest(request: {
    creatorId: number;
    fanId: string;
    message: string;
    context?: {
      fanHistory?: any[];
      creatorStyle?: string;
      previousMessages?: any[];
      personalityProfile?: any;
    };
    accountId?: string;
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise';
  }): Promise<AIResponse> {
    try {
      const response = await this.generateResponse(
        request.creatorId,
        request.fanId,
        request.message,
        request.context,
        request.accountId,
        request.plan
      );
      
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a contextual response to a fan message
   * 
   * Requirements:
   * - 2.1: Generate contextual response using GPT-4 with personality-aware prompts
   * - 10.1: Use Azure OpenAI-specific formatting
   * - 10.2: Enable JSON mode for structured output
   */
  async generateResponse(
    creatorId: number,
    fanId: string,
    message: string,
    context?: {
      fanHistory?: any[];
      creatorStyle?: string;
      previousMessages?: any[];
      personalityProfile?: any;
    },
    accountId?: string,
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise'
  ): Promise<{
    response: string;
    confidence: number;
    suggestedUpsell?: string;
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

    // Requirement 2.1: Get relevant insights from Knowledge Network
    const insights = await this.getRelevantInsights(creatorId, fanId);
    
    // Build messages with context and personality
    const messages = this.buildMessages(message, context, insights);
    
    // Router options for standard tier (GPT-4)
    const routerOptions: RouterOptions = {
      tier: 'standard', // Use standard tier for messaging
      plan: plan || 'pro',
      accountId: accountId || `creator-${creatorId}`,
      correlationId: `msg-${Date.now()}-${fanId}`,
    };

    // Requirement 10.2: Enable JSON mode for structured output
    const result = await azureOpenAIRouter.chat(messages, {
      ...routerOptions,
      temperature: 0.8, // Higher temperature for natural conversation
      maxTokens: 500,
      responseFormat: { type: 'json_object' }, // Enable JSON mode
    });

    // Parse response
    const responseData = this.parseResponse(result.text);
    
    // Log usage to Application Insights
    if (accountId) {
      await this.costTracker.logUsage(
        {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          model: 'gpt-4',
          estimatedCost: result.cost,
        },
        {
          accountId,
          creatorId: creatorId.toString(),
          operation: 'fan_messaging',
          correlationId: routerOptions.correlationId!,
          timestamp: new Date(),
        }
      );
    }

    // Store successful interaction insight
    if (responseData.confidence > 0.7 && this.network) {
      await this.storeInteractionInsight(
        creatorId,
        fanId,
        message,
        responseData.response,
        insights
      );
    }

    return {
      ...responseData,
      usage: {
        model: result.model,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        costUsd: result.cost,
      },
    };
  }

  /**
   * Get relevant insights from Knowledge Network
   * Requirement 2.1: Integrate insights from other agents
   */
  private async getRelevantInsights(creatorId: number, fanId: string): Promise<{
    fanPreferences: Insight[];
    salesTactics: Insight[];
    engagementPatterns: Insight[];
  }> {
    if (!this.network) {
      return { fanPreferences: [], salesTactics: [], engagementPatterns: [] };
    }

    const [fanPreferences, salesTactics, engagementPatterns] = await Promise.all([
      this.network.getRelevantInsights(creatorId, 'fan_preference', 3),
      this.network.getRelevantInsights(creatorId, 'sales_tactic', 3),
      this.network.getRelevantInsights(creatorId, 'engagement_pattern', 3),
    ]);

    return {
      fanPreferences,
      salesTactics,
      engagementPatterns,
    };
  }

  /**
   * Build chat messages with context and insights
   * Requirement 10.1: Use Azure OpenAI-specific formatting
   */
  private buildMessages(
    message: string,
    context?: {
      fanHistory?: any[];
      creatorStyle?: string;
      previousMessages?: any[];
      personalityProfile?: any;
    },
    insights?: {
      fanPreferences: Insight[];
      salesTactics: Insight[];
      engagementPatterns: Insight[];
    }
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // System message with personality and context
    let systemPrompt = `You are an AI assistant helping an OnlyFans creator respond to fan messages.

Your goal is to generate responses that:
1. Match the creator's communication style and personality
2. Are warm, engaging, and personal
3. Consider the fan's preferences and interaction history
4. Subtly suggest upsell opportunities when appropriate (PPV content, tips, exclusive content)
5. Maintain professional boundaries

`;

    // Add creator style if available
    if (context?.creatorStyle) {
      systemPrompt += `\nCreator's communication style: ${context.creatorStyle}`;
    }

    // Add personality profile if available
    if (context?.personalityProfile) {
      systemPrompt += `\nPersonality traits: ${JSON.stringify(context.personalityProfile)}`;
    }

    // Add insights from Knowledge Network
    if (insights) {
      if (insights.fanPreferences.length > 0) {
        systemPrompt += `\n\nFan preferences learned:\n`;
        insights.fanPreferences.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (insights.salesTactics.length > 0) {
        systemPrompt += `\nEffective sales tactics:\n`;
        insights.salesTactics.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }
    }

    systemPrompt += `\n\nYou MUST respond with valid JSON in this exact format:
{
  "response": "the message to send to the fan",
  "confidence": 0.85,
  "suggestedUpsell": "optional upsell suggestion or null",
  "reasoning": "brief explanation of your approach"
}`;

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add previous conversation context
    if (context?.previousMessages && context.previousMessages.length > 0) {
      context.previousMessages.slice(-3).forEach((msg: any) => {
        messages.push({
          role: msg.role === 'creator' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current fan message
    messages.push({
      role: 'user',
      content: `Fan's message: "${message}"`,
    });

    return messages;
  }

  /**
   * Parse the AI response
   * Requirement 10.2: Parse JSON mode output
   */
  private parseResponse(text: string): {
    response: string;
    confidence: number;
    suggestedUpsell?: string;
  } {
    try {
      // Parse JSON response
      const parsed = JSON.parse(text);
      return {
        response: parsed.response || text,
        confidence: parsed.confidence || 0.5,
        suggestedUpsell: parsed.suggestedUpsell || undefined,
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        response: text,
        confidence: 0.5,
      };
    }
  }

  /**
   * Store successful interaction insight
   * Requirement 2.1: Share insights with Knowledge Network
   */
  private async storeInteractionInsight(
    creatorId: number,
    fanId: string,
    originalMessage: string,
    response: string,
    insights: {
      fanPreferences: Insight[];
      salesTactics: Insight[];
      engagementPatterns: Insight[];
    }
  ): Promise<void> {
    if (!this.network) return;

    const insight: Insight = {
      source: this.id,
      type: 'successful_interaction',
      confidence: 0.8,
      data: {
        fanId,
        messageType: this.classifyMessage(originalMessage),
        responseStrategy: this.classifyResponse(response),
        hadUpsell: response.toLowerCase().includes('exclusive') || 
                    response.toLowerCase().includes('special'),
        timestamp: new Date().toISOString(),
        model: 'gpt-4',
        provider: 'azure',
      },
      timestamp: new Date(),
    };

    await this.network.broadcastInsight(creatorId, insight);
  }

  /**
   * Classify the type of fan message
   */
  private classifyMessage(message: string): string {
    const lower = message.toLowerCase();
    
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return 'greeting';
    }
    if (lower.includes('?')) {
      return 'question';
    }
    if (lower.includes('love') || lower.includes('beautiful') || lower.includes('sexy')) {
      return 'compliment';
    }
    if (lower.includes('buy') || lower.includes('purchase') || lower.includes('content')) {
      return 'purchase_intent';
    }
    
    return 'general';
  }

  /**
   * Classify the response strategy used
   */
  private classifyResponse(response: string): string {
    const lower = response.toLowerCase();
    
    if (lower.includes('exclusive') || lower.includes('special')) {
      return 'upsell';
    }
    if (lower.includes('thank') || lower.includes('appreciate')) {
      return 'appreciation';
    }
    if (lower.includes('?')) {
      return 'engagement_question';
    }
    
    return 'conversational';
  }
}
