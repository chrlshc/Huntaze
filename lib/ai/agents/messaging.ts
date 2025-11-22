/**
 * MessagingAgent - Handles fan interactions and message generation
 * 
 * Generates contextual responses to fan messages with personality matching
 * Requirements: 1.1, 1.2, 1.5
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { generateTextWithBilling } from '../gemini-billing.service';

export class MessagingAgent implements AITeamMember {
  id = 'messaging-agent';
  name = 'Messaging Agent';
  role = 'fan_interaction';
  model = 'gemini-2.5-flash'; // Use faster model for real-time messaging
  
  private network: AIKnowledgeNetwork | null = null;

  /**
   * Initialize agent with Knowledge Network access
   * Requirement 7.1: Access Knowledge Network for context
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a fan message request
   * Requirement 1.1: Generate contextual response based on fan history
   */
  async processRequest(request: {
    creatorId: number;
    fanId: string;
    message: string;
    context?: {
      fanHistory?: any[];
      creatorStyle?: string;
      previousMessages?: any[];
    };
  }): Promise<AIResponse> {
    try {
      const response = await this.generateResponse(
        request.creatorId,
        request.fanId,
        request.message,
        request.context
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
   * - 1.1: Generate contextual response based on fan history
   * - 1.2: Integrate insights from sales and analytics
   * - 1.5: Store successful interaction insights
   */
  async generateResponse(
    creatorId: number,
    fanId: string,
    message: string,
    context?: {
      fanHistory?: any[];
      creatorStyle?: string;
      previousMessages?: any[];
    }
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
    // Requirement 1.2: Get relevant insights from Knowledge Network
    const insights = await this.getRelevantInsights(creatorId, fanId);
    
    // Build prompt with context
    const prompt = this.buildPrompt(message, context, insights);
    
    // Requirement 1.1: Generate response via Gemini
    const result = await generateTextWithBilling({
      prompt,
      metadata: {
        creatorId,
        feature: 'fan_messaging',
        agentId: this.id,
      },
      model: this.model,
      temperature: 0.8, // Higher temperature for more natural conversation
      maxOutputTokens: 500,
    });

    // Parse response
    const responseData = this.parseResponse(result.text);
    
    // Requirement 1.5: Store successful interaction insight
    if (responseData.confidence > 0.7 && this.network) {
      await this.storeInteractionInsight(creatorId, fanId, message, responseData.response, insights);
    }

    return {
      ...responseData,
      usage: result.usage,
    };
  }

  /**
   * Get relevant insights from Knowledge Network
   * Requirement 1.2: Integrate insights from other agents
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
   * Build prompt with context and insights
   * Requirement 1.1: Use fan history and creator style
   */
  private buildPrompt(
    message: string,
    context?: {
      fanHistory?: any[];
      creatorStyle?: string;
      previousMessages?: any[];
    },
    insights?: {
      fanPreferences: Insight[];
      salesTactics: Insight[];
      engagementPatterns: Insight[];
    }
  ): string {
    let prompt = `You are an AI assistant helping an OnlyFans creator respond to fan messages.

Fan's message: "${message}"

`;

    // Add creator style if available
    if (context?.creatorStyle) {
      prompt += `Creator's communication style: ${context.creatorStyle}\n\n`;
    }

    // Add previous conversation context
    if (context?.previousMessages && context.previousMessages.length > 0) {
      prompt += `Previous conversation:\n`;
      context.previousMessages.slice(-3).forEach((msg: any) => {
        prompt += `- ${msg.role}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    // Add insights from Knowledge Network
    if (insights) {
      if (insights.fanPreferences.length > 0) {
        prompt += `Fan preferences learned:\n`;
        insights.fanPreferences.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
        prompt += `\n`;
      }

      if (insights.salesTactics.length > 0) {
        prompt += `Effective sales tactics:\n`;
        insights.salesTactics.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
        prompt += `\n`;
      }
    }

    prompt += `Generate a response that:
1. Matches the creator's communication style
2. Is warm, engaging, and personal
3. Considers the fan's preferences and history
4. Subtly suggests upsell opportunities when appropriate (PPV content, tips, exclusive content)
5. Maintains professional boundaries

Return your response in this JSON format:
{
  "response": "the message to send to the fan",
  "confidence": 0.0-1.0 (how confident you are this is a good response),
  "suggestedUpsell": "optional upsell suggestion or null",
  "reasoning": "brief explanation of your approach"
}`;

    return prompt;
  }

  /**
   * Parse the AI response
   */
  private parseResponse(text: string): {
    response: string;
    confidence: number;
    suggestedUpsell?: string;
  } {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(text);
      return {
        response: parsed.response || text,
        confidence: parsed.confidence || 0.5,
        suggestedUpsell: parsed.suggestedUpsell || undefined,
      };
    } catch {
      // If not JSON, return as plain text
      return {
        response: text,
        confidence: 0.5,
      };
    }
  }

  /**
   * Store successful interaction insight
   * Requirement 1.5: Share insights with Knowledge Network
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
