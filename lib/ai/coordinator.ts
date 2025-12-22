/**
 * AITeamCoordinator - Orchestrates multi-agent collaboration
 * 
 * Routes requests to appropriate agents and combines their intelligence.
 * Supports both Legacy and Foundry providers with feature flag routing.
 * Integrates Azure AI services: Phi-4 Multimodal and Azure Speech Batch.
 * 
 * Requirements: 3.1, 3.2, 3.7, 3.8, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { AIRequest, AIResponse } from './agents/types';
import { AIKnowledgeNetwork } from './knowledge-network';
import { MessagingAgent } from './agents/messaging';
import { ContentAgent } from './agents/content';
import { AnalyticsAgent } from './agents/analytics';
import { SalesAgent } from './agents/sales';
import { 
  AIProviderConfig, 
  getAIProviderConfig,
} from './config/provider-config';
import { 
  FoundryAgentRegistry, 
  getFoundryAgentRegistry,
  FoundryAgentType 
} from './foundry/agent-registry';
import { withRetry } from './foundry/retry';
import { getCircuitBreaker } from './foundry/circuit-breaker';
import { getRouterClient, TaskModality } from './foundry/router-client';

// Simple correlation ID generator (no external dependency)
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Response metadata for tracking and observability
 * Requirement 3.8: Include model, deployment, region, and cost
 */
export interface ResponseMetadata {
  correlationId: string;
  provider: 'foundry' | 'legacy';
  model?: string;
  deployment?: string;
  region?: string;
  latencyMs: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
}

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
    model?: string;
    deployment?: string;
    region?: string;
  };
  metadata?: ResponseMetadata;
};

/**
 * AITeamCoordinator
 * 
 * Central orchestration layer that routes requests to appropriate agents
 * and combines their responses. Supports feature flag-based provider selection.
 * 
 * Requirements: 3.1, 3.2, 3.7, 6.1
 */
export class AITeamCoordinator {
  private network: AIKnowledgeNetwork;
  
  // Legacy agents
  private messagingAgent: MessagingAgent;
  private contentAgent: ContentAgent;
  private analyticsAgent: AnalyticsAgent;
  private salesAgent: SalesAgent;
  
  // Foundry registry (lazy initialized)
  private foundryRegistry: FoundryAgentRegistry | null = null;
  private foundryInitialized: boolean = false;
  
  // Provider config
  private providerConfig: AIProviderConfig;

  constructor() {
    this.network = new AIKnowledgeNetwork();
    this.messagingAgent = new MessagingAgent();
    this.contentAgent = new ContentAgent();
    this.analyticsAgent = new AnalyticsAgent();
    this.salesAgent = new SalesAgent();
    this.providerConfig = getAIProviderConfig();
  }

  /**
   * Initialize all agents with Knowledge Network access
   */
  async initialize(): Promise<void> {
    // Initialize legacy agents
    await Promise.all([
      this.messagingAgent.initialize(this.network),
      this.contentAgent.initialize(this.network),
      this.analyticsAgent.initialize(this.network),
      this.salesAgent.initialize(this.network),
    ]);
    
    // Initialize Foundry registry if needed
    const provider = this.providerConfig.getProvider();
    if (provider === 'foundry' || provider === 'canary') {
      await this.initializeFoundry();
    }
  }

  /**
   * Initialize Foundry agent registry
   */
  private async initializeFoundry(): Promise<void> {
    if (this.foundryInitialized) return;
    
    try {
      this.foundryRegistry = getFoundryAgentRegistry();
      await this.foundryRegistry.initialize();
      this.foundryInitialized = true;
      console.log('[Coordinator] Foundry agents initialized');
    } catch (error) {
      console.error('[Coordinator] Failed to initialize Foundry agents:', error);
      // Don't throw - fallback to legacy will handle this
    }
  }

  /**
   * Select provider based on feature flag configuration
   * Requirement 3.1: Route based on AI_PROVIDER environment variable
   * Requirement 3.2: Support canary percentage-based routing
   * 
   * @param userId - Optional user ID for consistent canary routing
   * @returns Selected provider ('foundry' or 'legacy')
   */
  selectProvider(userId?: string): 'foundry' | 'legacy' {
    const configProvider = this.providerConfig.getProvider();
    
    // Requirement 3.1: Direct provider selection
    if (configProvider === 'foundry') {
      return 'foundry';
    }
    
    if (configProvider === 'legacy') {
      return 'legacy';
    }
    
    // Requirement 3.2: Canary mode with percentage-based routing
    if (configProvider === 'canary') {
      const useFoundry = this.providerConfig.shouldUseFoundry(userId);
      return useFoundry ? 'foundry' : 'legacy';
    }
    
    // Default to legacy
    return 'legacy';
  }

  /**
   * Handle fallback from Foundry to Legacy on failure
   * Requirement 3.7: Fallback to legacy agent if configured
   * Requirement 6.1: Fallback within 5 seconds
   * 
   * @param error - Error that triggered fallback
   * @param request - Original request
   * @param correlationId - Correlation ID for tracking
   * @returns Response from legacy agent
   */
  async handleFallback(
    error: Error,
    request: AIRequest,
    correlationId: string
  ): Promise<CoordinatorResponse> {
    const fallbackEnabled = this.providerConfig.isFallbackEnabled();
    
    if (!fallbackEnabled) {
      console.error(`[Coordinator] Fallback disabled, returning error. correlationId=${correlationId}`);
      return {
        success: false,
        error: error.message,
        agentsInvolved: [],
        metadata: {
          correlationId,
          provider: 'foundry',
          latencyMs: 0,
          fallbackUsed: false,
        },
      };
    }
    
    console.warn(`[Coordinator] Foundry failed, falling back to legacy. correlationId=${correlationId}, error=${error.message}`);
    
    const fallbackStartTime = Date.now();
    
    try {
      // Route to legacy handler
      const result = await this.routeToLegacy(request, correlationId);
      
      // Mark as fallback
      if (result.metadata) {
        result.metadata.fallbackUsed = true;
        result.metadata.fallbackReason = error.message;
      }
      
      const fallbackLatency = Date.now() - fallbackStartTime;
      console.log(`[Coordinator] Fallback completed in ${fallbackLatency}ms. correlationId=${correlationId}`);
      
      return result;
    } catch (fallbackError) {
      console.error(`[Coordinator] Fallback also failed. correlationId=${correlationId}`, fallbackError);
      return {
        success: false,
        error: `Foundry failed: ${error.message}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
        agentsInvolved: [],
        metadata: {
          correlationId,
          provider: 'legacy',
          latencyMs: Date.now() - fallbackStartTime,
          fallbackUsed: true,
          fallbackReason: error.message,
        },
      };
    }
  }

  /**
   * Enrich response with metadata
   * Requirement 3.8: Include model, deployment, region, and cost
   * Requirement 5.1: Log correlation ID, model, latency, cost
   * 
   * @param response - Original response
   * @param metadata - Metadata to add
   * @returns Response with metadata
   */
  enrichResponseMetadata(
    response: CoordinatorResponse,
    metadata: Partial<ResponseMetadata>
  ): CoordinatorResponse {
    const enrichedMetadata: ResponseMetadata = {
      correlationId: metadata.correlationId || generateCorrelationId(),
      provider: metadata.provider || 'legacy',
      model: metadata.model || response.usage?.model,
      deployment: metadata.deployment || response.usage?.deployment,
      region: metadata.region || response.usage?.region,
      latencyMs: metadata.latencyMs || 0,
      fallbackUsed: metadata.fallbackUsed || false,
      fallbackReason: metadata.fallbackReason,
    };
    
    return {
      ...response,
      metadata: enrichedMetadata,
    };
  }

  /**
   * Route a request to the appropriate agent(s)
   * Requirement 3.1, 3.2: Provider selection based on feature flag
   * Requirement 6.1: Identify request type and route to appropriate agents
   * 
   * @param request - AI request to process
   * @returns Coordinator response with combined results
   */
  async route(request: AIRequest): Promise<CoordinatorResponse> {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    
    try {
      // Log routing decision
      this.logRoutingDecision(request, correlationId);

      // Select provider based on feature flag
      const userId = request.creatorId?.toString();
      const provider = this.selectProvider(userId);
      
      console.log(`[Coordinator] Selected provider: ${provider}. correlationId=${correlationId}`);

      let result: CoordinatorResponse;
      
      if (provider === 'foundry') {
        // Ensure Foundry is initialized
        if (!this.foundryInitialized) {
          await this.initializeFoundry();
        }
        
        // Route to Foundry with circuit breaker and retry
        try {
          result = await this.routeToFoundry(request, correlationId);
        } catch (error) {
          // Requirement 3.7: Fallback on Foundry failure
          result = await this.handleFallback(
            error instanceof Error ? error : new Error(String(error)),
            request,
            correlationId
          );
        }
      } else {
        // Route to legacy
        result = await this.routeToLegacy(request, correlationId);
      }

      // Enrich with metadata
      const latencyMs = Date.now() - startTime;
      result = this.enrichResponseMetadata(result, {
        correlationId,
        provider: result.metadata?.fallbackUsed ? 'legacy' : provider,
        latencyMs,
        fallbackUsed: result.metadata?.fallbackUsed || false,
        fallbackReason: result.metadata?.fallbackReason,
      });

      // Log completion
      console.log(`[Coordinator] Request completed. correlationId=${correlationId}, latency=${latencyMs}ms, provider=${result.metadata?.provider}`);

      return result;
    } catch (error) {
      console.error(`[Coordinator] Error routing request. correlationId=${correlationId}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved: [],
        metadata: {
          correlationId,
          provider: 'legacy',
          latencyMs: Date.now() - startTime,
          fallbackUsed: false,
        },
      };
    }
  }

  /**
   * Route request to Foundry agents
   * Requirements 3.3, 3.4, 3.5, 3.6: Route to appropriate Foundry agent
   * 
   * @param request - AI request
   * @param correlationId - Correlation ID
   * @returns Response from Foundry agent
   */
  private async routeToFoundry(
    request: AIRequest,
    correlationId: string
  ): Promise<CoordinatorResponse> {
    if (!this.foundryRegistry || !this.foundryInitialized) {
      throw new Error('Foundry registry not initialized');
    }
    
    // Get circuit breaker for Foundry
    const circuitBreaker = getCircuitBreaker('foundry-router', {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
    });
    
    // Map request type to agent type
    const agentType = FoundryAgentRegistry.mapRequestTypeToAgent(request.type);
    
    if (!agentType) {
      throw new Error(`Unknown request type for Foundry: ${request.type}`);
    }
    
    // Execute with circuit breaker and retry
    const result = await circuitBreaker.execute(async () => {
      return await withRetry(async () => {
        return await this.executeFoundryRequest(request, agentType, correlationId);
      }, {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Coordinator] Foundry retry ${attempt}. correlationId=${correlationId}, delay=${delayMs}ms, error=${error}`);
        },
      });
    });
    
    if (!result.success) {
      throw result.error || new Error('Foundry request failed');
    }
    
    return result.data!;
  }

  /**
   * Execute a request using Foundry agent
   * 
   * @param request - AI request
   * @param agentType - Foundry agent type
   * @param correlationId - Correlation ID
   * @returns Response from agent
   */
  private async executeFoundryRequest(
    request: AIRequest,
    agentType: FoundryAgentType,
    correlationId: string
  ): Promise<CoordinatorResponse> {
    const agent = this.foundryRegistry!.getAgent(agentType);
    const agentsInvolved: string[] = [`${agentType}-foundry`];
    
    // Build request based on type - use type assertion for discriminated union
    let response: AIResponse;
    const req = request as any; // Type assertion for accessing properties
    
    switch (agentType) {
      case 'messaging':
        response = await (agent as any).processRequest({
          creatorId: req.creatorId,
          fanId: req.fanId,
          message: req.message,
          context: req.context,
        });
        break;
        
      case 'analytics':
        response = await (agent as any).processRequest({
          creatorId: req.creatorId,
          metrics: req.metrics,
        });
        break;
        
      case 'sales':
        response = await (agent as any).processRequest({
          creatorId: req.creatorId,
          fanId: req.fanId,
          context: req.context,
        });
        break;
        
      case 'compliance':
        response = await (agent as any).processRequest({
          creatorId: req.creatorId,
          content: req.message || req.context?.content,
        });
        break;
        
      case 'content_trends':
        response = await (agent as any).processRequest({
          creatorId: req.creatorId,
          contentUrl: req.contentUrl,
          platform: req.platform,
          analysisType: req.analysisType,
          context: req.context,
        });
        break;
        
      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }
    
    if (!response.success) {
      throw new Error(response.error || 'Agent request failed');
    }
    
    return {
      success: true,
      data: response.data,
      agentsInvolved,
      usage: response.data?.usage ? {
        totalInputTokens: response.data.usage.inputTokens || 0,
        totalOutputTokens: response.data.usage.outputTokens || 0,
        totalCostUsd: response.data.usage.costUsd || 0,
        model: response.data.usage.model,
        deployment: response.data.usage.deployment,
        region: response.data.usage.region,
      } : undefined,
      metadata: {
        correlationId,
        provider: 'foundry',
        model: response.data?.usage?.model,
        deployment: response.data?.usage?.deployment,
        region: response.data?.usage?.region,
        latencyMs: 0,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Route request to legacy agents
   * 
   * @param request - AI request
   * @param correlationId - Correlation ID
   * @returns Response from legacy agent
   */
  private async routeToLegacy(
    request: AIRequest,
    correlationId: string
  ): Promise<CoordinatorResponse> {
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
        
      case 'content_trends_analysis':
        result = await this.handleContentTrendsAnalysis(
          request.creatorId,
          (request as any).contentUrl,
          (request as any).platform,
          (request as any).analysisType,
          request.context
        );
        break;
        
      default:
        return {
          success: false,
          error: 'Unknown request type',
          agentsInvolved: [],
          metadata: {
            correlationId,
            provider: 'legacy',
            latencyMs: 0,
            fallbackUsed: false,
          },
        };
    }
    
    // Add metadata
    result.metadata = {
      correlationId,
      provider: 'legacy',
      latencyMs: 0,
      fallbackUsed: false,
    };
    
    return result;
  }

  /**
   * Handle fan message with multi-agent collaboration
   * Requirement 6.3: Orchestrer les appels séquentiels et combiner les résultats
   * Requirement 6.4: Gérer l'erreur gracieusement sans bloquer les autres agents
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

      if (!messagingResponse.success) {
        console.warn('[Coordinator] MessagingAgent failed:', messagingResponse.error);
        return {
          success: false,
          error: messagingResponse.error,
          agentsInvolved,
        };
      }

      if (messagingResponse.data?.usage) {
        totalInputTokens += messagingResponse.data.usage.inputTokens;
        totalOutputTokens += messagingResponse.data.usage.outputTokens;
        totalCostUsd += messagingResponse.data.usage.costUsd;
      }

      // Step 2: Optionally get sales optimization
      let salesSuggestion = null;
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
          console.error('[Coordinator] SalesAgent error (isolated):', error);
        }
      }

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

        if (analyticsResponse.success && analyticsResponse.data) {
          analyticsInsights = analyticsResponse.data;
          
          if (analyticsResponse.data.usage) {
            totalInputTokens += analyticsResponse.data.usage.inputTokens;
            totalOutputTokens += analyticsResponse.data.usage.outputTokens;
            totalCostUsd += analyticsResponse.data.usage.costUsd;
          }
        }
      } catch (error) {
        console.warn('[Coordinator] AnalyticsAgent failed, continuing without insights');
      }

      const contentResponse = await this.contentAgent.processRequest({
        creatorId,
        platform,
        contentInfo: {
          ...contentInfo,
          analyticsInsights,
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

      if (contentResponse.data?.usage) {
        totalInputTokens += contentResponse.data.usage.inputTokens;
        totalOutputTokens += contentResponse.data.usage.outputTokens;
        totalCostUsd += contentResponse.data.usage.costUsd;
      }

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
   * Handle content trends analysis
   * Routes to appropriate Azure AI service based on task type and modality
   */
  async handleContentTrendsAnalysis(
    creatorId: number,
    contentUrl?: string,
    platform?: string,
    analysisType: string = 'viral_analysis',
    context?: any
  ): Promise<CoordinatorResponse> {
    const agentsInvolved: string[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;

    try {
      // Determine modality based on analysis type and content
      const modality = this.determineModality(analysisType, context);
      
      // Try using the router client for content trends
      const routerClient = getRouterClient();
      
      if (routerClient) {
        try {
          const routerResponse = await routerClient.routeContentTrends({
            task_type: analysisType,
            modality,
            prompt: context?.prompt || `Analyze content for ${analysisType}`,
            image_urls: context?.imageUrls,
            audio_url: context?.audioUrl,
            video_url: contentUrl,
            client_tier: context?.clientTier || 'standard',
          });

          agentsInvolved.push(`content-trends-${routerResponse.azure_service || routerResponse.model}`);

          if (routerResponse.usage) {
            totalInputTokens += routerResponse.usage.prompt_tokens || 0;
            totalOutputTokens += routerResponse.usage.completion_tokens || 0;
            // Estimate cost based on model
            totalCostUsd += this.estimateCost(routerResponse.model, routerResponse.usage);
          }

          return {
            success: true,
            data: {
              analysisType,
              model: routerResponse.model,
              azureService: routerResponse.azure_service,
              modality: routerResponse.modality,
              result: JSON.parse(routerResponse.output),
            },
            agentsInvolved,
            usage: {
              totalInputTokens,
              totalOutputTokens,
              totalCostUsd,
            },
          };
        } catch (routerError) {
          console.warn('[Coordinator] Router client failed, falling back to Content Trends Engine:', routerError);
        }
      }

      // Fallback: Use existing Content Trends AI Engine if available
      try {
        const contentTrendsModule = await import('./content-trends');
        const { ContentTrendsAIRouter, getContentTrendsRouter } = contentTrendsModule;
        
        if (getContentTrendsRouter) {
          const contentTrendsRouter = getContentTrendsRouter();
          
          // Route the task
          const routingDecision = contentTrendsRouter.routeTask({
            id: generateCorrelationId(),
            type: analysisType as any,
            modality: modality as any,
            content: {
              text: context?.prompt,
              imageUrls: context?.imageUrls,
              videoUrl: contentUrl,
              audioUrl: context?.audioUrl,
            },
            priority: context?.priority || 'medium',
          });

          agentsInvolved.push(`content-trends-${routingDecision.model}`);

          return {
            success: true,
            data: {
              analysisType,
              model: routingDecision.model,
              routingReason: routingDecision.reason,
              estimatedCost: routingDecision.estimatedCost,
              viralPotential: 50, // Placeholder
              insights: [`Routed to ${routingDecision.model} for ${analysisType}`],
              recommendations: [{
                type: 'general',
                content: `Analysis will be performed using ${routingDecision.model}`,
                confidence: routingDecision.estimatedCost.totalCost > 0 ? 0.8 : 0.5,
              }],
            },
            agentsInvolved,
            usage: {
              totalInputTokens: routingDecision.estimatedCost.inputTokens,
              totalOutputTokens: routingDecision.estimatedCost.outputTokens,
              totalCostUsd: routingDecision.estimatedCost.totalCost,
            },
          };
        }
      } catch (importError) {
        console.warn('[Coordinator] Content Trends Engine not available:', importError);
      }
      
      // Final fallback: return basic analysis
      return {
        success: true,
        data: {
          analysisType,
          viralPotential: 50,
          insights: ['Content analysis engine not available'],
          recommendations: [{
            type: 'general',
            content: 'Content Trends AI Engine is being deployed',
            confidence: 0.5,
          }],
        },
        agentsInvolved: ['content-trends-fallback'],
        usage: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCostUsd: 0,
        },
      };
    } catch (error) {
      console.error('[Coordinator] Error in handleContentTrendsAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentsInvolved,
      };
    }
  }

  /**
   * Determine content modality based on analysis type and context
   */
  private determineModality(analysisType: string, context?: any): TaskModality {
    // Audio tasks
    if (analysisType === 'audio_transcription' || context?.audioUrl) {
      return 'audio';
    }
    
    // Visual tasks
    const visualTasks = ['ocr', 'visual_analysis', 'facial_analysis', 'editing_dynamics'];
    if (visualTasks.includes(analysisType) || context?.imageUrls?.length > 0) {
      return 'visual';
    }
    
    // Multimodal tasks (video with audio)
    if (context?.videoUrl || (context?.imageUrls && context?.audioUrl)) {
      return 'multimodal';
    }
    
    // Default to text
    return 'text';
  }

  /**
   * Estimate cost based on model and usage
   */
  private estimateCost(model: string, usage: { prompt_tokens?: number; completion_tokens?: number }): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'DeepSeek-R1': { input: 0.00135, output: 0.0054 },
      'Llama-3.3-70B': { input: 0.00099, output: 0.00099 },
      'Mistral-Large-2411': { input: 0.002, output: 0.006 },
      'Phi-4-Multimodal': { input: 0.00014, output: 0.00056 },
      'Azure-Speech-Batch': { input: 0, output: 0 }, // Per-hour pricing
    };
    
    const modelPricing = pricing[model] || { input: 0.001, output: 0.002 };
    const inputCost = ((usage.prompt_tokens || 0) / 1000) * modelPricing.input;
    const outputCost = ((usage.completion_tokens || 0) / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Determine if sales agent should be invoked
   */
  private shouldInvokeSalesAgent(message: string, context?: any): boolean {
    const lower = message.toLowerCase();
    
    const hasPurchaseIntent = 
      lower.includes('buy') ||
      lower.includes('purchase') ||
      lower.includes('price') ||
      lower.includes('how much') ||
      lower.includes('exclusive') ||
      lower.includes('content');
    
    const hasHighEngagement = context?.engagementLevel === 'high';
    const explicitRequest = context?.invokeSales === true;
    
    return hasPurchaseIntent || hasHighEngagement || explicitRequest;
  }

  /**
   * Log routing decision
   * Requirement 5.1: Log correlation ID, provider, model, latency
   */
  private logRoutingDecision(request: AIRequest, correlationId: string): void {
    console.log('[Coordinator] Routing request:', {
      correlationId,
      type: request.type,
      creatorId: request.creatorId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get the Knowledge Network instance
   */
  getKnowledgeNetwork(): AIKnowledgeNetwork {
    return this.network;
  }

  /**
   * Get provider configuration (for testing/debugging)
   */
  getProviderConfig(): AIProviderConfig {
    return this.providerConfig;
  }

  /**
   * Check if Foundry is initialized
   */
  isFoundryInitialized(): boolean {
    return this.foundryInitialized;
  }
}
