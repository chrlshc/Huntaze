/**
 * AnalyticsAgent - Handles performance analysis and predictions
 * 
 * Analyzes performance metrics and provides actionable recommendations
 * Requirements: 1.2, 1.5
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { generateTextWithBilling } from '../gemini-billing.service';

export class AnalyticsAgent implements AITeamMember {
  id = 'analytics-agent';
  name = 'Analytics Agent';
  role = 'performance_analysis';
  model = 'gemini-2.5-pro'; // Use more powerful model for complex analysis
  
  private network: AIKnowledgeNetwork | null = null;

  /**
   * Initialize agent with Knowledge Network access
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a performance analysis request
   */
  async processRequest(request: {
    creatorId: number;
    metrics: {
      timeframe?: string;
      platforms?: string[];
      contentTypes?: string[];
      data?: any;
    };
  }): Promise<AIResponse> {
    try {
      const result = await this.analyzePerformance(
        request.creatorId,
        request.metrics
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Analyze performance metrics and provide insights
   * 
   * Requirements:
   * - 1.2: Analyze performance with pattern recognition
   * - 1.2: Add prediction capabilities
   * - 1.2: Provide actionable recommendations
   * - 1.5: Store analytics insights
   */
  async analyzePerformance(
    creatorId: number,
    metrics: {
      timeframe?: string;
      platforms?: string[];
      contentTypes?: string[];
      data?: any;
    }
  ): Promise<{
    insights: string[];
    patterns: string[];
    predictions: string[];
    recommendations: string[];
    confidence: number;
    usage: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };
  }> {
    // Get historical insights from Knowledge Network
    const historicalInsights = await this.getHistoricalInsights(creatorId);
    
    // Build prompt with metrics and historical context
    const prompt = this.buildPrompt(metrics, historicalInsights);
    
    // Generate analysis via Gemini
    const result = await generateTextWithBilling({
      prompt,
      metadata: {
        creatorId,
        feature: 'performance_analysis',
        agentId: this.id,
      },
      model: this.model,
      temperature: 0.3, // Lower temperature for analytical accuracy
      maxOutputTokens: 1000,
    });

    // Parse response
    const analysisData = this.parseResponse(result.text);
    
    // Store analytics insights
    if (analysisData.confidence > 0.7 && this.network) {
      await this.storeAnalyticsInsights(creatorId, metrics, analysisData);
    }

    return {
      ...analysisData,
      usage: result.usage,
    };
  }

  /**
   * Get historical insights from Knowledge Network
   */
  private async getHistoricalInsights(creatorId: number): Promise<{
    performancePatterns: Insight[];
    contentStrategies: Insight[];
    engagementPatterns: Insight[];
  }> {
    if (!this.network) {
      return { performancePatterns: [], contentStrategies: [], engagementPatterns: [] };
    }

    const [performancePatterns, contentStrategies, engagementPatterns] = await Promise.all([
      this.network.getRelevantInsights(creatorId, 'performance_pattern', 5),
      this.network.getRelevantInsights(creatorId, 'content_strategy', 5),
      this.network.getRelevantInsights(creatorId, 'engagement_pattern', 5),
    ]);

    return {
      performancePatterns,
      contentStrategies,
      engagementPatterns,
    };
  }

  /**
   * Build prompt for performance analysis
   */
  private buildPrompt(
    metrics: {
      timeframe?: string;
      platforms?: string[];
      contentTypes?: string[];
      data?: any;
    },
    historicalInsights: {
      performancePatterns: Insight[];
      contentStrategies: Insight[];
      engagementPatterns: Insight[];
    }
  ): string {
    let prompt = `You are an AI analytics expert helping an OnlyFans creator understand their performance.

Current metrics:
- Timeframe: ${metrics.timeframe || 'last 30 days'}
- Platforms: ${metrics.platforms?.join(', ') || 'all'}
- Content types: ${metrics.contentTypes?.join(', ') || 'all'}

`;

    // Add metrics data if available
    if (metrics.data) {
      prompt += `Performance data:\n${JSON.stringify(metrics.data, null, 2)}\n\n`;
    }

    // Add historical context
    if (historicalInsights.performancePatterns.length > 0) {
      prompt += `Historical performance patterns:\n`;
      historicalInsights.performancePatterns.forEach(insight => {
        prompt += `- ${JSON.stringify(insight.data)}\n`;
      });
      prompt += `\n`;
    }

    if (historicalInsights.contentStrategies.length > 0) {
      prompt += `Previous content strategies:\n`;
      historicalInsights.contentStrategies.forEach(insight => {
        prompt += `- ${JSON.stringify(insight.data)}\n`;
      });
      prompt += `\n`;
    }

    prompt += `Analyze the performance data and provide:

1. KEY INSIGHTS: What are the most important findings from the data?
2. PATTERNS: What patterns or trends do you observe?
3. PREDICTIONS: Based on current trends, what can we predict for the future?
4. RECOMMENDATIONS: What specific, actionable steps should the creator take?

Consider:
- Engagement rates and trends
- Content performance by type and platform
- Audience behavior patterns
- Revenue opportunities
- Optimal posting times and frequency
- Content mix optimization

Return your response in this JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "patterns": ["pattern 1", "pattern 2", ...],
  "predictions": ["prediction 1", "prediction 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of your analysis"
}`;

    return prompt;
  }

  /**
   * Parse the AI response
   */
  private parseResponse(text: string): {
    insights: string[];
    patterns: string[];
    predictions: string[];
    recommendations: string[];
    confidence: number;
  } {
    try {
      const parsed = JSON.parse(text);
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
        predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      // If not JSON, try to extract sections
      return {
        insights: this.extractSection(text, 'insights'),
        patterns: this.extractSection(text, 'patterns'),
        predictions: this.extractSection(text, 'predictions'),
        recommendations: this.extractSection(text, 'recommendations'),
        confidence: 0.5,
      };
    }
  }

  /**
   * Extract a section from unstructured text
   */
  private extractSection(text: string, section: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let inSection = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      if (lower.includes(section)) {
        inSection = true;
        continue;
      }
      
      if (inSection && (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))) {
        items.push(line.replace(/^[-•\d.]\s*/, '').trim());
      } else if (inSection && line.trim() === '') {
        inSection = false;
      }
    }

    return items;
  }

  /**
   * Store analytics insights in Knowledge Network
   */
  private async storeAnalyticsInsights(
    creatorId: number,
    metrics: any,
    analysisData: {
      insights: string[];
      patterns: string[];
      predictions: string[];
      recommendations: string[];
      confidence: number;
    }
  ): Promise<void> {
    if (!this.network) return;

    // Store performance patterns
    for (const pattern of analysisData.patterns) {
      const insight: Insight = {
        source: this.id,
        type: 'performance_pattern',
        confidence: analysisData.confidence,
        data: {
          pattern,
          timeframe: metrics.timeframe,
          platforms: metrics.platforms,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      };
      await this.network.broadcastInsight(creatorId, insight);
    }

    // Store engagement patterns
    if (analysisData.insights.length > 0) {
      const insight: Insight = {
        source: this.id,
        type: 'engagement_pattern',
        confidence: analysisData.confidence,
        data: {
          insights: analysisData.insights,
          recommendations: analysisData.recommendations,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      };
      await this.network.broadcastInsight(creatorId, insight);
    }
  }
}
