/**
 * AITeamCoordinator - Orchestrates multi-agent collaboration
 * 
 * Routes requests to appropriate agents and combines their intelligence
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { AIRequest, AIResponse } from './agents/types';
import { AIKnowledgeNetwork } from './knowledge-network';
import { MessagingAgent } from './agents/messaging';
import { ContentAgent } from './agents/content';
import { AnalyticsAgent } from './agents/analytics';
import { SalesAgent } from './agents/sales';

/**
 * Coordinator response format
 */
export type CoordinatorResponse = {
  success: boolean;
  data?: any;
  error?: string;
  agentsInvolved: string[];
  usage?: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
};

/**
 * AITeamCoordinator
 * 
 * Central orchestration layer that routes requests to appropriate agents
 * and combines their responses
 */
export class AITeamCoordinator {
  private network: AIKnowledgeNetwork;
  private messagingAgent: MessagingAgent;
  private contentAgent: ContentAgent;
  private analyticsAgent: AnalyticsAgent;
  private salesAgent: SalesAgent;

  constructor() {
    this.network = new AIKnowledgeNetwork();
    this.messagingAgent = new MessagingAgent();
    this.contentAgent = new ContentAgent();
    this.analyticsAgent = new AnalyticsAgent();
    this.salesAgent = new SalesAgent();
  }

  /**
   * Initialize all agents with Knowledge Network access
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.messagingAgent.initialize(this.network),
      this.contentAgent.initialize(this.network),
      this.analyticsAgent.initialize(this.network),
      this.salesAgent.initialize(this.network),
    ]);
  }

  /**
   * Route a request to the appropriate agent(s)
   * Requirement 6.1: Identify request type and route to appropriate agents
   * Requirement 6.2: Router vers les agents appropriés dans le bon ordre
   * 
   * @param request - AI request to process
   * @returns Coordinator response with combined results
   */
  async route(request: AIRequest): Promise<CoordinatorResponse> {
    const startTime = Date.now();
    
    try {
      // Log routing decision
      // Requirement 6.5: Log routing decisions
      this.logRoutingDecision(request);

      // Route to appropriate handler based on request type
      let result: CoordinatorResponse;
      
      switch (request.type) {
        case 'fan_message':
          result = await this.handleFanMessage(
            request.creatorId,
            request.fanId,
            request.message,
            request.context
          );
          break;
          
        case 'generate_caption':
          result = await this.handleCaptionGeneration(
            request.creatorId,
            request.platform,
            request.contentInfo
          );
          break;
          
        case 'analyze_performance':
          result = await this.handlePerformanceAnalysis(
            request.creatorId,
            request.metrics
          );
          break;
          
        case 'optimize_sales':
          result = await this.handleSalesOptimization(
            request.creatorId,
            request.fanId,
            request.context
          );
          break;
          
        default:
          return {
            success: false,
            error: 'Unknown request type',
            agentsInvolved: [],
          };
      }

      // Log execution time
      const executionTime = Date.now() - startTime;
      console.log(`[Coordinator] Request ${request.type} completed in ${executionTime}ms`);

      return result;
    } catch (error) {
      console.error('[Coordinator] Error routing request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved: [],
      };
    }
  }

  /**
   * Handle fan message with multi-agent collaboration
   * Requirement 6.3: Orchestrer les appels séquentiels et combiner les résultats
   * Requirement 6.4: Gérer l'erreur gracieusement sans bloquer les autres agents
   * 
   * Flow:
   * 1. MessagingAgent generates initial response
   * 2. SalesAgent provides upsell suggestions (optional)
   * 3. Combine results into unified response
   * 
   * @param creatorId - Creator ID
   * @param fanId - Fan ID
   * @param message - Fan's message
   * @param context - Additional context
   * @returns Combined response from multiple agents
   */
  async handleFanMessage(
    creatorId: number,
    fanId: string,
    message: string,
    context?: any
  ): Promise<CoordinatorResponse> {
    const agentsInvolved: string[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;

    try {
      // Step 1: Get messaging response
      const messagingResponse = await this.messagingAgent.processRequest({
        creatorId,
        fanId,
        message,
        context,
      });

      agentsInvolved.push('messaging-agent');

      // Requirement 6.4: Handle agent failure gracefully
      if (!messagingResponse.success) {
        console.warn('[Coordinator] MessagingAgent failed:', messagingResponse.error);
        return {
          success: false,
          error: messagingResponse.error,
          agentsInvolved,
        };
      }

      // Accumulate usage
      if (messagingResponse.data?.usage) {
        totalInputTokens += messagingResponse.data.usage.inputTokens;
        totalOutputTokens += messagingResponse.data.usage.outputTokens;
        totalCostUsd += messagingResponse.data.usage.costUsd;
      }

      // Step 2: Optionally get sales optimization (if appropriate)
      let salesSuggestion = null;
      
      // Only invoke sales agent if there's purchase intent or engagement
      const shouldInvokeSales = this.shouldInvokeSalesAgent(message, context);
      
      if (shouldInvokeSales) {
        try {
          const salesResponse = await this.salesAgent.processRequest({
            creatorId,
            fanId,
            context: {
              ...context,
              originalMessage: message,
              messagingResponse: messagingResponse.data,
            },
          });

          agentsInvolved.push('sales-agent');

          // Requirement 6.4: Isolate agent failures
          if (salesResponse.success && salesResponse.data) {
            salesSuggestion = salesResponse.data;
            
            if (salesResponse.data.usage) {
              totalInputTokens += salesResponse.data.usage.inputTokens;
              totalOutputTokens += salesResponse.data.usage.outputTokens;
              totalCostUsd += salesResponse.data.usage.costUsd;
            }
          } else {
            console.warn('[Coordinator] SalesAgent failed, continuing without sales optimization');
          }
        } catch (error) {
          // Requirement 6.4: Agent failure isolation - don't fail entire request
          console.error('[Coordinator] SalesAgent error (isolated):', error);
        }
      }

      // Step 3: Combine results
      // Requirement 6.3: Return unified result with contributions from each agent
      return {
        success: true,
        data: {
          response: messagingResponse.data.response,
          confidence: messagingResponse.data.confidence,
          suggestedUpsell: messagingResponse.data.suggestedUpsell || salesSuggestion?.message,
          salesTactics: salesSuggestion?.tactics,
          suggestedPrice: salesSuggestion?.suggestedPrice,
        },
        agentsInvolved,
        usage: {
          totalInputTokens,
          totalOutputTokens,
          totalCostUsd,
        },
      };
    } catch (error) {
      console.error('[Coordinator] Error in handleFanMessage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved,
      };
    }
  }

  /**
   * Handle caption generation with agent coordination
   * Requirement 6.3: Orchestrate sequential calls and combine results
   * 
   * Flow:
   * 1. AnalyticsAgent provides performance insights (optional)
   * 2. ContentAgent generates caption with insights
   * 3. Combine results
   * 
   * @param creatorId - Creator ID
   * @param platform - Platform name
   * @param contentInfo - Content information
   * @returns Caption with hashtags and insights
   */
  async handleCaptionGeneration(
    creatorId: number,
    platform: string,
    contentInfo: any
  ): Promise<CoordinatorResponse> {
    const agentsInvolved: string[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;

    try {
      // Step 1: Optionally get analytics insights for better caption
      let analyticsInsights = null;
      
      try {
        const analyticsResponse = await this.analyticsAgent.processRequest({
          creatorId,
          metrics: {
            platforms: [platform],
            contentTypes: [contentInfo.type],
            timeframe: 'last_30_days',
          },
        });

        agentsInvolved.push('analytics-agent');

        // Requirement 6.4: Isolate agent failures
        if (analyticsResponse.success && analyticsResponse.data) {
          analyticsInsights = analyticsResponse.data;
          
          if (analyticsResponse.data.usage) {
            totalInputTokens += analyticsResponse.data.usage.inputTokens;
            totalOutputTokens += analyticsResponse.data.usage.outputTokens;
            totalCostUsd += analyticsResponse.data.usage.costUsd;
          }
        }
      } catch (error) {
        // Requirement 6.4: Continue without analytics if it fails
        console.warn('[Coordinator] AnalyticsAgent failed, continuing without insights');
      }

      // Step 2: Generate caption with ContentAgent
      const contentResponse = await this.contentAgent.processRequest({
        creatorId,
        platform,
        contentInfo: {
          ...contentInfo,
          analyticsInsights, // Pass analytics insights to content agent
        },
      });

      agentsInvolved.push('content-agent');

      if (!contentResponse.success) {
        return {
          success: false,
          error: contentResponse.error,
          agentsInvolved,
        };
      }

      // Accumulate usage
      if (contentResponse.data?.usage) {
        totalInputTokens += contentResponse.data.usage.inputTokens;
        totalOutputTokens += contentResponse.data.usage.outputTokens;
        totalCostUsd += contentResponse.data.usage.costUsd;
      }

      // Step 3: Combine results
      return {
        success: true,
        data: {
          caption: contentResponse.data.caption,
          hashtags: contentResponse.data.hashtags,
          confidence: contentResponse.data.confidence,
          performanceInsights: analyticsInsights?.insights,
        },
        agentsInvolved,
        usage: {
          totalInputTokens,
          totalOutputTokens,
          totalCostUsd,
        },
      };
    } catch (error) {
      console.error('[Coordinator] Error in handleCaptionGeneration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved,
      };
    }
  }

  /**
   * Handle performance analysis
   * Requirement 6.2: Route to appropriate agent
   * 
   * @param creatorId - Creator ID
   * @param metrics - Performance metrics
   * @returns Analysis results
   */
  async handlePerformanceAnalysis(
    creatorId: number,
    metrics: any
  ): Promise<CoordinatorResponse> {
    const agentsInvolved: string[] = [];

    try {
      const analyticsResponse = await this.analyticsAgent.processRequest({
        creatorId,
        metrics,
      });

      agentsInvolved.push('analytics-agent');

      if (!analyticsResponse.success) {
        return {
          success: false,
          error: analyticsResponse.error,
          agentsInvolved,
        };
      }

      return {
        success: true,
        data: analyticsResponse.data,
        agentsInvolved,
        usage: analyticsResponse.data?.usage ? {
          totalInputTokens: analyticsResponse.data.usage.inputTokens,
          totalOutputTokens: analyticsResponse.data.usage.outputTokens,
          totalCostUsd: analyticsResponse.data.usage.costUsd,
        } : undefined,
      };
    } catch (error) {
      console.error('[Coordinator] Error in handlePerformanceAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved,
      };
    }
  }

  /**
   * Handle sales optimization
   * Requirement 6.2: Route to appropriate agent
   * 
   * @param creatorId - Creator ID
   * @param fanId - Fan ID
   * @param context - Sales context
   * @returns Optimized sales message
   */
  async handleSalesOptimization(
    creatorId: number,
    fanId: string,
    context: any
  ): Promise<CoordinatorResponse> {
    const agentsInvolved: string[] = [];

    try {
      const salesResponse = await this.salesAgent.processRequest({
        creatorId,
        fanId,
        context,
      });

      agentsInvolved.push('sales-agent');

      if (!salesResponse.success) {
        return {
          success: false,
          error: salesResponse.error,
          agentsInvolved,
        };
      }

      return {
        success: true,
        data: salesResponse.data,
        agentsInvolved,
        usage: salesResponse.data?.usage ? {
          totalInputTokens: salesResponse.data.usage.inputTokens,
          totalOutputTokens: salesResponse.data.usage.outputTokens,
          totalCostUsd: salesResponse.data.usage.costUsd,
        } : undefined,
      };
    } catch (error) {
      console.error('[Coordinator] Error in handleSalesOptimization:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved,
      };
    }
  }

  /**
   * Determine if sales agent should be invoked
   * 
   * @param message - Fan's message
   * @param context - Request context
   * @returns True if sales agent should be invoked
   */
  private shouldInvokeSalesAgent(message: string, context?: any): boolean {
    const lower = message.toLowerCase();
    
    // Invoke sales agent if message shows purchase intent
    const hasPurchaseIntent = 
      lower.includes('buy') ||
      lower.includes('purchase') ||
      lower.includes('price') ||
      lower.includes('how much') ||
      lower.includes('exclusive') ||
      lower.includes('content');
    
    // Or if fan has high engagement
    const hasHighEngagement = context?.engagementLevel === 'high';
    
    // Or if explicitly requested
    const explicitRequest = context?.invokeSales === true;
    
    return hasPurchaseIntent || hasHighEngagement || explicitRequest;
  }

  /**
   * Log routing decision
   * Requirement 6.5: Log routing decisions
   * 
   * @param request - AI request being routed
   */
  private logRoutingDecision(request: AIRequest): void {
    console.log('[Coordinator] Routing request:', {
      type: request.type,
      creatorId: request.creatorId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get the Knowledge Network instance
   * 
   * @returns Knowledge Network instance
   */
  getKnowledgeNetwork(): AIKnowledgeNetwork {
    return this.network;
  }
}
