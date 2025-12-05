/**
 * AI Insights Service
 * 
 * Generates automatic insights from analytics data using Mistral Large.
 * "Ton churn a augmenté de 15% ce mois, probablement lié à..."
 * 
 * Features:
 * - Auto-generated insights from metrics
 * - Narrative reports (metrics → readable text)
 * - Trend detection & explanations
 */

import { getAIService, AIService } from './service';

// ============================================
// Types
// ============================================

export type InsightType = 
  | 'churn_alert'
  | 'revenue_trend'
  | 'engagement_drop'
  | 'growth_opportunity'
  | 'content_performance'
  | 'fan_behavior';

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive';

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric: string;
  change: number; // percentage
  recommendation: string;
  confidence: number;
  createdAt: Date;
}

export interface MetricsData {
  revenue: { current: number; previous: number; };
  subscribers: { current: number; previous: number; churned: number; };
  engagement: { current: number; previous: number; };
  messages: { sent: number; received: number; responseRate: number; };
  content: { posts: number; avgEngagement: number; topPerforming: string[]; };
}

export interface GenerateInsightsRequest {
  creatorId: number;
  metrics: MetricsData;
  period?: 'day' | 'week' | 'month';
}

export interface GenerateInsightsResponse {
  insights: Insight[];
  summary: string;
  confidence: number;
}

export interface NarrativeReportRequest {
  creatorId: number;
  metrics: MetricsData;
  period: 'week' | 'month';
  includeRecommendations?: boolean;
}

export interface NarrativeReportResponse {
  report: string;
  highlights: string[];
  actionItems: string[];
  confidence: number;
}

// ============================================
// AI Insights Service
// ============================================

export class AIInsightsService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || getAIService();
  }

  /**
   * Generate automatic insights from metrics data
   */
  async generateInsights(
    request: GenerateInsightsRequest
  ): Promise<GenerateInsightsResponse> {
    const { metrics, period = 'month' } = request;
    const prompt = this.buildInsightsPrompt(metrics, period);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'math', // Routes to DeepSeek R1 for analysis/reasoning
        systemPrompt: this.getInsightsSystemPrompt(),
      });

      return this.parseInsightsResponse(result.content, metrics);
    } catch (error) {
      console.error('[AIInsights] Error generating insights:', error);
      return this.generateFallbackInsights(metrics);
    }
  }

  /**
   * Generate narrative report from metrics
   * Transforms raw numbers into readable, actionable text
   */
  async generateNarrativeReport(
    request: NarrativeReportRequest
  ): Promise<NarrativeReportResponse> {
    const { metrics, period, includeRecommendations = true } = request;
    const prompt = this.buildReportPrompt(metrics, period, includeRecommendations);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative', // Creative writing for narrative
        systemPrompt: this.getReportSystemPrompt(),
      });

      return this.parseReportResponse(result.content);
    } catch (error) {
      console.error('[AIInsights] Error generating report:', error);
      return this.generateFallbackReport(metrics, period);
    }
  }

  // ============================================
  // Private - Prompt Building
  // ============================================

  private getInsightsSystemPrompt(): string {
    return `You are an analytics expert for OnlyFans creators.
Analyze metrics and generate actionable insights.

Rules:
1. Focus on significant changes (>5%)
2. Explain WHY changes might have occurred
3. Provide specific, actionable recommendations
4. Be encouraging but honest
5. Return valid JSON only

Response format:
{
  "insights": [
    {
      "type": "churn_alert|revenue_trend|engagement_drop|growth_opportunity|content_performance|fan_behavior",
      "severity": "info|warning|critical|positive",
      "title": "Short title",
      "description": "Detailed explanation with probable cause",
      "metric": "metric_name",
      "change": 15.5,
      "recommendation": "Specific action to take",
      "confidence": 0.85
    }
  ],
  "summary": "One paragraph executive summary"
}`;
  }

  private buildInsightsPrompt(metrics: MetricsData, period: string): string {
    const revenueChange = this.calcChange(metrics.revenue.current, metrics.revenue.previous);
    const subsChange = this.calcChange(metrics.subscribers.current, metrics.subscribers.previous);
    const engagementChange = this.calcChange(metrics.engagement.current, metrics.engagement.previous);
    const churnRate = metrics.subscribers.previous > 0 
      ? (metrics.subscribers.churned / metrics.subscribers.previous) * 100 
      : 0;

    return `Analyze these ${period}ly metrics for an OnlyFans creator:

REVENUE:
- Current: $${metrics.revenue.current.toFixed(2)}
- Previous: $${metrics.revenue.previous.toFixed(2)}
- Change: ${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%

SUBSCRIBERS:
- Current: ${metrics.subscribers.current}
- Previous: ${metrics.subscribers.previous}
- Churned: ${metrics.subscribers.churned}
- Churn Rate: ${churnRate.toFixed(1)}%
- Net Change: ${subsChange > 0 ? '+' : ''}${subsChange.toFixed(1)}%

ENGAGEMENT:
- Current Rate: ${metrics.engagement.current.toFixed(1)}%
- Previous Rate: ${metrics.engagement.previous.toFixed(1)}%
- Change: ${engagementChange > 0 ? '+' : ''}${engagementChange.toFixed(1)}%

MESSAGES:
- Sent: ${metrics.messages.sent}
- Received: ${metrics.messages.received}
- Response Rate: ${metrics.messages.responseRate.toFixed(1)}%

CONTENT:
- Posts: ${metrics.content.posts}
- Avg Engagement: ${metrics.content.avgEngagement.toFixed(1)}%
- Top Performing: ${metrics.content.topPerforming.join(', ') || 'None'}

Generate insights focusing on:
1. Any concerning trends (churn, engagement drops)
2. Growth opportunities
3. What's working well
4. Specific recommendations

Return JSON only.`;
  }

  private getReportSystemPrompt(): string {
    return `You are a friendly analytics assistant for OnlyFans creators.
Write engaging, easy-to-read reports that feel personal and actionable.

Style:
- Conversational but professional
- Use emojis sparingly for emphasis
- Focus on what matters most
- Be encouraging and supportive
- Give specific, actionable advice

Response format:
{
  "report": "Full narrative report (3-5 paragraphs)",
  "highlights": ["Key highlight 1", "Key highlight 2", "Key highlight 3"],
  "actionItems": ["Action 1", "Action 2", "Action 3"]
}`;
  }

  private buildReportPrompt(
    metrics: MetricsData, 
    period: string,
    includeRecommendations: boolean
  ): string {
    const revenueChange = this.calcChange(metrics.revenue.current, metrics.revenue.previous);
    const subsChange = this.calcChange(metrics.subscribers.current, metrics.subscribers.previous);

    return `Write a ${period}ly performance report for an OnlyFans creator.

Key Metrics:
- Revenue: $${metrics.revenue.current.toFixed(2)} (${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last ${period})
- Subscribers: ${metrics.subscribers.current} (${subsChange > 0 ? '+' : ''}${subsChange.toFixed(1)}%)
- Churned: ${metrics.subscribers.churned} fans
- Engagement: ${metrics.engagement.current.toFixed(1)}%
- Messages Response Rate: ${metrics.messages.responseRate.toFixed(1)}%
- Content Posts: ${metrics.content.posts}

${includeRecommendations ? 'Include 3 specific action items to improve performance.' : ''}

Write in a friendly, encouraging tone. Be specific about what's working and what needs attention.
Return JSON only.`;
  }

  // ============================================
  // Private - Response Parsing
  // ============================================

  private parseInsightsResponse(
    content: string, 
    metrics: MetricsData
  ): GenerateInsightsResponse {
    try {
      const json = this.extractJSON(content);
      const parsed = JSON.parse(json);

      const insights: Insight[] = (parsed.insights || []).map((i: any, idx: number) => ({
        id: `insight-${Date.now()}-${idx}`,
        type: this.validateInsightType(i.type),
        severity: this.validateSeverity(i.severity),
        title: i.title || 'Insight',
        description: i.description || '',
        metric: i.metric || 'general',
        change: Number(i.change) || 0,
        recommendation: i.recommendation || '',
        confidence: Math.min(1, Math.max(0, Number(i.confidence) || 0.5)),
        createdAt: new Date(),
      }));

      return {
        insights,
        summary: parsed.summary || this.generateDefaultSummary(metrics),
        confidence: insights.length > 0 ? 0.8 : 0.5,
      };
    } catch {
      return this.generateFallbackInsights(metrics);
    }
  }

  private parseReportResponse(content: string): NarrativeReportResponse {
    try {
      const json = this.extractJSON(content);
      const parsed = JSON.parse(json);

      return {
        report: parsed.report || 'Unable to generate report.',
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        confidence: 0.8,
      };
    } catch {
      return {
        report: content, // Use raw content as fallback
        highlights: [],
        actionItems: [],
        confidence: 0.4,
      };
    }
  }

  // ============================================
  // Private - Helpers
  // ============================================

  private calcChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private extractJSON(content: string): string {
    let json = content.trim();
    if (json.startsWith('```')) {
      const match = json.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) json = match[1].trim();
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : json;
  }

  private validateInsightType(type: string): InsightType {
    const valid: InsightType[] = [
      'churn_alert', 'revenue_trend', 'engagement_drop',
      'growth_opportunity', 'content_performance', 'fan_behavior'
    ];
    return valid.includes(type as InsightType) ? type as InsightType : 'revenue_trend';
  }

  private validateSeverity(severity: string): InsightSeverity {
    const valid: InsightSeverity[] = ['info', 'warning', 'critical', 'positive'];
    return valid.includes(severity as InsightSeverity) ? severity as InsightSeverity : 'info';
  }

  private generateDefaultSummary(metrics: MetricsData): string {
    const revenueChange = this.calcChange(metrics.revenue.current, metrics.revenue.previous);
    const trend = revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable';
    return `Your revenue is ${trend} ${Math.abs(revenueChange).toFixed(1)}% this period with ${metrics.subscribers.current} active subscribers.`;
  }

  private generateFallbackInsights(metrics: MetricsData): GenerateInsightsResponse {
    const insights: Insight[] = [];
    const revenueChange = this.calcChange(metrics.revenue.current, metrics.revenue.previous);
    const churnRate = metrics.subscribers.previous > 0 
      ? (metrics.subscribers.churned / metrics.subscribers.previous) * 100 
      : 0;

    // Churn alert
    if (churnRate > 10) {
      insights.push({
        id: `insight-${Date.now()}-churn`,
        type: 'churn_alert',
        severity: churnRate > 20 ? 'critical' : 'warning',
        title: `Churn rate at ${churnRate.toFixed(1)}%`,
        description: `You lost ${metrics.subscribers.churned} subscribers this period. This might be due to reduced posting frequency or engagement.`,
        metric: 'churn_rate',
        change: churnRate,
        recommendation: 'Send a re-engagement message to at-risk fans with a special offer.',
        confidence: 0.7,
        createdAt: new Date(),
      });
    }

    // Revenue trend
    if (Math.abs(revenueChange) > 5) {
      insights.push({
        id: `insight-${Date.now()}-revenue`,
        type: 'revenue_trend',
        severity: revenueChange > 0 ? 'positive' : 'warning',
        title: `Revenue ${revenueChange > 0 ? 'up' : 'down'} ${Math.abs(revenueChange).toFixed(1)}%`,
        description: revenueChange > 0 
          ? 'Great job! Your revenue is growing.' 
          : 'Revenue has decreased. Consider launching a promotion.',
        metric: 'revenue',
        change: revenueChange,
        recommendation: revenueChange > 0 
          ? 'Keep up the momentum with consistent posting.'
          : 'Try a limited-time discount to boost sales.',
        confidence: 0.8,
        createdAt: new Date(),
      });
    }

    return {
      insights,
      summary: this.generateDefaultSummary(metrics),
      confidence: 0.5,
    };
  }

  private generateFallbackReport(metrics: MetricsData, period: string): NarrativeReportResponse {
    const revenueChange = this.calcChange(metrics.revenue.current, metrics.revenue.previous);
    
    return {
      report: `This ${period}, you earned $${metrics.revenue.current.toFixed(2)} (${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last ${period}). You have ${metrics.subscribers.current} active subscribers with a ${metrics.messages.responseRate.toFixed(0)}% message response rate. Keep engaging with your fans!`,
      highlights: [
        `Revenue: $${metrics.revenue.current.toFixed(2)}`,
        `Subscribers: ${metrics.subscribers.current}`,
        `Engagement: ${metrics.engagement.current.toFixed(1)}%`,
      ],
      actionItems: [
        'Respond to pending messages',
        'Post new content',
        'Check on at-risk subscribers',
      ],
      confidence: 0.4,
    };
  }
}

// ============================================
// Singleton & Exports
// ============================================

let insightsServiceInstance: AIInsightsService | null = null;

export function getAIInsightsService(): AIInsightsService {
  if (!insightsServiceInstance) {
    insightsServiceInstance = new AIInsightsService();
  }
  return insightsServiceInstance;
}

export async function generateInsights(
  request: GenerateInsightsRequest
): Promise<GenerateInsightsResponse> {
  return getAIInsightsService().generateInsights(request);
}

export async function generateNarrativeReport(
  request: NarrativeReportRequest
): Promise<NarrativeReportResponse> {
  return getAIInsightsService().generateNarrativeReport(request);
}
