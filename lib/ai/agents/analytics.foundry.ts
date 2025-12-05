/**
 * AnalyticsAgent - Azure AI Foundry Integration
 * 
 * Handles data analysis and pattern recognition using Azure AI Foundry
 * via the Python AI Router service. Uses DeepSeek-R1 for math/reasoning tasks.
 * 
 * Feature: azure-foundry-agents-integration, Task 5
 * Requirements: 1.1, 2.2, 3.1-3.3, 5.1, 5.2, 5.4, 6.2, 6.7, 7.1-7.3, 9.2
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

export interface AnalyticsRequest {
  creatorId: number;
  analysisType: 'revenue' | 'engagement' | 'content' | 'fan_behavior' | 'predictive';
  data: unknown;
  timeRange?: {
    start: Date;
    end: Date;
  };
  context?: {
    previousAnalyses?: unknown[];
    benchmarks?: unknown;
  };
  accountId?: string;
  plan?: UserPlan;
}

export interface AnalyticsInsight {
  category: string;
  finding: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface AnalyticsPrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: string;
}

export interface AnalyticsRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  confidence: number;
}

export interface AnalyticsResponseData {
  insights: AnalyticsInsight[];
  predictions: AnalyticsPrediction[];
  recommendations: AnalyticsRecommendation[];
  summary: string;
  confidence: number;
}

export interface AnalyticsUsage {
  model: string;
  deployment: string;
  region: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Cost calculation is now centralized in lib/ai/foundry/cost-calculator.ts

// =============================================================================
// AnalyticsAgent Implementation
// =============================================================================

export class FoundryAnalyticsAgent implements AITeamMember {
  id = 'analytics-agent-foundry';
  name = 'Analytics Agent (Foundry)';
  role = 'data_analysis';
  model = 'DeepSeek-R1'; // Default model, actual model comes from router response
  typeHint: TypeHint = 'math'; // Requirement 2.2: math for data analysis requiring reasoning
  
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
   * Process an analytics request
   * Requirement 5.1: Maintain same input/output interface
   */
  async processRequest(request: AnalyticsRequest): Promise<AIResponse> {
    try {
      const response = await this.analyzeData(request);
      
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
   * Analyze data and generate insights
   * 
   * Requirements:
   * - 1.1: Call Python AI Router /route endpoint
   * - 2.2: Hint router with type "math" for data analysis
   * - 3.1-3.3: Map user plan to client_tier
   */
  async analyzeData(request: AnalyticsRequest): Promise<{
    data: AnalyticsResponseData;
    usage: AnalyticsUsage;
  }> {
    const { creatorId, analysisType, data, timeRange, context, accountId, plan } = request;

    // Check quota before making request
    if (accountId) {
      const quotaCheck = await this.costTracker.checkQuota(accountId);
      if (!quotaCheck.allowed) {
        throw new Error('Quota exceeded for this account');
      }
    }

    // Get historical insights from Knowledge Network
    const historicalInsights = await this.getHistoricalInsights(creatorId, analysisType);
    
    // Build the prompt with system instructions and context
    const prompt = this.buildPrompt(analysisType, data, timeRange, context, historicalInsights);
    
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
      await this.logUsage(accountId, creatorId, analysisType, usage);
    }

    // Store high-confidence insights in Knowledge Network
    if (responseData.confidence > 0.75 && this.network) {
      await this.storeAnalyticsInsights(
        creatorId,
        analysisType,
        responseData.insights,
        responseData.predictions,
        routerResponse
      );
    }

    return {
      data: responseData,
      usage,
    };
  }


  /**
   * Get historical insights from Knowledge Network
   * Requirement 2.2: Integrate historical patterns
   */
  private async getHistoricalInsights(
    creatorId: number,
    analysisType: string
  ): Promise<{
    patterns: Insight[];
    trends: Insight[];
    anomalies: Insight[];
  }> {
    if (!this.network) {
      return { patterns: [], trends: [], anomalies: [] };
    }

    const [patterns, trends, anomalies] = await Promise.all([
      this.network.getRelevantInsights(creatorId, `${analysisType}_pattern`, 5),
      this.network.getRelevantInsights(creatorId, `${analysisType}_trend`, 5),
      this.network.getRelevantInsights(creatorId, 'anomaly', 3),
    ]);

    return { patterns, trends, anomalies };
  }

  /**
   * Build the prompt with system instructions and context
   * Requirement 6.2, 6.7, 9.2: Optimized English prompt for DeepSeek-R1 with JSON format
   */
  private buildPrompt(
    analysisType: string,
    data: unknown,
    timeRange?: { start: Date; end: Date },
    context?: { previousAnalyses?: unknown[]; benchmarks?: unknown },
    historicalInsights?: { patterns: Insight[]; trends: Insight[]; anomalies: Insight[] }
  ): string {
    // System prompt optimized for DeepSeek-R1 (math/reasoning)
    let prompt = `You are an advanced AI analytics agent specializing in OnlyFans creator performance analysis.

Your role:
1. Analyze data patterns and identify key insights
2. Generate accurate predictions based on historical trends
3. Provide actionable recommendations with confidence scores
4. Detect anomalies and explain their significance
5. Consider industry benchmarks

Analysis type: ${analysisType}
`;

    // Add time range context
    if (timeRange) {
      prompt += `Time range: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}\n`;
    }

    // Add benchmarks if available
    if (context?.benchmarks) {
      prompt += `\nBenchmarks:\n${JSON.stringify(context.benchmarks, null, 2)}\n`;
    }

    // Add historical insights from Knowledge Network
    if (historicalInsights) {
      if (historicalInsights.patterns.length > 0) {
        prompt += `\nHistorical patterns:\n`;
        historicalInsights.patterns.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (historicalInsights.trends.length > 0) {
        prompt += `\nPrevious trends:\n`;
        historicalInsights.trends.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (historicalInsights.anomalies.length > 0) {
        prompt += `\nKnown anomalies:\n`;
        historicalInsights.anomalies.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }
    }

    // Add previous analyses context
    if (context?.previousAnalyses && context.previousAnalyses.length > 0) {
      prompt += `\nPrevious analyses:\n`;
      context.previousAnalyses.slice(-2).forEach((analysis) => {
        prompt += `- ${JSON.stringify(analysis)}\n`;
      });
    }

    // Add data to analyze
    prompt += `\nData to analyze:\n${JSON.stringify(data, null, 2)}

You MUST respond with valid JSON:
{
  "insights": [{"category": "string", "finding": "string", "confidence": 0.85, "impact": "high|medium|low", "actionable": true}],
  "predictions": [{"metric": "string", "predictedValue": 1234.56, "confidence": 0.80, "timeframe": "string"}],
  "recommendations": [{"action": "string", "priority": "high|medium|low", "expectedImpact": "string", "confidence": 0.75}],
  "summary": "executive summary",
  "confidence": 0.85
}`;

    return prompt;
  }

  /**
   * Parse the AI response
   * Requirement 6.7: Parse JSON output with required fields
   */
  private parseResponse(text: string): AnalyticsResponseData {
    try {
      const parsed = JSON.parse(text);
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        summary: parsed.summary || 'Analysis completed',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        insights: [],
        predictions: [],
        recommendations: [],
        summary: text,
        confidence: 0.3,
      };
    }
  }

  /**
   * Extract usage statistics from router response
   * Requirement 5.2, 7.1-7.3: Convert usage to existing format with cost
   * Uses centralized cost calculator from lib/ai/foundry/cost-calculator.ts
   */
  private extractUsage(response: RouterResponse): AnalyticsUsage {
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
    analysisType: string,
    usage: AnalyticsUsage
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
        operation: `analytics_${analysisType}`,
        correlationId: `analytics-${Date.now()}-${analysisType}`,
        timestamp: new Date(),
      } as any
    );
  }

  /**
   * Store analytics insights in Knowledge Network
   * Requirement 5.4: Include actual model from router response in metadata
   */
  private async storeAnalyticsInsights(
    creatorId: number,
    analysisType: string,
    insights: AnalyticsInsight[],
    predictions: AnalyticsPrediction[],
    routerResponse: RouterResponse
  ): Promise<void> {
    if (!this.network) return;

    // Store high-confidence insights
    for (const insight of insights.filter(i => i.confidence > 0.7)) {
      const networkInsight: Insight = {
        source: this.id,
        type: `${analysisType}_pattern`,
        confidence: insight.confidence,
        data: {
          category: insight.category,
          finding: insight.finding,
          impact: insight.impact,
          actionable: insight.actionable,
          timestamp: new Date().toISOString(),
          // Requirement 5.4: Include actual model info from router
          model: routerResponse.model,
          deployment: routerResponse.deployment,
          region: routerResponse.region,
          provider: 'azure-foundry',
        },
        timestamp: new Date(),
      };

      await this.network.broadcastInsight(creatorId, networkInsight);
    }

    // Store high-confidence predictions
    for (const prediction of predictions.filter(p => p.confidence > 0.7)) {
      const networkInsight: Insight = {
        source: this.id,
        type: `${analysisType}_prediction`,
        confidence: prediction.confidence,
        data: {
          metric: prediction.metric,
          predictedValue: prediction.predictedValue,
          timeframe: prediction.timeframe,
          timestamp: new Date().toISOString(),
          model: routerResponse.model,
          deployment: routerResponse.deployment,
          region: routerResponse.region,
          provider: 'azure-foundry',
        },
        timestamp: new Date(),
      };

      await this.network.broadcastInsight(creatorId, networkInsight);
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new FoundryAnalyticsAgent instance
 */
export function createFoundryAnalyticsAgent(routerClient?: RouterClient): FoundryAnalyticsAgent {
  return new FoundryAnalyticsAgent(routerClient);
}
