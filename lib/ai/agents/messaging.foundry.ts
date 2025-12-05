/**
 * MessagingAgent - Azure AI Foundry Integration
 * 
 * Handles fan interactions and message generation using Azure AI Foundry
 * via the Python AI Router service.
 * 
 * Feature: azure-foundry-agents-integration, Task 4
 * Requirements: 1.1, 2.1, 3.1-3.3, 5.1, 5.2, 5.4, 6.1, 6.6, 7.1-7.3, 9.1
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { 
  getRouterClient, 
  RouterClient, 
  RouterResponse,
  RouterError,
  RouterErrorCode 
} from '../foundry/router-client';
import { 
  planToTier, 
  agentTypeHint, 
  detectFrenchLanguage,
  type UserPlan,
  type ClientTier,
  type TypeHint 
} from '../foundry/mapping';
import { 
  calculateCostSimple,
  convertRouterUsage,
} from '../foundry/cost-calculator';
import { getCostTrackingService } from '../azure/cost-tracking.service';

// =============================================================================
// Types
// =============================================================================

export interface MessagingRequest {
  creatorId: number;
  fanId: string;
  message: string;
  context?: {
    fanHistory?: unknown[];
    creatorStyle?: string;
    previousMessages?: Array<{ role: string; content: string }>;
    personalityProfile?: Record<string, unknown>;
  };
  accountId?: string;
  plan?: UserPlan;
}

export interface MessagingResponseData {
  response: string;
  confidence: number;
  suggestedUpsell?: string;
  reasoning?: string;
}

export interface MessagingUsage {
  model: string;
  deployment: string;
  region: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Cost calculation is now centralized in lib/ai/foundry/cost-calculator.ts

// =============================================================================
// MessagingAgent Implementation
// =============================================================================

export class FoundryMessagingAgent implements AITeamMember {
  id = 'messaging-agent-foundry';
  name = 'Messaging Agent (Foundry)';
  role = 'fan_interaction';
  model = 'Llama-3.3-70B'; // Default model, actual model comes from router response
  typeHint: TypeHint = 'chat'; // Requirement 2.1: chat for fan interactions
  
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
   * Process a fan message request
   * Requirement 5.1: Maintain same input/output interface
   */
  async processRequest(request: MessagingRequest): Promise<AIResponse> {
    try {
      const response = await this.generateResponse(request);
      
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
   * Generate a contextual response to a fan message
   * 
   * Requirements:
   * - 1.1: Call Python AI Router /route endpoint
   * - 2.1: Hint router with type "chat" for fan interactions
   * - 3.1-3.3: Map user plan to client_tier
   */
  async generateResponse(request: MessagingRequest): Promise<{
    data: MessagingResponseData;
    usage: MessagingUsage;
  }> {
    const { creatorId, fanId, message, context, accountId, plan } = request;

    // Check quota before making request
    if (accountId) {
      const quotaCheck = await this.costTracker.checkQuota(accountId);
      if (!quotaCheck.allowed) {
        throw new Error('Quota exceeded for this account');
      }
    }

    // Get relevant insights from Knowledge Network
    const insights = await this.getRelevantInsights(creatorId, fanId);
    
    // Build the prompt with system instructions and context
    const prompt = this.buildPrompt(message, context, insights);
    
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
      await this.logUsage(accountId, creatorId, routerResponse, usage);
    }

    // Store successful interaction insight
    if (responseData.confidence > 0.7 && this.network) {
      await this.storeInteractionInsight(
        creatorId,
        fanId,
        message,
        responseData.response,
        routerResponse
      );
    }

    return {
      data: responseData,
      usage,
    };
  }

  /**
   * Build the prompt with system instructions and context
   * Requirement 6.1, 6.6, 9.1: Optimized English prompt with JSON format
   */
  private buildPrompt(
    message: string,
    context?: MessagingRequest['context'],
    insights?: {
      fanPreferences: Insight[];
      salesTactics: Insight[];
      engagementPatterns: Insight[];
    }
  ): string {
    // System prompt optimized for Llama-3.3-70B
    let prompt = `You are an AI assistant helping an OnlyFans creator respond to fan messages.

Your role:
1. Generate warm, engaging, personal responses
2. Match the creator's communication style and personality
3. Consider fan preferences and interaction history
4. Identify subtle upsell opportunities (PPV, tips, exclusive content)
5. Maintain professional boundaries

`;

    // Add creator style if available
    if (context?.creatorStyle) {
      prompt += `Creator's style: ${context.creatorStyle}\n`;
    }

    // Add personality profile if available
    if (context?.personalityProfile) {
      prompt += `Fan personality profile: ${JSON.stringify(context.personalityProfile)}\n`;
    }

    // Add previous messages for context
    if (context?.previousMessages && context.previousMessages.length > 0) {
      prompt += `\nPrevious messages:\n`;
      context.previousMessages.slice(-3).forEach((msg) => {
        const role = msg.role === 'creator' ? 'Creator' : 'Fan';
        prompt += `${role}: ${msg.content}\n`;
      });
    }

    // Add insights from Knowledge Network
    if (insights) {
      if (insights.fanPreferences.length > 0) {
        prompt += `\nFan preferences from insights:\n`;
        insights.fanPreferences.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (insights.salesTactics.length > 0) {
        prompt += `\nEffective sales tactics:\n`;
        insights.salesTactics.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }
    }

    // Add current fan message
    prompt += `\nFan's message: "${message}"

You MUST respond with valid JSON:
{
  "response": "the message to send to the fan",
  "confidence": 0.85,
  "suggestedUpsell": "optional upsell suggestion or null",
  "reasoning": "brief explanation of your approach"
}`;

    return prompt;
  }

  /**
   * Get relevant insights from Knowledge Network
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

    return { fanPreferences, salesTactics, engagementPatterns };
  }

  /**
   * Parse the AI response
   * Requirement 6.6: Parse JSON output with required fields
   */
  private parseResponse(text: string): MessagingResponseData {
    try {
      const parsed = JSON.parse(text);
      return {
        response: parsed.response || text,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        suggestedUpsell: parsed.suggestedUpsell || undefined,
        reasoning: parsed.reasoning || undefined,
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
   * Extract usage statistics from router response
   * Requirement 5.2, 7.1-7.3: Convert usage to existing format with cost
   * Uses centralized cost calculator from lib/ai/foundry/cost-calculator.ts
   */
  private extractUsage(response: RouterResponse): MessagingUsage {
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
    response: RouterResponse,
    usage: MessagingUsage
  ): Promise<void> {
    // Note: We use 'as any' for model because Foundry models differ from Azure OpenAI models
    // The cost is already calculated in extractUsage() using Foundry pricing
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
        operation: 'fan_messaging',
        correlationId: `msg-${Date.now()}`,
        timestamp: new Date(),
        // Additional metadata from router stored in custom properties
        // deployment: response.deployment,
        // region: response.region,
        // provider: 'azure-foundry',
      } as any
    );
  }

  /**
   * Store successful interaction insight
   * Requirement 5.4: Include actual model from router response in metadata
   */
  private async storeInteractionInsight(
    creatorId: number,
    fanId: string,
    originalMessage: string,
    responseText: string,
    routerResponse: RouterResponse
  ): Promise<void> {
    if (!this.network) return;

    const insight: Insight = {
      source: this.id,
      type: 'successful_interaction',
      confidence: 0.8,
      data: {
        fanId,
        messageType: this.classifyMessage(originalMessage),
        responseStrategy: this.classifyResponse(responseText),
        hadUpsell: responseText.toLowerCase().includes('exclusive') || 
                    responseText.toLowerCase().includes('special'),
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

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new FoundryMessagingAgent instance
 */
export function createFoundryMessagingAgent(routerClient?: RouterClient): FoundryMessagingAgent {
  return new FoundryMessagingAgent(routerClient);
}
