/**
 * AI Fan Segmentation Service
 * 
 * Automatic fan segmentation using DeepSeek R1 for reasoning.
 * - Whales (high spenders)
 * - Regulars (consistent engagement)
 * - At-risk (churn prediction)
 * - New (recent subscribers)
 * - Dormant (inactive)
 */

import { getAIService, AIService } from './service';

// ============================================
// Types
// ============================================

export type FanSegment = 
  | 'whale'
  | 'regular'
  | 'at_risk'
  | 'new'
  | 'dormant'
  | 'engaged'
  | 'casual';

export interface Fan {
  id: string;
  name: string;
  username?: string;
  totalSpent: number;
  subscriptionDays: number;
  lastActive: Date;
  messageCount: number;
  purchaseCount: number;
  tipAmount: number;
  renewalProbability?: number;
}

export interface SegmentedFan extends Fan {
  segment: FanSegment;
  segmentScore: number;
  churnRisk: number;
  lifetimeValue: number;
  recommendations: string[];
}

export interface SegmentationResult {
  segments: Record<FanSegment, SegmentedFan[]>;
  summary: {
    totalFans: number;
    whales: number;
    regulars: number;
    atRisk: number;
    newFans: number;
    dormant: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface SegmentFansRequest {
  creatorId: number;
  fans: Fan[];
  includeRecommendations?: boolean;
}

export interface PredictChurnRequest {
  creatorId: number;
  fan: Fan;
}

export interface ChurnPrediction {
  fanId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  preventionActions: string[];
  confidence: number;
}

// ============================================
// Segmentation Thresholds
// ============================================

const THRESHOLDS = {
  whale: {
    minSpent: 500,
    minTips: 100,
  },
  regular: {
    minSpent: 50,
    minMessages: 5,
    minDays: 30,
  },
  new: {
    maxDays: 14,
  },
  dormant: {
    inactiveDays: 30,
  },
  atRisk: {
    inactiveDays: 14,
    lowEngagement: true,
  },
};

// ============================================
// AI Fan Segmentation Service
// ============================================

export class AIFanSegmentationService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || getAIService();
  }

  /**
   * Segment fans into categories
   */
  async segmentFans(request: SegmentFansRequest): Promise<SegmentationResult> {
    const { fans, includeRecommendations = true } = request;

    // First pass: rule-based segmentation
    const segmentedFans = fans.map(fan => this.classifyFan(fan));

    // Group by segment
    const segments: Record<FanSegment, SegmentedFan[]> = {
      whale: [],
      regular: [],
      at_risk: [],
      new: [],
      dormant: [],
      engaged: [],
      casual: [],
    };

    for (const fan of segmentedFans) {
      segments[fan.segment].push(fan);
    }

    // Generate AI insights if we have at-risk fans
    let insights: string[] = [];
    let recommendations: string[] = [];

    if (includeRecommendations && segments.at_risk.length > 0) {
      const aiInsights = await this.generateSegmentInsights(segments);
      insights = aiInsights.insights;
      recommendations = aiInsights.recommendations;
    } else {
      insights = this.generateBasicInsights(segments);
      recommendations = this.generateBasicRecommendations(segments);
    }

    return {
      segments,
      summary: {
        totalFans: fans.length,
        whales: segments.whale.length,
        regulars: segments.regular.length,
        atRisk: segments.at_risk.length,
        newFans: segments.new.length,
        dormant: segments.dormant.length,
      },
      insights,
      recommendations,
    };
  }

  /**
   * Predict churn probability for a specific fan
   */
  async predictChurn(request: PredictChurnRequest): Promise<ChurnPrediction> {
    const { fan } = request;
    
    // Calculate base churn probability
    const daysSinceActive = this.daysSince(fan.lastActive);
    const engagementScore = this.calculateEngagementScore(fan);
    
    let churnProbability = 0;
    const factors: string[] = [];

    // Inactivity factor
    if (daysSinceActive > 30) {
      churnProbability += 0.4;
      factors.push(`Inactive for ${daysSinceActive} days`);
    } else if (daysSinceActive > 14) {
      churnProbability += 0.2;
      factors.push(`${daysSinceActive} days since last activity`);
    }

    // Low engagement factor
    if (engagementScore < 0.3) {
      churnProbability += 0.2;
      factors.push('Low engagement score');
    }

    // No purchases factor
    if (fan.purchaseCount === 0 && fan.subscriptionDays > 14) {
      churnProbability += 0.15;
      factors.push('No purchases made');
    }

    // Low message count
    if (fan.messageCount < 3 && fan.subscriptionDays > 7) {
      churnProbability += 0.1;
      factors.push('Minimal messaging activity');
    }

    // Positive factors (reduce churn)
    if (fan.tipAmount > 0) {
      churnProbability -= 0.1;
    }
    if (fan.totalSpent > 100) {
      churnProbability -= 0.15;
    }

    churnProbability = Math.max(0, Math.min(1, churnProbability));

    const riskLevel = this.getRiskLevel(churnProbability);
    const preventionActions = this.getPreventionActions(riskLevel, factors);

    return {
      fanId: fan.id,
      churnProbability,
      riskLevel,
      factors,
      preventionActions,
      confidence: 0.75,
    };
  }

  /**
   * Get fans most likely to churn
   */
  async getAtRiskFans(
    fans: Fan[],
    limit: number = 10
  ): Promise<ChurnPrediction[]> {
    const predictions = await Promise.all(
      fans.map(fan => this.predictChurn({ creatorId: 0, fan }))
    );

    return predictions
      .filter(p => p.riskLevel !== 'low')
      .sort((a, b) => b.churnProbability - a.churnProbability)
      .slice(0, limit);
  }

  // ============================================
  // Private - Classification
  // ============================================

  private classifyFan(fan: Fan): SegmentedFan {
    const daysSinceActive = this.daysSince(fan.lastActive);
    const engagementScore = this.calculateEngagementScore(fan);
    const lifetimeValue = this.calculateLTV(fan);
    const churnRisk = this.calculateChurnRisk(fan, daysSinceActive, engagementScore);

    let segment: FanSegment;
    let segmentScore: number;

    // Whale: High spender
    if (fan.totalSpent >= THRESHOLDS.whale.minSpent || fan.tipAmount >= THRESHOLDS.whale.minTips) {
      segment = 'whale';
      segmentScore = Math.min(1, fan.totalSpent / 1000);
    }
    // New: Recent subscriber
    else if (fan.subscriptionDays <= THRESHOLDS.new.maxDays) {
      segment = 'new';
      segmentScore = 1 - (fan.subscriptionDays / THRESHOLDS.new.maxDays);
    }
    // Dormant: Long inactive
    else if (daysSinceActive >= THRESHOLDS.dormant.inactiveDays) {
      segment = 'dormant';
      segmentScore = Math.min(1, daysSinceActive / 60);
    }
    // At-risk: Showing churn signals
    else if (churnRisk > 0.5) {
      segment = 'at_risk';
      segmentScore = churnRisk;
    }
    // Regular: Consistent engagement
    else if (
      fan.totalSpent >= THRESHOLDS.regular.minSpent &&
      fan.messageCount >= THRESHOLDS.regular.minMessages &&
      fan.subscriptionDays >= THRESHOLDS.regular.minDays
    ) {
      segment = 'regular';
      segmentScore = engagementScore;
    }
    // Engaged: Active but lower spend
    else if (engagementScore > 0.5) {
      segment = 'engaged';
      segmentScore = engagementScore;
    }
    // Casual: Everyone else
    else {
      segment = 'casual';
      segmentScore = 0.3;
    }

    return {
      ...fan,
      segment,
      segmentScore,
      churnRisk,
      lifetimeValue,
      recommendations: this.getFanRecommendations(segment, fan),
    };
  }

  private calculateEngagementScore(fan: Fan): number {
    let score = 0;
    
    // Message activity (0-0.3)
    score += Math.min(0.3, fan.messageCount / 30 * 0.3);
    
    // Purchase activity (0-0.3)
    score += Math.min(0.3, fan.purchaseCount / 10 * 0.3);
    
    // Tip activity (0-0.2)
    score += Math.min(0.2, fan.tipAmount / 50 * 0.2);
    
    // Subscription length (0-0.2)
    score += Math.min(0.2, fan.subscriptionDays / 90 * 0.2);

    return Math.min(1, score);
  }

  private calculateLTV(fan: Fan): number {
    const monthlyValue = fan.subscriptionDays > 0 
      ? (fan.totalSpent / fan.subscriptionDays) * 30 
      : 0;
    
    // Project 12 months with decay
    return monthlyValue * 12 * 0.7;
  }

  private calculateChurnRisk(
    fan: Fan,
    daysSinceActive: number,
    engagementScore: number
  ): number {
    let risk = 0;

    // Inactivity
    if (daysSinceActive > 14) {
      risk += Math.min(0.4, (daysSinceActive - 14) / 30 * 0.4);
    }

    // Low engagement
    if (engagementScore < 0.3) {
      risk += 0.3;
    } else if (engagementScore < 0.5) {
      risk += 0.15;
    }

    // No purchases
    if (fan.purchaseCount === 0 && fan.subscriptionDays > 14) {
      risk += 0.2;
    }

    return Math.min(1, risk);
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.75) return 'critical';
    if (probability >= 0.5) return 'high';
    if (probability >= 0.25) return 'medium';
    return 'low';
  }

  // ============================================
  // Private - Recommendations
  // ============================================

  private getFanRecommendations(segment: FanSegment, fan: Fan): string[] {
    const recs: Record<FanSegment, string[]> = {
      whale: [
        'Send exclusive content previews',
        'Offer VIP perks or early access',
        'Personal thank you message',
      ],
      regular: [
        'Maintain consistent engagement',
        'Offer loyalty rewards',
        'Ask for content preferences',
      ],
      at_risk: [
        'Send re-engagement message',
        'Offer special discount',
        'Ask if everything is okay',
      ],
      new: [
        'Send welcome message',
        'Share best content highlights',
        'Ask about interests',
      ],
      dormant: [
        'Win-back campaign with offer',
        'Share what they\'ve missed',
        'Limited-time comeback discount',
      ],
      engaged: [
        'Encourage first purchase',
        'Share exclusive offers',
        'Build personal connection',
      ],
      casual: [
        'Increase engagement touchpoints',
        'Share popular content',
        'Personalized recommendations',
      ],
    };

    return recs[segment] || [];
  }

  private getPreventionActions(
    riskLevel: string,
    factors: string[]
  ): string[] {
    const actions: string[] = [];

    if (factors.some(f => f.includes('Inactive'))) {
      actions.push('Send a personalized check-in message');
    }

    if (factors.some(f => f.includes('engagement'))) {
      actions.push('Share exclusive content to re-engage');
    }

    if (factors.some(f => f.includes('purchases'))) {
      actions.push('Offer a special discount on first purchase');
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      actions.push('Consider a limited-time offer to retain');
    }

    return actions.length > 0 ? actions : ['Monitor engagement closely'];
  }

  // ============================================
  // Private - AI Insights
  // ============================================

  private async generateSegmentInsights(
    segments: Record<FanSegment, SegmentedFan[]>
  ): Promise<{ insights: string[]; recommendations: string[] }> {
    const prompt = `Analyze this fan segmentation data and provide insights:

Whales (high spenders): ${segments.whale.length}
Regulars: ${segments.regular.length}
At-risk: ${segments.at_risk.length}
New fans: ${segments.new.length}
Dormant: ${segments.dormant.length}
Engaged: ${segments.engaged.length}
Casual: ${segments.casual.length}

At-risk fans average days inactive: ${this.avgDaysInactive(segments.at_risk)}
Whale average spend: $${this.avgSpend(segments.whale).toFixed(2)}

Provide 3 key insights and 3 actionable recommendations.
Return JSON: { "insights": [...], "recommendations": [...] }`;

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'math', // DeepSeek R1 for reasoning
        systemPrompt: 'You are a fan retention expert. Analyze data and provide actionable insights. Return JSON only.',
      });

      const json = result.content.match(/\{[\s\S]*\}/)?.[0] || '{}';
      const parsed = JSON.parse(json);

      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : this.generateBasicInsights(segments),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : this.generateBasicRecommendations(segments),
      };
    } catch {
      return {
        insights: this.generateBasicInsights(segments),
        recommendations: this.generateBasicRecommendations(segments),
      };
    }
  }

  private generateBasicInsights(segments: Record<FanSegment, SegmentedFan[]>): string[] {
    const insights: string[] = [];
    const total = Object.values(segments).flat().length;

    if (segments.whale.length > 0) {
      const whalePercent = ((segments.whale.length / total) * 100).toFixed(1);
      insights.push(`${whalePercent}% of your fans are whales (high spenders)`);
    }

    if (segments.at_risk.length > 0) {
      insights.push(`${segments.at_risk.length} fans are at risk of churning`);
    }

    if (segments.new.length > 0) {
      insights.push(`${segments.new.length} new fans joined recently`);
    }

    return insights.length > 0 ? insights : ['Your fan base is healthy'];
  }

  private generateBasicRecommendations(segments: Record<FanSegment, SegmentedFan[]>): string[] {
    const recs: string[] = [];

    if (segments.at_risk.length > 0) {
      recs.push('Send re-engagement messages to at-risk fans');
    }

    if (segments.whale.length > 0) {
      recs.push('Reward your top spenders with exclusive content');
    }

    if (segments.new.length > 0) {
      recs.push('Welcome new fans with a personal message');
    }

    return recs.length > 0 ? recs : ['Keep engaging consistently with your fans'];
  }

  private avgDaysInactive(fans: SegmentedFan[]): number {
    if (fans.length === 0) return 0;
    const total = fans.reduce((sum, f) => sum + this.daysSince(f.lastActive), 0);
    return Math.round(total / fans.length);
  }

  private avgSpend(fans: SegmentedFan[]): number {
    if (fans.length === 0) return 0;
    const total = fans.reduce((sum, f) => sum + f.totalSpent, 0);
    return total / fans.length;
  }
}

// ============================================
// Singleton & Exports
// ============================================

let segmentationServiceInstance: AIFanSegmentationService | null = null;

export function getAIFanSegmentationService(): AIFanSegmentationService {
  if (!segmentationServiceInstance) {
    segmentationServiceInstance = new AIFanSegmentationService();
  }
  return segmentationServiceInstance;
}

export async function segmentFans(
  request: SegmentFansRequest
): Promise<SegmentationResult> {
  return getAIFanSegmentationService().segmentFans(request);
}

export async function predictChurn(
  request: PredictChurnRequest
): Promise<ChurnPrediction> {
  return getAIFanSegmentationService().predictChurn(request);
}
