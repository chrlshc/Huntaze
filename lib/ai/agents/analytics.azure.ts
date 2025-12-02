/**
 * AnalyticsAgent - Azure OpenAI Migration
 * 
 * Handles data analysis and pattern recognition using Azure OpenAI Service
 * 
 * Feature: huntaze-ai-azure-migration, Task 11
 * Requirements: 2.2, 10.1, 10.2
 * Validates: Property 4 (Agent model assignment - AnalyticsAI)
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { azureOpenAIRouter, type RouterOptions } from '../azure/azure-openai-router';
import { getCostTrackingService } from '../azure/cost-tracking.service';
import type { ChatMessage } from '../azure/azure-openai.types';

export class AzureAnalyticsAgent implements AITeamMember {
  id = 'analytics-agent-azure';
  name = 'Analytics Agent (Azure)';
  role = 'data_analysis';
  model = 'gpt-4-turbo'; // Use GPT-4 Turbo premium tier for analytics
  
  private network: AIKnowledgeNetwork | null = null;
  private costTracker = getCostTrackingService();

  /**
   * Initialize agent with Knowledge Network access
   * Requirement 2.2: Access Knowledge Network for context
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process an analytics request
   * Requirement 2.2: Analyze patterns and generate insights
   */
  async processRequest(request: {
    creatorId: number;
    analysisType: 'revenue' | 'engagement' | 'content' | 'fan_behavior' | 'predictive';
    data: any;
    timeRange?: {
      start: Date;
      end: Date;
    };
    context?: {
      previousAnalyses?: any[];
      benchmarks?: any;
    };
    accountId?: string;
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise';
  }): Promise<AIResponse> {
    try {
      const analysis = await this.analyzeData(
        request.creatorId,
        request.analysisType,
        request.data,
        request.timeRange,
        request.context,
        request.accountId,
        request.plan
      );
      
      return {
        success: true,
        data: analysis,
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
   * - 2.2: Use GPT-4 Turbo with structured output for insights
   * - 10.1: Use Azure OpenAI-specific formatting
   * - 10.2: Enable JSON mode for structured output
   */
  async analyzeData(
    creatorId: number,
    analysisType: 'revenue' | 'engagement' | 'content' | 'fan_behavior' | 'predictive',
    data: any,
    timeRange?: {
      start: Date;
      end: Date;
    },
    context?: {
      previousAnalyses?: any[];
      benchmarks?: any;
    },
    accountId?: string,
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise'
  ): Promise<{
    insights: Array<{
      category: string;
      finding: string;
      confidence: number;
      impact: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>;
    predictions: Array<{
      metric: string;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>;
    recommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
      confidence: number;
    }>;
    summary: string;
    confidence: number;
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

    // Requirement 2.2: Get relevant insights from Knowledge Network
    const historicalInsights = await this.getHistoricalInsights(creatorId, analysisType);
    
    // Build messages with data and context
    const messages = this.buildAnalysisMessages(
      analysisType,
      data,
      timeRange,
      context,
      historicalInsights
    );
    
    // Router options for premium tier (GPT-4 Turbo)
    const routerOptions: RouterOptions = {
      tier: 'premium', // Use premium tier for analytics
      plan: plan || 'pro',
      accountId: accountId || `creator-${creatorId}`,
      correlationId: `analytics-${Date.now()}-${analysisType}`,
    };

    // Requirement 10.2: Enable JSON mode for structured output
    const result = await azureOpenAIRouter.chat(messages, {
      ...routerOptions,
      temperature: 0.3, // Lower temperature for analytical accuracy
      maxTokens: 2000, // More tokens for detailed analysis
      responseFormat: { type: 'json_object' }, // Enable JSON mode
    });

    // Parse response
    const analysisData = this.parseAnalysisResponse(result.text);
    
    // Log usage to Application Insights
    if (accountId) {
      await this.costTracker.logUsage(
        {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          model: 'gpt-4-turbo',
          estimatedCost: result.cost,
        },
        {
          accountId,
          creatorId: creatorId.toString(),
          operation: `analytics_${analysisType}`,
          correlationId: routerOptions.correlationId!,
          timestamp: new Date(),
        }
      );
    }

    // Store high-confidence insights in Knowledge Network
    if (analysisData.confidence > 0.75 && this.network) {
      await this.storeAnalyticsInsights(
        creatorId,
        analysisType,
        analysisData.insights,
        analysisData.predictions
      );
    }

    return {
      ...analysisData,
      usage: {
        model: result.model,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        costUsd: result.cost,
      },
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

    return {
      patterns,
      trends,
      anomalies,
    };
  }

  /**
   * Build chat messages for analysis
   * Requirement 10.1: Use Azure OpenAI-specific formatting
   */
  private buildAnalysisMessages(
    analysisType: string,
    data: any,
    timeRange?: {
      start: Date;
      end: Date;
    },
    context?: {
      previousAnalyses?: any[];
      benchmarks?: any;
    },
    historicalInsights?: {
      patterns: Insight[];
      trends: Insight[];
      anomalies: Insight[];
    }
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // System message with analytical context
    let systemPrompt = `You are an advanced AI analytics agent specializing in OnlyFans creator performance analysis.

Your role is to:
1. Analyze data patterns and identify key insights
2. Generate accurate predictions based on historical trends
3. Provide actionable recommendations with confidence scores
4. Detect anomalies and explain their significance
5. Consider industry benchmarks and best practices

Analysis Type: ${analysisType}
`;

    // Add time range context
    if (timeRange) {
      systemPrompt += `\nTime Range: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`;
    }

    // Add benchmarks if available
    if (context?.benchmarks) {
      systemPrompt += `\n\nIndustry Benchmarks:\n${JSON.stringify(context.benchmarks, null, 2)}`;
    }

    // Add historical insights from Knowledge Network
    if (historicalInsights) {
      if (historicalInsights.patterns.length > 0) {
        systemPrompt += `\n\nHistorical Patterns Detected:\n`;
        historicalInsights.patterns.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (historicalInsights.trends.length > 0) {
        systemPrompt += `\nPrevious Trends:\n`;
        historicalInsights.trends.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (historicalInsights.anomalies.length > 0) {
        systemPrompt += `\nKnown Anomalies:\n`;
        historicalInsights.anomalies.forEach(insight => {
          systemPrompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }
    }

    // Add previous analyses context
    if (context?.previousAnalyses && context.previousAnalyses.length > 0) {
      systemPrompt += `\n\nPrevious Analyses:\n`;
      context.previousAnalyses.slice(-2).forEach((analysis: any) => {
        systemPrompt += `- ${JSON.stringify(analysis)}\n`;
      });
    }

    systemPrompt += `\n\nYou MUST respond with valid JSON in this exact format:
{
  "insights": [
    {
      "category": "revenue|engagement|content|behavior",
      "finding": "detailed description of the insight",
      "confidence": 0.85,
      "impact": "high|medium|low",
      "actionable": true
    }
  ],
  "predictions": [
    {
      "metric": "metric name",
      "predictedValue": 1234.56,
      "confidence": 0.80,
      "timeframe": "next 7 days|next 30 days|next quarter"
    }
  ],
  "recommendations": [
    {
      "action": "specific action to take",
      "priority": "high|medium|low",
      "expectedImpact": "description of expected outcome",
      "confidence": 0.75
    }
  ],
  "summary": "executive summary of the analysis",
  "confidence": 0.85
}`;

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add data to analyze
    messages.push({
      role: 'user',
      content: `Please analyze the following data:\n\n${JSON.stringify(data, null, 2)}`,
    });

    return messages;
  }

  /**
   * Parse the AI analysis response
   * Requirement 10.2: Parse JSON mode output with confidence scoring
   */
  private parseAnalysisResponse(text: string): {
    insights: Array<{
      category: string;
      finding: string;
      confidence: number;
      impact: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>;
    predictions: Array<{
      metric: string;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>;
    recommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
      confidence: number;
    }>;
    summary: string;
    confidence: number;
  } {
    try {
      // Parse JSON response
      const parsed = JSON.parse(text);
      
      // Validate and normalize the response
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
   * Store analytics insights in Knowledge Network
   * Requirement 2.2: Share insights with other agents
   */
  private async storeAnalyticsInsights(
    creatorId: number,
    analysisType: string,
    insights: Array<{
      category: string;
      finding: string;
      confidence: number;
      impact: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>,
    predictions: Array<{
      metric: string;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>
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
          model: 'gpt-4-turbo',
          provider: 'azure',
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
          model: 'gpt-4-turbo',
          provider: 'azure',
        },
        timestamp: new Date(),
      };

      await this.network.broadcastInsight(creatorId, networkInsight);
    }
  }
}
