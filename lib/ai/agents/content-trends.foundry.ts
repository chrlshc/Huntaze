/**
 * FoundryContentTrendsAgent - Content Trends AI agent using Azure AI Foundry
 * 
 * Integrates the Content Trends AI Engine with the Foundry routing system.
 * Provides viral analysis, trend detection, and content recommendations.
 * 
 * Requirements: Content Trends Integration
 */

import { RouterClient, RouterRequest, RouterResponse } from '../foundry/router-client';
import { AIResponse } from './types';
import { TypeHint } from '../foundry/mapping';
import { calculateCostSimple } from '../foundry/cost-calculator';

/**
 * Content Trends request types
 */
export interface ContentTrendsRequest {
  creatorId: number;
  contentUrl?: string;
  platform?: string;
  analysisType: 'viral_analysis' | 'trend_detection' | 'content_recommendations' | 'trend_arbitrage';
  context?: {
    targetAudience?: string[];
    contentType?: string;
    timeframe?: string;
    includeRecommendations?: boolean;
    [key: string]: any;
  };
}

/**
 * Content Trends response data
 */
export interface ContentTrendsResponseData {
  analysisType: string;
  viralPotential?: number;
  trends?: Array<{
    id: string;
    title: string;
    platform: string;
    viralScore: number;
    velocity: number;
    category: string;
  }>;
  recommendations?: Array<{
    type: string;
    content: string;
    confidence: number;
    timing?: string;
  }>;
  insights?: string[];
  optimizedTiming?: string;
  targetAudience?: string[];
  arbitrageOpportunities?: Array<{
    platform: string;
    opportunity: string;
    potential: number;
  }>;
  usage?: {
    model: string;
    deployment: string;
    region: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

/**
 * FoundryContentTrendsAgent configuration
 */
export interface FoundryContentTrendsAgentConfig {
  routerClient: RouterClient;
  clientTier?: 'standard' | 'vip';
}

/**
 * FoundryContentTrendsAgent
 * 
 * Processes content trends requests using Azure AI Foundry models
 * through the intelligent router system.
 */
export class FoundryContentTrendsAgent {
  private routerClient: RouterClient;
  private clientTier: 'standard' | 'vip';
  
  readonly id = 'content-trends-foundry';
  readonly name = 'Content Trends Foundry Agent';
  readonly role = 'Content Analysis & Trend Detection';
  readonly model = 'Azure AI Foundry Router';
  readonly typeHint: TypeHint = 'creative'; // Content analysis is creative work

  constructor(config: FoundryContentTrendsAgentConfig) {
    this.routerClient = config.routerClient;
    this.clientTier = config.clientTier || 'standard';
  }

  /**
   * Process content trends request
   */
  async processRequest(request: ContentTrendsRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const routerRequest: RouterRequest = {
        prompt,
        client_tier: this.clientTier,
        type_hint: 'creative', // Content analysis requires creative reasoning
        language_hint: 'en',
      };

      const response = await this.routerClient.route(routerRequest);
      const parsedData = this.parseResponse(response, request.analysisType);

      return {
        success: true,
        data: parsedData,
        usage: {
          model: response.model,
          deployment: response.deployment,
          region: response.region,
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          costUsd: calculateCostSimple(response.model, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0),
        },
      };
    } catch (error) {
      console.error('[FoundryContentTrendsAgent] Error processing request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build prompt based on analysis type
   */
  private buildPrompt(request: ContentTrendsRequest): string {
    const { analysisType, contentUrl, platform, context } = request;

    switch (analysisType) {
      case 'viral_analysis':
        return this.buildViralAnalysisPrompt(contentUrl, platform, context);
      
      case 'trend_detection':
        return this.buildTrendDetectionPrompt(platform, context);
      
      case 'content_recommendations':
        return this.buildRecommendationsPrompt(platform, context);
      
      case 'trend_arbitrage':
        return this.buildArbitragePrompt(platform, context);
      
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }
  }

  /**
   * Build viral analysis prompt
   */
  private buildViralAnalysisPrompt(contentUrl?: string, platform?: string, context?: any): string {
    return `You are a viral content analysis expert. Analyze the following content for viral potential.

${contentUrl ? `Content URL: ${contentUrl}` : ''}
${platform ? `Platform: ${platform}` : ''}
${context?.targetAudience ? `Target Audience: ${context.targetAudience.join(', ')}` : ''}

Provide a comprehensive viral analysis including:
1. Viral potential score (0-100)
2. Key viral mechanisms identified
3. Emotional triggers present
4. Optimal timing recommendations
5. Target audience insights
6. Actionable recommendations for improvement

Format your response as JSON with the following structure:
{
  "viralPotential": number,
  "insights": ["insight1", "insight2", ...],
  "recommendations": [{"type": "string", "content": "string", "confidence": number}],
  "optimizedTiming": "string",
  "targetAudience": ["audience1", "audience2", ...]
}`;
  }

  /**
   * Build trend detection prompt
   */
  private buildTrendDetectionPrompt(platform?: string, context?: any): string {
    const timeframe = context?.timeframe || '24h';
    
    return `You are a trend detection specialist. Identify current trending content and emerging patterns.

${platform ? `Platform: ${platform}` : 'All Platforms'}
Timeframe: ${timeframe}
${context?.contentType ? `Content Type: ${context.contentType}` : ''}

Analyze and provide:
1. Top trending topics/hashtags
2. Emerging content patterns
3. Viral velocity metrics
4. Cross-platform trend correlations
5. Predicted trend longevity

Format your response as JSON:
{
  "trends": [
    {
      "id": "string",
      "title": "string", 
      "platform": "string",
      "viralScore": number,
      "velocity": number,
      "category": "string"
    }
  ],
  "insights": ["insight1", "insight2", ...]
}`;
  }

  /**
   * Build recommendations prompt
   */
  private buildRecommendationsPrompt(platform?: string, context?: any): string {
    return `You are a content strategy expert. Generate personalized content recommendations.

${platform ? `Platform: ${platform}` : ''}
${context?.targetAudience ? `Target Audience: ${context.targetAudience.join(', ')}` : ''}
${context?.contentType ? `Content Type: ${context.contentType}` : ''}

Provide strategic recommendations including:
1. Content ideas based on current trends
2. Optimal posting times
3. Hashtag strategies
4. Engagement optimization tactics
5. Cross-platform opportunities

Format as JSON:
{
  "recommendations": [
    {
      "type": "content_idea|timing|hashtags|engagement",
      "content": "string",
      "confidence": number,
      "timing": "string"
    }
  ],
  "insights": ["insight1", "insight2", ...]
}`;
  }

  /**
   * Build arbitrage prompt
   */
  private buildArbitragePrompt(platform?: string, context?: any): string {
    return `You are a trend arbitrage specialist. Identify cross-platform opportunities.

${platform ? `Primary Platform: ${platform}` : ''}

Analyze and identify:
1. Trends popular on one platform but not others
2. Content gaps and opportunities
3. Timing advantages for cross-platform posting
4. Platform-specific optimization strategies

Format as JSON:
{
  "arbitrageOpportunities": [
    {
      "platform": "string",
      "opportunity": "string", 
      "potential": number
    }
  ],
  "insights": ["insight1", "insight2", ...]
}`;
  }

  /**
   * Parse router response into structured data
   */
  private parseResponse(response: RouterResponse, analysisType: string): ContentTrendsResponseData {
    try {
      // Try to parse JSON from the response
      const jsonMatch = response.output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        analysisType,
        ...parsedData,
        usage: {
          model: response.model,
          deployment: response.deployment,
          region: response.region,
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          costUsd: calculateCostSimple(response.model, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0),
        },
      };
    } catch (error) {
      console.error('[FoundryContentTrendsAgent] Error parsing response:', error);
      
      // Fallback: return basic structure with raw output
      return {
        analysisType,
        insights: [response.output],
        usage: {
          model: response.model,
          deployment: response.deployment,
          region: response.region,
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          costUsd: calculateCostSimple(response.model, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0),
        },
      };
    }
  }
}

/**
 * Create FoundryContentTrendsAgent instance
 */
export function createFoundryContentTrendsAgent(config: {
  baseUrl?: string;
  apiKey?: string;
  clientTier?: 'standard' | 'vip';
}): FoundryContentTrendsAgent {
  const routerClient = new RouterClient(config.baseUrl);
  
  return new FoundryContentTrendsAgent({
    routerClient,
    clientTier: config.clientTier,
  });
}